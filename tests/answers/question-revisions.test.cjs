'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const answers = require('../../js/answer-presentation.js');
const revisions = require('../../js/question-revisions.js');
const ROOT = path.resolve(__dirname, '../..');
const clone = value => JSON.parse(JSON.stringify(value));
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
const digest = value => 'sha256:' + crypto.createHash('sha256').update(canonical(value), 'utf8').digest('hex');
const author = (extra = {}) => ({qid: 'technical-revision-fixture', t: 'Historical tokens', cat: 'tokens-old', diff: 'medium',
  q: 'Choose the original marked token.', opts: ['marked token', 'round token', 'square token', 'plain token'],
  ans: 0, exp: 'Historical token explanation.', refs: ['technical-card'], ...extra});
function sources(raw, index = 0) {
  const main = {id: raw.qid, d: raw.diff === 'hard' ? Math.min(12, 8 + Math.floor(index / 30)) : Math.min(12, 4 + Math.floor(index / 25)),
    _d: raw.diff, q: raw.q, o: [...raw.opts], a: raw.ans, e: raw.exp, r: [...raw.refs], c: raw.cat};
  return {main, exam: clone(main), study: {id: raw.qid, q: raw.q, o: [...raw.opts], a: raw.ans, e: raw.exp, refs: [...raw.refs]},
    offline: {id: raw.qid, q: raw.q, o: [...raw.opts], a: raw.ans, e: raw.exp}};
}
function manifestFor(raw, refs) {
  const authorRevision = digest(raw), referenceRevisions = Object.fromEntries(raw.refs.map(id => [id, refs[id] ? digest(refs[id]) : null]));
  return {version: 1, release: '16.10', current: {[raw.qid]: {authorRevision, referenceRevisions,
    recordRevision: digest({authorRevision, referenceRevisions}),
    sourceRevisions: Object.fromEntries(Object.entries(sources(raw)).map(([profile, source]) => [profile, digest(source)]))}}};
}
function fixture({cardOnly = false, history = true} = {}) {
  const before = author(), after = cardOnly ? clone(before) : author({t: 'Current tokens', cat: 'tokens-current', diff: 'hard',
    q: 'Choose the updated marked token.', opts: ['plain token', 'round token', 'square token', 'updated token'], ans: 3, exp: 'Current token explanation.'});
  const oldRefs = {'technical-card': {label: 'Historical token card', summary: 'Historical card body.'}};
  const refs = {'technical-card': {label: 'Current token card', summary: 'Current card body.'}};
  const archive = {qid: before.qid, release: '16.09', author: before, sources: sources(before), references: oldRefs,
    policy: {material: true, pending: 'update-required'}};
  const manifest = manifestFor(after, refs), archived = history ? [archive] : [];
  const catalog = revisions.createCatalog({manifest, history: archived, authors: [after],
    sources: Object.fromEntries(Object.entries(sources(after)).map(([profile, value]) => [profile, [value]])), references: refs});
  return {before, after, oldRefs, refs, archive, manifest, history: archived, catalog};
}
function answerFor(question, chosen = question.a) {
  return {chosen, correct: chosen === question.a, authoredChoice: answers.originalIndex(question, chosen), optionId: answers.optionId(question, chosen)};
}
function load(context, relative) { vm.runInContext(fs.readFileSync(path.join(ROOT, relative), 'utf8'), context, {filename: relative}); }
function harness(mode, f) {
  const data = new Map([['nefroquest-save-v9', 'untouched campaign'], ['resources', 'untouched resources']]), writes = [];
  const nodes = new Map(), buttons = Array.from({length: 4}, () => ({style: {}, classList: {add() {}, toggle() {}},
    addEventListener() {}, getBoundingClientRect() { return {left: 0, top: 0, width: 10, height: 10}; }}));
  function node(id = '') {
    const value = {id, innerHTML: '', textContent: '', style: {}, children: [], classList: {add() {}, remove() {}, toggle() {}},
      setAttribute() {}, remove() { nodes.delete(this.id); }, appendChild(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); },
      querySelector() { return null; }, querySelectorAll(selector) { return selector.includes('btn') ? buttons : []; }, focus() {}, scrollIntoView() {}};
    if (id) nodes.set(id, value);
    return value;
  }
  for (const id of ['studyQuestionArea', 'studyFeedback', 'studyProgress', 'studyCorrect', 'studyWrong', 'nqOffCard', 'nqOffCorrectCount', 'nqOffFeedbackArea']) node(id);
  let owner = {generation: 1}, rejectWrites = false, fault = null, readbackThrows = false, armedReads = 0;
  const saveKey = mode === 'study' ? 'nefroquest-study-state' : 'nefroquest-offline-study-state';
  const context = vm.createContext({console, Date, JSON, Math, Map, Set, Promise, AbortController,
    topics: clone([f.after]), refsDB: clone(f.refs), NQQuestionRevisionManifest: clone(f.manifest), NQQuestionRevisionHistory: clone(f.history),
    localStorage: {getItem(key) {
      if (key === saveKey && readbackThrows) { readbackThrows = false; throw Error('Technical readback failure'); }
      const value = data.get(key) ?? null;
      if (key === saveKey && fault?.kind === 'before-write' && ++armedReads === 1) { data.set(key, fault.raw); return value; }
      return value;
    }, setItem(key, value) {
      if (rejectWrites) return;
      writes.push([key, String(value)]); data.set(key, String(value));
      if (key === saveKey && fault?.kind === 'readback') { fault = null; readbackThrows = true; }
      else if (key === saveKey && fault?.kind === 'writer') { data.set(key, fault.raw); fault = null; }
    },
      removeItem(key) { writes.push([key, null]); data.delete(key); }},
    document: {activeElement: null, readyState: 'loading', body: node(), getElementById: id => nodes.get(id) || null,
      createElement: () => node(), querySelector() { return null; }, querySelectorAll: selector => selector === '.study-option-btn' || selector === '.nq-off-btn' ? buttons : [], addEventListener() {}},
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {},
    _toast() {}, playSound() {}, isPremium() { return false; }, updateSRData() { context.srCalls++; },
    trackQuestionAnswer() { context.answerCalls++; }, srCalls: 0, answerCalls: 0, mentorCalls: 0,
    state: {gameStarted: true}, NQPilot: {captureBinding: () => owner, matchesBinding: value => value === owner, onContextChange() {}}});
  context.window = context;
  load(context, 'js/answer-presentation.js'); load(context, 'js/question-revisions.js');
  if (mode === 'study') {
    const utils = fs.readFileSync(path.join(ROOT, 'js/utils.js'), 'utf8');
    vm.runInContext(utils.slice(utils.indexOf('    function escapeHtml('), utils.indexOf('    function shuffle(')), context, {filename: 'utils.js escapeHtml'});
    load(context, 'js/study-mode.js');
    // Only the DOM mounting and mentor UI are shells; mapping/catalog/persistence/render/answer functions remain real.
    vm.runInContext("_studyProgressBinding=NQPilot.captureBinding(); _mountStudySurface=page=>document.body.appendChild(page); resetMentorQuestion=()=>{}; _canAskMentor=()=>false; window.setMentorQuestion=()=>{mentorCalls++};", context);
  } else {
    const html = fs.readFileSync(path.join(ROOT, 'offline.html'), 'utf8');
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');
    vm.runInContext(inline, context, {filename: 'offline.html inline'});
    vm.runInContext('showFloatingText=()=>{};', context);
  }
  return {context, data, writes, nodes, buttons, run: source => vm.runInContext(source, context), changeOwner() { owner = {generation: 2}; },
    failWrites() { rejectWrites = true; }, fault(kind, raw) { fault = {kind, raw}; armedReads = 0; }};
}
function studySave(f, question, answer = null, binding) {
  return JSON.stringify({questions: [f.before.qid], index: 0, correct: 7, wrong: 3, axisStats: {'tokens-old': {correct: 7, wrong: 3}},
    presentationVersion: 1, presentations: [{id: f.before.qid, question, answer, ...(binding ? {revisionBinding: binding} : {})}], savedAt: Date.now()});
}
function offlineSave(f, question, answer = null, binding) {
  return JSON.stringify({version: 1, questionIds: [f.before.qid], index: 0, correctCount: 7, question, answer,
    ...(binding ? {revisionBinding: binding} : {})});
}

test('content digest agrees independently with Node crypto, including nested Unicode and long JSON', () => {
  for (const value of [{z: ['é', '🧪', null, {b: 2, a: 1}], a: 'tokens'}, {}, 'x'.repeat(100000), {zero: -0}]) assert.equal(revisions.digest(value), digest(value));
  assert.throws(() => revisions.digest({bad: undefined}), TypeError);
  assert.throws(() => revisions.digest([, 'hole']), TypeError);
  const getter = {}; Object.defineProperty(getter, 'x', {get() { throw Error('must not read'); }, enumerable: true});
  assert.throws(() => revisions.digest(getter), TypeError);
});
test('all profiles preserve exact historical snapshots, option IDs, authored choices and cards', () => {
  const f = fixture(), frozen = clone(f);
  for (const profile of ['main', 'exam', 'study', 'offline']) {
    const question = answers.present(sources(f.before)[profile], {random: () => 0});
    const old = f.catalog.resolve(question, {profile});
    assert(old && old.historical);
    assert.deepEqual(old.question, question);
    assert.deepEqual(old.author, f.before);
    assert.deepEqual(old.references, f.oldRefs);
    assert.equal(old.policy.pending, 'update-required');
    assert.equal(old.policy.answered, 'historical');
    assert.equal(answers.originalIndex(old.question, old.question.a), f.before.ans);
    assert.equal(answers.optionId(old.question, old.question.a), answers.optionId(question, question.a));
    assert.equal(f.catalog.current(f.before.qid, profile).historical, false);
    old.question.o[0] = 'mutated return'; old.author.t = 'mutated return'; old.references['technical-card'].label = 'mutated return';
    assert.deepEqual(f.catalog.resolve(question, {profile}).question, question);
    assert.deepEqual(f.catalog.resolve(question, {profile}).author, frozen.before);
  }
});
test('verifier works before lazy topics and rejects self-consistent unknown sources, cross-profile and bad bindings', () => {
  const f = fixture(), verifier = revisions.createVerifier({manifest: f.manifest, history: f.history});
  const question = answers.present(sources(f.after).main, {random: () => 0});
  assert.deepEqual(verifier.restoreKnown(question, {profile: 'main'}).question, question);
  assert.equal(verifier.restoreKnown(question, {profile: 'study'}), null);
  const forged = answers.present({...sources(f.after).main, q: 'Unpublished but internally coherent.'}, {random: () => 0});
  assert(answers.restore(forged));
  assert.equal(verifier.restoreKnown(forged, {profile: 'main'}), null);
  const binding = verifier.restoreKnown(question, {profile: 'main'}).binding;
  for (const bad of [null, {...binding, profile: 'exam'}, {...binding, qid: 'other'}, {...binding, recordRevision: digest('unknown')}, {...binding, extra: true}]) {
    assert.equal(verifier.restoreKnown(question, {profile: 'main', binding: bad}), null);
  }
  assert.equal(verifier.restoreKnown({...question, a: (question.a + 1) % 4}, {profile: 'main'}), null);
});
test('ref-only changes are ambiguous without external binding even when sourceRevision is unchanged', () => {
  const f = fixture({cardOnly: true}), question = answers.present(sources(f.before).study, {random: () => 0});
  const inspected = f.catalog.inspect(question, {profile: 'study'});
  assert.equal(inspected.status, 'ambiguous'); assert.equal(inspected.candidates.length, 2);
  assert.equal(f.catalog.resolve(question, {profile: 'study'}), null);
  for (const candidate of inspected.candidates) {
    const value = f.catalog.resolve(question, {profile: 'study', binding: candidate.binding});
    assert.equal(value.historical, candidate.historical);
    assert.equal(value.references['technical-card'].label, candidate.historical ? f.oldRefs['technical-card'].label : f.refs['technical-card'].label);
  }
  assert.equal(f.catalog.inspectLegacy(f.before.qid, {profile: 'study'}).status, 'ambiguous');
  assert.equal(fixture({history: false}).catalog.resolveLegacy(f.before.qid, {profile: 'study'}).historical, false);
});
test('catalog refuses drift in actual runtime source, raw author, reference card and malformed history', () => {
  const f = fixture(), options = {manifest: f.manifest, history: f.history, authors: [f.after], sources: {study: [sources(f.after).study]}, references: f.refs};
  assert.throws(() => revisions.createCatalog({...options, sources: {study: [{...sources(f.after).study, e: 'drift'}]}}), TypeError);
  assert.throws(() => revisions.createCatalog({...options, authors: [{...f.after, cat: 'drift'}]}), TypeError);
  assert.throws(() => revisions.createCatalog({...options, references: {'technical-card': {label: 'drift'}}}), TypeError);
  assert.throws(() => revisions.createCatalog({...options, history: [{...f.archive, policy: {material: false}}]}), TypeError);
  assert.throws(() => revisions.createCatalog({...options, references: undefined}), TypeError);
  assert.equal(revisions.createCatalog({...options, references: undefined, sources: {offline: [sources(f.after).offline]}}).resolve(answers.present(sources(f.before).offline), {profile: 'offline'}).historical, true);
});
test('pure browser resolver has no storage, DOM, network or resource access', () => {
  const f = fixture(), context = vm.createContext({NQAnswers: answers});
  context.window = context;
  for (const key of ['localStorage', 'document', 'fetch', 'navigator', 'state']) Object.defineProperty(context, key, {get() { throw Error('Unexpected ' + key); }});
  load(context, 'js/question-revisions.js');
  assert.equal(Object.isFrozen(context.NQQuestionRevisions), true);
  assert(context.NQQuestionRevisions.createVerifier({manifest: f.manifest, history: f.history}).restoreKnown(answers.present(sources(f.after).main), {profile: 'main'}));
});
test('published 741 authors and all 2964 actual profiles agree with the runtime catalog', () => {
  const builder = require('../../tools/build-question-revision-manifest.cjs');
  const topics = builder.load('data/topics.js', 'topics'), refs = builder.load('data/refs.js', 'refsDB');
  const manifest = require('../../data/question-revision-manifest.js'), history = require('../../data/question-revision-history.js');
  const sourceLists = {main: [], exam: [], study: [], offline: []};
  topics.forEach((raw, index) => Object.entries(builder.sources(raw, index)).forEach(([profile, value]) => sourceLists[profile].push(value)));
  const catalog = revisions.createCatalog({manifest, history, authors: topics, sources: sourceLists, references: refs});
  for (const [profile, list] of Object.entries(sourceLists)) for (const source of list) {
    const snapshot = answers.present(source, {preserveOrder: true}), resolved = catalog.resolve(snapshot, {profile});
    assert(resolved && !resolved.historical, source.id + ':' + profile);
    assert.deepEqual(resolved.question, snapshot);
    assert.equal(resolved.binding.recordRevision, manifest.current[source.id].recordRevision);
  }
  assert.equal(topics.length, 741);
});
test('Study restores historical authored display and answer without writes, mentor calls or credit', () => {
  const f = fixture(), h = harness('study', f), q = answers.present(sources(f.before).study, {random: () => 0}), answer = answerFor(q);
  const raw = studySave(f, q, answer); h.data.set('nefroquest-study-state', raw);
  assert.equal(h.context.resumeSavedStudyMode(), true);
  assert.equal(h.data.get('nefroquest-study-state'), raw); assert.equal(h.writes.length, 0);
  assert.deepEqual(clone(h.run('_studyPresentations[0]')), q);
  assert.deepEqual(clone(h.run('studyModeQuestions[0]')), f.before);
  assert.equal(h.run('studyModeCorrect'), 7); assert.equal(h.run('studyModeWrong'), 3);
  assert.match(h.nodes.get('studyQuestionArea').innerHTML, /Choose the original marked token/);
  assert.match(h.nodes.get('studyQuestionArea').innerHTML, /Versão histórica/);
  assert.match(h.nodes.get('studyFeedback').innerHTML, /Historical token explanation/);
  assert.match(h.nodes.get('studyFeedback').innerHTML, /Historical token card/);
  assert.doesNotMatch(h.nodes.get('studyFeedback').innerHTML, /Current token card/);
  h.context.answerStudyQuestion(q.a); h.context.viewCurrentStudyRevision();
  assert.equal(h.context.answerCalls, 0); assert.equal(h.context.srCalls, 0); assert.equal(h.context.mentorCalls, 0);
  assert.equal(h.writes.length, 0);
  assert.match(h.nodes.get('studyCurrentRevision').innerHTML, /Current token explanation/);
});
test('Study pending material update requires explicit choice, preserves raw and counts and obeys owner binding', () => {
  const f = fixture(), h = harness('study', f), q = answers.present(sources(f.before).study, {random: () => 0}), raw = studySave(f, q);
  h.data.set('nefroquest-study-state', raw); assert.equal(h.context.resumeSavedStudyMode(), true);
  assert.match(h.nodes.get('studyQuestionArea').innerHTML, /useCurrentStudyRevision/);
  assert.equal((h.nodes.get('studyQuestionArea').innerHTML.match(/data-kbd-hint="\d" disabled/g) || []).length, 4);
  h.context.answerStudyQuestion(q.a); assert.equal(h.writes.length, 0); assert.equal(h.context.answerCalls, 0);
  assert.equal(h.context.useCurrentStudyRevision(), true);
  const saved = JSON.parse(h.data.get('nefroquest-study-state'));
  assert.equal(saved.revisionOriginRaw, raw); assert.equal(saved.questions[0], f.before.qid);
  assert.equal(saved.correct, 7); assert.equal(saved.wrong, 3); assert.equal(saved.presentations[0].answer, null);
  assert.equal(saved.presentations[0].question._answerPresentation.sourceQuestion.q, f.after.q);
  assert.equal(h.context.srCalls, 0); assert.equal(h.context.answerCalls, 0);
  h.changeOwner(); const writes = h.writes.length;
  assert.equal(h.context.useCurrentStudyRevision(), false); h.context.answerStudyQuestion(h.run('_studyPresentations[0].a'));
  assert.equal(h.writes.length, writes); assert.equal(h.context.answerCalls, 0);
});
test('Study unknown and ref-only ambiguous saves stay byte-preserved and consultation cannot record answers', () => {
  const f = fixture({cardOnly: true}), h = harness('study', f), q = answers.present(sources(f.before).study, {random: () => 0});
  const raw = studySave(f, q, answerFor(q)); h.data.set('nefroquest-study-state', raw);
  assert.equal(h.context.resumeSavedStudyMode(), false); assert.equal(h.writes.length, 0);
  assert.match(h.nodes.get('studyRevisionHold').innerHTML, /Consultar versão histórica/);
  assert.match(h.nodes.get('studyRevisionHold').innerHTML, /Consultar versão atual/);
  const selected = f.catalog.inspect(q, {profile: 'study'}).candidates.find(value => value.historical);
  assert.equal(h.context.consultSavedStudyRevision('0|' + selected.binding.recordRevision), true);
  h.context.answerStudyQuestion(q.a); h.run('_saveStudyState();'); h.context.exitStudyMode();
  assert.equal(h.data.get('nefroquest-study-state'), raw); assert.equal(h.writes.length, 0); assert.equal(h.context.answerCalls, 0);
  const changed = fixture(), unknown = harness('study', changed), forged = answers.present({...sources(changed.before).study, q: 'Unknown technical fixture.'});
  unknown.data.set('nefroquest-study-state', studySave(changed, forged));
  assert.equal(unknown.context.resumeSavedStudyMode(), false); assert.equal(unknown.writes.length, 0);
});
test('offline historical replay is exact and cannot recredit; pending replacement preserves raw', () => {
  const f = fixture(), h = harness('offline', f), q = answers.present(sources(f.before).offline, {random: () => 0}), raw = offlineSave(f, q, answerFor(q));
  h.data.set('nefroquest-offline-study-state', raw); h.context.initOfflineStudy();
  assert.equal(h.writes.length, 0); assert.equal(h.data.get('nefroquest-offline-study-state'), raw);
  assert.deepEqual(clone(h.run('currentPresentation')), q); assert.deepEqual(clone(h.run('sessionQuestions[0]')), f.before);
  assert.match(h.nodes.get('nqOffCard').innerHTML, /Versão histórica/);
  assert.match(h.nodes.get('nqOffFeedbackArea').innerHTML, /Historical token explanation/);
  h.context.answerQuestion(q.a, null); h.context.viewCurrentOfflineRevision();
  assert.equal(h.writes.length, 0);
  const pending = harness('offline', f), pendingRaw = offlineSave(f, q);
  pending.data.set('nefroquest-offline-study-state', pendingRaw); pending.context.initOfflineStudy();
  assert.equal((pending.nodes.get('nqOffCard').innerHTML.match(/data-idx="\d" disabled/g) || []).length, 4);
  pending.context.answerQuestion(q.a, null); assert.equal(pending.writes.length, 0);
  assert.equal(pending.context.useCurrentOfflineRevision(), true);
  const saved = JSON.parse(pending.data.get('nefroquest-offline-study-state'));
  assert.equal(saved.revisionOriginRaw, pendingRaw); assert.equal(saved.correctCount, 7); assert.equal(saved.answer, null);
  assert.equal(saved.question._answerPresentation.sourceQuestion.q, f.after.q);
  assert.equal(pending.data.get('resources'), 'untouched resources'); assert.equal(pending.data.get('nefroquest-save-v9'), 'untouched campaign');
});
test('offline ambiguous consultation and unknown source never write or advance the held session', () => {
  const f = fixture({cardOnly: true}), h = harness('offline', f), q = answers.present(sources(f.before).offline), raw = offlineSave(f, q, answerFor(q));
  h.data.set('nefroquest-offline-study-state', raw); h.context.initOfflineStudy();
  assert.equal(h.writes.length, 0); assert.match(h.nodes.get('nqOffCard').innerHTML, /Consultar versão histórica/);
  const candidate = f.catalog.inspect(q, {profile: 'offline'}).candidates.find(value => value.historical);
  assert.equal(h.context.consultOfflineRevision(candidate.binding.recordRevision), true);
  h.context.nextQuestion(); h.context.answerQuestion(q.a, null); h.context.saveOfflineSession();
  assert.equal(h.run('currentIndex'), 0); assert.equal(h.writes.length, 0); assert.equal(h.data.get('nefroquest-offline-study-state'), raw);
  const changed = fixture(), unknown = harness('offline', changed), forged = answers.present({...sources(changed.before).offline, q: 'Unpublished technical fixture.'});
  const unknownRaw = offlineSave(changed, forged); unknown.data.set('nefroquest-offline-study-state', unknownRaw); unknown.context.initOfflineStudy();
  assert.equal(unknown.writes.length, 0); assert.equal(unknown.data.get('nefroquest-offline-study-state'), unknownRaw);
});
test('new HTML requirement fails closed when all or any catalog asset is absent, preserving both mode saves', () => {
  const f = fixture();
  for (const mode of ['study', 'offline']) for (const missing of ['all', 'NQQuestionRevisions', 'NQQuestionRevisionManifest', 'NQQuestionRevisionHistory']) {
    const h = harness(mode, f), q = answers.present(sources(f.before)[mode]), key = mode === 'study' ? 'nefroquest-study-state' : 'nefroquest-offline-study-state';
    const raw = mode === 'study' ? studySave(f, q) : offlineSave(f, q);
    h.data.set(key, raw);
    h.run('window.NQ_REQUIRES_QUESTION_REVISIONS=true;');
    if (missing === 'all') h.run('delete window.NQQuestionRevisions; delete window.NQQuestionRevisionManifest; delete window.NQQuestionRevisionHistory;');
    else h.run('delete window[' + JSON.stringify(missing) + '];');
    if (mode === 'study') assert.equal(h.context.resumeSavedStudyMode(), false, mode + ':' + missing);
    else assert.equal(h.context.restoreOfflineSession(), false, mode + ':' + missing);
    assert.equal(h.writes.length, 0); assert.equal(h.data.get(key), raw);
  }
});
test('pending replacement rolls back runtime when persistence refuses or saved bytes changed concurrently', () => {
  const f = fixture();
  for (const mode of ['study', 'offline']) for (const reason of ['refused', 'divergent']) {
    const h = harness(mode, f), q = answers.present(sources(f.before)[mode]), key = mode === 'study' ? 'nefroquest-study-state' : 'nefroquest-offline-study-state';
    const raw = mode === 'study' ? studySave(f, q) : offlineSave(f, q); h.data.set(key, raw);
    if (mode === 'study') assert.equal(h.context.resumeSavedStudyMode(), true); else h.context.initOfflineStudy();
    if (reason === 'refused') h.failWrites(); else h.data.set(key, raw + ' ');
    assert.equal(mode === 'study' ? h.context.useCurrentStudyRevision() : h.context.useCurrentOfflineRevision(), false);
    assert.deepEqual(clone(h.run(mode === 'study' ? '_studyPresentations[0]' : 'currentPresentation')), q);
    assert.equal(h.writes.length, 0); assert.equal(h.data.get(key), reason === 'refused' ? raw : raw + ' ');
    assert.equal(h.context.answerCalls, 0); assert.equal(h.context.srCalls, 0);
  }
});
test('Study and offline pending readback failure restore only their own candidate and preserve a concurrent writer', () => {
  const f = fixture();
  for (const mode of ['study', 'offline']) for (const reason of ['readback', 'writer']) {
    const h = harness(mode, f), q = answers.present(sources(f.before)[mode]), key = mode === 'study' ? 'nefroquest-study-state' : 'nefroquest-offline-study-state';
    const raw = mode === 'study' ? studySave(f, q) : offlineSave(f, q); h.data.set(key, raw);
    if (mode === 'study') assert.equal(h.context.resumeSavedStudyMode(), true); else h.context.initOfflineStudy();
    const foreign = raw + ' '; h.fault(reason, foreign);
    assert.equal(mode === 'study' ? h.context.useCurrentStudyRevision() : h.context.useCurrentOfflineRevision(), false, mode + ':' + reason);
    assert.deepEqual(clone(h.run(mode === 'study' ? '_studyPresentations[0]' : 'currentPresentation')), q);
    assert.equal(h.data.get(key), reason === 'readback' ? raw : foreign);
    assert.equal(h.writes.length, reason === 'readback' ? 2 : 1);
    assert(h.writes.every(([writtenKey]) => writtenKey === key));
    assert.equal(h.context.answerCalls, 0); assert.equal(h.context.srCalls, 0);
  }
});
test('both save helpers use two reads against their captured primary raw before writing', () => {
  const f = fixture();
  for (const mode of ['study', 'offline']) {
    const h = harness(mode, f), q = answers.present(sources(f.before)[mode]), key = mode === 'study' ? 'nefroquest-study-state' : 'nefroquest-offline-study-state';
    const raw = mode === 'study' ? studySave(f, q) : offlineSave(f, q); h.data.set(key, raw);
    if (mode === 'study') assert.equal(h.context.resumeSavedStudyMode(), true); else h.context.initOfflineStudy();
    const foreign = raw + ' '; h.fault('before-write', foreign);
    assert.equal(h.run(mode === 'study' ? '_saveStudyState()' : 'saveOfflineSession()'), false);
    assert.equal(h.data.get(key), foreign); assert.equal(h.writes.length, 0);
    assert.deepEqual(clone(h.run(mode === 'study' ? '_studyPresentations[0]' : 'currentPresentation')), q);
  }
});
test('fresh null-baseline readback compensation removes only its own candidate and does not adopt an existing raw', () => {
  const f = fixture();
  for (const mode of ['study', 'offline']) for (const existing of [false, true]) {
    const h = harness(mode, f), key = mode === 'study' ? 'nefroquest-study-state' : 'nefroquest-offline-study-state';
    if (mode === 'study') h.run("studyModeActive=true; studyModeQuestions=topics; _studyPresentations=topics.map(q=>_studyPresent(q)); _studyAnswers=[null]; _studyRevisions=topics.map(q=>_studyRevisionCatalog().current(q.qid,'study'));");
    else h.run("sessionQuestions=topics; currentIndex=0; currentPresentation=NQAnswers.present(offlineCanonical(topics[0])); offlineAnswer=null; offlineRevision=getOfflineRevisionCatalog().current(topics[0].qid,'offline');");
    if (existing) h.data.set(key, 'foreign primary bytes'); else h.fault('readback');
    assert.equal(h.run(mode === 'study' ? '_saveStudyState()' : 'saveOfflineSession()'), false);
    assert.equal(h.data.has(key), existing); if (existing) assert.equal(h.data.get(key), 'foreign primary bytes');
    assert.equal(h.writes.length, existing ? 0 : 2); assert.equal(h.context.answerCalls, 0); assert.equal(h.context.srCalls, 0);
    assert.equal(h.run(mode === 'study' ? '_studySavedRaw' : 'offlineSavedRaw'), null);
  }
});
test('expired Study saves in the required bundle are held without raw deletion or automatic resume', () => {
  const f = fixture();
  for (const missing of [false, true]) {
    const h = harness('study', f), q = answers.present(sources(f.before).study), saved = JSON.parse(studySave(f, q, answerFor(q)));
    saved.savedAt = Date.now() - 25 * 60 * 60 * 1000;
    const raw = JSON.stringify(saved); h.data.set('nefroquest-study-state', raw);
    h.run('window.NQ_REQUIRES_QUESTION_REVISIONS=true;');
    if (missing) h.run('delete window.NQQuestionRevisions; delete window.NQQuestionRevisionManifest; delete window.NQQuestionRevisionHistory;');
    assert.equal(h.context._loadStudyState().revisionHold, 'expired');
    assert.equal(h.context.resumeSavedStudyMode(), false);
    assert.equal(h.data.get('nefroquest-study-state'), raw); assert.equal(h.writes.length, 0);
    assert.equal(h.run('studyModeActive'), false); assert.equal(h.context.answerCalls, 0); assert.equal(h.context.srCalls, 0);
  }
});
test('completed Study saves in the required bundle remain preserved on inspection and resume', () => {
  const f = fixture();
  for (const missing of [false, true]) {
    const h = harness('study', f), q = answers.present(sources(f.before).study), saved = JSON.parse(studySave(f, q, answerFor(q)));
    saved.index = saved.questions.length;
    const raw = JSON.stringify(saved); h.data.set('nefroquest-study-state', raw);
    h.run('window.NQ_REQUIRES_QUESTION_REVISIONS=true;');
    if (missing) h.run('delete window.NQQuestionRevisions; delete window.NQQuestionRevisionManifest; delete window.NQQuestionRevisionHistory;');
    assert.equal(h.context._loadStudyState().revisionHold, 'complete');
    assert.equal(h.context.resumeSavedStudyMode(), false);
    assert.equal(h.data.get('nefroquest-study-state'), raw); assert.equal(h.writes.length, 0);
    assert.equal(h.run('studyModeActive'), false); assert.equal(h.context.answerCalls, 0); assert.equal(h.context.srCalls, 0);
  }
});
test('legacy Study TTL and completion cleanup still apply when every new revision flag/global is absent', () => {
  const f = fixture();
  for (const completed of [false, true]) {
    const h = harness('study', f), q = answers.present(sources(f.after).study), saved = JSON.parse(studySave(f, q));
    if (completed) saved.index = saved.questions.length; else saved.savedAt = Date.now() - 25 * 60 * 60 * 1000;
    h.data.set('nefroquest-study-state', JSON.stringify(saved));
    h.run('delete window.NQ_REQUIRES_QUESTION_REVISIONS; delete window.NQQuestionRevisions; delete window.NQQuestionRevisionManifest; delete window.NQQuestionRevisionHistory;');
    if (completed) assert.equal(h.context.resumeSavedStudyMode(), false); else assert.equal(h.context._loadStudyState(), null);
    assert.equal(h.data.has('nefroquest-study-state'), false); assert.deepEqual(h.writes, [['nefroquest-study-state', null]]);
  }
});


for (const isolated of ['flag false', 'flag null', 'catalog only']) test(`Study present revision global ${isolated} preserves expired raw and assessment without legacy cleanup`, () => {
  const f = fixture(), h = harness('study', f), q = answers.present(sources(f.before).study), saved = JSON.parse(studySave(f, q, answerFor(q)));
  saved.savedAt = Date.now() - 25 * 60 * 60 * 1000;
  const raw = JSON.stringify(saved); h.data.set('nefroquest-study-state', raw);
  h.run('delete window.NQ_REQUIRES_QUESTION_REVISIONS; delete window.NQQuestionRevisions; delete window.NQQuestionRevisionManifest; delete window.NQQuestionRevisionHistory; delete window.questionRevisionCatalog;');
  if (isolated === 'catalog only') h.context.questionRevisionCatalog = f.catalog;
  else h.context.NQ_REQUIRES_QUESTION_REVISIONS = isolated === 'flag false' ? false : null;
  const held = h.context._loadStudyState();
  assert(held, isolated); assert.equal(held.revisionHold, 'expired');
  assert.equal(held.correct, 7); assert.equal(held.wrong, 3); assert.deepEqual(clone(held.presentations[0].answer), answerFor(q));
  assert.equal(h.context.resumeSavedStudyMode(), false); assert.equal(h.data.get('nefroquest-study-state'), raw);
  assert.equal(h.writes.length, 0); assert.equal(h.context.answerCalls, 0); assert.equal(h.context.srCalls, 0);
  assert.equal(h.run('studyModeActive'), false);
});
