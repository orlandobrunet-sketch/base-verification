/**
 * Supabase Edge Function: create-mp-preference
 *
 * Cria uma preferência de pagamento no Mercado Pago e retorna a URL de checkout.
 *
 * Variáveis de ambiente necessárias (Supabase Dashboard → Project Settings → Edge Functions):
 *   MP_ACCESS_TOKEN   — Access Token de produção ou sandbox do Mercado Pago
 *   APP_URL           — URL base do app, ex: https://nefroquest.com
 *   MP_SANDBOX        — "true" para usar sandbox (init_point de teste)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PRICES: Record<string, { title: string; amount: number }> = {
  monthly:  { title: 'NefroQuest — Plano Mensal',   amount: 9.90 },
  lifetime: { title: 'NefroQuest — Acesso Vitalício', amount: 89.00 },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify JWT — only authenticated users can create preferences
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const plan: string = body.plan;

    if (!PRICES[plan]) {
      return new Response(JSON.stringify({ error: 'Plano inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appUrl = Deno.env.get('APP_URL') ?? 'https://nefroquest.com';
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN');

    if (!mpToken) {
      return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN não configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isSandbox = Deno.env.get('MP_SANDBOX') === 'true';
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`;

    const preference = {
      items: [
        {
          id: plan,
          title: PRICES[plan].title,
          description: '1.000+ questões comentadas de Nefrologia, atualizadas constantemente.',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: PRICES[plan].amount,
        },
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${appUrl}?payment=approved&plan=${plan}`,
        failure: `${appUrl}?payment=failed`,
        pending: `${appUrl}?payment=pending&plan=${plan}`,
      },
      auto_return: 'approved',
      external_reference: `${user.id}:${plan}`,
      notification_url: webhookUrl,
      statement_descriptor: 'NEFROQUEST',
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${user.id}-${plan}-${Date.now()}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      console.error('MP API error:', mpRes.status, errText);
      return new Response(JSON.stringify({ error: 'Erro ao criar preferência MP' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mpData = await mpRes.json();
    const checkoutUrl = isSandbox ? mpData.sandbox_init_point : mpData.init_point;

    return new Response(JSON.stringify({ checkout_url: checkoutUrl, preference_id: mpData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge Function error:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
