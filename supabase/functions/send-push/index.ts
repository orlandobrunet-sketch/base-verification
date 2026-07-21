/**
 * Supabase Edge Function: send-push
 *
 * Envia Web Push notifications para um usuário específico ou para todos
 * os assinantes. Requer autenticação com service role (admin only).
 *
 * Variáveis de ambiente necessárias:
 *   VAPID_PUBLIC_KEY   — chave pública VAPID (base64url)
 *   VAPID_PRIVATE_KEY  — chave privada VAPID (base64url)
 *   VAPID_SUBJECT      — mailto: ou URL do remetente (ex: mailto:admin@nefroquest.com)
 *   SUPABASE_URL       — injetada automaticamente
 *   SUPABASE_SERVICE_ROLE_KEY — injetada automaticamente
 *
 * Body JSON:
 *   { userId?: string, title: string, body: string, url?: string, tag?: string }
 *   Se userId omitido, envia para todos os assinantes.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ── VAPID signing helpers ────────────────────────────────────────────────────

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function buildVapidToken(
  audience: string,
  subject: string,
  privateKeyB64: string,
): Promise<string> {
  const header = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const now = Math.floor(Date.now() / 1000);
  const payload = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: now + 43200, // 12 hours
    sub: subject,
  })));
  const signingInput = `${header}.${payload}`;
  const rawKey = base64UrlToUint8Array(privateKeyB64);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', rawKey as BufferSource, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  ).catch(async () => {
    // Try PKCS8 format if raw fails (some VAPID key generators use PKCS8)
    const pkcs8Key = base64UrlToUint8Array(privateKeyB64);
    return crypto.subtle.importKey('pkcs8', pkcs8Key as BufferSource, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  });
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${uint8ArrayToBase64Url(new Uint8Array(sig))}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: string,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string,
): Promise<{ ok: boolean; status: number; endpoint: string }> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const token = await buildVapidToken(audience, vapidSubject, vapidPrivate);

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': `vapid t=${token},k=${vapidPublic}`,
    },
    body: payload,
  });
  return { ok: res.ok || res.status === 201, status: res.status, endpoint: subscription.endpoint };
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // Cliente com service role (server-side) para acessar o banco e validar tokens.
  const supa = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

  // Autorização: aceita a service-role key (cron/admin direto) OU um usuário
  // autenticado cujo JWT tenha app_metadata.is_admin === true. A service key
  // NUNCA é exigida no cliente — o painel admin chama com o token do admin.
  let authorized = !!serviceKey && authHeader.includes(serviceKey);
  if (!authorized) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token) {
      try {
        const { data: { user } } = await supa.auth.getUser(token);
        authorized = user?.app_metadata?.is_admin === true;
      } catch { authorized = false; }
    }
  }
  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')  ?? '';
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@nefroquest.com';

  if (!vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  let body: { userId?: string; title: string; body: string; url?: string; tag?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const { userId, title, body: msgBody, url = '/jogar/', tag = 'nq-push' } = body;
  if (!title || !msgBody) {
    return new Response(JSON.stringify({ error: 'title and body are required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  // Fetch target subscriptions
  let query = supa.from('push_subscriptions').select('endpoint, p256dh, auth_key');
  if (userId) query = query.eq('user_id', userId);
  const { data: subs, error: dbErr } = await query;
  if (dbErr) {
    return new Response(JSON.stringify({ error: dbErr.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0 }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const payload = JSON.stringify({ title, body: msgBody, url, tag, icon: '/assets/images/favicon-192x192.png', badge: '/assets/images/favicon-32x32.png' });

  const results = await Promise.allSettled(
    subs.map(sub => sendWebPush(sub, payload, vapidPublic, vapidPrivate, vapidSubject))
  );

  let sent = 0, failed = 0;
  const staleEndpoints: string[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.ok) {
      sent++;
    } else {
      failed++;
      // 404/410 = subscription expired — clean up
      const status = r.status === 'fulfilled' ? r.value.status : 0;
      if (status === 404 || status === 410) {
        const ep = r.status === 'fulfilled' ? r.value.endpoint : '';
        if (ep) staleEndpoints.push(ep);
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await supa.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
  }

  return new Response(JSON.stringify({ sent, failed, stale_removed: staleEndpoints.length }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
