const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

const helper = readFileSync(resolve(__dirname, '../helpers/game.ts'), 'utf8');
const auth = readFileSync(resolve(__dirname, '../../js/auth.js'), 'utf8');
function section(source, start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'real source must remain available');
  return source.slice(from, to);
}

// Exercise the real helper and auth callback, not a duplicate of their logic.
// The mock Page schedules INITIAL_SESSION at the boundaries that raced in CI.
function fixture({ user = null, eventAt = 'entry', storageFails = false, source = helper } = {}) {
  const nodes = new Map(), storage = new Map(), noop = () => {};
  const element = id => {
    if (!nodes.has(id)) {
      const classes = new Set(id === 'landingScreen' ? [] : ['hidden']);
      nodes.set(id, { classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) } });
    }
    return nodes.get(id);
  };
  const context = {
    authUser: user, _guestMode: false, _guestHookShown: false, _authSessionEpoch: 0,
    _explicitSessionOwner: null, PREMIUM_KEY: 'premium', WHITELIST_KEY: 'whitelist',
    document: { getElementById: element },
    localStorage: { setItem: (key, value) => { if (storageFails) throw Error('storage unavailable'); storage.set(key, value); }, removeItem: key => storage.delete(key) },
    _acceptSessionUser: () => true, _setAuthSessionUser: value => { context.authUser = value; },
    _markExplicitLoginIntent: noop, _loadPremiumFromDB: noop, _loadProgressFromCloud: noop,
    checkFirstTimeOnboarding: noop, _invalidatePremiumCache: noop,
    updateWelcomeUserBadge: noop, _finishAuthStartup: noop, _resumePaymentAfterLogin: noop,
    _authSessionHandler: null,
  };
  context.window = context;
  context.continueGame = () => { element('mainApp').classList.remove('hidden'); };
  context.expect = locator => ({ toBeHidden: async () => assert.equal(element(locator.slice(1)).classList.contains('hidden'), true) });
  context.waitForGame = async () => assert.equal(element('mainApp').classList.contains('hidden'), false);
  vm.createContext(context);
  vm.runInContext(section(auth, '    function _showSignedOutPortal()', '    window._retireAuthFromSharedLogout'), context);
  vm.runInContext(section(auth, '    function playAsGuest()', '    function _showGuestHook()'), context);
  vm.runInContext(section(auth, '      _authSessionHandler =', '      _supaClient.auth.onAuthStateChange'), context);
  const entry = section(source, 'export async function enterGame(', '\n/**\n * Injeta estado de boss')
    .replace('export async function', 'async function').replace('page: Page', 'page').replaceAll('(window as any)', 'window');
  vm.runInContext(entry, context);
  const emit = () => context._authSessionHandler('INITIAL_SESSION', user ? { user } : null);
  const page = {
    locator: selector => selector,
    waitForFunction: async fn => { assert.equal(vm.runInContext(`(${fn.toString()})()`, context), true); },
    evaluate: async fn => {
      const body = fn.toString();
      const result = vm.runInContext(`(${body})()`, context);
      const stage = body.includes('continueGame()') ? 'continue' : 'entry';
      if (eventAt === stage) emit();
      return result;
    },
  };
  if (eventAt === 'before') emit();
  return { context, storage, element, run: () => context.enterGame(page), emit };
}

for (const eventAt of ['before', 'entry', 'continue', 'after']) {
  test(`anonymous fixture survives INITIAL_SESSION ${eventAt}`, async () => {
    const f = fixture({ eventAt });
    await f.run();
    if (eventAt === 'after') f.emit();
    assert.equal(f.context._guestMode, true);
    assert.equal(f.storage.get('nq_guest_mode'), '1');
    assert.equal(f.element('landingScreen').classList.contains('hidden'), true);
    assert.equal(f.element('mainApp').classList.contains('hidden'), false);
  });
}

test('authenticated fixture retains owner and never activates guest mode', async () => {
  const owner = { id: 'fixture-owner', app_metadata: { premium: true } };
  const f = fixture({ user: owner });
  await f.run();
  assert.equal(f.context.authUser, owner);
  assert.equal(f.context._guestMode, false);
  assert.equal(f.storage.has('nq_guest_mode'), false);
});

test('guest session remains active when localStorage is unavailable', async () => {
  const f = fixture({ storageFails: true, eventAt: 'continue' });
  await f.run();
  assert.equal(f.context._guestMode, true);
  assert.equal(f.element('landingScreen').classList.contains('hidden'), true);
});
