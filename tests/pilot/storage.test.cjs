const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../js/pilot.js'), 'utf8');
const gameSource = fs.readFileSync(path.join(__dirname, '../../js/game.js'), 'utf8');
const answersSource = fs.readFileSync(path.join(__dirname, '../../js/answer-presentation.js'), 'utf8');
const KEY = 'nefroquest-pilot-v1';
const clean = value => value == null ? value : JSON.parse(JSON.stringify(value));

function sharedStorage() {
  return {values: new Map(), failWrite: false, dropWrite: false, failRead: false,
    failRemove: false, writes: [], held: new Set(), clients: [], id: 0};
}
function fixture(shared = sharedStorage(), {owner = null, locks = true} = {}) {
  const listeners = new Map();
  const storage = {
    getItem(key) { if (shared.failRead) throw new Error('read denied'); return shared.values.get(key) ?? null; },
    setItem(key, value) {
      if (shared.failWrite && key === KEY) throw new Error('quota exceeded');
      shared.writes.push({key, value: String(value)});
      if (shared.dropWrite && key === KEY) return;
      shared.values.set(key, String(value));
    },
    removeItem(key) {
      if (shared.failRemove) throw new Error('remove denied');
      shared.values.delete(key);
    }
  };
  const navigator = locks ? {locks: {
    async request(name, options, callback) {
      assert.equal(options.mode, 'exclusive'); assert.equal(options.ifAvailable, true);
      if (shared.held.has(name)) return callback(null);
      shared.held.add(name);
      try { return await callback({name}); } finally { shared.held.delete(name); }
    }
  }} : {};
  const ctx = {localStorage: storage, navigator, crypto: {randomUUID: () => `synthetic-${++shared.id}`},
    authUser: owner ? {id: owner} : null, Date, Math,
    addEventListener(name, fn) { listeners.set(name, fn); }};
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(answersSource, ctx, {filename: 'answer-presentation.js'});
  vm.runInContext(source, ctx);
  return {ctx, pilot: ctx.NQPilot, storage, shared,
    progress: () => ctx.nqProgressStorage(),
    event: key => listeners.get('storage')?.({key, storageArea: storage}),
    record: () => JSON.parse(shared.values.get(KEY))};
}
async function start(f, character = 'nephros', difficulty = 'normal', owner = null) {
  assert.equal(await f.pilot.reserve(difficulty, owner), true);
  assert.equal(f.pilot.start(character, difficulty, owner), true);
}
async function relinquish(f) { f.pilot.release(); await new Promise(resolve => setImmediate(resolve)); }
function initializeJourney(f) {
  const save = f.pilot.load();
  const lives = {easy: 5, normal: 4, hard: 3}[save.difficulty];
  Object.assign(save, {gameStarted: true, lives, maxLives: lives, level: 1,
    xp: 0, gold: 0, score: 0, answered: false, queueIds: ['synthetic-q1']});
  assert.equal(f.pilot.save(save, f.pilot.classBenefits), true);
}
function sourceSection(start, end) {
  const begin = gameSource.indexOf(start);
  const finish = gameSource.indexOf(end, begin + start.length);
  assert.ok(begin >= 0 && finish > begin, `missing production section ${start}`);
  return gameSource.slice(begin, finish);
}
function installResumeEngine(f, onStop) {
  const ctx = f.ctx;
  Object.assign(ctx, {_continueGamePending: false, _progressEpoch: 0, _stateData: {},
    state: {gameStarted: false, gameOver: false}, stops: 0, continuations: 0, toasts: [],
    isCharacterPilot: () => f.pilot.active,
    _currentSaveOwner: () => ctx.authUser?.id || null,
    _saveBeforeDomainSwitch: () => true, _doSaveGame: () => true,
    _stopLocalJourney() {
      ctx.stops++; ctx._progressEpoch++; f.pilot.release();
      if (onStop) onStop();
    },
    _reloadJourneyCollections() {}, refreshWelcomeSave() {},
    _toast(message) { ctx.toasts.push(message); },
    async continueGame(pilotResume) { assert.equal(pilotResume, true); ctx.continuations++; return true; }});
  vm.runInContext(sourceSection('    let _pilotResumePending = false;', '    function saveGame()'), ctx);
}
function installContinueEngine(f, {loadTopics = async () => {}, restore = true} = {}) {
  const ctx = f.ctx, calls = [], timers = [], frames = [];
  const title = {textContent: 'Original title'}, detail = {textContent: 'Original detail'};
  const classes = new Set(), attributes = new Map();
  const button = {disabled: false, isConnected: true, focused: 0,
    querySelector: selector => selector === 'strong' ? title : detail,
    classList: {add: value => classes.add(value), remove: value => classes.delete(value)},
    setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key),
    focus() { this.focused++; }};
  const data = {gameStarted: false, gameOver: false, character: 'nephros', level: 1};
  Object.assign(ctx, {state: data, _stateData: data, _progressEpoch: 0,
    _forja: null, _autoSaveTimer: null, _saveTimer: null, _cloudSyncTimer: null, _cloudLoadSyncTimer: null,
    pendingScore: null, _pendingRating: null, questionBank: [],
    isCharacterPilot: () => f.pilot.active, _currentSaveOwner: () => ctx.authUser?.id || null,
    document: {getElementById: id => id === 'welcomeContinueBtn' ? button : null,
      querySelector: () => null, removeEventListener() {}, body: {classList: {remove() {}}}},
    ui: {journal: {innerHTML: ''}}, characters: {nephros: {name: 'Synthetic Nephros'}},
    _loadPremiumFromDB: async () => {},
    loadGame: () => f.pilot.active ? f.pilot.load() : {character: 'nephros', gameStarted: true, lives: 4},
    _loadTopics: loadTopics,
    restoreGame() { if (!restore) return false; ctx.state.gameStarted = true; calls.push('restored'); return true; },
    refreshCharacterPilotUI() { assert.equal(ctx.state.gameStarted, true); calls.push('refreshed'); },
    dismissWelcome() { calls.push('dismissed'); }, renderHUD() {}, updateBadges() {}, renderQuestion() {},
    updateBossUI() {}, applyBossOptionBadges() {}, playSound() {}, log() {}, _toast() {},
    showActionConfirmPopup() {}, _invalidateStatsCache() {},
    setTimeout(callback) { timers.push(callback); return timers.length; }, clearTimeout() {},
    requestAnimationFrame(callback) { frames.push(callback); }, console });
  vm.runInContext(sourceSection('    function _captureJourneyBinding()', '    function _reloadJourneyCollections()'), ctx);
  vm.runInContext(sourceSection('    function _stopLocalJourney()', '    window._stopLocalJourney'), ctx);
  vm.runInContext(sourceSection('    let _continueGamePending = false;', '    function startNewFromWelcome()'), ctx);
  return {ctx, calls, timers, frames, button, title, detail, classes, attributes};
}
function answered(f, {qid = 'q1', correct = true, xp = 0, gold = 0, shield = false,
  progress = '1'} = {}) {
  const save = f.pilot.load();
  assert.equal(f.pilot.beginTransaction(), true);
  const ledger = f.pilot.classBenefits;
  if (ledger.windowAnswers < 20) {
    ledger.windowAnswers++;
    if (qid && !ledger.seenQids.includes(qid)) ledger.seenQids.push(qid);
    ledger.creditedEvents.push(`${ledger.journeyId}:${ledger.windowAnswers}:${qid}`);
  }
  ledger.xpGranted += xp; ledger.goldGranted += gold; ledger.shieldSpent ||= shield;
  save.gameStarted = true;
  save.lives ??= {easy: 5, normal: 4, hard: 3}[save.difficulty];
  save.maxLives ??= save.lives;
  save.gold = (save.gold || 0) + gold;
  save.xp = (save.xp || 0) + xp;
  save.pilotLastAnswer = {domain: 'pilot', journeyId: ledger.journeyId, correct, xp, gold, shield};
  f.progress().setItem('nefroquest-stats', progress);
  return {save, ledger, commit: () => f.pilot.commit(save, ledger)};
}

test('normal storage remains an ordinary facade, including legacy bytes', () => {
  const f = fixture();
  const old = '{"schemaVersion":7,"forjaPending":{"gold":12}}';
  f.shared.values.set('nefroquest-save-v7', old);
  assert.equal(f.progress().getItem('nefroquest-save-v7'), old);
  f.progress().setItem('nefroquest-stats', ' {"gamesPlayed":4} ');
  assert.equal(f.storage.getItem('nefroquest-stats'), ' {"gamesPlayed":4} ');
  f.progress().removeItem('nefroquest-stats');
  assert.equal(f.storage.getItem('nefroquest-save-v7'), old);
});

test('reservation and cancellation never touch normal saves or an existing pilot', async () => {
  const f = fixture(); f.shared.values.set('nefroquest-save-v7', 'normal-forja');
  f.shared.values.set(KEY, 'existing-raw');
  assert.equal(await f.pilot.reserve('normal', null), true);
  assert.equal(f.pilot.active, true); assert.equal(f.pilot.status, 'reserved');
  assert.equal(f.shared.writes.length, 0);
  await relinquish(f);
  assert.equal(f.storage.getItem(KEY), 'existing-raw');
  assert.equal(f.storage.getItem('nefroquest-save-v7'), 'normal-forja');
});

test('unsupported locks and excluded difficulties refuse to start without writes', async () => {
  const f = fixture(undefined, {locks: false});
  assert.equal(await f.pilot.reserve('normal', null), false);
  assert.equal(f.pilot.active, false); assert.equal(f.shared.writes.length, 0);
  const supported = fixture();
  for (const diff of ['hardcore', 'boss', 'study', 'exam', undefined])
    assert.equal(await supported.pilot.reserve(diff, null), false);
  assert.equal(supported.shared.writes.length, 0);
});

test('class and mode are locked to the opt-in reservation', async () => {
  const f = fixture(); assert.equal(await f.pilot.reserve('easy', null), true);
  assert.equal(f.pilot.start('nephros', 'hard', null), false);
  assert.equal(f.pilot.start('invalid', 'easy', null), false);
  assert.equal(f.shared.writes.length, 0);
  assert.equal(f.pilot.start('aquaria', 'easy', null), true);
  const ledger = f.pilot.classBenefits; ledger.lockedClass = 'nephros';
  assert.equal(f.pilot.save({...f.pilot.load(), character: 'nephros'}, ledger), false);
  await relinquish(f);
});

test('transaction stages collections and commits answer, ledger and stats with one write', async () => {
  const f = fixture(); await start(f);
  f.shared.values.set('nefroquest-stats', 'normal-stats');
  const before = f.storage.getItem(KEY), writes = f.shared.writes.length;
  let shown = 0;
  const answer = answered(f, {xp: 1, progress: '{"totalAnswered":1}'});
  f.progress().setItem('nq-unlocked-refs', '["ref1"]');
  f.pilot.afterCommit(() => shown++);
  assert.equal(shown, 0);
  assert.equal(f.progress().getItem('nefroquest-stats'), '{"totalAnswered":1}');
  assert.equal(f.storage.getItem(KEY), before);
  assert.equal(answer.commit(), true);
  assert.equal(shown, 1); assert.equal(f.shared.writes.length - writes, 1);
  assert.equal(f.record().save.xp, 1); assert.equal(f.record().classBenefits.xpGranted, 1);
  assert.equal(f.record().progress['nq-unlocked-refs'], '["ref1"]');
  assert.equal(f.storage.getItem('nefroquest-stats'), 'normal-stats');
  assert.equal(answer.commit(), false);
  await relinquish(f);
});

test('abort discards read-own-writes and announcements without durable credit', async () => {
  const f = fixture(); await start(f);
  const before = f.storage.getItem(KEY); let shown = 0;
  const answer = answered(f, {xp: 1}); f.pilot.afterCommit(() => shown++);
  f.pilot.abort();
  assert.equal(f.progress().getItem('nefroquest-stats'), null);
  assert.equal(answer.commit(), false); assert.equal(shown, 0);
  assert.equal(f.storage.getItem(KEY), before); assert.equal(f.pilot.classBenefits.xpGranted, 0);
  await relinquish(f);
});

test('20-answer window accepts repeats without repeated benefit and refuses overflow', async () => {
  const f = fixture(); await start(f);
  assert.equal(answered(f, {qid: 'same', xp: 1}).commit(), true);
  assert.equal(answered(f, {qid: 'same', xp: 1}).commit(), false);
  f.pilot.rollback();
  assert.equal(answered(f, {qid: 'same', xp: 0}).commit(), true);
  for (let i = 3; i <= 20; i++) assert.equal(answered(f, {qid: `q${i}`, xp: 1}).commit(), true);
  assert.equal(f.pilot.classBenefits.windowAnswers, 20);
  assert.equal(f.pilot.classBenefits.xpGranted, 19);
  const beyond = answered(f, {qid: 'q21', xp: 1});
  assert.equal(beyond.commit(), false); f.pilot.rollback();
  assert.equal(answered(f, {qid: 'q21', xp: 0}).commit(), true);
  assert.equal(f.pilot.classBenefits.windowAnswers, 20);
  assert.equal(f.pilot.classBenefits.xpGranted, 19);
  await relinquish(f);
});

test('Nephros ceiling permits zero retained XP and never compensates it later', async () => {
  const f = fixture(); await start(f);
  assert.equal(answered(f, {qid: 'cap', xp: 0}).commit(), true);
  assert.equal(answered(f, {qid: 'level', xp: 1}).commit(), true);
  assert.equal(f.pilot.classBenefits.xpGranted, 1);
  const invalid = answered(f, {qid: 'compensation', xp: 2});
  assert.equal(invalid.commit(), false); f.pilot.rollback();
  await relinquish(f);
});

test('gold ceiling is 40 with at most 2 per new correct question', async () => {
  const f = fixture(); await start(f, 'glomerulus');
  for (let i = 1; i <= 20; i++) assert.equal(answered(f, {qid: `gold${i}`, gold: 2}).commit(), true);
  assert.equal(f.pilot.classBenefits.goldGranted, 40);
  assert.equal(answered(f, {qid: '21', gold: 2}).commit(), false); f.pilot.rollback();
  assert.equal(f.record().save.gold, 40);
  await relinquish(f);
});

test('Aquaria prevention is persisted once and cannot be restored on replay', async () => {
  const f = fixture(); await start(f, 'aquaria');
  assert.equal(answered(f, {qid: 'blocked', correct: false}).commit(), true);
  assert.equal(f.pilot.classBenefits.shieldSpent, false);
  assert.equal(answered(f, {qid: 'loss', correct: false, shield: true}).commit(), true);
  const saved = f.storage.getItem(KEY);
  const wrong = answered(f, {qid: 'reset', correct: false}); wrong.ledger.shieldSpent = false;
  assert.equal(wrong.commit(), false); f.pilot.rollback();
  assert.equal(f.storage.getItem(KEY), saved);
  await relinquish(f);
  const reloaded = fixture(f.shared); assert.ok(await reloaded.pilot.resume(null));
  assert.equal(reloaded.pilot.classBenefits.shieldSpent, true);
  await relinquish(reloaded);
});

test('credit requires matching correct result and cannot be moved to another class', async () => {
  const f = fixture(); await start(f);
  assert.equal(answered(f, {qid: 'wrong', correct: false, xp: 1}).commit(), false); f.pilot.rollback();
  assert.equal(answered(f, {qid: 'gold', gold: 2}).commit(), false); f.pilot.rollback();
  const before = f.storage.getItem(KEY), ledger = f.pilot.classBenefits;
  ledger.windowAnswers = 1; ledger.seenQids = ['x']; ledger.creditedEvents = [`${ledger.journeyId}:1:x`];
  assert.equal(f.pilot.save(f.pilot.load(), ledger), false);
  assert.equal(f.storage.getItem(KEY), before);
  await relinquish(f);
});

test('failed atomic write keeps old save bytes and discards staged credit and effects', async () => {
  const f = fixture(); await start(f); initializeJourney(f);
  const before = f.storage.getItem(KEY); let shown = 0;
  const answer = answered(f, {xp: 1}); f.pilot.afterCommit(() => shown++);
  f.shared.failWrite = true;
  assert.equal(answer.commit(), false); assert.equal(f.pilot.writable, false);
  f.pilot.rollback(); assert.equal(shown, 0); assert.equal(f.storage.getItem(KEY), before);
  assert.equal(f.pilot.classBenefits.xpGranted, 0);
  f.shared.failWrite = false; await relinquish(f);
  assert.ok(await f.pilot.resume(null)); assert.equal(f.pilot.classBenefits.xpGranted, 0);
  await relinquish(f);
});

test('silent write loss is detected by read-back and never announced', async () => {
  const f = fixture(); await start(f); const before = f.storage.getItem(KEY);
  const answer = answered(f, {xp: 1}); f.shared.dropWrite = true;
  assert.equal(answer.commit(), false); assert.equal(f.pilot.status, 'paused');
  assert.equal(f.storage.getItem(KEY), before);
  f.pilot.rollback(); await relinquish(f);
});

test('exclusive lease prevents a second tab, then permits exact resume after release', async () => {
  const shared = sharedStorage(), first = fixture(shared), second = fixture(shared);
  await start(first); assert.equal(answered(first, {xp: 1}).commit(), true);
  const raw = shared.values.get(KEY);
  assert.equal(await second.pilot.resume(null), null);
  assert.equal(await second.pilot.reserve('hard', null), false);
  assert.equal(shared.values.get(KEY), raw);
  await relinquish(first);
  assert.ok(await second.pilot.resume(null));
  assert.equal(second.pilot.classBenefits.xpGranted, 1);
  assert.equal(shared.values.get(KEY), raw);
  await relinquish(second);
});

test('revision change in another client invalidates actions without overwriting it', async () => {
  const f = fixture(); await start(f); const binding = f.pilot.captureBinding();
  const answer = answered(f, {xp: 1});
  const replacement = f.record(); replacement.revision++;
  f.shared.values.set(KEY, JSON.stringify(replacement)); f.event(KEY);
  assert.equal(f.pilot.active, true); assert.equal(f.pilot.writable, false);
  assert.equal(f.pilot.matchesBinding(binding), false);
  const raw = f.storage.getItem(KEY);
  assert.equal(answer.commit(), false); assert.equal(f.storage.getItem(KEY), raw);
  f.pilot.rollback(); await relinquish(f);
});

test('owner changes suspend credit and never transfer progress to another identity', async () => {
  const f = fixture(undefined, {owner: 'one'}); await start(f, 'nephros', 'normal', 'one');
  const answer = answered(f, {xp: 1}); const raw = f.storage.getItem(KEY);
  f.ctx.authUser = {id: 'two'};
  assert.equal(answer.commit(), false); assert.equal(f.pilot.writable, false);
  assert.equal(f.storage.getItem(KEY), raw); f.pilot.rollback(); await relinquish(f);
  assert.equal(await f.pilot.resume('two'), null);
  assert.equal(f.pilot.peekProgress('nefroquest-stats', 'two'), null);
});

test('missing or corrupt ledger cannot regenerate credits or adopt normal data', async () => {
  const f = fixture(); await start(f); assert.equal(answered(f, {xp: 1}).commit(), true);
  const valid = f.record(); await relinquish(f);
  f.shared.values.set('nefroquest-save-v7', 'normal-unchanged');
  for (const mutate of [r => { delete r.classBenefits; }, r => { r.classBenefits.xpGranted = 21; },
    r => { r.classBenefits.creditedEvents = []; }, r => { r.progress['unexpected-key'] = 'bad'; },
    r => { r.save.classBenefits.shieldSpent = true; }]) {
    const record = clean(valid); mutate(record); const raw = JSON.stringify(record);
    f.shared.values.set(KEY, raw);
    assert.equal(f.pilot.peek(null).valid, false); assert.equal(await f.pilot.resume(null), null);
    assert.equal(f.pilot.active, false); assert.equal(f.storage.getItem(KEY), raw);
    assert.equal(f.storage.getItem('nefroquest-save-v7'), 'normal-unchanged');
  }
});

test('new journeys preserve same-owner lifetime collections but use a fresh ledger', async () => {
  const f = fixture(); await start(f);
  assert.equal(answered(f, {xp: 1, progress: '{"totalAnswered":7}'}).commit(), true);
  f.progress().setItem('nefroquest-achievements', '["own-achievement"]');
  const oldId = f.pilot.journeyId; await relinquish(f);
  assert.equal(f.pilot.peekProgress('nefroquest-stats', null), '{"totalAnswered":7}');
  await start(f, 'glomerulus', 'hard');
  assert.notEqual(f.pilot.journeyId, oldId); assert.equal(f.pilot.classBenefits.windowAnswers, 0);
  assert.equal(f.progress().getItem('nefroquest-stats'), '{"totalAnswered":7}');
  assert.equal(f.progress().getItem('nefroquest-achievements'), '["own-achievement"]');
  await relinquish(f);
  f.ctx.authUser = {id: 'new-owner'}; await start(f, 'aquaria', 'easy', 'new-owner');
  assert.equal(f.progress().getItem('nefroquest-stats'), null);
  assert.equal(f.progress().getItem('nefroquest-achievements'), null);
  await relinquish(f);
});

test('stale normal and pilot callbacks cannot write across a domain switch', async () => {
  const f = fixture(); const normal = f.progress();
  await start(f); assert.throws(() => normal.setItem('nefroquest-stats', 'stale normal'));
  const pilot = f.progress(); await relinquish(f);
  assert.throws(() => pilot.setItem('nefroquest-stats', 'stale pilot'));
  assert.equal(f.storage.getItem('nefroquest-stats'), null);
  assert.equal(f.pilot.matchesBinding(f.pilot.captureBinding()), true);
});

test('pilot modes, collections and acidbase stay isolated while preferences retain scope', async () => {
  const f = fixture(); const keys = ['nefroquest-stats', 'nefroquest-detailed-stats',
    'nefroquest-mastered', 'nefroquest-all-answered-qids', 'nefroquest-sr-data',
    'nefroquest-achievements', 'nefroquest-announced-badges', 'nefroquest-badge-history',
    'nefroquest-journey-count', 'nefroquest-arqui-defeated', 'nefroquest-hardcore-completed',
    'nefroquest-gold-milestone-shown', 'nefroquest_total_accumulated_knowledge',
    'nq-unlocked-refs', 'unlockedArticles', 'nq-acidbase-progress', 'nefroquest-study-state',
    'nefroquest-exam-state', 'nq_last_study', 'nefroquest-minigame-notified',
    'nefroquest-error-reasons', 'nefroquest-comp-stats', 'nefroquest-minigame-best',
    'nefroquest-recommended-difficulty', 'nefroquest-ritual-done'];
  for (const key of keys) f.shared.values.set(key, `normal:${key}`);
  await start(f);
  for (const key of keys) {
    assert.equal(f.progress().getItem(key), key === 'nefroquest-journey-count' ? '1' : null);
    f.progress().setItem(key, `pilot:${key}`);
    assert.equal(f.progress().getItem(key), `pilot:${key}`);
    assert.equal(f.storage.getItem(key), `normal:${key}`);
    f.progress().removeItem(key);
    assert.equal(f.storage.getItem(key), `normal:${key}`);
  }
  for (const key of ['nefroquest-reading-mode', 'nq-bib-favorites', 'nq-identity']) {
    f.progress().setItem(key, 'setting'); assert.equal(f.storage.getItem(key), 'setting');
  }
  assert.throws(() => f.progress().removeItem('nefroquest-save-v7'));
  assert.throws(() => f.progress().setItem('nefroquest-save', 'bad'));
  await relinquish(f);
});

test('reset affects only the pilot; removal failure keeps authority and normal bytes', async () => {
  const f = fixture(); f.shared.values.set('nefroquest-save-v7', 'schema7-forja-pending');
  await start(f); initializeJourney(f); f.shared.failRemove = true;
  assert.equal(f.pilot.reset(), false); assert.equal(f.pilot.active, true);
  assert.equal(f.storage.getItem('nefroquest-save-v7'), 'schema7-forja-pending');
  f.shared.failRemove = false; await relinquish(f); assert.ok(await f.pilot.resume(null));
  assert.equal(f.pilot.reset(), true); assert.equal(f.pilot.active, false);
  assert.equal(f.storage.getItem(KEY), null);
  assert.equal(f.storage.getItem('nefroquest-save-v7'), 'schema7-forja-pending');
});

test('closed pilot retains its noncompetitive marker and persisted limits on resume', async () => {
  const f = fixture(); await start(f); assert.equal(answered(f, {xp: 1}).commit(), true);
  const closed = f.pilot.load(); closed.gameOver = true;
  assert.equal(f.pilot.save(closed, f.pilot.classBenefits), true);
  assert.equal(f.pilot.peek(null).closed, true);
  await relinquish(f);
  assert.equal((await f.pilot.resume(null)).journeyDomain, 'pilot');
  assert.equal(f.pilot.classBenefits.xpGranted, 1);
  await relinquish(f);
});

test('fatal answer remains closed after a reload before its final screen', async () => {
  const f = fixture(); await start(f, 'aquaria');
  const answer = answered(f, {qid: 'fatal', correct: false});
  answer.save.lives = 0; answer.save.gameOver = false;
  assert.equal(answer.commit(), true);
  assert.equal(f.pilot.peek(null).closed, true);
  assert.equal(f.pilot.load().gameOver, true);
  await relinquish(f);
  const resumed = await f.pilot.resume(null);
  assert.equal(resumed.lives, 0); assert.equal(resumed.gameOver, true);
  await relinquish(f);
});

test('domain change during an after-commit effect cancels later stale effects', async () => {
  const f = fixture(); await start(f); let stale = 0;
  const answer = answered(f, {xp: 1});
  f.pilot.afterCommit(() => f.pilot.release());
  f.pilot.afterCommit(() => stale++);
  assert.equal(answer.commit(), true);
  assert.equal(stale, 0); assert.equal(f.pilot.active, false);
  await relinquish(f);
});

test('new pilot atomically resets announcement deduplication and increments its own journey', async () => {
  const f = fixture();
  const normal = {'nefroquest-announced-badges': '["normal-badge"]',
    'nefroquest-badge-history': '{"normal-badge":{"jornada":8}}',
    'nefroquest-journey-count': '8', 'nefroquest-achievements': '["normal-achievement"]'};
  for (const [key, value] of Object.entries(normal)) f.shared.values.set(key, value);
  await start(f);
  assert.equal(f.progress().getItem('nefroquest-journey-count'), '1');
  f.progress().setItem('nefroquest-announced-badges', '["pilot-badge"]');
  f.progress().setItem('nefroquest-badge-history', '{"pilot-badge":{"jornada":1}}');
  f.progress().setItem('nefroquest-achievements', '["pilot-achievement"]');
  await relinquish(f);
  const writes = f.shared.writes.length;
  await start(f, 'aquaria', 'hard');
  assert.equal(f.shared.writes.length - writes, 1);
  assert.equal(f.progress().getItem('nefroquest-announced-badges'), null);
  assert.equal(f.progress().getItem('nefroquest-journey-count'), '2');
  assert.equal(f.progress().getItem('nefroquest-badge-history'), '{"pilot-badge":{"jornada":1}}');
  assert.equal(f.progress().getItem('nefroquest-achievements'), '["pilot-achievement"]');
  assert.equal(f.pilot.classBenefits.windowAnswers, 0);
  for (const [key, value] of Object.entries(normal)) assert.equal(f.storage.getItem(key), value);
  await relinquish(f);
});

test('failed new-journey write cannot partially reset announcements or increment its counter', async () => {
  const f = fixture(); await start(f);
  f.progress().setItem('nefroquest-announced-badges', '["retained-on-failure"]');
  const before = f.storage.getItem(KEY); await relinquish(f);
  assert.equal(await f.pilot.reserve('hard', null), true);
  f.shared.failWrite = true;
  assert.equal(f.pilot.start('aquaria', 'hard', null), false);
  assert.equal(f.storage.getItem(KEY), before);
  assert.equal(f.record().progress['nefroquest-journey-count'], '1');
  assert.equal(f.record().progress['nefroquest-announced-badges'], '["retained-on-failure"]');
  await relinquish(f);
});

test('a crash before journey initialization cannot resume a scaffold or retain its lock', async () => {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const f = fixture(); await start(f, 'nephros', difficulty);
    const raw = f.storage.getItem(KEY), writes = f.shared.writes.length;
    assert.equal(f.pilot.peek(null).valid, true);
    assert.equal(f.pilot.peek(null).started, false);
    assert.equal(f.pilot.peek(null).resumable, false);
    await relinquish(f);
    assert.equal(await f.pilot.resume(null), null);
    assert.equal(f.pilot.active, false);
    assert.equal(f.storage.getItem(KEY), raw);
    assert.equal(f.shared.writes.length, writes);
    await relinquish(f);
    const other = fixture(f.shared);
    assert.equal(await other.pilot.reserve(difficulty, null), true);
    await relinquish(other);
    assert.equal(f.storage.getItem(KEY), raw);
  }
});

test('an initialized journey resumes before its first answer with its selected lives', async () => {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const f = fixture(); await start(f, 'aquaria', difficulty); initializeJourney(f);
    assert.equal(f.pilot.peek(null).started, true);
    assert.equal(f.pilot.peek(null).resumable, true);
    const raw = f.storage.getItem(KEY); await relinquish(f);
    const resumed = await f.pilot.resume(null);
    assert.equal(resumed.lives, {easy: 5, normal: 4, hard: 3}[difficulty]);
    assert.equal(resumed.classBenefits.windowAnswers, 0);
    assert.equal(f.storage.getItem(KEY), raw);
    await relinquish(f);
  }
});

test('public resume engine refuses incomplete and closed records without stopping the current journey', async () => {
  for (const kind of ['incomplete', 'gameOver', 'gameCompleted', 'completedGame', 'zero-lives']) {
    const f = fixture(); await start(f);
    if (kind !== 'incomplete') {
      initializeJourney(f);
      const save = f.pilot.load();
      if (kind === 'zero-lives') save.lives = 0;
      else save[kind] = true;
      assert.equal(f.pilot.save(save, f.pilot.classBenefits), true);
    }
    const raw = f.storage.getItem(KEY); await relinquish(f);
    installResumeEngine(f);
    f.ctx.state.gameStarted = true; f.ctx.state.gold = 77;
    assert.equal(await f.ctx.resumePilotGame(), false, kind);
    assert.equal(f.ctx.stops, 0, kind);
    assert.equal(f.ctx.continuations, 0, kind);
    assert.equal(f.ctx.state.gold, 77, kind);
    assert.equal(f.storage.getItem(KEY), raw, kind);
    assert.equal(f.pilot.active, false, kind);
  }
});

test('a journey closed between the initial read and lease acquisition cannot continue', async () => {
  const f = fixture(); await start(f); initializeJourney(f); await relinquish(f);
  let closedRaw;
  installResumeEngine(f, () => {
    const record = f.record(); record.revision++; record.save.lives = 0; record.save.gameOver = true;
    closedRaw = JSON.stringify(record); f.shared.values.set(KEY, closedRaw);
  });
  assert.equal(await f.ctx.resumePilotGame(), false);
  assert.equal(f.ctx.stops, 1);
  assert.equal(f.ctx.continuations, 0);
  assert.equal(f.pilot.active, false);
  assert.equal(f.storage.getItem(KEY), closedRaw);
  await relinquish(f);
});

test('the public resume engine still continues an initialized live pilot', async () => {
  const f = fixture(); await start(f); initializeJourney(f); await relinquish(f);
  const raw = f.storage.getItem(KEY); installResumeEngine(f);
  assert.equal(await f.ctx.resumePilotGame(), true);
  assert.equal(f.ctx.stops, 1);
  assert.equal(f.ctx.continuations, 1);
  assert.equal(f.ctx._stateData.journeyDomain, 'pilot');
  assert.equal(f.storage.getItem(KEY), raw);
  await relinquish(f);
});

test('restore refuses closed or incomplete pilot saves before mutating gameplay', () => {
  const f = fixture(); f.ctx.state = {gold: 77};
  vm.runInContext(sourceSection('    function _answerChoice(', '    function _normalCharacterSaveValid('), f.ctx);
  vm.runInContext(sourceSection('    function restoreGame(selectedSave)', '    function initWelcomeScreen()'), f.ctx);
  for (const save of [{gameStarted: false}, {gameStarted: true, gameOver: true},
    {gameStarted: true, gameCompleted: true}, {gameStarted: true, completedGame: true},
    {gameStarted: true, lives: 0}]) {
    assert.equal(f.ctx.restoreGame({character: 'nephros', journeyDomain: 'pilot', ...save}), false);
    assert.equal(f.ctx.state.gold, 77);
  }
});

test('entitlement uses normal quota outside the pilot and combined quota only while active', async () => {
  const f = fixture();
  f.shared.values.set('nefroquest-stats', '{"questionsAnsweredAllTime":37}');
  f.ctx.STATS_KEY = 'nefroquest-stats';
  f.ctx.isCharacterPilot = () => f.pilot.active;
  f.ctx._currentSaveOwner = () => f.ctx.authUser?.id || null;
  vm.runInContext(sourceSection('    function getNormalGameStats()', '    function _saveBeforeDomainSwitch()'), f.ctx);
  const normalBytes = f.storage.getItem('nefroquest-stats');
  assert.equal(f.ctx.getEntitlementQuestionsAnswered(), 37);
  await start(f);
  f.progress().setItem('nefroquest-stats', '{"questionsAnsweredAllTime":9}');
  assert.equal(f.ctx.getEntitlementQuestionsAnswered(), 46);
  await relinquish(f);
  assert.equal(f.ctx.getEntitlementQuestionsAnswered(), 37);
  assert.equal(f.storage.getItem('nefroquest-stats'), normalBytes);
  f.ctx.authUser = {id: 'other'};
  await start(f, 'aquaria', 'hard', 'other');
  assert.equal(f.ctx.getEntitlementQuestionsAnswered(), 37);
  f.progress().setItem('nefroquest-stats', '{"questionsAnsweredAllTime":2}');
  assert.equal(f.ctx.getEntitlementQuestionsAnswered(), 39);
  await relinquish(f);
  assert.equal(f.ctx.getEntitlementQuestionsAnswered(), 37);
});

test('cloud progress constructor reads only normal collections and stats while a pilot is active', async () => {
  const f = fixture();
  const normal = {
    'nefroquest-stats': '{"questionsAnsweredAllTime":7,"gamesPlayed":2}',
    'nefroquest-detailed-stats': '{"totalCorrect":3}',
    'nefroquest-achievements': '["normal-achievement"]',
    'nefroquest-mastered': '["normal-question"]',
    'unlockedArticles': '["normal-article"]',
    'nq-unlocked-refs': '["normal-ref"]',
    'nq-acidbase-progress': '{"normal-case":true}',
    'nefroquest-sr-data': '{"normal-question":{"reps":2}}',
    'nefroquest-save-v7': '{"schemaVersion":7,"saveOwner":null,"character":"aquaria","gold":17}'
  };
  for (const [key, value] of Object.entries(normal)) f.shared.values.set(key, value);
  Object.assign(f.ctx, {STATS_KEY: 'nefroquest-stats', STATS_STORAGE_KEY: 'nefroquest-detailed-stats',
    MASTERED_KEY: 'nefroquest-mastered', CANONICAL_SAVE_KEY: 'nefroquest-save-v7', SAVE_KEY: 'nefroquest-save',
    _currentSaveOwner: () => null, _isSaveTombstone: save => save === null,
    getGameStats: () => { throw new Error('active-domain stats entered a cloud payload'); }});
  vm.runInContext(sourceSection('    function getNormalGameStats()', '    window.getNormalGameStats'), f.ctx);
  vm.runInContext(sourceSection('    function _buildCloudProgress()', '    async function _syncProgressToCloud()'), f.ctx);
  await start(f);
  for (const key of Object.keys(normal).filter(key => key !== 'nefroquest-save-v7')) {
    f.progress().setItem(key, key === 'nefroquest-stats' ? '{"questionsAnsweredAllTime":99,"gamesPlayed":55}' : '[]');
  }
  const cloud = clean(f.ctx._buildCloudProgress());
  assert.equal(cloud.stats.questionsAnsweredAllTime, 7);
  assert.equal(cloud.stats.gamesPlayed, 2);
  assert.deepEqual(cloud.detailedStats, {totalCorrect: 3});
  assert.deepEqual(cloud.achievements, ['normal-achievement']);
  assert.deepEqual(cloud.mastered, ['normal-question']);
  assert.deepEqual(cloud.unlockedArticles, ['normal-article']);
  assert.deepEqual(cloud.unlockedRefs, ['normal-ref']);
  assert.deepEqual(cloud.acidBaseProgress, {'normal-case': true});
  assert.deepEqual(cloud.srData, {'normal-question': {reps: 2}});
  assert.equal(cloud.save.schemaVersion, 7); assert.equal(cloud.save.gold, 17);
  assert.equal(cloud.save.journeyDomain, undefined); assert.equal(cloud.save.classBenefits, undefined);
  for (const [key, value] of Object.entries(normal)) assert.equal(f.storage.getItem(key), value);
  await relinquish(f);
});

test('successful continue refreshes pilot controls after gameplay restoration', async () => {
  const f = fixture(); await start(f); initializeJourney(f);
  const engine = installContinueEngine(f);
  await engine.ctx.continueGame(true);
  assert.deepEqual(engine.calls, ['restored', 'refreshed', 'dismissed']);
  await relinquish(f);
});

test('character choice defers welcome dismissal until the new journey save is confirmed', async () => {
  const f = fixture(); let dismissed = 0;
  Object.assign(f.ctx, {document: {getElementById: () => ({classList: {remove() {}}})},
    cancelPilotGameStart() {}, dismissWelcome() { dismissed++; }});
  vm.runInContext(sourceSection('    let _charSelectFocus;', '    function closeNameModal()'), f.ctx);
  vm.runInContext('_charSelectFromWelcome = true; closeCharSelectModal(false);', f.ctx);
  assert.equal(dismissed, 0, 'normal character selection keeps welcome open until startup is committed');
  assert.equal(await f.pilot.reserve('normal', null), true);
  vm.runInContext('_charSelectFromWelcome = true; closeCharSelectModal(false);', f.ctx);
  assert.equal(dismissed, 0, 'a reserved pilot must not schedule a stale welcome timer');
  await relinquish(f);
});

test('queued cleanup from journey A cannot unlock or relabel journey B', async () => {
  const f = fixture(), engine = installContinueEngine(f);
  await engine.ctx.continueGame();
  const staleTimers = engine.timers.slice();
  assert.equal(engine.button.disabled, true);
  assert.equal(engine.attributes.get('aria-busy'), 'true');
  engine.ctx._stopLocalJourney();
  assert.equal(engine.button.disabled, false, 'stopping clears the retired journey immediately');
  assert.equal(engine.attributes.has('aria-busy'), false);
  assert.equal(engine.title.textContent, 'Original title');
  engine.title.textContent = 'Journey B title'; engine.detail.textContent = 'Journey B detail';
  await engine.ctx.continueGame();
  assert.equal(engine.button.disabled, true);
  const busyTitle = engine.title.textContent, busyDetail = engine.detail.textContent;
  staleTimers.forEach(callback => callback());
  assert.equal(engine.button.disabled, true);
  assert.equal(engine.attributes.get('aria-busy'), 'true');
  assert.equal(engine.classes.has('is-busy'), true);
  assert.equal(engine.title.textContent, busyTitle);
  assert.equal(engine.detail.textContent, busyDetail);
  assert.equal(vm.runInContext('_continueGamePending', engine.ctx), true);
  engine.timers.slice(staleTimers.length).forEach(callback => callback());
  assert.equal(engine.button.disabled, false);
  assert.equal(engine.title.textContent, 'Journey B title');
  assert.equal(engine.detail.textContent, 'Journey B detail');
  assert.equal(vm.runInContext('_continueGamePending', engine.ctx), false);
});

test('retiring a journey during loading clears its controls before its late finally runs', async () => {
  let completeLoading;
  const f = fixture(), engine = installContinueEngine(f, {loadTopics: () => new Promise(resolve => { completeLoading = resolve; })});
  const pending = engine.ctx.continueGame();
  assert.equal(engine.button.disabled, true);
  engine.ctx._stopLocalJourney();
  assert.equal(engine.button.disabled, false);
  assert.equal(engine.attributes.has('aria-busy'), false);
  assert.equal(engine.title.textContent, 'Original title');
  completeLoading(); await pending;
  assert.equal(engine.button.disabled, false);
  assert.equal(engine.title.textContent, 'Original title');
  assert.equal(engine.calls.length, 0, 'an interrupted journey is never restored');
});

test('queued error focus from journey A cannot steal focus during journey B', async () => {
  const f = fixture(), engine = installContinueEngine(f, {restore: false});
  await engine.ctx.continueGame();
  assert.equal(engine.frames.length, 1);
  assert.equal(engine.button.disabled, false);
  engine.ctx._stopLocalJourney();
  // Keep B loading while A's animation-frame callback runs.
  let completeLoading;
  engine.ctx._loadTopics = () => new Promise(resolve => { completeLoading = resolve; });
  const pending = engine.ctx.continueGame();
  assert.equal(engine.button.disabled, true);
  engine.frames[0]();
  assert.equal(engine.button.focused, 0);
  assert.equal(engine.button.disabled, true);
  engine.ctx._stopLocalJourney(); completeLoading(); await pending;
});
