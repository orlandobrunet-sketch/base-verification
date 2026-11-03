/**
 * Supabase Edge Function: mp-webhook
 *
 * Recebe notificações IPN do Mercado Pago e atualiza o status premium do usuário.
 *
 * Variáveis de ambiente necessárias:
 *   MP_ACCESS_TOKEN           — Access Token do Mercado Pago
 *   SUPABASE_SERVICE_ROLE_KEY — Service Role Key (acesso admin ao Supabase)
 *   MP_WEBHOOK_SECRET         — Segredo do webhook (configurado no painel MP)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Log estruturado de tentativas inválidas — facilita auditoria/alertas no painel.
function logInvalidAttempt(reason: string, ctx: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({ event: 'mp_webhook_rejected', reason, ...ctx }));
}

// Comparação de strings em tempo constante — evita timing side-channel ao
// validar o HMAC. Compara sempre todos os caracteres, sem curto-circuito.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!secret) {
    // Sem segredo configurado: bloqueia em produção para evitar ativações fraudulentas
    logInvalidAttempt('secret_not_configured');
    return false;
  }

  const signature = req.headers.get('x-signature') ?? '';
  if (!signature) {
    logInvalidAttempt('missing_signature_header');
    return false;
  }

  // Formato: ts=<timestamp>,v1=<hmac>
  const ts  = signature.match(/ts=(\d+)/)?.[1] ?? '';
  const v1  = signature.match(/v1=([a-f0-9]+)/)?.[1] ?? '';
  if (!ts || !v1) {
    logInvalidAttempt('malformed_signature_header');
    return false;
  }

  // Manifesto: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  // Conforme a doc oficial do MP, o `data.id` do manifesto vem do QUERY PARAM
  // `data.id` (sufixo _url) e deve ser usado em MINÚSCULAS. Mantém fallback
  // para o body por robustez (em pagamentos os dois coincidem).
  // Ref: MP Developers — "Validar a origem de uma notificação".
  const requestId  = req.headers.get('x-request-id') ?? '';
  let   dataId     = '';
  try { dataId = new URL(req.url).searchParams.get('data.id') ?? ''; } catch { /* ignore */ }
  if (!dataId) {
    try {
      const body = JSON.parse(rawBody);
      if (body.data?.id)  dataId = String(body.data.id);
      else if (body.id)   dataId = String(body.id);
    } catch { /* será tratado depois */ }
  }
  const paymentId = dataId.toLowerCase();

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBytes  = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const computed  = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (!timingSafeEqual(computed, v1)) {
    logInvalidAttempt('signature_mismatch', { paymentId, ts });
    return false;
  }
  return true;
}

// Mesmo preço de create-mp-preference; o banco também valida antes de conceder.
const PLAN_AMOUNT: Record<string, number> = { monthly: 14.90, lifetime: 199.00 };

Deno.serve(async (req) => {
  if (req.method === 'GET') return new Response('ok', { status: 200 });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const rawBody = await req.text();
    if (!await verifySignature(req, rawBody)) return new Response('Unauthorized', { status: 401 });
    const body = JSON.parse(rawBody);
    const paymentId = body.type === 'payment' && body.data?.id ? String(body.data.id)
      : body.topic === 'payment' && body.id ? String(body.id) : null;
    if (!paymentId) return new Response('ok', { status: 200 });
    const signedId = new URL(req.url).searchParams.get('data.id');
    if (!/^[0-9]+$/.test(paymentId) || (signedId && signedId !== paymentId)) {
      logInvalidAttempt('payment_id_mismatch');
      return new Response('Invalid payment ID', { status: 400 });
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpToken) return new Response('Config error', { status: 500 });
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    });
    if (!mpRes.ok) {
      const transient = mpRes.status === 429 || mpRes.status >= 500;
      console.error('Failed to fetch payment from MP:', mpRes.status);
      return new Response(transient ? 'MP unavailable' : 'ok', { status: transient ? 502 : 200 });
    }

    const payment = await mpRes.json();
    if (!['approved', 'refunded', 'charged_back'].includes(payment.status)) {
      return new Response('ok', { status: 200 });
    }
    const ref: string = payment.external_reference ?? '';
    const colonIdx = ref.lastIndexOf(':');
    if (colonIdx === -1) return new Response('ok', { status: 200 });
    const userId = ref.substring(0, colonIdx);
    const plan = ref.substring(colonIdx + 1);
    const amount = Number(payment.transaction_amount);
    const expected = PLAN_AMOUNT[plan];
    if (payment.status === 'approved' && (typeof expected !== 'number' ||
        payment.currency_id !== 'BRL' || !Number.isFinite(amount) || amount < expected)) {
      logInvalidAttempt('amount_or_plan_mismatch', { paymentId, plan });
      return new Response('ok', { status: 200 });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    // Migration 020 primeiro, deploy desta função depois. Uma única transação
    // bloqueia o perfil e grava histórico + premium, sem janela entre os dois.
    const { data, error } = await supabase.rpc('process_mp_payment', {
      p_payment_id: paymentId, p_user_id: userId, p_plan: plan,
      p_status: payment.status, p_amount: Number.isFinite(amount) ? amount : null,
      p_currency: payment.currency_id ?? null,
    });
    if (error) {
      console.error('Atomic payment update failed:', error);
      return new Response('DB error', { status: 500 });
    }
    console.log('Payment processed:', paymentId, data?.outcome);
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
