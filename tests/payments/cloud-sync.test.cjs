const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const migration = resolve(__dirname, '../../supabase/migrations/20261111143230_protect_cloud_progress_version.sql');
const connectionString = process.env.NQ_PAYMENTS_DATABASE_URL;
const ownerA = '00000000-0000-4000-8000-000000009901';
const ownerB = '00000000-0000-4000-8000-000000009902';
const saved = { save: { character: 'nephros', xp: 177, correctTotal: 5 } };
let fixture;

async function createFixture() {
  let db, control, databaseName, testConnectionString;
  async function close() {
    if (db) await (db.close ? db.close() : db.end());
    if (control) {
      if (databaseName) await control.query('DROP DATABASE "' + databaseName + '"');
      await control.end();
    }
  }
  try {
    if (connectionString) {
      const target = new URL(connectionString);
      if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.pathname !== '/nq_payments_test') {
        throw new Error('Cloud tests require the disposable local nq_payments_test instance');
      }
      const { Client } = require('pg');
      control = new Client({ connectionString });
      await control.connect();
      const candidateName = 'nq_cloud_sync_' + process.pid + '_' + Date.now();
      assert.match(candidateName, /^nq_cloud_sync_\d+_\d+$/);
      await control.query('CREATE DATABASE "' + candidateName + '"');
      databaseName = candidateName;
      target.pathname = '/' + databaseName;
      testConnectionString = target.href;
      db = new Client({ connectionString: testConnectionString });
      await db.connect();
      db.exec = sql => db.query(sql);
      db.close = () => db.end();
    } else {
      db = new PGlite();
    }
    await db.exec(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
      END $$;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      CREATE TABLE public.profiles (
        id uuid PRIMARY KEY,
        game_progress jsonb DEFAULT '{}'::jsonb,
        display_name text,
        is_premium boolean DEFAULT false,
        premium_plan text
      );
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      CREATE POLICY profiles_own ON public.profiles FOR ALL TO authenticated
        USING (id = auth.uid()) WITH CHECK (id = auth.uid());
      GRANT USAGE ON SCHEMA public, auth TO authenticated;
      GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
      GRANT SELECT, UPDATE ON public.profiles TO authenticated;
    `);
    await db.query('INSERT INTO public.profiles (id, game_progress) VALUES ($1, $2)', [ownerA, saved]);
    const sql = readFileSync(migration, 'utf8');
    if (sql.trim()) await db.exec(sql);
    const initialized = (await db.query('SELECT game_progress, to_jsonb(profiles)->>\'game_progress_version\' AS version FROM public.profiles WHERE id=$1', [ownerA])).rows[0];
    return { db, close, testConnectionString, initialized };
  } catch (error) {
    await close();
    throw error;
  }
}

async function useOwner(db, owner) {
  await db.query('SET ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [owner]);
}

async function snapshot(id = ownerA) {
  await fixture.db.exec('RESET ROLE');
  return (await fixture.db.query('SELECT game_progress, game_progress_version::text AS game_progress_version, display_name, is_premium, premium_plan FROM public.profiles WHERE id=$1', [id])).rows[0];
}

async function write(db, progress, expected = 0, owner = ownerA) {
  return db.query('UPDATE public.profiles SET game_progress=$1, game_progress_version=$2 WHERE id=$3 AND game_progress_version=$4 RETURNING game_progress, game_progress_version::text AS game_progress_version',
    [progress, expected + 1, owner, expected]);
}

before(async () => { fixture = await createFixture(); });
after(async () => { await fixture?.close(); });
beforeEach(async () => {
  await fixture.db.exec('RESET ROLE; TRUNCATE public.profiles;');
  await fixture.db.query('INSERT INTO public.profiles (id,game_progress,display_name,is_premium,premium_plan) VALUES ($1,$2,\'A\',true,\'lifetime\'),($3,$4,\'B\',false,null)',
    [ownerA, saved, ownerB, { save: { character: 'aquaria', xp: 42 } }]);
});

test('a legacy PATCH cannot overwrite cloud progress without a matching version', async () => {
  await useOwner(fixture.db, ownerA);
  await assert.rejects(fixture.db.query('UPDATE public.profiles SET game_progress=$1 WHERE id=$2',
    [{ save: null }, ownerA]), { code: '40001' });
  assert.deepEqual((await snapshot()).game_progress, saved);
});

test('the migration gives existing saved progress version zero without changing it', () => {
  assert.deepEqual(fixture.initialized, { game_progress: saved, version: '0' });
});

test('a matching version saves once and a stale retry cannot replace that save', async () => {
  await useOwner(fixture.db, ownerA);
  const progress = { save: { character: 'nephros', xp: 250, correctTotal: 7 } };
  const accepted = await write(fixture.db, progress);
  assert.deepEqual(accepted.rows, [{ game_progress: progress, game_progress_version: '1' }]);
  assert.deepEqual((await write(fixture.db, { save: null })).rows, []);
  const row = await snapshot();
  assert.deepEqual(row.game_progress, progress);
  assert.equal(row.game_progress_version, '1');
  assert.equal(row.display_name, 'A');
  assert.equal(row.is_premium, true);
  assert.equal(row.premium_plan, 'lifetime');
});

test('an identical snapshot is idempotent but changed progress requires the next version', async () => {
  await useOwner(fixture.db, ownerA);
  await fixture.db.query('UPDATE public.profiles SET game_progress=$1 WHERE id=$2', [saved, ownerA]);
  for (const version of [0, 2, -1]) {
    await assert.rejects(fixture.db.query('UPDATE public.profiles SET game_progress=$1,game_progress_version=$2 WHERE id=$3',
      [{ save: null }, version, ownerA]), { code: '40001' });
  }
  assert.deepEqual((await snapshot()).game_progress, saved);
});

test('row level security keeps another account invisible to a sync update', async () => {
  await useOwner(fixture.db, ownerA);
  assert.deepEqual((await fixture.db.query('SELECT id FROM public.profiles WHERE id=$1', [ownerB])).rows, []);
  assert.deepEqual((await write(fixture.db, { save: null }, 0, ownerB)).rows, []);
  const row = await snapshot(ownerB);
  assert.deepEqual(row.game_progress, { save: { character: 'aquaria', xp: 42 } });
  assert.equal(row.game_progress_version, '0');
});

test('profile metadata and payment updates keep their progress and version', async () => {
  await useOwner(fixture.db, ownerA);
  await fixture.db.query('UPDATE public.profiles SET display_name=$1 WHERE id=$2', ['Renamed', ownerA]);
  await fixture.db.exec('RESET ROLE');
  await fixture.db.query('UPDATE public.profiles SET is_premium=false,premium_plan=null WHERE id=$1', [ownerA]);
  assert.deepEqual(await snapshot(), { game_progress: saved, game_progress_version: '0',
    display_name: 'Renamed', is_premium: false, premium_plan: null });
});

test('negative revisions and direct API execution of the trigger function are rejected', async () => {
  await assert.rejects(fixture.db.query('INSERT INTO public.profiles(id,game_progress_version) VALUES($1,-1)',
    ['00000000-0000-4000-8000-000000009903']), { code: '23514' });
  const { rows } = await fixture.db.query(`SELECT rolname, has_function_privilege(rolname,
    'public.profiles_guard_game_progress_version()', 'EXECUTE') AS allowed
    FROM pg_roles WHERE rolname IN ('anon','authenticated') ORDER BY rolname`);
  assert.deepEqual(rows, [{ rolname: 'anon', allowed: false }, { rolname: 'authenticated', allowed: false }]);
});

test('two independent connections using the same revision have only one winning save', { skip: !connectionString }, async () => {
  const { Client } = require('pg');
  const first = new Client({ connectionString: fixture.testConnectionString });
  const second = new Client({ connectionString: fixture.testConnectionString });
  await first.connect();
  await second.connect();
  let pending;
  try {
    await useOwner(first, ownerA);
    await useOwner(second, ownerA);
    await first.query('BEGIN');
    const newer = { save: { character: 'nephros', xp: 400, correctTotal: 12 } };
    assert.equal((await write(first, newer)).rows.length, 1);
    const pid = (await second.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    pending = write(second, { save: null });
    pending.catch(() => {});
    const deadline = Date.now() + 5000;
    let waiting = false;
    while (!waiting && Date.now() < deadline) {
      waiting = (await fixture.db.query("SELECT wait_event_type='Lock' AS waiting FROM pg_stat_activity WHERE pid=$1", [pid])).rows[0]?.waiting;
      if (!waiting) await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(waiting, true, 'the second save must wait for the first transaction');
    await first.query('COMMIT');
    assert.deepEqual((await pending).rows, []);
    assert.deepEqual((await snapshot()).game_progress, newer);
  } finally {
    await first.query('ROLLBACK');
    await pending?.catch(() => {});
    await first.end();
    await second.end();
  }
});
