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

test('a reversal received without a profile blocks a late approval after profile creation', async () => {
  await db.query('DELETE FROM public.profiles WHERE id=$1', [user]);
  assert.equal((await pay(db, '121', 'refunded')).outcome, 'refund_recorded');
  assert.equal((await pay(db, '121', 'charged_back')).outcome, 'already_refunded');
  assert.equal((await pay(db, '121')).outcome, 'already_refunded');
  assert.equal(await profile(db), undefined);

  await db.query('INSERT INTO public.profiles(id) VALUES($1)', [user]);
  assert.equal((await pay(db, '121')).outcome, 'already_refunded');
  assert.equal((await profile(db)).is_premium, false);
  const { rows } = await db.query('SELECT payment_id, user_id, plan FROM public.processed_payments');
  assert.deepEqual(rows, [{ payment_id: '121:estorno', user_id: user, plan: 'refund' }]);
});

test('an approval already recorded is idempotent after profile deletion', async () => {
  await pay(db, '122');
  await db.query('DELETE FROM public.profiles WHERE id=$1', [user]);
  assert.equal((await pay(db, '122')).outcome, 'already_processed');
  assert.equal(await profile(db), undefined);
  const { rows } = await db.query('SELECT payment_id, user_id, plan FROM public.processed_payments');
  assert.deepEqual(rows, [{ payment_id: '122', user_id: user, plan: 'monthly' }]);
});

test('a new approval without a profile still fails and leaves no grant', async () => {
  await db.query('DELETE FROM public.profiles WHERE id=$1', [user]);
  await assert.rejects(pay(db, '123'), { code: 'P0002' });
  assert.equal(await profile(db), undefined);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.processed_payments')).rows[0].n, 0);
});

test('an existing reversal owned by another account rejects both approval and refund', async () => {
  const other = '00000000-0000-4000-8000-000000000002';
  await db.query("INSERT INTO public.processed_payments(payment_id,user_id,plan) VALUES('124:estorno',$1,'refund')", [other]);
  await assert.rejects(pay(db, '124'), { code: '22023' });
  await assert.rejects(pay(db, '124', 'refunded'), { code: '22023' });
  assert.equal((await profile(db)).is_premium, false);
  const { rows } = await db.query('SELECT payment_id, user_id, plan FROM public.processed_payments');
  assert.deepEqual(rows, [{ payment_id: '124:estorno', user_id: other, plan: 'refund' }]);
});

test('approval waits for a reversal started without a profile, even after profile creation', { skip: !url }, async () => {
  const { Client } = require('pg');
  await db.query('DELETE FROM public.profiles WHERE id=$1', [user]);
  const refunding = new Client({ connectionString: url });
  const approving = new Client({ connectionString: url });
  await refunding.connect();
  await approving.connect();
  let approval;
  try {
    await refunding.query('BEGIN');
    assert.equal((await pay(refunding, '125', 'refunded')).outcome, 'refund_recorded');
    // A transação do estorno não encontrou linha de perfil para bloquear.
    await db.query('INSERT INTO public.profiles(id) VALUES($1)', [user]);
    const pid = (await approving.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    approval = pay(approving, '125');
    // Mantém a rejeição observada se o cenário falhar antes do await abaixo.
    approval.catch(() => {});
    const deadline = Date.now() + 5000;
    let locked = false;
    while (!locked && Date.now() < deadline) {
      const state = (await db.query('SELECT wait_event_type, wait_event FROM pg_stat_activity WHERE pid=$1', [pid])).rows[0];
      locked = state?.wait_event_type === 'Lock' && state.wait_event === 'advisory';
      if (!locked) await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(locked, true, 'a aprovação precisa aguardar o estorno do mesmo pagamento');
    await refunding.query('COMMIT');
    assert.equal((await approval).outcome, 'already_refunded');
    assert.equal((await profile(db)).is_premium, false);
    const { rows } = await db.query('SELECT payment_id, user_id, plan FROM public.processed_payments');
    assert.deepEqual(rows, [{ payment_id: '125:estorno', user_id: user, plan: 'refund' }]);
  } finally {
    await refunding.query('ROLLBACK');
    await approval?.catch(() => {});
    await refunding.end();
    await approving.end();
  }
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
