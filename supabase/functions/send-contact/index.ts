/**
 * Supabase Edge Function: send-contact
 *
 * Proxy para Web3Forms — mantém a chave de API fora do código cliente.
 * Aceita apenas POST com { name, email, message }.
 *
 * Variáveis de ambiente necessárias:
 *   WEB3FORMS_KEY — chave de acesso Web3Forms
 */

const ALLOWED_ORIGINS = [
  'https://nefroquest.com',
  'https://www.nefroquest.com',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin != null && (
      ALLOWED_ORIGINS.includes(origin) ||
      /^https:\/\/[a-z0-9-]+-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/.test(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    );

  return {
    'Access-Control-Allow-Origin': allowed ? origin! : 'https://nefroquest.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const MAX_NAME    = 120;
const MAX_EMAIL   = 254;
const MAX_MESSAGE = 2000;

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const cors   = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('WEB3FORMS_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Not configured' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let body: { name?: unknown; email?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { name = '', email = '', message = '' } = body;

  if (
    typeof name    !== 'string' || name.trim().length    === 0 || name.length    > MAX_NAME    ||
    typeof email   !== 'string' || email.trim().length   === 0 || email.length   > MAX_EMAIL   ||
    typeof message !== 'string' || message.trim().length === 0 || message.length > MAX_MESSAGE
  ) {
    return new Response(JSON.stringify({ error: 'Invalid fields' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: apiKey,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('Web3Forms error:', res.status, data);
      return new Response(JSON.stringify({ error: 'Failed to send' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-contact error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
