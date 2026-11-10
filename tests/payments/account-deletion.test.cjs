const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const migration = resolve(__dirname, '../../supabase/migrations/20261110120744_account_delete_cascade.sql');
const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';

async function runEndpoint({ user = { id: userA }, target = userA, token = 'test-jwt', deleteError = null, method = 'POST' } = {}) {
  const { handleDeleteAccount } = await import('../../supabase/functions/delete-account/handler.ts');
  const calls = [];
  const response = await handleDeleteAccount(new Request('https://example.test/delete-account', {
    method,
    headers: token ? { Authorization: 'Bearer ' + token } : {},
    body: method === 'POST' ? JSON.stringify({ userId: target }) : undefined,
  }), {
    async getUser(jwt) {
      calls.push(['verify', jwt]);
      return { data: { user }, error: user ? null : 'invalid token' };
    },
    admin: { async deleteUser(id, soft) {
      calls.push(['delete', id, soft]);
      return { error: deleteError };
    } },
  });
  return { status: response.status, body: await response.json(), calls };
}

test('account deletion requires a verified non-anonymous session and rejects a different target', async () => {
  const noToken = await runEndpoint({ token: null });
  assert.equal(noToken.status, 401);
  assert.deepEqual(noToken.calls, []);
  for (const user of [null, { id: userA, is_anonymous: true }]) {
    const rejected = await runEndpoint({ user });
    assert.equal(rejected.status, 401);
    assert.deepEqual(rejected.calls, [['verify', 'test-jwt']]);
  }
  const different = await runEndpoint({ target: userB });
  assert.equal(different.status, 409);
  assert.deepEqual(different.calls, [['verify', 'test-jwt']]);
});

test('account deletion confirms a hard delete only after the Auth API accepts it', async () => {
  const rejected = await runEndpoint({ deleteError: 'database unavailable' });
  assert.equal(rejected.status, 500);
  assert.equal(rejected.body.deleted, undefined);
  const accepted = await runEndpoint();
  assert.deepEqual(accepted, {
    status: 200, body: { deleted: true, userId: userA },
    calls: [['verify', 'test-jwt'], ['delete', userA, false]],
  });
});

test('deleting an auth account removes its profile and ranking while retaining the payment ledger and other accounts', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE TABLE public.profiles (
      id uuid PRIMARY KEY CONSTRAINT profiles_id_fkey REFERENCES auth.users(id),
      game_progress jsonb NOT NULL DEFAULT '{}'
    );
    CREATE TABLE public.leaderboard (
      id integer PRIMARY KEY, player_name text,
      user_id uuid CONSTRAINT leaderboard_user_id_fkey REFERENCES auth.users(id) ON DELETE SET NULL
    );
    CREATE TABLE public.processed_payments (payment_id text PRIMARY KEY, user_id uuid NOT NULL);
    INSERT INTO auth.users VALUES ('${userA}'), ('${userB}');
    INSERT INTO public.profiles (id) SELECT id FROM auth.users;
    INSERT INTO public.leaderboard VALUES (1, 'A', '${userA}'), (2, 'B', '${userB}'), (3, 'Visitor', null);
    INSERT INTO public.processed_payments VALUES ('1', '${userA}'), ('2', '${userB}');
    CREATE ROLE nq_test_auth_admin;
    GRANT USAGE ON SCHEMA auth TO nq_test_auth_admin;
    GRANT SELECT, DELETE ON auth.users TO nq_test_auth_admin;
  `);
  await db.exec(readFileSync(migration, 'utf8'));
  // The Auth role has no direct privileges on the dependent app tables.
  await db.exec('SET ROLE nq_test_auth_admin');
  await db.query('DELETE FROM auth.users WHERE id = $1', [userA]);
  await db.exec('RESET ROLE');
  assert.deepEqual((await db.query('SELECT id FROM auth.users')).rows, [{ id: userB }]);
  assert.deepEqual((await db.query('SELECT id FROM public.profiles')).rows, [{ id: userB }]);
  assert.deepEqual((await db.query('SELECT id FROM public.leaderboard ORDER BY id')).rows, [{ id: 2 }, { id: 3 }]);
  assert.deepEqual((await db.query('SELECT payment_id, user_id FROM public.processed_payments ORDER BY payment_id')).rows, [
    { payment_id: '1', user_id: userA }, { payment_id: '2', user_id: userB }
  ]);
});
