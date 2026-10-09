import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

// Run this exact suite against an immutable pre-fix snapshot via NQ_GAME_SOURCE.
// Extract the product functions, including its deferred stop, rather than
// reproducing the save/reset algorithm in the test.
const gamePath = process.env.NQ_GAME_SOURCE || new URL('../../js/game.js', import.meta.url);
const source = readFileSync(gamePath, 'utf8');
function between(name, nextName) {
  const start = source.search(new RegExp(`^\\s*function ${name}\\(`, 'm'));
  const end = source.indexOf(`function ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `canonical ${name} boundaries must exist`);
  return source.slice(start, end);
}
const canonical = [
  between('_currentSaveOwner', '_prepareProgressOwner'),
  between('_stopLocalJourney', '_mirrorLegacySave'),
  between('_mirrorLegacySave', '_showGuestSaveRecovery'),
  between('_doSaveGame', '_migrateSave'),
  between('_migrateSave', 'loadGame'),
  between('loadGame', 'deleteSave'),
  between('deleteSave', 'clearLocalProgress'),
  between('isProgressSandbox', 'beginProgressSandbox'),
].join('\n');
console.log('JOURNEY_RESET_INPUT', JSON.stringify({
  gameSha256: createHash('sha256').update(source).digest('hex'), vmTimeoutMs: 500,
}));

const LEGACY = 'nefroquest-save';
const CANONICAL = 'nefroquest-save-v7';
const ANNOUNCED = 'nefroquest-announced-badges';
const COUNT = 'nefroquest-journey-count';
const copy = value => JSON.parse(JSON.stringify(value));
const persistentHistory = {
  'nefroquest-badge-history': '[{"id":"badge1","journey":2}]',
  'nefroquest-stats': '{"gamesPlayed":3,"bestLevel":4,"questionsAnsweredAllTime":21}',
  'nefroquest-mastered': '["known-question"]',
  'unlockedArticles': '["existing-article"]',
  'nq-unlocked-refs': '["existing-reference"]',
  'nefroquest-detailed-stats': '{"totalQuestions":21}',
  'nefroquest-music-volume': '0.17',
};
function stateFor(character = 'aquaria') {
  return {
    gameStarted: false, gameOver: false, character, current: { id: 'q-new' },
    queue: [{ id: 'q-new' }, { id: 'q-next' }], idx: 0,
    level: 1, xp: 0, xpToNext: 200, score: 0, lives: 3, maxLives: 3,
    streak: 0, gold: 0, bonusUses: 0, correctTotal: 0, narrativeShown: 0,
    bossIntroShown: false, battleFinalShown: false, difficulty: 'hard',
    equipment: { weapon: { n: 'Vazio', rar: 'common', atk: 0 } },
    chestsOpened: 0, obtainedItems: [], allItemsCollectedNotified: false,
    forjaPending: null, legendaryAbilityUsed: {}, extraLifeGiven: false,
    chestCorrectCount: 0, chestTarget: 5,
  };
}
function previousSave(owner = null, withOwner = true) {
  const save = {
    ...stateFor('nephros'), schemaVersion: 7, gameStarted: true,
    gold: 91, level: 3, idx: 4, queueIds: ['q-old'], recentIds: ['q-old'],
    saveRevision: 'previous-revision', timestamp: 100,
    forjaPending: { paid: true, candidates: [{ n: 'paid-candidate' }] },
  };
  if (withOwner) save.saveOwner = owner;
  return JSON.stringify(save);
}
function environment({ kind = 'legacy', owner = null, removalFails = false, tombstoneFails = false } = {}) {
  const storage = new Map(Object.entries({ ...persistentHistory, [ANNOUNCED]: '["badge1"]', [COUNT]: '3' }));
  const oldRaw = kind === 'legacy' ? previousSave(null, false) : previousSave(owner);
  if (kind !== 'fresh') storage.set(LEGACY, oldRaw);
  if (kind === 'pair') storage.set(CANONICAL, oldRaw);
  const writes = [];
  const removed = [];
  const cancelledTimers = [];
  const microtasks = [];
  const calls = { cloud: 0, refresh: 0, warning: 0, recovery: 0, invalidation: 0 };
  let revision = 0;
  const mainClasses = new Set();
  const welcomeClasses = new Set(['hidden']);
  const element = classes => ({ inert: true, classList: {
    add: (...names) => names.forEach(name => classes.add(name)),
    remove: (...names) => names.forEach(name => classes.delete(name)),
  } });
  const main = element(mainClasses);
  const welcome = element(welcomeClasses);
  const state = stateFor();
  state.forjaPending = { paid: true, candidates: [{ n: 'paid-candidate' }] };
  const context = vm.createContext({
    authUser: owner === null ? null : { id: owner },
    state, _stateData: state, _recentIds: ['recent-question'],
    _forja: null, _progressSandboxMode: null,
    _saveBaseline: undefined, _saveOwner: undefined, _legacySaveBaseline: undefined,
    _saveCleanupBlocked: false, _guestRecoveryAccepted: null, _progressEpoch: 7,
    _autoSaveTimer: 'auto', _saveTimer: 'save', _cloudSyncTimer: 'cloud', _cloudLoadSyncTimer: 'cloud-load',
    SAVE_KEY: LEGACY, CANONICAL_SAVE_KEY: CANONICAL, SAVE_SCHEMA_VERSION: 7,
    crypto: { randomUUID: () => `test-revision-${++revision}` },
    clearTimeout: timer => cancelledTimers.push(timer),
    queueMicrotask: callback => microtasks.push(callback), __microtasks: microtasks,
    _scheduleCloudSync: () => { calls.cloud++; },
    refreshWelcomeSave: () => { calls.refresh++; },
    _warnStorageFull: () => { calls.warning++; },
    _invalidateStatsCache: () => { calls.invalidation++; },
    _showGuestSaveRecovery: () => { calls.recovery++; },
    _track() {}, _toast() {}, window: {},
    document: {
      querySelector: () => null,
      getElementById: id => id === 'mainApp' ? main : id === 'welcomeScreen' ? welcome : null,
      body: { classList: { remove() {} } },
    },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, raw) => {
        if (tombstoneFails && key === CANONICAL && JSON.parse(raw)?.save === null) throw new Error('fixture quota failure');
        storage.set(key, String(raw)); writes.push([key, String(raw)]);
      },
      removeItem: key => {
        if (removalFails && key === LEGACY) throw new Error('fixture removal failure');
        storage.delete(key); removed.push(key);
      },
    },
  });
  function run(code) {
    return vm.runInContext(code, context, { timeout: 500, filename: 'canonical journey reset/save' });
  }
  run(canonical);
  return {
    run, context, state, storage, writes, removed, cancelledTimers, calls, oldRaw,
    mainClasses, welcomeClasses,
    drain: () => run('while (__microtasks.length) __microtasks.shift()();'),
    start: () => { Object.assign(state, stateFor(), { gameStarted: true }); },
    baselines: () => copy(run('({canonical:_saveBaseline, owner:_saveOwner, legacy:_legacySaveBaseline})')),
  };
}
function loadExisting(env) {
  const loaded = env.run('loadGame()');
  assert.equal(loaded?.character, 'nephros', 'boot must load the legitimate prior save');
  assert.equal(env.calls.recovery, 0, 'a matching guest pair needs no recovery choice');
  assert.equal(env.baselines().legacy, env.oldRaw, 'boot has observed the previous legacy bytes');
}
function reset(env) {
  const before = copy(env.state);
  const epoch = env.run('_progressEpoch');
  const cloudCalls = env.calls.cloud;
  assert.equal(env.run('deleteSave()'), true, 'authorized new-journey reset must succeed');
  assert.deepEqual(copy(env.state), { ...before, gameStarted: false, forjaPending: null });
  const { saveRevision, ...tombstone } = JSON.parse(env.storage.get(CANONICAL));
  assert.match(saveRevision, /^test-revision-\d+$/, 'reset must commit a new revision');
  assert.deepEqual(tombstone, {
    schemaVersion: 7, saveOwner: env.context.authUser?.id || null,
    save: null, resetReason: 'journey',
  });
  assert.equal(env.storage.has(LEGACY), false);
  assert.equal(env.storage.has(ANNOUNCED), false);
  assert.equal(env.storage.get(COUNT), '4', 'one reset counts one new journey');
  for (const [key, raw] of Object.entries(persistentHistory)) assert.equal(env.storage.get(key), raw,
    `new journey must preserve auxiliary history/preferences: ${key}`);
  assert.deepEqual(env.removed, [LEGACY, ANNOUNCED], 'only the intended transient keys are removed');
  assert.deepEqual(env.cancelledTimers, ['auto', 'save', 'cloud', 'cloud-load']);
  assert.equal(env.run('_progressEpoch'), epoch + 1);
  assert.equal(env.calls.cloud, cloudCalls + 1);
}
function assertSaved(env, owner = null) {
  const before = copy(env.state);
  assert.equal(env.run('_doSaveGame()'), true, 'first save after a local reset must commit');
  env.drain();
  assert.deepEqual(copy(env.state), before, 'successful save must keep the journey running');
  assert.equal(env.state.gameStarted, true);
  assert.equal(env.calls.refresh, 0, 'successful local reset/save must not queue a stale-tab stop');
  assert.equal(env.mainClasses.has('hidden'), false);
  const raw = env.storage.get(CANONICAL);
  assert.equal(env.storage.get(LEGACY), raw, 'canonical transaction and legacy mirror must match');
  const saved = JSON.parse(raw);
  assert.equal(saved.character, 'aquaria');
  assert.equal(saved.saveOwner, owner);
  assert.equal(saved.schemaVersion, 7);
  assert.deepEqual(saved.queueIds, ['q-new', 'q-next']);
  assert.deepEqual(saved.recentIds, ['recent-question']);
  assert.equal(saved.forjaPending, null, 'new journey must not carry a previous paid transaction');
  assert.equal(Object.hasOwn(saved, 'save'), false, 'new save replaces the tombstone');
  assert.equal(env.baselines().canonical, raw);
  assert.equal(env.baselines().legacy, raw);
  for (const [key, bytes] of Object.entries(persistentHistory)) assert.equal(env.storage.get(key), bytes);
}
function assertRefused(env) {
  const before = [...env.storage];
  const writes = env.writes.length;
  assert.equal(env.run('_doSaveGame()'), false, 'synchronous conflict must reject the save before its storage event');
  assert.deepEqual([...env.storage], before, 'a stale tab must never overwrite the competing bytes');
  assert.equal(env.writes.length, writes);
  env.drain();
  assert.equal(env.state.gameStarted, false);
  assert.equal(env.state.character, null);
  assert.deepEqual(copy(env.state.queue), []);
  assert.equal(env.mainClasses.has('hidden'), true, 'canonical deferred stop hides the running app');
  assert.equal(env.welcomeClasses.has('hidden'), false);
  assert.equal(env.calls.refresh, 1);
}

for (const kind of ['legacy', 'pair']) {
  test(`guest ${kind}: boot, authorized restart and first save keep the new journey`, () => {
    const env = environment({ kind });
    loadExisting(env);
    reset(env);
    env.start();
    assertSaved(env);
  });
}
test('guest: restarting after a prior save in the same tab commits the new save', () => {
  const env = environment({ kind: 'fresh' });
  env.start();
  assert.equal(env.run('_doSaveGame()'), true);
  const observed = env.storage.get(LEGACY);
  assert.equal(env.baselines().legacy, observed);
  reset(env);
  env.start();
  assertSaved(env);
});
test('fresh guest: the first new journey saves without a previous snapshot', () => {
  const env = environment({ kind: 'fresh' });
  assert.equal(env.run('loadGame()'), null);
  reset(env);
  env.start();
  assertSaved(env);
});
test('authenticated owner: authorized restart preserves ownership and auxiliary history', () => {
  const env = environment({ kind: 'pair', owner: 'owner-A' });
  loadExisting(env);
  reset(env);
  env.start();
  assertSaved(env, 'owner-A');
});
test('guest: a competing legacy write after reset still stops without overwriting', () => {
  const env = environment();
  loadExisting(env);
  reset(env);
  env.start();
  env.storage.set(LEGACY, previousSave(null, false).replace('91', '999'));
  assertRefused(env);
});
test('guest: a competing legacy removal after a new save still stops without overwriting', () => {
  const env = environment({ kind: 'fresh' });
  reset(env);
  env.start();
  assertSaved(env);
  env.storage.delete(LEGACY);
  assertRefused(env);
});
test('a competing canonical write after reset still stops without overwriting', () => {
  const env = environment();
  loadExisting(env);
  reset(env);
  env.start();
  env.storage.set(CANONICAL, previousSave());
  assertRefused(env);
});
for (const reason of ['reset', 'logout']) {
  test(`a competing ${reason} tombstone after reset is never resurrected`, () => {
    const env = environment();
    loadExisting(env);
    reset(env);
    env.start();
    env.storage.set(CANONICAL, JSON.stringify({
      schemaVersion: 7, saveOwner: null, saveRevision: 'other-tab', save: null, resetReason: reason,
    }));
    assertRefused(env);
  });
}
for (const owner of [null, 'owner-A']) {
  test(`owner ${owner || 'guest'}: an identity change after reset blocks the pending save`, () => {
    const env = environment({ kind: 'pair', owner });
    loadExisting(env);
    reset(env);
    env.start();
    env.context.authUser = { id: 'owner-B' };
    assertRefused(env);
  });
}
test('failed legacy removal cannot adopt an unobserved null baseline', () => {
  const env = environment({ removalFails: true });
  loadExisting(env);
  assert.throws(() => env.run('deleteSave()'), /fixture removal failure/);
  assert.equal(env.storage.get(LEGACY), env.oldRaw);
  assert.equal(env.baselines().legacy, env.oldRaw, 'failed removal preserves the observed legacy baseline');
  assert.equal(env.state.gameStarted, false);
  assert.equal(JSON.parse(env.storage.get(CANONICAL)).resetReason, 'journey');
  assert.equal(env.storage.get(ANNOUNCED), '["badge1"]');
  assert.equal(env.storage.get(COUNT), '3');
  assert.equal(env.calls.cloud, 0);
});
test('failed tombstone write rejects reset without deleting the save or adopting new baselines', () => {
  const env = environment({ kind: 'pair', tombstoneFails: true });
  loadExisting(env);
  const storageBefore = [...env.storage];
  const baselinesBefore = env.baselines();
  assert.equal(env.run('deleteSave()'), false);
  assert.deepEqual([...env.storage], storageBefore);
  assert.deepEqual(env.baselines(), baselinesBefore);
  assert.equal(env.calls.warning, 1);
  assert.equal(env.calls.cloud, 0);
  assert.deepEqual(env.removed, []);
});
