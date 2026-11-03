const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const { createHmac, webcrypto } = require('node:crypto');
const { database, reset, profile, user, root } = require('./database.cjs');
let db;
before(async () => { db = await database(); });
after(async () => { await db?.close(); });
beforeEach(async () => { await reset(db); });
const code = stripTypeScriptTypes(readFileSync(join(root, 'supabase/functions/mp-webhook/index.ts'), 'utf8')
  .replace(/^import .*createClient.*;\r?\n/m, ''));

function webhook(options = {}) {
  let handler;
  const statuses = [...(options.statuses || ['approved'])];
  const context = vm.createContext({
    Request, Response, URL, TextEncoder, Date, crypto: webcrypto,
    console: { log() {}, error() {} },
    Deno: { env: { get: () => 'test-only' }, serve: fn => { handler = fn; } },
    fetch: async url => {
      assert.equal(url, 'https://api.mercadopago.com/v1/payments/123');
      if (options.apiStatus) return new Response('', { status: options.apiStatus });
      return new Response(JSON.stringify({ id: 123, status: statuses.shift() ?? 'approved',
        external_reference: user + ':monthly', transaction_amount: options.amount ?? 14.9,
        currency_id: options.currency ?? 'BRL' }));
    },
    createClient: () => ({ rpc: async (name, p) => {
      assert.equal(name, 'process_mp_payment');
      if (options.rpcError) return { data: null, error: { message: 'database unavailable' } };
      if (options.beforeTransaction) await options.beforeTransaction(p.p_status);
      try {
        const { rows } = await db.query('SELECT public.process_mp_payment($1,$2,$3,$4,$5,$6) AS result',
          [p.p_payment_id, p.p_user_id, p.p_plan, p.p_status, p.p_amount, p.p_currency]);
        return { data: rows[0].result, error: null };
      } catch (error) { return { data: null, error: { message: error.message } }; }
    } }),
  });
  vm.runInContext(code, context);
  return handler;
}

function request({ bodyId = '123', signature = true } = {}) {
  const hmac = createHmac('sha256', 'test-only').update('id:123;request-id:test-request;ts:1;').digest('hex');
  return new Request('https://example.test/webhook?data.id=123', {
    method: 'POST', headers: { 'x-request-id': 'test-request', 'x-signature': signature ? 'ts=1,v1=' + hmac : '' },
    body: JSON.stringify({ type: 'payment', data: { id: bodyId } }),
  });
}

test('a signed webhook grants access through the real database transaction', async () => {
  assert.equal((await webhook()(request())).status, 200);
  assert.equal((await profile(db)).is_premium, true);
});

test('unsigned notifications and mismatched signed IDs cannot grant access', async () => {
  const handler = webhook();
  assert.equal((await handler(request({ signature: false }))).status, 401);
  assert.equal((await handler(request({ bodyId: '456' }))).status, 400);
  assert.equal((await profile(db)).is_premium, false);
});

test('transient payment API errors request another notification', async () => {
  for (const apiStatus of [429, 503]) assert.equal((await webhook({ apiStatus })(request())).status, 502);
  assert.equal((await profile(db)).is_premium, false);
});

test('underpayment and a different currency never reach activation', async () => {
  assert.equal((await webhook({ amount: 14.89 })(request())).status, 200);
  assert.equal((await webhook({ currency: 'USD' })(request())).status, 200);
  assert.equal((await profile(db)).is_premium, false);
});

test('an unavailable transaction returns an error instead of acknowledging a grant', async () => {
  assert.equal((await webhook({ rpcError: true })(request())).status, 500);
  assert.equal((await profile(db)).is_premium, false);
});

test('a delayed approval cannot reactivate a refund accepted by the webhook', async () => {
  let paused, resume;
  const approvalPaused = new Promise(resolve => { paused = resolve; });
  const resumeApproval = new Promise(resolve => { resume = resolve; });
  const handler = webhook({ statuses: ['approved', 'refunded'], beforeTransaction: async status => {
    if (status === 'approved') { paused(); await resumeApproval; }
  } });
  const approval = handler(request());
  await approvalPaused;
  try { assert.equal((await handler(request())).status, 200); }
  finally { resume(); }
  assert.equal((await approval).status, 200);
  assert.equal((await profile(db)).is_premium, false);
  const marker = await db.query("SELECT payment_id FROM public.processed_payments WHERE payment_id='123:estorno'");
  assert.equal(marker.rows.length, 1);
});
