'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const { PGlite } = require('../tests/payments/node_modules/@electric-sql/pglite');

const migration = name => fs.readFileSync(require.resolve(`../supabase/migrations/${name}.sql`), 'utf8').replaceAll('\r\n', '\n');
const versionGuard = migration('20261111143230_protect_cloud_progress_version');
const ownerGuard = migration('20261115150000_guard_owner_authority_progress');
const conflictTransport = migration('20261124220425_avoid_retry_on_progress_guard_conflicts');

test('conflict transport preserves both triggers and their authorization while returning PT409', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;
      CREATE TABLE profiles (id text PRIMARY KEY, game_progress jsonb NOT NULL DEFAULT '{}');
      INSERT INTO profiles(id) VALUES ('chest-test-a'), ('chest-test-b');
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      GRANT SELECT, UPDATE ON profiles TO authenticated;
      CREATE POLICY profiles_own_progress ON profiles FOR ALL TO authenticated
        USING (id = current_setting('app.test_owner'))
        WITH CHECK (id = current_setting('app.test_owner'));
    `);
    await db.exec(versionGuard);
    await db.exec(ownerGuard);

    const definitions = async () => (await db.query(`
      SELECT p.proname, p.prosrc, p.proowner, p.proacl::text, p.proconfig, p.prosecdef,
        t.oid AS trigger_oid, pg_get_triggerdef(t.oid) AS trigger_definition,
        has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
        has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute
      FROM pg_proc p JOIN pg_trigger t ON t.tgfoid = p.oid
      WHERE t.tgrelid = 'public.profiles'::regclass
        AND p.proname IN ('profiles_guard_game_progress_version', 'guard_owner_authority_progress')
      ORDER BY p.proname
    `)).rows;
    const original = await definitions();
    assert.equal(original.length, 2);
    for (const fn of original) {
      assert.match(fn.prosrc, /'40001'/);
      assert.deepEqual(fn.proconfig, ['search_path=""']);
      assert.equal(fn.prosecdef, false);
      assert.equal(fn.anon_can_execute, false);
      assert.equal(fn.authenticated_can_execute, false);
      assert.equal(fn.service_role_can_execute, true);
    }

    await db.exec(conflictTransport);
    assert.deepEqual(await definitions(), original.map(fn => ({
      ...fn,
      prosrc: fn.prosrc.replaceAll("'40001'", "'PT409'"),
    })));

    await db.exec("SET ROLE authenticated; SET app.test_owner = 'chest-test-a';");
    const owner = 'chest-test-a';
    const read = async () => (await db.query('SELECT game_progress, game_progress_version FROM profiles WHERE id = $1', [owner])).rows[0];
    const write = async (version, nextVersion, data) => (await db.query(`
      UPDATE profiles SET game_progress = $4, game_progress_version = $3
      WHERE id = $1 AND game_progress_version = $2 RETURNING game_progress_version
    `, [owner, version, nextVersion, data])).rows;

    const legacy = { save: { saveOwner: owner } };
    assert.equal((await write(0, 1, legacy)).length, 1);
    const legacyRow = await read();
    assert.deepEqual(await write(0, 1, legacy), []);
    await assert.rejects(write(1, 3, legacy), { code: 'PT409' });
    assert.deepEqual(await read(), legacyRow);

    const protectedProgress = { ownerAuthority: {
      format: 'nq-owner-authority-v1', base: null,
      state: {
        protocol: 1, owner, resetEpoch: 0,
        save: { saveOwner: owner, journeyId: 'test-chest' },
        collections: { articles: [], knowledge: 0 }, receipts: [], tombstone: null,
      },
    } };
    assert.equal((await write(1, 2, protectedProgress)).length, 1);
    const protectedRow = await read();
    await assert.rejects(write(2, 3, legacy), { code: 'PT409' });
    const invalid = structuredClone(protectedProgress);
    invalid.ownerAuthority.base = JSON.stringify(protectedProgress.ownerAuthority.state);
    invalid.ownerAuthority.state.collections.articles = null;
    await assert.rejects(write(2, 3, invalid), { code: '22023' });
    assert.deepEqual(await read(), protectedRow);

    await db.exec("SET app.test_owner = 'chest-test-b';");
    assert.equal(await read(), undefined);
    assert.deepEqual(await write(2, 3, protectedProgress), []);
    await db.exec("SET app.test_owner = 'chest-test-a';");
    assert.deepEqual(await read(), protectedRow);
  } finally {
    await db.close();
  }
});
