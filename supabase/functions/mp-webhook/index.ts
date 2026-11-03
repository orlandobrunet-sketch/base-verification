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

// Preço de cada plano, igual ao de create-mp-preference. Pagamento abaixo disso não ativa.
const PLAN_AMOUNT: Record<string, number> = { monthly: 14.90, lifetime: 199.00 };
const MONTHLY_DAYS = 32;

/**
 * Vencimento do mensal: soma 32 dias a partir do vencimento atual quando ele
 * ainda está no futuro, para que renovar antes da hora não descarte dias pagos.
 */
function nextMonthlyExpiry(currentExpiry: string | null, now = new Date()): string {
  const current = currentExpiry ? new Date(currentExpiry) : null;
  const base = current && current > now ? current : now;
  const expires = new Date(base);
  expires.setDate(expires.getDate() + MONTHLY_DAYS);
  return expires.toISOString();
}

const REFUND_SUFFIX = ':estorno';
const PROFILE_FIELDS = 'is_premium, premium_plan, premium_expires_at, premium_updated_at, mp_payment_id';

// Colunas que só o servidor altera (trigger da migration 017). Servem de trava
// otimista; premium_updated_at não serve, porque o próprio usuário pode mudá-la.
const GUARD_FIELDS = ['is_premium', 'premium_plan', 'premium_expires_at', 'mp_payment_id'] as const;

/**
 * Atualiza o perfil só se as colunas de premium não mudaram desde a leitura,
 * para que dois avisos simultâneos não se sobrescrevam. 'conflict' pede nova tentativa.
 */
// deno-lint-ignore no-explicit-any
async function guardedProfileUpdate(supabase: any, userId: string, previous: Record<string, unknown> | null,
  fields: Record<string, unknown>): Promise<'ok' | 'conflict' | 'error'> {
  let query = supabase.from('profiles').update(fields).eq('id', userId);
  for (const col of GUARD_FIELDS) {
    const value = previous?.[col] ?? null;
    query = value === null ? query.is(col, null) : query.eq(col, value);
  }
  const { data, error } = await query.select('id');
  if (error) {
    console.error('Supabase update error:', error);
    return 'error';
  }
  return data?.length ? 'ok' : 'conflict';
}

/**
 * Desfaz um pagamento estornado ou contestado. O mensal devolve os 32 dias que
 * somou; o vitalício cai só se não restar outro vitalício pago. Um marcador
 * `<id>:estorno` em processed_payments garante que o estorno conte uma vez.
 */
// deno-lint-ignore no-explicit-any
async function revokePayment(supabase: any, paymentId: string, userId: string, status: string): Promise<Response> {
  const { data: current, error: currentError } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single();
  if (currentError) {
    console.error('Supabase profile read error:', currentError);
    return new Response('DB error', { status: 500 });
  }

  const { data: grantedRow, error: grantedError } = await supabase
    .from('processed_payments')
    .select('payment_id, plan')
    .eq('user_id', userId)
    .eq('payment_id', paymentId)
    .maybeSingle();
  if (grantedError) {
    console.error('Supabase ledger read error:', grantedError);
    return new Response('DB error', { status: 500 });
  }

  const now = new Date();
  if (!grantedRow) {
    // Pagamento anterior ao registro em processed_payments: vale a regra antiga,
    // que revoga quando ele é o pagamento guardado no perfil.
    if (current?.mp_payment_id !== paymentId) {
      logInvalidAttempt('refund_without_grant', { paymentId, userId, status });
      return new Response('ok', { status: 200 });
    }
    const result = await guardedProfileUpdate(supabase, userId, current,
      { is_premium: false, premium_expires_at: null, premium_updated_at: now.toISOString() });
    if (result !== 'ok') return new Response('Retry', { status: result === 'conflict' ? 409 : 500 });
    console.log(`Payment ${paymentId} ${status}: legacy grant revoked for ${userId}`);
    return new Response('ok', { status: 200 });
  }

  const marker = paymentId + REFUND_SUFFIX;
  const { error: markerError } = await supabase
    .from('processed_payments')
    .insert({ payment_id: marker, user_id: userId, plan: 'refund' });
  if (markerError) {
    if (markerError.code === '23505') {
      console.log(`Refund ${paymentId} already processed. Skipping.`);
      return new Response('ok', { status: 200 });
    }
    console.error('Failed to log refund idempotency:', markerError);
    return new Response('DB error', { status: 500 });
  }
  const undoMarker = () => supabase.from('processed_payments').delete().eq('payment_id', marker);

  // O histórico é lido depois de gravar o marcador: de dois estornos simultâneos,
  // ao menos o último enxerga o marcador do outro.
  const { data: rows, error: rowsError } = await supabase
    .from('processed_payments')
    .select('payment_id, plan')
    .eq('user_id', userId);
  if (rowsError) {
    console.error('Supabase ledger read error:', rowsError);
    await undoMarker();
    return new Response('DB error', { status: 500 });
  }
  const ledger: { payment_id: string; plan: string }[] = rows ?? [];
  const refunded = new Set(ledger.filter(r => r.payment_id.endsWith(REFUND_SUFFIX))
    .map(r => r.payment_id.slice(0, -REFUND_SUFFIX.length)));
  const otherLifetime = ledger.some(r => r.plan === 'lifetime' && !r.payment_id.endsWith(REFUND_SUFFIX) && !refunded.has(r.payment_id));

  let update: Record<string, unknown> | null = null;
  if (current?.is_premium && current.premium_plan === 'lifetime') {
    // O vitalício só cai quando o estornado é um vitalício e não sobra outro.
    if (grantedRow.plan === 'lifetime' && !otherLifetime) {
      update = { is_premium: false, premium_expires_at: null };
    }
  } else if (current?.is_premium && grantedRow.plan === 'monthly' && current.premium_expires_at) {
    const expires = new Date(current.premium_expires_at);
    expires.setDate(expires.getDate() - MONTHLY_DAYS);
    update = expires > now
      ? { premium_expires_at: expires.toISOString() }
      : { is_premium: false, premium_expires_at: null };
  }

  if (update) {
    const result = await guardedProfileUpdate(supabase, userId, current,
      { ...update, premium_updated_at: now.toISOString() });
    if (result !== 'ok') {
      await undoMarker();
      return new Response('Retry', { status: result === 'conflict' ? 409 : 500 });
    }
  }

  console.log(`Payment ${paymentId} ${status}: ${update ? JSON.stringify(update) : 'nothing to revoke'} for ${userId}`);
  return new Response('ok', { status: 200 });
}

Deno.serve(async (req) => {
  // Mercado Pago às vezes envia GET para validar o endpoint
  if (req.method === 'GET') {
    return new Response('ok', { status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Lê o body uma única vez (necessário para validar assinatura E parsear JSON)
    const rawBody = await req.text();

    // Validar assinatura HMAC do Mercado Pago
    const valid = await verifySignature(req, rawBody);
    if (!valid) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = JSON.parse(rawBody);
    console.log('MP webhook received:', JSON.stringify(body));

    // MP envia diferentes tipos de notificação:
    // - IPN clássico: { topic: 'payment', id: '...' }
    // - Webhooks v2:  { type: 'payment', data: { id: '...' } }
    let paymentId: string | null = null;

    if (body.type === 'payment' && body.data?.id) {
      paymentId = String(body.data.id);
    } else if (body.topic === 'payment' && body.id) {
      paymentId = String(body.id);
    }

    if (!paymentId) {
      console.log('Not a payment notification, skipping:', body.type ?? body.topic);
      return new Response('ok', { status: 200 });
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpToken) {
      console.error('MP_ACCESS_TOKEN not set');
      return new Response('Config error', { status: 500 });
    }

    // Buscar detalhes do pagamento na API do Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    });

    if (!mpRes.ok) {
      console.error('Failed to fetch payment from MP:', mpRes.status, await mpRes.text());
      // Instabilidade do MP precisa de retry: responder 200 aqui deixaria o
      // pagamento aprovado sem ativação. Erro 4xx não melhora ao repetir.
      const transient = mpRes.status === 429 || mpRes.status >= 500;
      return new Response(transient ? 'MP unavailable' : 'ok', { status: transient ? 502 : 200 });
    }

    const payment = await mpRes.json();
    console.log('Payment status:', payment.status, 'ref:', payment.external_reference);

    // external_reference: "user_id:plan" (ex: "abc-123:monthly")
    const ref: string = payment.external_reference ?? '';
    const colonIdx = ref.lastIndexOf(':');
    if (colonIdx === -1) {
      console.error('Invalid external_reference:', ref);
      return new Response('ok', { status: 200 });
    }

    const userId = ref.substring(0, colonIdx);
    const plan   = ref.substring(colonIdx + 1); // 'monthly' | 'lifetime'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Estorno ou contestação: retira só o que este pagamento concedeu, a partir
    // do registro em processed_payments (não da coluna mp_payment_id, que guarda
    // apenas o último pagamento).
    if (payment.status === 'refunded' || payment.status === 'charged_back') {
      return await revokePayment(supabase, paymentId, userId, payment.status);
    }

    // Só processa pagamentos aprovados
    if (payment.status !== 'approved') {
      return new Response('ok', { status: 200 });
    }

    const expectedAmount = PLAN_AMOUNT[plan];
    if (expectedAmount === undefined || payment.currency_id !== 'BRL' ||
        !(Number(payment.transaction_amount) >= expectedAmount)) {
      logInvalidAttempt('amount_or_plan_mismatch', {
        paymentId, plan, amount: payment.transaction_amount, currency: payment.currency_id,
      });
      return new Response('ok', { status: 200 });
    }

    const { data: current, error: currentError } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', userId)
      .single();
    if (currentError) {
      console.error('Supabase profile read error:', currentError);
      return new Response('DB error', { status: 500 });
    }

    // Quem já tem o vitalício e compra o mensal continua vitalício.
    const keepsLifetime = current?.is_premium && current.premium_plan === 'lifetime';
    const finalPlan = keepsLifetime ? 'lifetime' : plan;
    // lifetime → expiresAt null (nunca expira)
    const expiresAt = finalPlan === 'monthly'
      ? nextMonthlyExpiry(current?.is_premium ? current.premium_expires_at : null)
      : null;

    // Tenta registrar o pagamento para garantir idempotência (chave única)
    const { error: insertError } = await supabase
      .from('processed_payments')
      .insert({
        payment_id: paymentId,
        user_id: userId,
        plan: plan,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        console.log(`Payment ${paymentId} already processed (idempotency check). Skipping profile update.`);
        return new Response('ok', { status: 200 });
      }
      console.error('Failed to log payment idempotency:', insertError);
      return new Response('DB error', { status: 500 });
    }

    const result = await guardedProfileUpdate(supabase, userId, current, {
      is_premium:          true,
      premium_plan:        finalPlan,
      premium_expires_at:  expiresAt,
      premium_updated_at:  new Date().toISOString(),
      // O vitalício guarda o pagamento que o concedeu.
      ...(keepsLifetime ? {} : { mp_payment_id: paymentId }),
    });

    if (result !== 'ok') {
      // Desfaz o marcador de idempotência: a ativação NÃO ocorreu, então o
      // retry do Mercado Pago precisa reprocessar este pagamento. Sem este
      // rollback, o 23505 do retry pularia a ativação e o usuário ficaria
      // "pago mas não ativado". Um conflito (outro aviso mudou o perfil no
      // meio) também volta para nova tentativa, com o perfil relido.
      await supabase.from('processed_payments').delete().eq('payment_id', paymentId);
      return new Response(result === 'conflict' ? 'Retry' : 'DB error', { status: result === 'conflict' ? 409 : 500 });
    }

    console.log(`✅ User ${userId} activated ${finalPlan} (expires: ${expiresAt ?? 'never'})`);
    return new Response('ok', { status: 200 });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
