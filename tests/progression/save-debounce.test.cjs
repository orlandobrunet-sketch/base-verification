'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

// Like journey-reset, run the production sections against observable storage.
// NQ_GAME_SOURCE permits external mutation controls without changing the app.
// This covers legacy autosave timing, not pilot/answer transactions or a browser.
// The 600ms wait in spec04 is not a temporal proof: its fixture already has a save.
const game = fs.readFileSync(process.env.NQ_GAME_SOURCE || path.join(__dirname, '../../js/game.js'), 'utf8');
const sourceHash = createHash('sha256').update(game).digest('hex');
function section(start, end) {
  const first = game.indexOf(start), last = game.indexOf(end, first + start.length);
  assert(first >= 0 && last > first, 'Missing production section: ' + start);
  return game.slice(first, last);
}
function fn(name) {
  const first = new RegExp('^    function ' + name + '\\(', 'm').exec(game);
  assert(first, 'Missing production function: ' + name);
  const rest = game.slice(first.index + first[0].length);
  const next = /^    (?:async )?function /m.exec(rest);
  assert(next, 'Missing next function boundary: ' + name);
  return game.slice(first.index, first.index + first[0].length + next.index);
}
const product = [
  section('    let _autoSaveTimer = null;', '    function isProgressSandbox()'),
  ...['isCharacterPilot', '_currentSaveOwner', '_guestSavePair', '_canonicalSaveRecord', '_isSaveTombstone',
    '_writeSaveTombstone', '_mirrorLegacySave', '_captureJourneyBinding', '_matchesJourneyBinding',
    '_questionSaveExtras', 'saveGame', '_doSaveGame', 'deleteSave', 'isProgressSandbox', 'beginProgressSandbox'].map(fn),
].join('\n');
const constants = ['SAVE_KEY', 'CANONICAL_SAVE_KEY', 'SAVE_SCHEMA_VERSION'].map(name => {
  const match = new RegExp('^    const ' + name + '\\s*=([^;]+);', 'm').exec(game);
  assert(match, 'Missing production constant: ' + name);
  return 'const ' + name + ' =' + match[1] + ';';
}).join('\n');
console.log('AUTOSAVE_INPUT', JSON.stringify({ gameSha256: sourceHash, vmTimeoutMs: 500 }));

function harness(owner = null) {
  const values = new Map(), writes = [], removed = [], timers = new Map(), microtasks = [];
  const calls = { cloud: 0, stopped: 0, warnings: 0 };
  let now = 0, nextTimer = 0, revision = 0;
  class ClockDate extends Date { static now() { return now; } }
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem(key, raw) { values.set(key, String(raw)); writes.push({ key, raw: String(raw), at: now }); },
    removeItem(key) { values.delete(key); removed.push(key); },
  };
  const context = vm.createContext({
    Date: ClockDate, console, authUser: owner === null ? null : { id: owner },
    localStorage: storage, nqProgressStorage: () => storage,
    crypto: { randomUUID: () => 'technical-save-' + (++revision) },
    _saveTimer: null, _pilotAnswerTransaction: null, _normalJourneyStaging: false,
    _saveCleanupBlocked: false, _saveBaseline: undefined, _saveOwner: undefined,
    _legacySaveBaseline: undefined, _guestRecoveryAccepted: null,
    _cloudSyncTimer: null, _cloudLoadSyncTimer: null, _progressEpoch: 0, _recentIds: [],
    _invalidateStatsCache() {}, _scheduleCloudSync() { calls.cloud++; },
    _stopLocalJourney() { calls.stopped++; }, refreshWelcomeSave() {},
    _warnStorageFull() { calls.warnings++; },
    _track() { assert.fail('Unexpected save error'); }, _toast() {},
    document: { body: { dataset: {}, appendChild() {} }, getElementById: () => null,
      createElement: () => ({ setAttribute() {} }) },
    setTimeout(callback, delay) { timers.set(++nextTimer, { callback, due: now + delay }); return nextTimer; },
    clearTimeout: id => timers.delete(id), queueMicrotask: callback => microtasks.push(callback),
    fetch() { assert.fail('Autosave fixture must never access the network'); },
  });
  context.window = context;
  const run = code => vm.runInContext(code, context, { timeout: 500, filename: 'game.js real legacy autosave' });
  run(constants + '\n' + product);
  run(`Object.assign(_stateData, {
    gameStarted:true, character:'nephros', score:10, gold:20,
    current:{id:'technical-autosave'}, queue:[{id:'technical-autosave'}]
  });`);
  const key = run('CANONICAL_SAVE_KEY'), legacyKey = run('SAVE_KEY');
  function advanceTo(target) {
    assert(target >= now);
    for (;;) {
      const next = [...timers].filter(([, timer]) => timer.due <= target)
        .sort(([idA, a], [idB, b]) => a.due - b.due || idA - idB)[0];
      if (!next) break;
      const [id, timer] = next;
      timers.delete(id); now = timer.due; timer.callback();
      while (microtasks.length) microtasks.shift()();
    }
    now = target;
  }
  return { run, advanceTo, context, values, writes, removed, calls, key, legacyKey,
    pending: () => timers.size,
    commits: () => writes.filter(write => write.key === key),
    saved: () => JSON.parse(values.get(key) || 'null'),
  };
}

test('legacy automatic save waits for both 500ms and 300ms boundaries before writing', () => {
  const h = harness();
  h.run('state.score = 123;');
  h.advanceTo(499); assert.equal(h.writes.length, 0);
  h.advanceTo(500); assert.equal(h.writes.length, 0);
  h.advanceTo(799); assert.equal(h.writes.length, 0, 'No early commit during the inner save window');
  h.advanceTo(800);
  assert.equal(h.commits().length, 1);
  assert.equal(h.commits()[0].at, 800);
  assert.equal(h.saved().score, 123);
  assert.equal(h.saved().timestamp, 800);
  assert.equal(h.values.get(h.legacyKey), h.values.get(h.key), 'Real legacy mirror agrees with canonical bytes');
});

test('a burst waits from its last mutation and commits the latest snapshot once', () => {
  const h = harness();
  h.run('state.score = 111;');
  h.advanceTo(250); h.run('state.gold = 222;');
  h.advanceTo(499); h.run('state.score = 333; state.idx = 1;');
  h.advanceTo(1298);
  assert.equal(h.writes.length, 0, 'Earlier Proxy timers must have been cancelled');
  h.advanceTo(1299);
  assert.equal(h.commits().length, 1);
  assert.deepEqual([h.saved().score, h.saved().gold, h.saved().idx], [333, 222, 1]);
  h.advanceTo(5000); assert.equal(h.commits().length, 1);
});

test('repeated explicit save calls share the same pending 300ms commit', () => {
  const h = harness();
  h.run('saveGame();');
  h.advanceTo(100); h.run('saveGame();');
  h.advanceTo(299); h.run('saveGame();');
  assert.equal(h.writes.length, 0);
  h.advanceTo(300);
  assert.equal(h.commits().length, 1);
  assert.equal(h.saved().score, 10);
  h.advanceTo(5000); assert.equal(h.commits().length, 1);
});

for (const stage of ['proxy', 'commit']) test(`reset cancels the pending ${stage} timer without resurrecting its journey`, () => {
  const h = harness();
  h.run('globalThis.binding = _captureJourneyBinding(); state.score = 444;');
  h.advanceTo(stage === 'proxy' ? 100 : 600);
  assert.equal(h.pending(), 1);
  assert.equal(h.run('deleteSave()'), true);
  const tombstone = h.values.get(h.key);
  assert.equal(h.saved().save, null);
  assert.equal(h.saved().resetReason, 'journey');
  assert.equal(h.run('_matchesJourneyBinding(binding)'), false);
  assert.equal(h.run('state.gameStarted'), false);
  assert.equal(h.pending(), 0);
  assert.equal(h.values.has(h.legacyKey), false);
  h.advanceTo(5000);
  assert.equal(h.values.get(h.key), tombstone);
  assert.equal(h.commits().length, 1, 'Only the reset tombstone was written');
});

test('an owner change before the pending commit preserves the previous owner bytes', () => {
  const h = harness('technical-owner-A');
  assert.equal(h.run('_doSaveGame()'), true);
  const previous = h.values.get(h.key), baselineWrites = h.writes.length;
  h.run('globalThis.binding = _captureJourneyBinding(); state.gold = 555;');
  h.advanceTo(799);
  h.context.authUser = { id: 'technical-owner-B' };
  assert.equal(h.run('_matchesJourneyBinding(binding)'), false);
  h.advanceTo(800);
  assert.equal(h.values.get(h.key), previous);
  assert.equal(h.writes.length, baselineWrites);
  assert.equal(h.calls.stopped, 1, 'Actual ownership refusal queues a stop, observed without UI teardown');
});

for (const stage of ['proxy', 'commit']) test(`sandbox flushes the pending ${stage} state and isolates later mutations`, () => {
  const h = harness();
  h.run('state.gold = 666;');
  h.advanceTo(stage === 'proxy' ? 100 : 600);
  h.run("beginProgressSandbox('technical-preview');");
  assert.equal(h.commits().length, 1);
  assert.equal(h.saved().gold, 666);
  const durable = h.values.get(h.key), beforeWrites = h.writes.length;
  h.run('state.gold = 999; saveGame();');
  assert.equal(h.run('_doSaveGame()'), false);
  assert.equal(h.pending(), 0);
  h.advanceTo(5000);
  assert.equal(h.run('state.gold'), 999, 'Sandbox UI state can still change in memory');
  assert.equal(h.values.get(h.key), durable);
  assert.equal(h.writes.length, beforeWrites);
});
