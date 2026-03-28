/**
 * Supabase Edge Function: mp-webhook
 *
 * Recebe notificações IPN do Mercado Pago e atualiza o status premium do usuário.
 *
 * Variáveis de ambiente necessárias:
 *   MP_ACCESS_TOKEN          — Access Token do Mercado Pago
 *   SUPABASE_SERVICE_ROLE_KEY — Service Role Key (acesso admin ao Supabase)
 *
 * URL a configurar no Mercado Pago / preferência:
 *   https://<project>.supabase.co/functions/v1/mp-webhook
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Mercado Pago às vezes envia GET para validar o endpoint
  if (req.method === 'GET') {
    return new Response('ok', { status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
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
