const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(resolve(__dirname, '../../js/game.js'), 'utf8');
const begin = source.indexOf('    function _maxNumero(');
const end = source.indexOf('    window._mergeCloudProgress = _mergeCloudProgress;', begin);
assert.ok(begin >= 0 && end > begin, 'the real cloud merge source must be loaded');
const mergeSource = source.slice(begin, end);
const canonicalKey = 'nefroquest-save-v7';
const mirrorKey = 'nefroquest-save';
const localSave = {
  schemaVersion: 7, saveOwner: 'owner-A', saveRevision: 'local-revision',
  character: 'nephros', xp: 177, correctTotal: 5, timestamp: 2000,
  forjaPending: { id: 'paid-local-choice', custo: 300, slot: 'weapon' },
};

function fixture({ failKey = null, save = localSave } = {}) {
  const values = new Map();
  if (save) {
    values.set(canonicalKey, JSON.stringify(save));
    values.set(mirrorKey, JSON.stringify(save));
  }
  const before = Object.fromEntries(values);
  const context = {
    window: {},
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => {
        if (key === failKey) throw new Error('synthetic storage failure');
        values.set(key, value);
      },
    },
    CANONICAL_SAVE_KEY: canonicalKey, SAVE_KEY: mirrorKey,
    STATS_KEY: 'nefroquest-stats', MASTERED_KEY: 'nefroquest-mastered',
    DETAILED_STATS_SCHEMA_VERSION: 1,
    state: { gameStarted: true },
    _saveCleanupBlocked: false, _characterCloudConflict: false, _cloudSyncTimer: null,
    _saveBaseline: JSON.stringify(save), _saveOwner: 'owner-A',
    stops: 0, scheduled: 0, messages: [],
    isCharacterPilot: () => false,
    _currentSaveOwner: () => 'owner-A',
    _canonicalSaveRecord: () => JSON.parse(values.get(canonicalKey) || 'null'),
    _isSaveTombstone: value => value === null || value?.save === null,
    _readQuestionSaveExtras: value => value.invalidPresentation ? null : { legacy: true },
    _requiresQuestionRevisionCatalog: () => false,
    _questionRevisionVerifier: () => null,
    _normalCharacterSaveValid: value => value.classBenefits?.valid === true,
    _normalBenefitsValid: () => true,
    _isDetailedStatsRecord: value => !!value && typeof value === 'object' && !Array.isArray(value),
    _invalidateStatsCache() {},
    getGameStats: () => ({}),
    // Migration/presentation modules have their own suites. This fixture
    // exercises whether the real merge accepts, persists or rejects a snapshot.
    _migrateSave: value => value,
    _mirrorLegacySave: raw => values.set(mirrorKey, raw),
    _stopLocalJourney() { context.state.gameStarted = false; context.stops++; },
    _scheduleCloudSync() { context.scheduled++; },
    _warnStorageFull() {},
    _toast(message) { context.messages.push(message); },
    crypto: { randomUUID: () => 'imported-revision' },
    clearTimeout() {},
    console: { error() {} },
  };
  vm.createContext(context);
  vm.runInContext(mergeSource, context);
  return { context, values, before,
    merge: (payload, options) => context._mergeCloudProgress(payload, options),
    saved: () => JSON.parse(values.get(canonicalKey) || 'null') };
}

test('keeping the local journey still rejects foreign-owner and pilot cloud histories before merging', () => {
  for (const save of [
    { character: 'nephros', saveOwner: 'owner-B' },
    { character: 'nephros', saveOwner: 'owner-A', journeyDomain: 'pilot' },
  ]) {
    const f = fixture();
    assert.equal(f.merge({ save, achievements: ['foreign-medal'], stats: { bestScore: 999 } }, { keepSave: true }), false);
    assert.deepEqual(Object.fromEntries(f.values), f.before);
    assert.equal(f.context._characterCloudConflict.owner, 'owner-A');
  }
});

test('keeping the local journey cannot accept an invalid ledger or question presentation', () => {
  for (const save of [
    { character: 'nephros', saveOwner: 'owner-A', classBenefits: { valid: false } },
    { character: 'nephros', saveOwner: 'owner-A', invalidPresentation: true },
  ]) {
    const f = fixture();
    assert.equal(f.merge({ save, achievements: ['remote-medal'] }, { keepSave: true }), false);
    assert.deepEqual(Object.fromEntries(f.values), f.before);
  }
});

test('every failed remote-history write prevents acknowledging the cloud merge', () => {
  const payload = {
    stats: { bestScore: 123, questionsAnsweredAllTime: 9 },
    achievements: ['remote-medal'], mastered: ['q1'],
    unlockedArticles: ['article1'], unlockedRefs: ['reference1'],
    arquiDefeated: true, hardcoreCompleted: true,
    detailedStats: { totalQuestions: 9 },
    acidBaseProgress: { completed: ['case1'], grimoireUses: { case1: 1 } },
    srData: { q1: { reps: 1 } },
  };
  for (const failKey of [
    'nefroquest-stats', 'nefroquest-achievements', 'nefroquest-mastered',
    'unlockedArticles', 'nq-unlocked-refs', 'nefroquest-arqui-defeated',
    'nefroquest-hardcore-completed', 'nefroquest-detailed-stats',
    'nq-acidbase-progress', 'nefroquest-sr-data',
  ]) {
    const f = fixture({ failKey });
    assert.equal(f.merge(payload, { keepSave: true }), false, failKey);
    assert.equal(f.values.has(failKey), false, failKey);
    assert.equal(f.values.get(canonicalKey), f.before[canonicalKey]);
  }
});

test('choosing the remote journey replaces a local paid Forge choice with the selected complete snapshot', () => {
  const f = fixture();
  const remote = { schemaVersion: 6, saveOwner: 'owner-A', character: 'aquaria',
    xp: 42, gold: 80, correctTotal: 2, timestamp: 1000 };
  assert.equal(f.merge({ save: remote }, { replaceSave: true }), true);
  assert.deepEqual(f.saved(), { ...remote, saveRevision: 'imported-revision' });
  assert.equal(f.values.get(mirrorKey), f.values.get(canonicalKey));
  assert.equal(f.context._saveBaseline, f.values.get(canonicalKey));
  assert.equal(f.context.stops, 1);
  assert.equal(f.context.scheduled, 0);
});

test('a failed selected-journey write preserves the durable local snapshot and reports failure', () => {
  const f = fixture({ failKey: canonicalKey });
  const remote = { schemaVersion: 6, saveOwner: 'owner-A', character: 'aquaria', xp: 42 };
  assert.equal(f.merge({ save: remote }, { replaceSave: true }), false);
  assert.deepEqual(Object.fromEntries(f.values), f.before);
  assert.equal(f.context.stops, 0);
});

test('a valid history merge can preserve the local journey and combine remote achievements', () => {
  const f = fixture();
  f.values.set('nefroquest-achievements', JSON.stringify(['local-medal']));
  const remote = { schemaVersion: 6, saveOwner: 'owner-A', character: 'nephros', xp: 1 };
  assert.equal(f.merge({ save: remote, achievements: ['remote-medal'] }, { keepSave: true }), true);
  assert.deepEqual(JSON.parse(f.values.get('nefroquest-achievements')), ['local-medal', 'remote-medal']);
  assert.equal(f.values.get(canonicalKey), f.before[canonicalKey]);
  assert.equal(f.context.stops, 0);
});
