'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the production producers; the small domain fixture deliberately rejects
// stale bindings so a callback that switches to the live domain fails the test.
function fixture(files, { realPilot = false } = {}) {
  const normal = new Map(), pilot = new Map(), callbacks = [], commits = [], timers = [];
  const nodes = new Map();
  let binding = Object.freeze({ domain: 'normal', journeyId: null, owner: null, generation: 0 });
  let writeFailure = false;
  const storage = map => ({
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => { if (writeFailure) throw new Error('synthetic persistence failure'); map.set(key, String(value)); },
    removeItem: key => { if (writeFailure) throw new Error('synthetic persistence failure'); map.delete(key); },
  });
  const normalStore = storage(normal), pilotStore = storage(pilot);
  const ctx = {
    console, Date, Math, JSON, Set, Map, Object, Number, String, Array, Promise, AbortController,
    localStorage: normalStore,
    document: {
      readyState: 'loading', activeElement: null,
      addEventListener() {}, removeEventListener() {},
      getElementById: id => nodes.get(id) || null,
      querySelector() { return null; }, querySelectorAll() { return []; },
      createElement() { return { textContent: '', remove() {} }; },
      head: { appendChild() {} },
      body: { classList: { add() {}, remove() {}, contains() { return false; } } },
    },
    setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {},
    setInterval: fn => { timers.push(fn); return timers.length; }, clearInterval() {},
    requestAnimationFrame: fn => { timers.push(fn); return timers.length; },
    navigator: { locks: { request(name, options, callback) { return callback({ name }); } } },
    crypto: { randomUUID: () => 'synthetic-real-pilot' },
    authUser: null, addEventListener() {},
    HTMLElement: class {}, Element: class {},
    scrollTo() {}, getComputedStyle() { return {}; },
    playSound() {}, _toast() {}, _track() {}, isPremium() { return false; },
    isProgressSandbox() { return false; }, confirm() { return true; },
    _scheduleCloudSync() { ctx.cloudCalls++; }, _syncProgressToCloud() { ctx.cloudCalls++; return Promise.resolve(); },
    cloudCalls: 0, state: { gameStarted: false }, musicEnabled: false,
    getDetailedStats() { return {}; }, getGameStats() { return {}; },
    refsDB: {}, nefroArticles: [], refreshWelcomeSave() {},
  };
  ctx.window = ctx;
  ctx.NQPilot = {
    get active() { return binding.domain === 'pilot'; },
    captureBinding: () => binding,
    matchesBinding: other => other === binding,
    onContextChange: callback => { callbacks.push(callback); return () => {}; },
    afterCommit: callback => commits.push(callback),
  };
  ctx.nqProgressStorage = captured => {
    if (captured && captured !== binding) throw new Error('stale progress binding');
    return binding.domain === 'pilot' ? pilotStore : normalStore;
  };
  vm.createContext(ctx);
  if (realPilot) vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/pilot.js'), 'utf8'), ctx, { filename: 'pilot.js' });
  for (const file of files) {
    let source = fs.readFileSync(path.join(__dirname, '../../js', file), 'utf8');
    if (file === 'minigame-acidbase.js') source = source.replace('  window.showAcidBaseMinigame =', '  window.__acid = { _loadProgress, _markCompleted, _renderSummary };\n  window.showAcidBaseMinigame =');
    if (file === 'dashboard.js') source = source.replace('  window.openDashboard =', '  window.__dash = { _readJson, _progressStorage, setBinding: value => { _dashboardBinding = value; } };\n  window.openDashboard =');
    vm.runInContext(source, ctx, { filename: file });
  }
  return {
    ctx, normal, pilot, nodes, commits, timers,
    run: source => vm.runInContext(source, ctx),
    activate() {
      if (realPilot) return ctx.NQPilot.reserve('normal', null).then(ok => {
        assert.equal(ok, true); assert.equal(ctx.NQPilot.start('nephros', 'normal', null), true);
      });
      binding = Object.freeze({ domain: 'pilot', journeyId: 'synthetic-pilot', owner: null, generation: binding.generation + 1 }); callbacks.forEach(fn => fn());
    },
    leave() {
      if (realPilot) { ctx.NQPilot.release(); return; }
      binding = Object.freeze({ domain: 'normal', journeyId: null, owner: null, generation: binding.generation + 1 }); callbacks.forEach(fn => fn());
    },
    failWrites(value = true) { writeFailure = value; },
    snapshot: () => JSON.stringify([...normal].filter(([key]) => key !== 'nefroquest-pilot-v1')),
  };
}

test('study resume, expiry and clear use only the selected progress domain', () => {
  const f = fixture(['study-mode.js']);
  f.normal.set('nefroquest-study-state', '{"legacy":"untouched"}');
  const before = f.snapshot(); f.activate();
  f.run("_studyProgressBinding = NQPilot.captureBinding(); studyModeActive = true; studyModeQuestions = [{ qid: 'synthetic-1' }]; studyModeCorrect = 1; _saveStudyState();");
  assert.equal(f.ctx._loadStudyState().correct, 1);
  assert.equal(f.pilot.has('nefroquest-study-state'), true);
  assert.equal(f.snapshot(), before);
  const saved = JSON.parse(f.pilot.get('nefroquest-study-state')); saved.savedAt = Date.now() - 25 * 60 * 60 * 1000;
  f.pilot.set('nefroquest-study-state', JSON.stringify(saved));
  assert.equal(f.ctx._loadStudyState(), null);
  assert.equal(f.pilot.has('nefroquest-study-state'), false);
  assert.equal(f.snapshot(), before);
});

test('exam persistence and timer callbacks cannot enter the normal domain after leaving pilot', () => {
  const f = fixture(['exam.js']);
  f.normal.set('nefroquest-exam-state', '{"legacy":"untouched"}');
  const before = f.snapshot(); f.activate();
  f.run("_examProgressBinding = NQPilot.captureBinding(); _examState = { questions: [{id:'synthetic-2'}],idx:0,answers:[],startTime:Date.now() }; _saveExamState(); _examIniciarRelogio();");
  assert.equal(f.ctx._loadExamState().questions[0].id, 'synthetic-2');
  const pilotSaved = f.pilot.get('nefroquest-exam-state');
  f.leave(); f.timers.forEach(fn => fn()); f.ctx._saveExamState();
  assert.equal(f.pilot.get('nefroquest-exam-state'), pilotSaved);
  assert.equal(f.snapshot(), before);
});

test('SR, unlocked resources and achievements stay separate; favorites remain personal', () => {
  const f = fixture(['utils.js', 'achievements.js']);
  f.normal.set('nefroquest-sr-data', '{"old":{"reps":3}}');
  f.normal.set('nq-unlocked-refs', '["normal-ref"]');
  f.normal.set('nefroquest-achievements', '["normal-badge"]');
  const before = f.snapshot(); f.activate();
  f.ctx.updateSRData('synthetic-q', true); f.ctx._unlockRefsFromQuestion(['pilot-ref']);
  assert.equal(f.ctx.saveUnlockedAchievements(['pilot-badge']), true);
  assert.deepEqual(Array.from(f.ctx._getUnlockedRefs()), ['pilot-ref']);
  assert.deepEqual(Array.from(f.ctx.getUnlockedAchievements()), ['pilot-badge']);
  assert.equal(JSON.parse(f.pilot.get('nefroquest-sr-data'))['synthetic-q'].reps, 1);
  assert.equal(f.snapshot(), before); assert.equal(f.ctx.cloudCalls, 0);
  f.run("_toggleBibFav('shared-favorite')");
  assert.equal(f.pilot.has('nq-bib-favorites'), false);
  assert.ok(f.normal.has('nq-bib-favorites'));
});

test('leaving a domain discards cached book resources and pending study state', () => {
  const f = fixture(['utils.js', 'study-mode.js']); f.activate();
  f.run("_bibItems=[{label:'pilot'}]; _bibVisibleItems=[{label:'pilot'}]; _bibProgressBinding=NQPilot.captureBinding(); _studyProgressBinding=NQPilot.captureBinding(); studyModeActive=true; studyModeQuestions=[{qid:'pilot'}];");
  f.leave();
  assert.equal(f.run('_bibItems'), null);
  assert.equal(f.run('_bibVisibleItems.length'), 0);
  assert.equal(f.run('studyModeActive'), false);
  assert.equal(f.run('studyModeQuestions.length'), 0);
});

test('a delayed topic load for an old pilot cannot start an exam in a new domain', async () => {
  const f = fixture(['exam.js']); f.activate();
  let resolve; f.ctx.questionBank = null; f.ctx._loadTopics = () => new Promise(done => { resolve = done; });
  f.run('_examProgressBinding = NQPilot.captureBinding()');
  const waiting = f.ctx._examComecar(); f.leave(); f.ctx.questionBank = [{id:'synthetic'}]; resolve(); await waiting;
  assert.equal(f.run('_examState'), null);
  assert.equal(f.normal.size, 0); assert.equal(f.pilot.size, 0);
});

test('acid-base completion is local to pilot and rejects stale or failed persistence', () => {
  const f = fixture(['minigame-acidbase.js']); f.normal.set('nq-acidbase-progress', '{"completed":["legacy"]}');
  const before = f.snapshot(); f.activate(); const binding = f.ctx.NQPilot.captureBinding();
  assert.equal(f.ctx.__acid._markCompleted('synthetic-case', 2, binding), true);
  assert.deepEqual(JSON.parse(f.pilot.get('nq-acidbase-progress')).completed, ['synthetic-case']);
  assert.equal(f.ctx.cloudCalls, 0); assert.equal(f.snapshot(), before);
  f.failWrites(); assert.equal(f.ctx.__acid._markCompleted('synthetic-failed', 1, binding), false);
  assert.equal(JSON.parse(f.pilot.get('nq-acidbase-progress')).completed.includes('synthetic-failed'), false);
  f.failWrites(false); f.leave(); assert.equal(f.ctx.__acid._markCompleted('synthetic-stale', 1, binding), false);
  assert.equal(f.snapshot(), before);
});

test('dashboard reads pilot stats but ranking explicitly reads the normal profile', () => {
  const f = fixture(['dashboard.js']); f.normal.set('nefroquest-stats', '{"bestScore":42}');
  f.activate(); f.pilot.set('nefroquest-stats', '{"bestScore":999}');
  f.ctx.__dash.setBinding(f.ctx.NQPilot.captureBinding());
  assert.equal(f.ctx.__dash._readJson('nefroquest-stats', {}).bestScore, 999);
  assert.equal(f.ctx.__dash._readJson('nefroquest-stats', {}, true).bestScore, 42);
  f.leave(); assert.equal(f.snapshot(), '[["nefroquest-stats","{\\"bestScore\\":42}"]]');
});

test('pilot reset delegates to its guarded engine reset without deleting normal keys', () => {
  const f = fixture(['study-mode.js']); f.normal.set('nefroquest-save-v7', '{"schemaVersion":7}');
  const before = f.snapshot(); f.activate(); const calls = [];
  f.ctx.clearLocalProgress = action => { calls.push(action); return true; };
  f.ctx.confirmResetProgress(); assert.deepEqual(calls, ['reset']); assert.equal(f.snapshot(), before);
});

test('the real pilot module commits all auxiliary producers without consuming boons or changing legacy bytes', async () => {
  const f = fixture(['utils.js', 'study-mode.js', 'exam.js', 'achievements.js', 'dashboard.js', 'minigame-acidbase.js'], { realPilot: true });
  f.normal.set('nefroquest-save-v7', ' {"schemaVersion":7,"forjaPending":{"gold":17}} ');
  f.normal.set('nefroquest-save', ' {"legacy":"byte-preserved"} ');
  f.normal.set('nefroquest-study-state', '{"normalStudy":true}');
  f.normal.set('nefroquest-exam-state', '{"normalExam":true}');
  f.normal.set('nefroquest-sr-data', '{"legacy":{"reps":2}}');
  f.normal.set('nq-acidbase-progress', '{"completed":["normal-only"]}');
  const before = f.snapshot(); await f.activate();
  f.run("_studyProgressBinding=NQPilot.captureBinding(); studyModeActive=true; studyModeQuestions=[{qid:'actual-study'}]; _saveStudyState(); _examProgressBinding=NQPilot.captureBinding(); _examState={questions:[{id:'actual-exam'}],idx:0,answers:[],startTime:Date.now()}; _saveExamState();");
  f.ctx.updateSRData('actual-study', true); f.ctx._unlockRefsFromQuestion(['actual-ref']);
  assert.equal(f.ctx.saveUnlockedAchievements(['actual-badge']), true);
  assert.equal(f.ctx.__acid._markCompleted('actual-case', 0, f.ctx.NQPilot.captureBinding()), true);
  const stored = JSON.parse(f.normal.get('nefroquest-pilot-v1'));
  assert.ok(stored.progress['nefroquest-study-state']);
  assert.ok(stored.progress['nefroquest-exam-state']);
  assert.equal(JSON.parse(stored.progress['nefroquest-sr-data'])['actual-study'].reps, 1);
  assert.deepEqual(JSON.parse(stored.progress['nq-acidbase-progress']).completed, ['actual-case']);
  assert.deepEqual(JSON.parse(stored.progress['nq-unlocked-refs']), ['actual-ref']);
  assert.equal(stored.classBenefits.windowAnswers, 0);
  assert.equal(stored.classBenefits.xpGranted, 0);
  assert.equal(stored.classBenefits.goldGranted, 0);
  assert.equal(stored.classBenefits.shieldSpent, false);
  assert.equal(f.ctx.cloudCalls, 0); assert.equal(f.snapshot(), before);
  f.leave(); assert.equal(f.run('studyModeActive'), false); assert.equal(f.run('_examState'), null);
  assert.equal(f.snapshot(), before);
});

function pageFixture() {
  const f = fixture(['utils.js']);
  const classes = initial => {
    const values = new Set(initial);
    return { contains: value => values.has(value), add: value => values.add(value), remove: value => values.delete(value),
      toggle(value, on) { if (on) values.add(value); else values.delete(value); } };
  };
  const main = { classList: classes([]), inert: false };
  const welcome = { classList: classes(['hidden']), inert: true };
  const scrolls = []; let focusCalls = 0;
  f.ctx.scrollY = 42; f.ctx.scrollTo = (...args) => scrolls.push(args);
  f.ctx.document.activeElement = { isConnected: true, getClientRects: () => [{}], focus() { focusCalls++; } };
  f.ctx.document.querySelectorAll = selector => selector === '#mainApp, #welcomeScreen' ? [main, welcome] : [];
  f.ctx.document.createElement = () => ({ isConnected: false, classList: classes([]),
    setAttribute() {}, addEventListener() {}, contains() { return false; }, remove() { this.isConnected = false; } });
  f.ctx.document.body.appendChild = page => { page.isConnected = true; };
  return { f, main, welcome, scrolls, focusCalls: () => focusCalls };
}

test('page helper normal close restores original visibility, inert, scroll and focus', () => {
  const { f, main, welcome, scrolls, focusCalls } = pageFixture();
  const { pagina, fechar } = f.ctx.nqPaginaPropria('synthetic-page', 'Synthetic');
  assert.equal(main.classList.contains('hidden'), true); assert.equal(main.inert, true);
  fechar(); assert.equal(pagina.isConnected, false);
  assert.equal(main.classList.contains('hidden'), false); assert.equal(main.inert, false);
  assert.equal(welcome.classList.contains('hidden'), true); assert.equal(welcome.inert, true);
  assert.deepEqual(scrolls, [[0, 0], [0, 42]]); assert.equal(focusCalls(), 1);
});

test('page helper close can dispose its page without restoring origin or focus', () => {
  const { f, main, scrolls, focusCalls } = pageFixture();
  const { pagina, fechar } = f.ctx.nqPaginaPropria('synthetic-page', 'Synthetic');
  fechar({ restoreFocus: false, restoreOrigin: false });
  assert.equal(pagina.isConnected, false);
  assert.equal(main.classList.contains('hidden'), true); assert.equal(main.inert, true);
  assert.deepEqual(scrolls, [[0, 0]]); assert.equal(focusCalls(), 0);
});

test('a captured old page close cannot replace the main-screen state after domain change', () => {
  const { f, main, welcome, scrolls, focusCalls } = pageFixture();
  const { pagina, fechar } = f.ctx.nqPaginaPropria('synthetic-old-page', 'Synthetic');
  f.activate();
  main.classList.add('hidden'); main.inert = false;
  welcome.classList.remove('hidden'); welcome.inert = false;
  fechar();
  assert.equal(pagina.isConnected, false);
  assert.equal(main.classList.contains('hidden'), true); assert.equal(main.inert, false);
  assert.equal(welcome.classList.contains('hidden'), false); assert.equal(welcome.inert, false);
  assert.deepEqual(scrolls, [[0, 0]]); assert.equal(focusCalls(), 0);
});
