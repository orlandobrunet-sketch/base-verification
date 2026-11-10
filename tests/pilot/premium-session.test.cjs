const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../js/game.js'), 'utf8');
const premium = source.slice(source.indexOf('    let _isPremiumCache'), source.indexOf('    function _incrementQuestionsAnswered'));
const account = id => ({ id, email: id + '@example.invalid' });
const paid = { data: { is_premium: true, premium_expires_at: null }, error: null };
const free = { data: { is_premium: false }, error: null };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

function fixture(profile, whitelist = () => Promise.resolve({ data: null, error: null })) {
  const storage = new Map();
  const client = {
    from(table) {
      return { select: () => ({ eq: (_field, owner) => ({
        single: () => profile(owner),
        maybeSingle: () => whitelist(owner)
      }) }) };
    }
  };
  const context = {
    window: {}, _supaClient: client, authUser: account('a'), _authSessionEpoch: 1,
    PREMIUM_KEY: 'nefroquest-premium', WHITELIST_KEY: 'nefroquest-whitelist',
    isAdminUser: () => false, _generatePremiumSignature: owner => 'sig:' + owner,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    }
  };
  vm.runInNewContext(premium, context);
  return { context, storage, switchTo(id) {
    context.authUser = account(id);
    ++context._authSessionEpoch;
  } };
}

test('a cached premium entitlement belongs to the active account', async () => {
  const f = fixture(async () => paid);
  await f.context._loadPremiumFromDB();
  assert.equal(f.context.isPremium(), true);
  f.switchTo('b');
  assert.equal(f.context.isPremium(), false);
});

test('a late profile response cannot grant or clear another account’s premium', async () => {
  for (const delayed of [paid, free]) {
    const pending = deferred();
    const current = delayed === paid ? free : paid;
    const f = fixture(owner => owner === 'a' ? pending.promise : Promise.resolve(current));
    const loadingA = f.context._loadPremiumFromDB();
    f.switchTo('b');
    await f.context._loadPremiumFromDB();
    pending.resolve(delayed);
    await loadingA;
    assert.equal(f.context.isPremium(), current === paid);
    assert.equal(f.storage.get('nefroquest-premium-sig'), current === paid ? 'sig:b' : undefined);
  }
});

test('a late whitelist response cannot assign a previous account’s access', async () => {
  const pending = deferred();
  const started = deferred();
  const f = fixture(async () => free, email => {
    assert.equal(email, 'a@example.invalid');
    started.resolve();
    return pending.promise;
  });
  const loadingA = f.context._loadPremiumFromDB();
  await started.promise;
  f.switchTo('b');
  pending.resolve({ data: { email: 'a@example.invalid' }, error: null });
  await loadingA;
  assert.equal(f.context.isPremium(), false);
  assert.equal(f.storage.has('nefroquest-whitelist-sig'), false);
});

test('a newer profile read supersedes an earlier read in the same session', async () => {
  const pending = deferred();
  let reads = 0;
  const f = fixture(() => ++reads === 1 ? pending.promise : Promise.resolve(paid));
  const older = f.context._loadPremiumFromDB();
  await f.context._loadPremiumFromDB();
  pending.resolve(free);
  await older;
  assert.equal(f.context.isPremium(), true);
});

test('a verified payment supersedes a profile read started before confirmation', async () => {
  const pending = deferred();
  const f = fixture(() => pending.promise);
  const older = f.context._loadPremiumFromDB();
  f.context._saveVerifiedPremium('a');
  pending.resolve(free);
  await older;
  assert.equal(f.context.isPremium(), true);
  assert.equal(f.storage.get('nefroquest-premium-sig'), 'sig:a');
});
