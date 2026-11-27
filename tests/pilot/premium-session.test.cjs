const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../js/game.js'), 'utf8');
const premium = source.slice(source.indexOf('    let _verifiedPremium'), source.indexOf('    function _incrementQuestionsAnswered'));
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
    isAdminUser: () => false,
    setTimeout, clearTimeout,
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
    assert.equal(f.storage.has('nefroquest-premium-sig'), false);
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

test('legacy local flags and account metadata cannot grant access', async () => {
  const f = fixture(async () => free);
  f.context.authUser.app_metadata = { premium: true };
  for (const key of ['nefroquest-premium','nefroquest-whitelist', 'nefroquest-premium-sig','nefroquest-whitelist-sig']) f.storage.set(key, 'legacy-fixture');
  assert.equal(f.context.isPremium(), false);
  await f.context._loadPremiumFromDB();
  assert.equal(f.context.isPremium(), false);
  assert.equal(f.storage.size, 0);
});

test('network failure preserves active access in the same session but not in a fresh document', async () => {
  let response = paid;
  const f = fixture(async () => response);
  await f.context._loadPremiumFromDB();
  response = {data:null,error:new Error('unavailable')};
  await f.context._loadPremiumFromDB();
  assert.equal(f.context.isPremium(), true);
  assert.equal(fixture(async () => response).context.isPremium(), false);
  f.context._invalidatePremiumCache();
  assert.equal(f.context.isPremium(), false);
});

test('only an exact own whitelist result grants access; removing it clears access', async () => {
  let email = 'a@example.invalid';
  const f = fixture(async () => free, async () => ({data: { email }, error:null}));
  await f.context._loadPremiumFromDB();
  assert.equal(f.context.isPremium(), true);
  email = 'b@example.invalid';
  await f.context._loadPremiumFromDB();
  assert.equal(f.context.isPremium(), false);
});

test('a monthly grant expires in memory without account reload', async () => {
  const f = fixture(async () => ({data:{is_premium:true,premium_expires_at:'2026-11-26T20:45:00Z'},error:null}));
  const RealDate = Date;
  let now = RealDate.parse('2026-11-26T20:44:59Z');
  f.context.Date = class extends RealDate { static now() { return now; } };
  await f.context._loadPremiumFromDB();
  assert.equal(f.context.isPremium(), true);
  now += 1000;
  assert.equal(f.context.isPremium(), false);
});

test('concurrent entitlement consumers share a recent pending read', async () => {
  const profile = deferred();
  let reads = 0;
  const f = fixture(() => { reads++; return profile.promise; });
  const first = f.context._awaitPremiumAccess();
  const second = f.context._awaitPremiumAccess();
  assert.equal(reads, 1);
  profile.resolve(paid);
  assert.deepEqual(await Promise.all([first, second]), ['premium', 'premium']);
});

test('a forced consultation reports a failed read separately from previously verified access', async () => {
  let profile = paid;
  const f = fixture(async () => profile);
  assert.equal(await f.context._awaitPremiumAccess(), 'premium');
  profile = {data: null, error: new Error('offline')};
  assert.equal(await f.context._awaitPremiumAccess({refresh: true}), 'pending');
  assert.equal(f.context.isPremium(), true);
  profile = free;
  assert.equal(await f.context._awaitPremiumAccess({refresh: true}), 'free');
  assert.equal(f.context.isPremium(), false);
});

test('an older successful observation cannot stand in for a failed refresh', async () => {
  const priorRead = deferred();
  let reads = 0;
  const f = fixture(() => ++reads === 1 ? priorRead.promise : Promise.resolve({data: null, error: {message: 'offline'}}));
  const older = f.context._awaitPremiumAccess();
  assert.equal(await f.context._awaitPremiumAccess({refresh: true}), 'pending');
  priorRead.resolve(paid);
  assert.equal(await older, 'pending');
  assert.equal(f.context.isPremium(), false);
});

test('a pending consultation reports stale after a real owner change', async () => {
  const profile = deferred();
  const f = fixture(owner => owner === 'a' ? profile.promise : Promise.resolve(free));
  const previous = f.context._awaitPremiumAccess();
  f.switchTo('b');
  assert.equal(await f.context._awaitPremiumAccess(), 'free');
  profile.resolve(paid);
  assert.equal(await previous, 'stale');
  assert.equal(f.context.isPremium(), false);
});

test('a stalled profile settles the visible status at the deadline, with no false purchase offer', async () => {
  const profile = deferred();
  const f = fixture(() => profile.promise);
  let timeout;
  const timer = Symbol('timer');
  f.context.setTimeout = (callback, delay) => {
    assert.equal(delay, 8000);
    timeout = callback;
    return timer;
  };
  f.context.clearTimeout = handle => assert.equal(handle, timer);
  const status = f.context._awaitPremiumAccess();
  timeout();
  assert.equal(await status, 'pending');
  assert.equal(f.context.isPremium(), false);
  profile.resolve(paid);
});

test('a malformed paid profile is unknown and cannot grant an indefinite plan', async () => {
  for (const expires of [undefined, 'invalido']) {
    const f = fixture(async () => ({data: {is_premium: true, premium_expires_at: expires}, error: null}));
    assert.equal(await f.context._awaitPremiumAccess(), 'pending');
    assert.equal(f.context.isPremium(), false);
  }
});
