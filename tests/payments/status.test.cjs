const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const vm = require('node:vm');

const code = stripTypeScriptTypes(readFileSync(join(__dirname, '../../supabase/functions/mp-payment-status/index.ts'), 'utf8'));
const owner = '650effbc-f929-4553-9da7-13f89b35ad2d';
const other = '8bb4d91b-4255-4687-b54f-f04ed5a1c3aa';
const time = '2026-11-09T12:00:00Z';
const activeLifetime = { is_premium: true, premium_plan: 'lifetime', premium_expires_at: null };
const entry = (payment_id, user_id, plan) => ({ payment_id, user_id, plan, processed_at: time });

function endpoint({ profile = activeLifetime, payments = [], failure, beforeProfile } = {}) {
  let handler;
  const reads = [];
  const context = vm.createContext({
    Request, Response, URL, URLSearchParams, AbortSignal, Date,
    Deno: {
      env: { get: key => ({
        SUPABASE_URL: 'https://db.example.test',
        SUPABASE_ANON_KEY: 'fixture-public',
        SUPABASE_SERVICE_ROLE_KEY: 'fixture-service',
      })[key] },
      serve: fn => { handler = fn; },
    },
    fetch: async (target, options) => {
      const url = new URL(target);
      reads.push(url);
      assert.equal(url.origin, 'https://db.example.test');
      if (url.pathname === '/auth/v1/user') {
        assert.equal(options.headers.apikey, 'fixture-public');
        if (options.headers.Authorization === 'Bearer signed-a') return Response.json({ id: owner });
        if (options.headers.Authorization === 'Bearer signed-b') return Response.json({ id: other });
        return new Response('', { status: 401 });
      }
      assert.equal(options.headers.apikey, 'fixture-service');
      assert.equal(options.headers.Authorization, 'Bearer fixture-service');
      assert.equal(options.method ?? 'GET', 'GET');
      if (failure) return new Response('private database error', { status: 500 });
      if (url.pathname === '/rest/v1/profiles') {
        beforeProfile?.();
        const id = url.searchParams.get('id')?.slice(3);
        return Response.json(id === owner && profile ? [profile] : []);
      }
      assert.equal(url.pathname, '/rest/v1/processed_payments');
      const userId = url.searchParams.get('user_id')?.slice(3);
      const filter = url.searchParams.get('payment_id');
      const ids = filter?.startsWith('in.(') ? filter.slice(4, -1).split(',')
        : filter?.startsWith('eq.') ? [filter.slice(3)] : null;
      return Response.json(payments.filter(row => (!userId || row.user_id === userId) && (!ids || ids.includes(row.payment_id))));
    },
  });
  vm.runInContext(code, context);
  return { handler, reads };
}

function request({ token = 'signed-a', origin = 'https://nefroquest.com', id = '123', body = {} } = {}) {
  return new Request('https://db.example.test/functions/v1/mp-payment-status', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ payment_id: id, ...body }),
  });
}

test('only authenticated, numeric payment lookups reach the ledger', async () => {
  const { handler, reads } = endpoint();
  assert.equal((await handler(request({ token: null }))).status, 401);
  assert.equal((await handler(request({ id: '123,456' }))).status, 400);
  assert.equal((await handler(request({ origin: 'https://other.example' }))).status, 403);
  assert.equal(reads.length, 0);
  assert.equal((await handler(request({ token: 'unsigned-user' }))).status, 401);
  assert.deepEqual(reads.map(url => url.pathname), ['/auth/v1/user']);
});

test('the authenticated owner scopes profile and ledger, even with a forged owner and plan', async () => {
  const { handler, reads } = endpoint({ payments: [entry('123', other, 'lifetime')] });
  const response = await handler(request({ body: { user_id: other, plan: 'lifetime', status: 'approved' } }));
  assert.deepEqual(await response.json(), { status: 'pending' });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(reads[1].searchParams.get('user_id'), 'eq.' + owner);
  assert.equal(reads[1].searchParams.get('payment_id'), 'in.(123,123:estorno)');
  assert.equal(reads.length, 2, 'consultar o perfil não é necessário para um pagamento alheio');
});

test('existing access does not confirm a new receipt before its ledger grant', async () => {
  const payments = [entry('456', owner, 'lifetime')];
  const { handler, reads } = endpoint({ payments });
  assert.deepEqual(await (await handler(request())).json(), { status: 'pending' });
  assert.equal(reads.some(url => url.pathname === '/rest/v1/profiles'), false);
  payments.push(entry('123', owner, 'monthly'));
  assert.deepEqual(await (await handler(request({ body: { plan: 'lifetime' } }))).json(),
    { status: 'confirmed', plan: 'monthly', processed_at: time });
  assert.equal(reads.at(-2).searchParams.get('id'), 'eq.' + owner);
});

test('refund during the profile query takes priority over another active plan', async () => {
  const payments = [entry('123', owner, 'monthly'), entry('456', owner, 'lifetime')];
  const { handler, reads } = endpoint({
    payments,
    beforeProfile: () => payments.push(entry('123:estorno', owner, 'refund')),
  });
  assert.deepEqual(await (await handler(request())).json(), { status: 'reversed' });
  assert.equal(reads.at(-1).searchParams.get('user_id'), 'eq.' + owner);
  assert.equal(reads.at(-1).searchParams.get('payment_id'), 'eq.123:estorno');
});

test('an owned refund blocks confirmation before and after the matching purchase arrives', async () => {
  const payments = [entry('123:estorno', owner, 'refund')];
  const { handler } = endpoint({ payments });
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.deepEqual(await (await handler(request())).json(), { status: 'reversed' });
    payments.push(entry('123', owner, 'lifetime'));
  }
});

test('recorded payments with expired or incompatible access cannot activate premium', async () => {
  const scenarios = [
    { paymentPlan: 'monthly', profile: { is_premium: true, premium_plan: 'monthly', premium_expires_at: '2000-01-01T00:00:00Z' } },
    { paymentPlan: 'lifetime', profile: { is_premium: true, premium_plan: 'monthly', premium_expires_at: '2099-01-01T00:00:00Z' } },
    { paymentPlan: 'lifetime', profile: null },
  ];
  for (const { paymentPlan, profile } of scenarios) {
    const { handler } = endpoint({ profile, payments: [entry('123', owner, paymentPlan)] });
    assert.deepEqual(await (await handler(request())).json(), { status: 'recorded', plan: paymentPlan, processed_at: time });
  }
});

test('database failure yields unavailable without exposing private details', async () => {
  const { handler } = endpoint({ failure: true });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: 'unavailable' });
});
