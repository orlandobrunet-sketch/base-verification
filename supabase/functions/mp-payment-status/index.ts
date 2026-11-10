// Status de retorno do Checkout Pro. O webhook é o único caminho que concede acesso.
const siteOrigin = 'https://nefroquest.com';

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const allowed = !origin || origin === siteOrigin || origin === 'https://www.nefroquest.com'
    || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    || /^https:\/\/[a-z0-9-]+-[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/.test(origin);
  const headers = {
    'Access-Control-Allow-Origin': allowed && origin ? origin : siteOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
  const json = (body: object, status = 200) => new Response(JSON.stringify(body), { headers, status });
  if (!allowed) return json({ status: 'forbidden' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { headers, status: 204 });
  if (req.method !== 'POST') return json({ status: 'method_not_allowed' }, 405);
  const authorization = req.headers.get('Authorization');
  if (!authorization || !/^Bearer [^\s,]+$/i.test(authorization)) return json({ status: 'unauthorized' }, 401);

  const body = await req.json().catch(() => null);
  const paymentId = body?.payment_id;
  if (typeof paymentId !== 'string' || !/^\d{1,32}$/.test(paymentId)) return json({ status: 'invalid' }, 400);
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json({ status: 'unavailable' }, 503);

  try {
    const signal = AbortSignal.timeout(7000);
    // Consulta o Auth para validar o token e obter o dono. Nenhum campo do
    // navegador identifica a conta para as consultas privilegiadas.
    const identity = await fetch(url + '/auth/v1/user', {
      headers: { apikey: anonKey, Authorization: authorization }, signal,
    });
    if (identity.status === 401 || identity.status === 403) return json({ status: 'unauthorized' }, 401);
    if (!identity.ok) return json({ status: 'unavailable' }, 503);
    const user = await identity.json();
    if (typeof user.id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(user.id)) {
      return json({ status: 'unauthorized' }, 401);
    }
    const read = async (table: string, filters: Record<string, string>) => {
      const response = await fetch(url + '/rest/v1/' + table + '?' + new URLSearchParams(filters), {
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }, signal,
      });
      if (!response.ok) throw new Error('Unable to read payment state');
      return await response.json();
    };
    const reversalId = paymentId + ':estorno';
    const payments = await read('processed_payments', {
      select: 'payment_id,plan,processed_at', user_id: 'eq.' + user.id,
      payment_id: 'in.(' + paymentId + ',' + reversalId + ')',
    });
    if (payments.some((entry: { payment_id: string }) => entry.payment_id === reversalId)) {
      return json({ status: 'reversed' });
    }
    const payment = payments.find((entry: { payment_id: string }) => entry.payment_id === paymentId);
    if (!payment || !['monthly', 'lifetime'].includes(payment.plan)) return json({ status: 'pending' });
    // O webhook grava a compra e o perfil na mesma transação. Ler primeiro o
    // registro evita combinar uma compra nova com um perfil anterior ao grant.
    const [profile] = await read('profiles', {
      select: 'is_premium,premium_plan,premium_expires_at', id: 'eq.' + user.id,
    });
    // Um estorno pode chegar enquanto o perfil é lido e preservar outro plano.
    const reversals = await read('processed_payments', {
      select: 'payment_id', user_id: 'eq.' + user.id, payment_id: 'eq.' + reversalId,
    });
    if (reversals.length) return json({ status: 'reversed' });
    const planMatches = profile?.premium_plan === payment.plan || profile?.premium_plan === 'lifetime';
    const active = profile?.is_premium === true && planMatches && (
      (profile.premium_plan === 'lifetime' && profile.premium_expires_at === null) ||
      Date.parse(profile.premium_expires_at) > Date.now()
    );
    return json({
      status: active ? 'confirmed' : 'recorded',
      plan: payment.plan,
      processed_at: payment.processed_at,
    });
  } catch {
    return json({ status: 'unavailable' }, 503);
  }
});
