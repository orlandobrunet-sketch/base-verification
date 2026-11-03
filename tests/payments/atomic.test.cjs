const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { database, reset, processPayment: pay, profile, user, url } = require('./database.cjs');
let db;
before(async () => { db = await database(); });
after(async () => { await db?.close(); });
beforeEach(async () => { await reset(db); });
const expiry = row => new Date(row.premium_expires_at).toISOString();

test('a refund received before approval prevents later activation', async () => {
  await pay(db, '101', 'refunded');
  await pay(db, '101');
  assert.equal((await profile(db)).is_premium, false);
});

test('duplicate approval grants one monthly period', async () => {
  await reset(db, { is_premium: true, premium_plan: 'monthly', premium_expires_at: '2099-01-01T00:00:00Z' });
  await pay(db, '102'); await pay(db, '102');
  assert.equal(expiry(await profile(db)), '2099-02-02T00:00:00.000Z');
});

test('two renewals preserve all paid days', async () => {
  await reset(db, { is_premium: true, premium_plan: 'monthly', premium_expires_at: '2099-01-01T00:00:00Z' });
  await Promise.all([pay(db, '103'), pay(db, '104')]);
  assert.equal(expiry(await profile(db)), '2099-03-06T00:00:00.000Z');
});

test('refunding an older monthly payment subtracts it only once', async () => {
  await reset(db, { is_premium: true, premium_plan: 'monthly', premium_expires_at: '2099-01-01T00:00:00Z' });
  await pay(db, '105'); await pay(db, '106');
  await pay(db, '105', 'refunded'); await pay(db, '105', 'charged_back');
  assert.equal(expiry(await profile(db)), '2099-02-02T00:00:00.000Z');
});

test('refunding the only monthly grant removes access', async () => {
  await pay(db, '107'); await pay(db, '107', 'refunded');
  assert.equal((await profile(db)).is_premium, false);
});

test('a monthly purchase and its refund do not downgrade lifetime access', async () => {
  await pay(db, '108', 'approved', 'lifetime', 199);
  await pay(db, '109'); await pay(db, '109', 'refunded');
  const row = await profile(db);
  assert.equal(row.is_premium, true); assert.equal(row.premium_plan, 'lifetime');
  assert.equal(row.mp_payment_id, '108'); assert.equal(row.premium_expires_at, null);
});

test('lifetime access survives one refund and ends after the last grant is refunded', async () => {
  await pay(db, '110', 'approved', 'lifetime', 199); await pay(db, '111', 'approved', 'lifetime', 199);
  await pay(db, '110', 'refunded', 'lifetime', 199);
  assert.equal((await profile(db)).is_premium, true);
  await pay(db, '111', 'charged_back', 'lifetime', 199);
  assert.equal((await profile(db)).is_premium, false);
});

test('a legacy refund revokes only its own profile grant', async () => {
  await reset(db, { is_premium: true, premium_plan: 'lifetime', mp_payment_id: '112' });
  await pay(db, '113', 'refunded'); assert.equal((await profile(db)).is_premium, true);
  await pay(db, '112', 'refunded'); assert.equal((await profile(db)).is_premium, false);
});

test('underpayment, wrong currency and unsupported plans grant nothing', async () => {
  await pay(db, '114', 'approved', 'monthly', 14.89);
  await pay(db, '115', 'approved', 'monthly', 14.9, 'USD');
  await pay(db, '116', 'approved', 'unknown', 199);
  assert.equal((await profile(db)).is_premium, false);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.processed_payments')).rows[0].n, 0);
});

test('a profile write failure rolls back the payment marker and permits retry', async () => {
  await db.exec(`CREATE OR REPLACE FUNCTION public.reject_test_grant() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'injected write failure'; END $$;
    CREATE TRIGGER reject_test_grant BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.reject_test_grant();`);
  await assert.rejects(pay(db, '117'), /injected write failure/);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.processed_payments')).rows[0].n, 0);
  await db.exec('DROP TRIGGER reject_test_grant ON public.profiles');
  await pay(db, '117'); assert.equal((await profile(db)).is_premium, true);
});

test('only the service role can execute the payment function', async () => {
  const { rows } = await db.query(`SELECT rolname, has_function_privilege(rolname,
    'public.process_mp_payment(text,uuid,text,text,numeric,text)', 'EXECUTE') AS allowed
    FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role') ORDER BY rolname`);
  assert.deepEqual(rows.map(r => [r.rolname, r.allowed]), [['anon', false], ['authenticated', false], ['service_role', true]]);
});

test('a refund waits for an uncommitted approval and then revokes it', { skip: !url }, async () => {
  const { Client } = require('pg');
  const approving = new Client({ connectionString: url }), refunding = new Client({ connectionString: url });
  await approving.connect(); await refunding.connect();
  try {
    await approving.query('BEGIN');
    await pay(approving, '118');
    const backend = (await refunding.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    const refund = pay(refunding, '118', 'refunded');
    const deadline = Date.now() + 5000;
    let locked = false;
    while (Date.now() < deadline) {
      locked = (await db.query("SELECT wait_event_type='Lock' AS locked FROM pg_stat_activity WHERE pid=$1", [backend])).rows[0]?.locked;
      if (locked) break;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(locked, true, 'refund must wait for the approval transaction');
    await approving.query('COMMIT'); await refund;
    assert.equal((await profile(db)).is_premium, false);
  } finally {
    await approving.query('ROLLBACK'); await approving.end(); await refunding.end();
  }
});

test('independent connections preserve concurrent renewal and refund totals', { skip: !url }, async () => {
  await reset(db, { is_premium: true, premium_plan: 'monthly', premium_expires_at: '2099-01-01T00:00:00Z' });
  const { Client } = require('pg');
  const first = new Client({ connectionString: url }), second = new Client({ connectionString: url });
  await first.connect(); await second.connect();
  try {
    await Promise.all([pay(first, '119'), pay(second, '120')]);
    assert.equal(expiry(await profile(db)), '2099-03-06T00:00:00.000Z');
    await Promise.all([pay(first, '119', 'refunded'), pay(second, '120', 'refunded')]);
    assert.equal(expiry(await profile(db)), '2099-01-01T00:00:00.000Z');
  } finally { await first.end(); await second.end(); }
});
