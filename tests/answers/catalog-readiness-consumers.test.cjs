'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../..');
const sources = Object.fromEntries(['study-mode', 'dashboard', 'boss'].map(name =>
  [name, fs.readFileSync(path.join(ROOT, 'js', name + '.js'), 'utf8')]));
// Execute the actual production entry functions with a deferred loader. The
// fixture exercises readiness/ownership, not bank content or game algorithms.
function fn(file, name) {
  const source = sources[file], start = new RegExp('^([ \\t]*)(?:async )?function ' + name + '\\(', 'm').exec(source);
  assert(start, 'Missing production function ' + name);
  const rest = source.slice(start.index + start[0].length), end = new RegExp('^' + start[1] + '}[ \\t]*$', 'm').exec(rest);
  assert(end, 'Missing production boundary ' + name);
  return source.slice(start.index, start.index + start[0].length + end.index + end[0].length);
}
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return {promise, resolve, reject}; }
function base() {
  let owner = {id: 'technical-owner', epoch: 1};
  const gate = deferred(), calls = {load: 0, toast: [], mount: 0, syncCatalog: 0, sandbox: 0};
  const context = vm.createContext({console, Promise, Set, Map,
    topics: [{qid: 'technical-token', q: 'Choose a token.', opts: ['one', 'two'], ans: 0, refs: []}],
    questionBank: [{id: 'technical-token'}],
    NQ_REQUIRES_QUESTION_REVISIONS: true,
    NQQuestionRevisions: {createCatalogAsync() {}, createCatalog() {calls.syncCatalog++; return {legacy: true};}},
    NQQuestionRevisionManifest: {}, NQQuestionRevisionHistory: [], refsDB: {},
    authUser: {id: owner.id},
    NQPilot: {captureBinding: () => owner, matchesBinding: value => value === owner},
    _loadTopics() { calls.load++; return gate.promise; },
    _toast(message, type) { calls.toast.push({message, type}); },
    _captureJourneyBinding: () => owner, _matchesJourneyBinding: binding => binding === owner,
    document: {activeElement: null, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null},
    NEFRO_AXES: [{id: 'technical-axis', cat: 'technical'}],
    _studySelectedAxes: new Set(['previous-selection']), _studyProgressBinding: null, _studyCatalogCache: null,
    studyModeActive: false, studyModeQuestions: [], studyModeIndex: 8, studyModeCorrect: 7, studyModeWrong: 3,
    shuffle: values => values.slice(), getSRScheduledDueQuestions: values => values.slice(),
    showStudyModePage() { calls.mount++; },
    localStorage: {getItem: () => null, setItem() {throw Error('Readiness must not write storage.');}, removeItem() {throw Error('Readiness must not remove storage.');}},
  });
  context.window = context;
  const run = source => vm.runInContext(source, context);
  function load(file, names) { run(names.map(name => fn(file, name)).join('\n')); }
  function changeOwner() { owner = {id: 'different-owner', epoch: 2}; context.authUser = {id: owner.id}; }
  function ready() { context.questionRevisionCatalog = {ready: true}; gate.resolve(); }
  return {context, gate, calls, run, load, changeOwner, ready};
}
function study(entry) {
  const h = base(); h.load('study-mode', ['_studyCaptureBinding', '_studyBindingCurrent', '_studyRequiresQuestionRevisions', '_studyCatalogPending', entry]);
  return h;
}
for (const entry of ['showTopicSelector', 'startFreeStudyMode', 'startSRStudyAllMode', 'startScheduledSRStudyMode']) {
  test(entry + ' waits with topics already loaded and does not adopt a stale owner', async () => {
    const h = study(entry), task = h.run(entry + '()');
    assert.equal(h.calls.load, 1); assert.equal(h.context.studyModeActive, false); assert.equal(h.calls.mount, 0);
    assert.deepEqual([...h.context._studySelectedAxes], ['previous-selection']);
    h.changeOwner(); h.ready(); await task;
    assert.equal(h.context.studyModeActive, false); assert.equal(h.calls.mount, 0);
    assert.deepEqual([...h.context._studySelectedAxes], ['previous-selection']);
    assert.equal(h.calls.toast.filter(row => row.type === 'error').length, 0);
  });
  test(entry + ' keeps the session untouched when loading fails or never publishes a catalog', async () => {
    for (const reject of [true, false]) {
      const h = study(entry), task = h.run(entry + '()');
      if (reject) h.gate.reject(Error('Technical load failure')); else h.gate.resolve();
      await task;
      assert.equal(h.context.studyModeActive, false); assert.equal(h.calls.mount, 0);
      assert.deepEqual([...h.context._studySelectedAxes], ['previous-selection']);
      assert.equal(h.calls.toast.filter(row => row.type === 'error').length, 1);
    }
  });
}
for (const entry of ['startFreeStudyMode', 'startSRStudyAllMode', 'startScheduledSRStudyMode']) {
  test(entry + ' enters only after the completed catalog is published', async () => {
    const h = study(entry), task = h.run(entry + '()');
    assert.equal(h.calls.mount, 0); h.ready(); await task;
    assert.equal(h.calls.mount, 1); assert.equal(h.context.studyModeActive, true);
    assert.equal(h.context.studyModeIndex, 0); assert.equal(h.context.studyModeQuestions.length, 1);
  });
}
test('Study synchronous fallback is held during async readiness and retained for isolated old loaders', () => {
  const h = base(); h.load('study-mode', ['_studyRequiresQuestionRevisions', '_studyCatalogPending', '_studyRevisionCatalog', '_studyQuestionId', '_studyCanonical']);
  assert.equal(h.run('_studyRevisionCatalog()'), null); assert.equal(h.calls.syncCatalog, 0);
  delete h.context._loadTopics;
  assert.equal(h.run('_studyRevisionCatalog().legacy'), true); assert.equal(h.calls.syncCatalog, 1);
});
function dashboard() {
  const h = base(), root = {isConnected: true};
  h.context.document.getElementById = id => id === 'nqDashboard' ? root : null;
  h.context._dashboardBinding = h.run('NQPilot.captureBinding()');
  h.context._dashboardBindingCurrent = binding => h.context.NQPilot.matchesBinding(binding);
  h.load('dashboard', ['_ensureTopics']); return {...h, root};
}
test('Dashboard does not return early for loaded topics before catalog readiness', async () => {
  const h = dashboard(), task = h.run('_ensureTopics()');
  assert.equal(h.calls.load, 1); h.ready(); assert.equal(await task, true);
});
test('Dashboard readiness preserves owner, current root, and rejection guards', async () => {
  for (const outcome of ['owner', 'removed', 'reject', 'unpublished']) {
    const h = dashboard(), task = h.run('_ensureTopics()');
    if (outcome === 'owner') h.changeOwner();
    if (outcome === 'removed') h.root.isConnected = false;
    if (outcome === 'reject') h.gate.reject(Error('Technical failure'));
    else if (outcome === 'unpublished') h.gate.resolve(); else h.ready();
    assert.equal(await task, false, outcome);
  }
});
test('Dashboard keeps the immediate path for completed catalogs and old synchronous bundles', async () => {
  for (const legacy of [true, false]) {
    const h = dashboard();
    if (legacy) delete h.context.NQQuestionRevisions.createCatalogAsync; else h.context.questionRevisionCatalog = {ready: true};
    assert.equal(await h.run('_ensureTopics()'), true); assert.equal(h.calls.load, 0);
  }
});
function boss(entry) {
  const h = base();
  Object.assign(h.context, {characters: {nephros: {}}, state: {character: 'nephros', difficulty: 'normal'},
    _characterPreviewEpoch: 1, _lastSelectedCharacter: 'nephros', _pendingDiff: 'normal',
    isProgressSandbox: () => false, _guestMode: true, isPremium: () => true,
    carregarDadosGrimorio: async () => {},
    beginProgressSandbox() { h.calls.sandbox++; throw Error('Reached the post-readiness preview boundary.'); },
  });
  h.load('boss', ['_bossCatalogPending', entry]); return h;
}
for (const entry of ['startBossPreview', 'startGameWithCharacter']) {
  test(entry + ' waits for a catalog even when questionBank exists and drops stale ownership', async () => {
    const h = boss(entry), task = h.run(entry + '()');
    assert.equal(h.calls.load, 1); assert.equal(h.calls.sandbox, 0);
    h.changeOwner(); h.ready(); await task;
    assert.equal(h.calls.sandbox, 0); assert.equal(h.calls.toast.filter(row => row.type === 'error').length, 0);
    assert.equal(h.context.state.character, 'nephros');
  });
  test(entry + ' does not show a stale-owner error when catalog loading rejects', async () => {
    const h = boss(entry), task = h.run(entry + '()');
    h.changeOwner(); h.gate.reject(Error('Technical failure')); await task;
    assert.equal(h.calls.sandbox, 0); assert.equal(h.calls.toast.filter(row => row.type === 'error').length, 0);
  });
}
test('Boss preview cannot enter its sandbox until the full catalog is ready', async () => {
  const h = boss('startBossPreview'), task = h.run('startBossPreview()');
  assert.equal(h.calls.sandbox, 0); h.ready();
  await assert.rejects(task, /post-readiness preview boundary/); assert.equal(h.calls.sandbox, 1);
});
test('saved Study resume retains its synchronous boolean contract', () => {
  const h = base(); h.load('study-mode', ['_studyCaptureBinding', '_studyBindingCurrent', 'resumeSavedStudyMode']);
  h.context._loadStudyState = () => null;
  assert.equal(h.run('resumeSavedStudyMode()'), false);
});
