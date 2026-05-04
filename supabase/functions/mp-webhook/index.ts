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

async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!secret) {
    // Sem segredo configurado: bloqueia em produção para evitar ativações fraudulentas
    console.error('MP_WEBHOOK_SECRET not set — rejecting request');
    return false;
  }

  const signature = req.headers.get('x-signature') ?? '';
  if (!signature) {
    console.error('Missing x-signature header');
    return false;
  }

  // Formato: ts=<timestamp>,v1=<hmac>
  const ts  = signature.match(/ts=(\d+)/)?.[1] ?? '';
  const v1  = signature.match(/v1=([a-f0-9]+)/)?.[1] ?? '';
  if (!ts || !v1) {
    console.error('Malformed x-signature header:', signature);
    return false;
  }

  // Manifesto: id:<payment_id>;request-id:<x-request-id>;ts:<ts>;
  const requestId  = req.headers.get('x-request-id') ?? '';
  let   paymentId  = '';
  try {
    const body = JSON.parse(rawBody);
    if (body.data?.id)  paymentId = String(body.data.id);
    else if (body.id)   paymentId = String(body.id);
  } catch { /* será tratado depois */ }

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

  if (computed !== v1) {
    console.error('Signature mismatch — computed:', computed, 'received:', v1);
    return false;
  }
  return true;
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
      return new Response('ok', { status: 200 }); // Retorna 200 para MP não retentar
    }

    const payment = await mpRes.json();
    console.log('Payment status:', payment.status, 'ref:', payment.external_reference);

    // Só processa pagamentos aprovados
    if (payment.status !== 'approved') {
      return new Response('ok', { status: 200 });
    }

    // external_reference: "user_id:plan" (ex: "abc-123:monthly")
    const ref: string = payment.external_reference ?? '';
    const colonIdx = ref.lastIndexOf(':');
    if (colonIdx === -1) {
      console.error('Invalid external_reference:', ref);
      return new Response('ok', { status: 200 });
    }

    const userId = ref.substring(0, colonIdx);
    const plan   = ref.substring(colonIdx + 1); // 'monthly' | 'lifetime'

    // Calcular expiração
    let expiresAt: string | null = null;
    if (plan === 'monthly') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 32); // 32 dias de margem
      expiresAt = expires.toISOString();
    }
    // lifetime → expiresAt permanece null (nunca expira)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium:          true,
        premium_plan:        plan,
        premium_expires_at:  expiresAt,
        premium_updated_at:  new Date().toISOString(),
        mp_payment_id:       paymentId,
      })
      .eq('id', userId);

    if (error) {
      console.error('Supabase update error:', error);
      return new Response('DB error', { status: 500 });
    }

    console.log(`✅ User ${userId} activated ${plan} (expires: ${expiresAt ?? 'never'})`);
    return new Response('ok', { status: 200 });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
