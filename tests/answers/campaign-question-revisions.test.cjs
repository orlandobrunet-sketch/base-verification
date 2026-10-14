'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
const answers = require('../../js/answer-presentation.js');
const revisions = require('../../js/question-revisions.js');
const builder = require('../../tools/build-question-revision-manifest.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
const sourceHash = crypto.createHash('sha256').update(game).digest('hex');
function section(start, end) {
  const begin = game.indexOf(start), finish = game.indexOf(end, begin + start.length);
  assert(begin >= 0 && finish > begin, 'Production section unavailable: ' + start);
  return game.slice(begin, finish);
}
function fn(name) {
  const pattern = new RegExp('^    (?:async )?function ' + name + '\\(', 'm'), matched = pattern.exec(game);
  assert(matched, 'Production function unavailable: ' + name);
  const next = /^    (?:async )?function /m.exec(game.slice(matched.index + matched[0].length));
  assert(next, 'Next production boundary unavailable: ' + name);
  return game.slice(matched.index, matched.index + matched[0].length + next.index);
}
const source = (raw, index = 0) => builder.sources(raw, index).main;
function technicalFixture({cardOnly = false} = {}) {
  const before = {qid: 'technical-campaign-question', t: 'Technical before', q: 'Choose the original token.',
    opts: ['original token', 'plain token', 'square token', 'round token'], ans: 0, exp: 'Technical original explanation.',
    cat: 'technical-before', diff: 'medium', refs: ['technical-card']};
  const after = cardOnly ? clone(before) : {...clone(before), q: 'Choose the current token.',
    opts: ['plain token', 'square token', 'round token', 'current token'], ans: 3, exp: 'Technical current explanation.', cat: 'technical-current', diff: 'hard'};
  const oldRefs = {'technical-card': {label: 'Technical old card', badge: 'fixture'}}, refs = {'technical-card': {label: 'Technical current card', badge: 'fixture'}};
  const authorRevision = builder.digest(after), referenceRevisions = {'technical-card': builder.digest(refs['technical-card'])};
  const manifest = {version: 1, release: '16.10', current: {[after.qid]: {authorRevision, referenceRevisions,
    recordRevision: builder.digest({authorRevision, referenceRevisions}), sourceRevisions: {main: builder.digest(source(after))}}}};
  const history = [{qid: before.qid, release: '16.09', author: before, sources: {main: source(before)}, references: oldRefs,
    policy: {material: true, pending: 'update-required'}}];
  const catalog = revisions.createCatalog({manifest, history, authors: [after], sources: {main: [source(after)]}, references: refs});
  return {before, after, oldRefs, refs, manifest, history, catalog};
}
function harness(f) {
  const values = new Map(), writes = [], timers = new Map(), notices = [], nodes = new Map();
  let mode = 'normal', timerId = 0, uuid = 0, owner = 'technical-owner', failNextRead = false;
  function element(id = '') {
    const classes = new Set(), item = {id, dataset: {}, style: {}, className: '', textContent: '', children: [], disabled: false,
      classList: {add: key => classes.add(key), remove: key => classes.delete(key), contains: key => classes.has(key)},
      setAttribute() {}, removeAttribute() {}, remove() { nodes.delete(this.id); },
      appendChild(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); },
      insertAdjacentElement(position, child) { if (child.id) nodes.set(child.id, child); },
      querySelector() { return this.children.find(child => child.type === 'button') || {disabled: false}; },
      querySelectorAll(selector) { return selector === '.option' ? this.children.filter(child => child.className === 'option') : []; }};
    let html = ''; Object.defineProperty(item, 'innerHTML', {get: () => html, set(value) { html = String(value); item.children = []; }});
    if (id) nodes.set(id, item);
    return item;
  }
  const ui = Object.fromEntries(['question', 'options', 'feedback', 'refs', 'nextBtn', 'bonusBtn', 'journal', 'dockNextBtn', 'oraculoBtn'].map(key => [key, element(key)]));
  const saveKey = /const SAVE_KEY\s*=\s*['"]([^'"]+)/.exec(game)[1], canonicalKey = /const CANONICAL_SAVE_KEY\s*=\s*['"]([^'"]+)/.exec(game)[1];
  const storage = {getItem(key) { if (key === canonicalKey && failNextRead) { failNextRead = false; throw Error('Technical readback refusal'); } return values.get(key) ?? null; },
    setItem(key, value) { if (mode === 'refuse' && key === canonicalKey) return; if (mode === 'throw' && key === canonicalKey) throw Error('Technical quota refusal');
      writes.push([key, String(value)]); values.set(key, String(value));
      if (key === canonicalKey && mode === 'readback-throw') failNextRead = true;
      if (key === canonicalKey && mode === 'race') values.set(key, 'technical foreign writer bytes');
    }, removeItem(key) { writes.push([key, null]); values.delete(key); }};
  const context = vm.createContext({console, Date, Math, JSON, Set, Map, Promise, localStorage: storage,
    authUser: {id: owner}, SAVE_KEY: saveKey, CANONICAL_SAVE_KEY: canonicalKey, SAVE_SCHEMA_VERSION: 9,
    STATS_KEY: 'nefroquest-stats', MASTERED_KEY: 'nefroquest-mastered-ids', DETAILED_STATS_SCHEMA_VERSION: 2,
    _stateData: {}, _saveBaseline: undefined, _saveOwner: undefined, _legacySaveBaseline: undefined,
    _guestRecoveryAccepted: null, _saveCleanupBlocked: false, _progressEpoch: 0, _autoSaveTimer: null,
    _progressSandboxMode: null, _jornadaJaContabilizada: false, _recentIds: [], _sessionWrongAnswers: [],
    _pilotRestoredQuestion: false, _loadingNextQuestion: false, _nextQuestionOrigin: null,
    _masteredSet: new Set(['technical-mastered']), unlockedArticles: ['technical-unlock'], _minigameTriggerCount: 3,
    _boardPushedThisSession: true, chestCost: 120, _goldMilestoneShown: true, _cloudSyncTimer: null,
    _questionStartTime: 0, questionBank: [source(f.after)], HISTORY_SIZE: 30,
    NQ_REQUIRES_QUESTION_REVISIONS: true, NQQuestionRevisionManifest: clone(f.manifest), NQQuestionRevisionHistory: clone(f.history),
    refsDB: clone(f.refs), ui, characters: {nephros: {name: 'Technical fixture'}, aquaria: {}, glomerulus: {}},
    crypto: {randomUUID: () => 'technical-uuid-' + (++uuid)},
    document: {body: element('body'), getElementById: id => nodes.get(id) || null,
      createElement: () => element(), querySelector() { return null; }, querySelectorAll() { return []; }},
    setTimeout(callback, delay) { timers.set(++timerId, {callback, delay}); return timerId; }, clearTimeout: id => timers.delete(id), queueMicrotask() {},
    _invalidateStatsCache() {}, _scheduleCloudSync() { context.cloudCalls++; }, cloudCalls: 0,
    _track() {}, _toast(message) { notices.push(message); }, _warnStorageFull() {},
    nqProgressStorage: () => storage, renderHUD() {}, updateBossUI() {}, applyBossOptionBadges() {}, refreshWelcomeSave() {},
    _stopLocalJourney() { context.stopCalls++; }, stopCalls: 0, _reloadJourneyCollections() {}, resetGuardianFeedback() {},
    xpForLevel: level => level * 200, shuffleQueue() { throw Error('Fixture unexpectedly lost its queue'); },
    isCharacterPilot() { return false; }, usesLumenDebrief() { return false; }, flushPendingRating() {}, isAdminUser() { return false; },
    setLumenEvidenceAvailable() {}, _updateSkipButton() {}, _applyEpicLifelines() {},
    renderRefs(keys, cards) { context.renderedRefs = clone(cards); },
    renderLumenAnswerFeedback(correct, summary) { ui.feedback.textContent = summary; }, _pilotAnswerFeedback: () => 'technical replay only',
    getGameStats: () => JSON.parse(values.get('nefroquest-stats') || '{}'),
    _beginPilotAnswer() { context.beginCalls++; throw Error('A blocked/replayed answer reached the reward transaction'); }, beginCalls: 0,
    fetch() { throw Error('Unexpected network access'); }});
  context.window = context;
  function evaluate(code, name) { vm.runInContext(code, context, {filename: name}); }
  for (const relative of ['js/answer-presentation.js', 'js/question-revisions.js', 'js/character-benefits.js']) evaluate(fs.readFileSync(path.join(ROOT, relative), 'utf8'), relative);
  context.questionRevisionCatalog = context.NQQuestionRevisions.createCatalog({manifest: context.NQQuestionRevisionManifest,
    history: context.NQQuestionRevisionHistory, authors: [f.after], sources: {main: [source(f.after)]}, references: f.refs});
  evaluate(section('    let _saveTimer = null;', '    function _savePilotGame()'), 'game.js real revision/save/start helpers');
  evaluate(section('    const state = new Proxy(_stateData, {', '    function isProgressSandbox()'), 'game.js real state Proxy');
  for (const name of ['isProgressSandbox', '_currentSaveOwner', '_guestSavePair', '_canonicalSaveRecord', '_isSaveTombstone', '_mirrorLegacySave',
    '_captureJourneyBinding', '_matchesJourneyBinding', 'saveGame', '_doSaveGame', '_migrateSave', 'restoreGame', '_renderOptions',
    '_campaignQuestionRevisionRaw', '_renderCampaignQuestionRevisionNotice', 'useCurrentCampaignQuestionRevision', 'renderQuestion', 'answer',
    '_isDetailedStatsRecord', '_maxNumero', '_mergeMapaDeContadores', '_mergeHistoricoDeQuestoes', '_mergeDetailedStats', '_mergeCloudProgress']) evaluate(fn(name), 'game.js ' + name);
  const utils = fs.readFileSync(path.join(ROOT, 'js/utils.js'), 'utf8');
  evaluate(utils.slice(utils.indexOf('    function escapeHtml('), utils.indexOf('    function shuffle(')), 'utils.js real escapeHtml');
  function run(code) { return vm.runInContext(code, context); }
  function prepare({answered = false, binding, legacy = false} = {}) {
    const q = answers.present(source(f.before), {random: () => 0}), choice = q.a;
    const answer = {questionId: q.id, choice, originalChoice: answers.originalIndex(q, choice), optionId: answers.optionId(q, choice), correct: true};
    const ledger = clone(context.NQCharacterBenefits.create({character: 'nephros', difficulty: 'normal', owner, journeyId: 'technical-journey'}));
    ledger.windowAnswers = answered ? 2 : 1; ledger.seenQids = answered ? ['technical-previous', q.id] : ['technical-previous'];
    ledger.creditedEvents = ledger.seenQids.map((qid, index) => 'technical-journey:' + (index + 1) + ':' + qid); ledger.xpGranted = ledger.windowAnswers;
    const saved = {schemaVersion: 9, saveOwner: owner, saveRevision: 'technical-before-revision', timestamp: 100,
      character: 'nephros', difficulty: 'normal', journeyDomain: 'normal', gameStarted: true, gameOver: false, gameCompleted: false, completedGame: false,
      classBenefits: ledger, journeyAnswerOrdinal: answered ? 2 : 1, currentQuestionId: q.id, answered,
      characterLastAnswer: answered ? {domain: 'normal', journeyId: ledger.journeyId, ...answer, windowAnswers: 2, xp: 1, gold: 0, shield: false, baseXP: 10, baseGold: 5} : null,
      level: 4, xp: 74, xpToNext: 800, score: 777, lives: 3, maxLives: 4, streak: 2, gold: 311, bonusUses: 1, correctTotal: 7,
      queueIds: [q.id], idx: 0, recentIds: ['technical-previous'], equipment: {weapon: {n: 'Technical item', atk: 1}},
      obtainedItems: [{n: 'Technical inventory'}], allItemsCollectedNotified: true, forjaPending: {cost: 120, options: [{n: 'Technical paid choice'}]},
      chestCorrectCount: 3, chestTarget: 5, chestsOpened: 2, legendaryAbilityUsed: {}, extraLifeGiven: false, narrativeShown: 0,
      questionPresentation: q, questionAnswer: answered ? answer : null, wrongAnswerSnapshots: [], ...(binding ? {questionRevisionBinding: binding} : {})};
    if (legacy) { delete saved.questionPresentation; delete saved.questionAnswer; delete saved.wrongAnswerSnapshots; }
    const raw = JSON.stringify(saved); values.set(canonicalKey, raw); values.set(saveKey, 'legacy bytes stay intact');
    for (const [key, value] of Object.entries({'nefroquest-stats': {gamesPlayed: 3}, 'nefroquest-achievements': ['local-achievement'],
      'nefroquest-detailed-stats': {totalCorrect: 1}, 'nefroquest-mastered-ids': ['technical-mastered'], 'unlockedArticles': ['technical-unlock'],
      'nq-unlocked-refs': ['local-ref'], 'nefroquest-sr-data': {local: {reps: 2}}, 'nq-acidbase-progress': {completed: ['local-act']}})) values.set(key, JSON.stringify(value));
    context._saveBaseline = raw; context._saveOwner = owner; context._legacySaveBaseline = values.get(saveKey);
    return {q, saved, raw, answer};
  }
  return {context, values, writes, timers, notices, nodes, ui, canonicalKey, saveKey, prepare, run,
    snapshot: () => JSON.stringify([...values]), failWrites: value => { mode = value; },
    restore(saved) { context.selected = clone(saved); return run('restoreGame(selected)'); }, render() { return run('renderQuestion()'); },
    state: () => clone(run('_stateData')), revision: () => clone(run('_currentQuestionRevision'))};
}
function resourceFields(state) { return Object.fromEntries(['xp', 'score', 'lives', 'gold', 'bonusUses', 'correctTotal', 'classBenefits',
  'journeyAnswerOrdinal', 'equipment', 'obtainedItems', 'forjaPending', 'chestCorrectCount', 'chestTarget', 'chestsOpened'].map(key => [key, state[key]])); }
function cloudPayload(save) {
  return {save, stats: {gamesPlayed: 999, questionsAnsweredAllTime: 999}, achievements: ['remote-achievement'], mastered: ['remote-mastered'],
    unlockedArticles: ['remote-article'], unlockedRefs: ['remote-ref'], arquiDefeated: true, hardcoreCompleted: true,
    detailedStats: {totalCorrect: 999}, acidBaseProgress: {completed: ['remote-act']}, srData: {remote: {reps: 999}}};
}

test('campaign real restore/render replays historical answers without writes, remapping or resource credit', t => {
  t.diagnostic('game.js sha256:' + sourceHash);
  const f = technicalFixture(), h = harness(f), saved = h.prepare({answered: true}), before = h.snapshot();
  assert.equal(h.restore(saved.saved), true); h.render();
  assert.equal(h.snapshot(), before); assert.equal(h.writes.length, 0);
  assert.deepEqual(h.state().current, saved.q); assert.deepEqual(h.state().questionAnswer, saved.answer);
  assert.deepEqual(resourceFields(h.state()), resourceFields(saved.saved));
  const options = h.ui.options.querySelectorAll('.option');
  assert.equal(options.length, 4); assert(options.every(option => option.disabled));
  assert.equal(options[saved.q.a].classList.contains('correct'), true);
  assert.deepEqual(clone(h.context.renderedRefs), f.oldRefs);
  assert.match(h.nodes.get('campaignQuestionRevisionNotice').innerHTML, /Avaliação registrada/);
  h.run('answer(state.current.a, null);'); assert.equal(h.context.beginCalls, 0); assert.equal(h.writes.length, 0);
  const saveCallback = h.run('saveGame'); assert.equal([...h.timers.values()].filter(timer => timer.callback === saveCallback).length, 0);
});
test('pending campaign history blocks new answer until explicit current replacement, preserving ledger, forge and raw', () => {
  const f = technicalFixture(), h = harness(f), saved = h.prepare();
  assert.equal(h.restore(saved.saved), true); h.render();
  assert(h.ui.options.querySelectorAll('.option').every(option => option.disabled));
  h.run('answer(state.current.a, null);'); assert.equal(h.context.beginCalls, 0); assert.equal(h.writes.length, 0);
  assert.equal(h.context.useCurrentCampaignQuestionRevision(), true);
  const current = h.state(); assert.equal(current.current.id, saved.q.id); assert.equal(current.answered, false);
  assert.deepEqual(current.current._answerPresentation.sourceQuestion, source(f.after));
  assert.deepEqual(resourceFields(current), resourceFields(saved.saved));
  const committed = JSON.parse(h.values.get(h.canonicalKey));
  assert.equal(committed.questionRevisionOriginRaw, saved.raw);
  assert.deepEqual(committed.classBenefits, saved.saved.classBenefits); assert.deepEqual(committed.forjaPending, saved.saved.forjaPending);
  assert.equal(committed.journeyAnswerOrdinal, saved.saved.journeyAnswerOrdinal);
  assert.equal(committed.questionRevisionBinding.recordRevision, f.manifest.current[f.before.qid].recordRevision);
});
test('campaign current confirmation rejects refused/throwing storage and divergent CAS without replacing the old runtime', () => {
  const f = technicalFixture();
  for (const reason of ['refuse', 'throw', 'divergent']) {
    const h = harness(f), saved = h.prepare(); assert.equal(h.restore(saved.saved), true);
    const stateBefore = h.state(), revisionBefore = h.revision();
    if (reason === 'divergent') h.values.set(h.canonicalKey, saved.raw + ' '); else h.failWrites(reason);
    const rawBefore = h.snapshot(); assert.equal(h.context.useCurrentCampaignQuestionRevision(), false, reason);
    assert.equal(h.snapshot(), rawBefore, reason); assert.deepEqual(h.state(), stateBefore, reason); assert.deepEqual(h.revision(), revisionBefore, reason);
    assert.equal(h.run('_currentQuestionRevisionOriginRaw'), null); assert.equal(h.writes.length, 0);
  }
});
test('campaign readback failure compensates only its own candidate and preserves a newer writer', () => {
  const f = technicalFixture();
  for (const reason of ['readback-throw', 'race']) {
    const h = harness(f), saved = h.prepare(); assert.equal(h.restore(saved.saved), true);
    const stateBefore = h.state(), revisionBefore = h.revision(); h.failWrites(reason);
    assert.equal(h.context.useCurrentCampaignQuestionRevision(), false, reason);
    assert.deepEqual(h.state(), stateBefore); assert.deepEqual(h.revision(), revisionBefore);
    assert.equal(h.run('_currentQuestionRevisionOriginRaw'), null);
    assert.equal(h.values.get(h.canonicalKey), reason === 'race' ? 'technical foreign writer bytes' : saved.raw);
    assert.equal(h.values.get(h.saveKey), 'legacy bytes stay intact');
    assert.equal(h.writes.length, reason === 'race' ? 1 : 2);
    assert(h.writes.every(([key]) => key === h.canonicalKey));
  }
});
test('campaign unknown source and required assets absent fail closed without restoration or answer transactions', () => {
  const f = technicalFixture();
  for (const missing of ['source', 'all', 'NQQuestionRevisions', 'NQQuestionRevisionManifest', 'NQQuestionRevisionHistory']) {
    const h = harness(f), saved = h.prepare();
    if (missing === 'source') saved.saved.questionPresentation = answers.present({...source(f.before), q: 'Unpublished technical source.'});
    else {
      h.run('delete window.questionRevisionCatalog;');
      if (missing === 'all') h.run('delete window.NQQuestionRevisions; delete window.NQQuestionRevisionManifest; delete window.NQQuestionRevisionHistory;');
      else h.run('delete window[' + JSON.stringify(missing) + '];');
    }
    const before = h.snapshot(); assert.equal(h.restore(saved.saved), false, missing); assert.equal(h.snapshot(), before);
    h.context.blockedSnapshot = saved.saved.questionPresentation;
    h.run('_stateData.current=blockedSnapshot; _stateData.gameStarted=true; _stateData.answered=false; answer(blockedSnapshot.a,null);');
    assert.equal(h.writes.length, 0); assert.equal(h.context.beginCalls, 0);
  }
});
test('campaign legacy ambiguity from a reference-only revision preserves raw and never invents a binding', () => {
  const f = technicalFixture({cardOnly: true}), h = harness(f), saved = h.prepare({legacy: true}), before = h.snapshot();
  assert.equal(h.restore(saved.saved), false); assert.equal(h.snapshot(), before); assert.equal(h.writes.length, 0);
  assert.equal(h.run('_currentQuestionRevision'), null);
});
test('cloud unknown, ambiguous, bound-invalid or unknown review sources are rejected before importing any payload field', () => {
  for (const kind of ['unknown', 'ambiguous', 'binding', 'review']) {
    const f = technicalFixture({cardOnly: kind === 'ambiguous'}), h = harness(f), saved = h.prepare();
    if (kind === 'unknown') saved.saved.questionPresentation = answers.present({...source(f.before), q: 'Unknown remote technical source.'});
    if (kind === 'binding') saved.saved.questionRevisionBinding = {...f.catalog.resolve(saved.saved.questionPresentation, {profile: 'main'}).binding, recordRevision: builder.digest('unpublished binding')};
    if (kind === 'review') {
      const unknown = answers.present({...source(f.before), id: 'unknown-technical-review', q: 'Unknown review fixture.'}), choice = (unknown.a + 1) % unknown.o.length;
      saved.saved.wrongAnswerSnapshots = [{questionPresentation: unknown, choice, originalChoice: answers.originalIndex(unknown, choice),
        optionId: answers.optionId(unknown, choice), eventId: 'technical-review-event'}];
    }
    const before = h.snapshot(); h.context.cloudFixture = cloudPayload(saved.saved); h.run('_mergeCloudProgress(cloudFixture);');
    assert.equal(h.snapshot(), before, kind); assert.equal(h.writes.length, 0, kind);
  }
});
test('cloud legacy with catalog assets unavailable is held before any counters or resources are imported', () => {
  const f = technicalFixture(), h = harness(f), saved = h.prepare({legacy: true}), before = h.snapshot();
  h.run('delete window.questionRevisionCatalog; delete window.NQQuestionRevisions; delete window.NQQuestionRevisionManifest; delete window.NQQuestionRevisionHistory;');
  h.context.cloudFixture = cloudPayload(saved.saved); h.run('_mergeCloudProgress(cloudFixture);');
  assert.equal(h.snapshot(), before); assert.equal(h.writes.length, 0);
});
test('new normal journey refusal rolls back revision globals, old source, resources and paid choices', () => {
  const f = technicalFixture();
  for (const reason of ['initialize-false', 'refuse', 'throw', 'divergent']) {
    const h = harness(f), saved = h.prepare(); assert.equal(h.restore(saved.saved), true);
    h.run("_currentQuestionRevisionOriginRaw='technical-original-raw';");
    if (reason === 'divergent') h.values.set(h.canonicalKey, saved.raw + ' '); else if (reason !== 'initialize-false') h.failWrites(reason);
    const before = h.snapshot(), stateBefore = h.state(), revisionBefore = h.revision();
    h.context.initializeFixture = () => { h.run("_currentQuestionRevision=questionRevisionCatalog.current('technical-campaign-question','main'); _currentQuestionRevisionOriginRaw='provisional raw'; _stateData.current=NQAnswers.present(_currentQuestionRevision.source); _stateData.gold=999;"); return reason !== 'initialize-false'; };
    assert.equal(h.context._startNormalCharacterJourney({character: 'aquaria', difficulty: 'normal', initialize: h.context.initializeFixture}), false, reason);
    assert.equal(h.snapshot(), before, reason); assert.deepEqual(h.state(), stateBefore, reason); assert.deepEqual(h.revision(), revisionBefore, reason);
    assert.equal(h.run('_currentQuestionRevisionOriginRaw'), 'technical-original-raw'); assert.equal(h.writes.length, 0);
  }
});


// Missing assets must not look like a legacy bundle just because a new global is falsy.
for (const isolated of ['flag false', 'flag null', 'catalog only']) test(`campaign present revision global ${isolated} rejects unknown snapshots without runtime or raw mutation`, () => {
  const f = technicalFixture(), h = harness(f), saved = h.prepare();
  h.run('delete window.NQ_REQUIRES_QUESTION_REVISIONS; delete window.NQQuestionRevisions; delete window.NQQuestionRevisionManifest; delete window.NQQuestionRevisionHistory; delete window.questionRevisionCatalog;');
  if (isolated === 'catalog only') h.context.questionRevisionCatalog = f.catalog;
  else h.context.NQ_REQUIRES_QUESTION_REVISIONS = isolated === 'flag false' ? false : null;
  saved.saved.questionPresentation = answers.present({...source(f.before), q: 'Unpublished technical token source.'}, {random: () => 0});
  const rawBefore = h.snapshot(), runtimeBefore = h.state();
  assert.equal(h.restore(saved.saved), false, isolated);
  assert.equal(h.snapshot(), rawBefore); assert.deepEqual(h.state(), runtimeBefore);
  assert.equal(h.writes.length, 0); assert.equal(h.context.beginCalls, 0);
});
test('campaign legacy snapshot behavior is retained only when all five revision globals are absent', () => {
  const f = technicalFixture(), h = harness(f), saved = h.prepare();
  h.run('delete window.NQ_REQUIRES_QUESTION_REVISIONS; delete window.NQQuestionRevisions; delete window.NQQuestionRevisionManifest; delete window.NQQuestionRevisionHistory; delete window.questionRevisionCatalog;');
  const before = h.snapshot();
  assert.equal(h.restore(saved.saved), true); assert.equal(h.snapshot(), before); assert.equal(h.writes.length, 0);
  assert.equal(h.revision().legacyRuntime, true);
});
