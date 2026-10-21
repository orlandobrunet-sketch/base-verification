/* Technical revision fixtures and read-only published-bank regressions; no clinical content changes. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const answers = require('../../js/answer-presentation.js');
const revisions = require('../../js/question-revisions.js');
const ROOT = path.resolve(__dirname, '../..');
const KEY = 'nefroquest-exam-state';
const clone = value => JSON.parse(JSON.stringify(value));
const beforeAuthor = { qid: 'technical-1', q: 'Synthetic earlier stem', opts: ['Earlier A', 'Earlier B'], ans: 0,
  exp: 'Earlier explanation', refs: ['synthetic-card'] };
const currentAuthor = { ...beforeAuthor, q: 'Synthetic current stem', opts: ['Current A', 'Current B'], ans: 1,
  exp: 'Current explanation' };
const source = author => ({ id: author.qid, q: author.q, o: [...author.opts], a: author.ans, e: author.exp, c: 'technical' });
const beforeSource = source(beforeAuthor), currentSource = source(currentAuthor);
const oldRefs = { 'synthetic-card': { label: 'Earlier synthetic card' } };
const currentRefs = { 'synthetic-card': { label: 'Current synthetic card' } };
function fixture({ sameSource = false } = {}) {
  const author = sameSource ? beforeAuthor : currentAuthor, current = source(author);
  const authorRevision = revisions.digest(author);
  const referenceRevisions = { 'synthetic-card': revisions.digest(currentRefs['synthetic-card']) };
  const recordRevision = revisions.digest({ authorRevision, referenceRevisions });
  const manifest = { version: 1, release: 'technical-current', current: { 'technical-1': {
    authorRevision, referenceRevisions, recordRevision,
    sourceRevisions: { main: revisions.digest(current), exam: revisions.digest(current) } } } };
  const history = [{ qid: 'technical-1', release: 'technical-earlier', author: clone(beforeAuthor),
    sources: { main: clone(beforeSource), exam: clone(beforeSource) }, references: clone(oldRefs),
    policy: { material: true, pending: 'update-required' } }];
  const catalog = revisions.createCatalog({ manifest, history, authors: [author],
    sources: { main: [current], exam: [current] }, references: currentRefs });
  const question = answers.present(beforeSource, { random: () => 0 });
  const binding = catalog.inspect(question, { profile: 'exam' }).status === 'known'
    ? catalog.inspect(question, { profile: 'exam' }).value.binding
    : revisions.createVerifier({ manifest, history }).inspect(question, { profile: 'exam' }).candidates.find(row => row.historical).binding;
  return { manifest, history, catalog, question, binding };
}
function saved(f, { answered = false, bindings = true } = {}) {
  const q = clone(f.question), chosen = q.a;
  return { questions: [q], idx: 0, answers: answered ? [{ qId: q.id, correct: true, chosen, answered: true,
    authoredChoice: answers.originalIndex(q, chosen), optionId: answers.optionId(q, chosen), cat: 'technical' }] : [],
    ...(bindings ? { questionRevisionBindings: [clone(f.binding)] } : {}), startTime: Date.now() - 1000, savedAt: Date.now() };
}
function harness({ f = fixture(), initial = saved(f), legacy = false, failure = null, load = null } = {}) {
  const map = new Map(initial === null ? [] : [[KEY, JSON.stringify(initial)]]);
  const events = { writes: 0, tracks: 0, loads: 0 };
  const scope = { epoch: 1, owner: 'technical-owner' };
  const page = { innerHTML: '', focus() {}, remove() {}, classList: { contains() { return false; } } };
  const storage = { getItem: key => map.has(key) ? map.get(key) : null,
    setItem(key, value) { events.writes++; if (failure === 'refuse') throw Error('synthetic refusal');
      map.set(key, failure === 'diverge' ? 'synthetic competing bytes' : String(value)); },
    removeItem: key => map.delete(key) };
  const context = vm.createContext({ console: { error() {} }, localStorage: storage,
    window: { NQAnswers: answers, ...(legacy ? {} : { NQ_REQUIRES_QUESTION_REVISIONS: true, NQQuestionRevisions: revisions,
      NQQuestionRevisionManifest: f.manifest, NQQuestionRevisionHistory: f.history, questionRevisionCatalog: f.catalog }) },
    document: { getElementById(id) { return id === 'examPage' ? page : id === 'examResultado' && page.innerHTML.includes('id="examResultado"') ? {} : null; },
      querySelector() { return null; }, querySelectorAll() { return []; }, removeEventListener() {}, body: { classList: { remove() {} } } },
    _captureJourneyBinding: () => ({ ...scope }), _matchesJourneyBinding: binding => binding.epoch === scope.epoch && binding.owner === scope.owner,
    _loadTopics: async () => { events.loads++; if (load) await load(scope); }, questionBank: [clone(currentSource)],
    shuffle: values => values, setInterval: () => 1, clearInterval() {},
    trackQuestionAnswer() { events.tracks++; }, escapeHtml: text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;') });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/exam.js'), 'utf8'), context);
  vm.runInContext('_examJourneyBinding = _captureJourneyBinding();', context);
  return { f, map, page, context, events, scope, run: code => vm.runInContext(code, context),
    state: () => clone(vm.runInContext('_examState', context)) };
}

test('historical answered exam resumes exact shuffled snapshot and grade with zero writes or credits', async () => {
  const f = fixture(), initial = saved(f, { answered: true }), h = harness({ f, initial }), raw = h.map.get(KEY);
  await h.run('_examRetomar()');
  assert.deepEqual(h.state().questions, initial.questions);
  assert.deepEqual(h.state().answers, initial.answers);
  assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0); assert.equal(h.events.tracks, 0);
  assert.match(h.page.innerHTML, /data-question-revision="historical"/);
  assert.match(h.page.innerHTML, /versão technical-earlier/);
  assert.match(h.page.innerHTML, /Earlier explanation/); assert.match(h.page.innerHTML, /Current explanation/);
  h.run('_examAnswer(0)'); assert.equal(h.events.tracks, 0);
  await h.run('_examRetomar()'); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.tracks, 0);
});

test('pending material exam blocks answer/advance until explicit update and preserves original raw/counters', async () => {
  const h = harness(), raw = h.map.get(KEY), original = JSON.parse(raw);
  await h.run('_examRetomar()');
  assert.equal(h.run('_examNeedsCurrentRevision()'), true);
  h.run('_examAnswer(0); _examNext();');
  assert.equal(h.events.writes, 0); assert.equal(h.events.tracks, 0); assert.equal(h.state().idx, 0);
  assert.doesNotMatch(h.page.innerHTML, /data-action="_examAnswer"/);
  h.run('_examUseCurrentRevision()');
  const stored = JSON.parse(h.map.get(KEY));
  assert.equal(stored.questionRevisionOriginalRaw, raw);
  assert.deepEqual(stored.questionRevisionOrigins[0].question, original.questions[0]);
  assert.deepEqual(stored.answers, original.answers); assert.equal(stored.idx, original.idx); assert.equal(stored.startTime, original.startTime);
  assert.equal(stored.questions[0].id, original.questions[0].id);
  assert.equal(stored.questions[0]._answerPresentation.sourceQuestion.q, currentSource.q);
  assert.equal(h.events.tracks, 0);
  await h.run('_examRetomar()'); assert.equal(h.run('_examNeedsCurrentRevision()'), false);
  h.run('_examAnswer(_examState.questions[0].a)'); assert.equal(h.events.tracks, 1);
  await h.run('_examRetomar()'); assert.equal(h.events.tracks, 1);
});

for (const failure of ['refuse', 'diverge']) test(`pending update ${failure} rolls runtime back and gives no credit`, async () => {
  const h = harness({ failure }); await h.run('_examRetomar()');
  const prior = h.state(), raw = h.map.get(KEY); h.run('_examUseCurrentRevision()');
  assert.deepEqual(h.state(), prior); assert.equal(h.events.tracks, 0);
  assert.equal(h.map.get(KEY), failure === 'refuse' ? raw : 'synthetic competing bytes');
});

test('CAS divergence prevents pending update write and preserves competing raw', async () => {
  const h = harness(); await h.run('_examRetomar()'); const prior = h.state();
  h.map.set(KEY, 'competing raw'); h.run('_examUseCurrentRevision()');
  assert.deepEqual(h.state(), prior); assert.equal(h.events.writes, 0); assert.equal(h.map.get(KEY), 'competing raw');
});

test('current answer refusal rolls back before analytics or detailed-stat credit', async () => {
  const f = fixture(), q = answers.present(currentSource, { preserveOrder: true });
  const current = { ...saved(f), questions: [q], questionRevisionBindings: [f.catalog.current(q.id, 'exam').binding] };
  const h = harness({ f, initial: current, failure: 'refuse' }); await h.run('_examRetomar()');
  const prior = h.state(), raw = h.map.get(KEY); h.run('_examAnswer(_examState.questions[0].a)');
  assert.deepEqual(h.state(), prior); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.tracks, 0);
});

test('forged source with coherent recomputed presentation cannot become a trusted exam revision', async () => {
  const f = fixture(), initial = saved(f);
  initial.questions[0] = answers.present({ ...beforeSource, q: 'Forged synthetic source' }, { preserveOrder: true });
  const h = harness({ f, initial }), raw = h.map.get(KEY); await h.run('_examRetomar()');
  assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0);
  assert.match(h.page.innerHTML, /Prova preservada/);
});

test('same source but changed reference card requires a binding; ambiguous legacy raw stays held', async () => {
  const f = fixture({ sameSource: true }), initial = saved(f, { bindings: false });
  const h = harness({ f, initial }), raw = h.map.get(KEY); await h.run('_examRetomar()');
  assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.tracks, 0);
});

for (const missing of ['NQQuestionRevisions', 'NQQuestionRevisionManifest', 'NQQuestionRevisionHistory', 'questionRevisionCatalog'])
  test(`new bundle with missing ${missing} holds raw`, async () => {
    const h = harness(), raw = h.map.get(KEY); delete h.context.window[missing];
    await h.run('_examRetomar()'); assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0);
  });

test('owner/epoch change while topics load prevents runtime adoption and storage writes', async () => {
  const h = harness({ load: async scope => { scope.owner = 'other-owner'; scope.epoch++; } }), raw = h.map.get(KEY);
  await h.run('_examRetomar()'); assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0);
});

test('expired unknown raw is preserved in new bundle rather than being deleted by TTL', () => {
  const f = fixture(), initial = { ...saved(f), savedAt: Date.now() - 3 * 60 * 60 * 1000 };
  const h = harness({ f, initial }), raw = h.map.get(KEY); h.run('startExamMode()');
  assert.equal(h.map.get(KEY), raw); assert.match(h.page.innerHTML, /Prova preservada/);
});

test('legacy fixture without any new globals retains original shuffled resume behavior', async () => {
  const f = fixture(), initial = saved(f, { answered: true, bindings: false }), h = harness({ f, initial, legacy: true });
  await h.run('_examRetomar()'); assert.deepEqual(h.state().questions, initial.questions); assert.equal(h.events.loads, 0);
});

function reviewHarness({ f = fixture(), unknown = false, legacy = false } = {}) {
  const wrong = { ...clone(f.question), chosen: (f.question.a + 1) % f.question.o.length,
    authoredChoice: answers.originalIndex(f.question, (f.question.a + 1) % f.question.o.length),
    selectedOptionId: answers.optionId(f.question, (f.question.a + 1) % f.question.o.length), answerEventId: 'technical-event',
    questionRevisionBinding: f.catalog.inspect(f.question, { profile: 'main' }).value.binding };
  if (unknown) wrong.questionRevisionBinding.recordRevision = 'sha256:' + '0'.repeat(64);
  let modal;
  const original = JSON.stringify(wrong);
  const context = vm.createContext({ window: { NQAnswers: answers, ...(legacy ? {} : { NQ_REQUIRES_QUESTION_REVISIONS: true,
    NQQuestionRevisions: revisions, NQQuestionRevisionManifest: f.manifest, NQQuestionRevisionHistory: f.history, questionRevisionCatalog: f.catalog }) },
    _sessionWrongAnswers: [wrong], escapeHtml: text => String(text).replaceAll('<', '&lt;'), nqDialogo() {},
    document: { querySelectorAll: () => [], createElement: () => ({ setAttribute() {}, querySelector: () => ({ focus() {} }) }),
      body: { appendChild(element) { modal = element; } } } });
  const body = fs.readFileSync(path.join(ROOT, 'js/minigame.js'), 'utf8');
  const start = body.indexOf('    function showSessionWrongAnswers() {'), end = body.indexOf('    function finishGameUI()', start);
  vm.runInContext(body.slice(start, end), context); vm.runInContext('showSessionWrongAnswers()', context);
  assert.equal(JSON.stringify(wrong), original);
  return modal.innerHTML;
}

test('campaign wrong-answer review keeps old chosen/correct text and displays current content separately', () => {
  const html = reviewHarness();
  assert.match(html, /Earlier A/); assert.match(html, /Earlier B/); assert.match(html, /data-question-revision="historical"/);
  assert.match(html, /versão technical-earlier/);
  assert.match(html, /Current explanation/); assert.match(html, /is-chosen/); assert.match(html, /is-correct/);
});

test('unknown campaign wrong-answer binding hides interpretation and leaves raw untouched', () => {
  const html = reviewHarness({ unknown: true }); assert.match(html, /registro original foi preservado/);
  assert.doesNotMatch(html, /Earlier explanation|is-correct|Current explanation/);
});


test('unknown later exam snapshot prevents adoption of every earlier snapshot', async () => {
  const f = fixture(), initial = saved(f);
  initial.questions.push(answers.present({ ...beforeSource, id: 'unpublished-synthetic-id' }, { preserveOrder: true }));
  initial.questionRevisionBindings.push({ ...f.binding, qid: 'unpublished-synthetic-id' });
  const h = harness({ f, initial }), raw = h.map.get(KEY);
  await h.run('_examRetomar()'); assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0);
});

test('forged retained origin prevents resumed interpretation even with a valid current question', async () => {
  const f = fixture(), q = answers.present(currentSource, { preserveOrder: true });
  const initial = { ...saved(f), questions: [q], questionRevisionBindings: [f.catalog.current(q.id, 'exam').binding],
    questionRevisionOrigins: [{ index: 0, question: answers.present({ ...beforeSource, e: 'Forged archive' }), binding: f.binding }] };
  const h = harness({ f, initial }), raw = h.map.get(KEY);
  await h.run('_examRetomar()'); assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0);
});

test('storage unavailable after catalog loading holds raw without rejected resume promise', async () => {
  const h = harness(), raw = h.map.get(KEY);
  h.context._loadTopics = async () => { h.context.localStorage.getItem = () => { throw Error('synthetic unavailable storage'); }; };
  await h.run('_examRetomar()'); assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0);
});

test('blocked write does not let expiry callback reclassify or delete original exam', async () => {
  const h = harness({ failure: 'refuse' }); await h.run('_examRetomar()'); const raw = h.map.get(KEY);
  h.run('_examUseCurrentRevision(); _examState.startTime = Date.now() - 10000000; _updateExamTimer(); _examEsgotarTempo();');
  assert.deepEqual(h.state().answers, []); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.tracks, 0);
});

test('fresh exam persists profile-specific bindings before its first answer', async () => {
  const h = harness({ initial: null }); await h.run('_examComecar()');
  const stored = JSON.parse(h.map.get(KEY));
  assert.equal(stored.questionRevisionBindings[0].profile, 'exam');
  assert.equal(stored.questionRevisionBindings[0].qid, stored.questions[0].id);
  assert.equal(h.events.tracks, 0); assert.equal(h.state().questions[0].q, currentSource.q);
});

test('verifier without loaded published runtime sources cannot substitute for the hydrated catalog', async () => {
  const f = fixture(), h = harness({ f }), raw = h.map.get(KEY);
  h.context.window.questionRevisionCatalog = revisions.createVerifier({ manifest: f.manifest, history: f.history });
  await h.run('_examRetomar()'); assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw);
});

test('new binding profile cannot be reused for exam from campaign', async () => {
  const f = fixture(), initial = saved(f); initial.questionRevisionBindings[0].profile = 'main';
  const h = harness({ f, initial }), raw = h.map.get(KEY); await h.run('_examRetomar()');
  assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw);
});

test('answered historical result reports stored grade without regrading against current key', async () => {
  const f = fixture(), initial = saved(f, { answered: true }), h = harness({ f, initial });
  await h.run('_examRetomar()'); h.run('showExamResults()');
  assert.match(h.page.innerHTML, /<dd>100%<\/dd>/); assert.match(h.page.innerHTML, /Current explanation/);
  assert.equal(h.events.tracks, 0); assert.deepEqual(h.state().answers, initial.answers);
});


test('retained origin must describe a published historical revision actually replaced at its index', async () => {
  const f = fixture(), q = answers.present(currentSource, { preserveOrder: true }), binding = f.catalog.current(q.id, 'exam').binding;
  const initial = { ...saved(f), questions: [q], questionRevisionBindings: [binding],
    questionRevisionOrigins: [{ index: 0, question: q, binding }] };
  const h = harness({ f, initial }), raw = h.map.get(KEY); await h.run('_examRetomar()');
  assert.equal(h.state(), null); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0);
});


function failOneCandidateReadback(h, { competing = null } = {}) {
  const storage = h.context.localStorage, get = storage.getItem, set = storage.setItem;
  let pending = false, triggered = false;
  storage.setItem = (key, value) => {
    set(key, value);
    if (!triggered) pending = true;
    return undefined;
  };
  storage.getItem = key => {
    if (pending) {
      pending = false; triggered = true;
      if (competing !== null) h.map.set(key, competing);
      throw Error('synthetic one-time candidate readback failure');
    }
    return get(key);
  };
}

test('pending upgrade readback exception compensates only its written candidate and preserves original bytes', async () => {
  const h = harness(); await h.run('_examRetomar()');
  const prior = h.state(), raw = h.map.get(KEY); failOneCandidateReadback(h);
  h.run('_examUseCurrentRevision()');
  assert.deepEqual(h.state(), prior); assert.equal(h.map.get(KEY), raw);
  assert.equal(h.events.writes, 2); assert.equal(h.events.tracks, 0);
  assert.equal(h.run('_examSavedRaw'), raw);
});

test('current answer readback exception restores original durable answer state before any credit', async () => {
  const f = fixture(), q = answers.present(currentSource, { preserveOrder: true });
  const initial = { ...saved(f), questions: [q], questionRevisionBindings: [f.catalog.current(q.id, 'exam').binding] };
  const h = harness({ f, initial }); await h.run('_examRetomar()');
  const prior = h.state(), raw = h.map.get(KEY); failOneCandidateReadback(h);
  h.run('_examAnswer(_examState.questions[0].a)');
  assert.deepEqual(h.state(), prior); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.tracks, 0);
});

test('fresh exam with failed candidate readback removes its candidate when no earlier save existed', async () => {
  const h = harness({ initial: null }); failOneCandidateReadback(h);
  await h.run('_examComecar()'); assert.equal(h.state(), null); assert.equal(h.map.has(KEY), false); assert.equal(h.events.tracks, 0);
});

test('interleaving writer during failed candidate readback is preserved without compensating over it', async () => {
  const h = harness(); await h.run('_examRetomar()'); const prior = h.state();
  failOneCandidateReadback(h, { competing: 'synthetic competing owner bytes' }); h.run('_examUseCurrentRevision()');
  assert.deepEqual(h.state(), prior); assert.equal(h.map.get(KEY), 'synthetic competing owner bytes');
  assert.equal(h.events.writes, 1); assert.equal(h.events.tracks, 0);
});


test('storage false return after writing its candidate restores original bytes and keeps the pending runtime', async () => {
  const h = harness(); await h.run('_examRetomar()'); const prior = h.state(), raw = h.map.get(KEY);
  const set = h.context.localStorage.setItem;
  h.context.localStorage.setItem = (key, value) => { set(key, value); return false; };
  h.run('_examUseCurrentRevision()');
  assert.deepEqual(h.state(), prior); assert.equal(h.map.get(KEY), raw); assert.equal(h.events.tracks, 0);
});


test('expired historical exam consultation within TTL keeps original raw and every recorded answer', async () => {
  const f = fixture(), initial = { ...saved(f, { answered: true }), startTime: Date.now() - 91 * 60 * 1000 };
  const h = harness({ f, initial }), raw = h.map.get(KEY);
  await h.run('_examRetomar()'); assert.match(h.page.innerHTML, /Resultado da Prova/);
  assert.equal(h.map.get(KEY), raw); assert.deepEqual(h.state().answers, initial.answers);
  assert.equal(h.events.writes, 0); assert.equal(h.events.tracks, 0);
});

test('all answered historical exam consultation keeps original raw while showing its recorded result', async () => {
  const f = fixture(), initial = { ...saved(f, { answered: true }), idx: 1 };
  const h = harness({ f, initial }), raw = h.map.get(KEY);
  await h.run('_examRetomar()'); assert.match(h.page.innerHTML, /Resultado da Prova/);
  assert.equal(h.map.get(KEY), raw); assert.deepEqual(h.state().answers, initial.answers);
  assert.equal(h.events.writes, 0); assert.equal(h.events.tracks, 0);
});


test('legacy bundle with no revision globals retains native expired-save completion behavior', async () => {
  const f = fixture(), initial = { ...saved(f, { answered: true, bindings: false }), startTime: Date.now() - 91 * 60 * 1000 };
  const h = harness({ f, initial, legacy: true }); await h.run('_examRetomar()');
  assert.match(h.page.innerHTML, /Resultado da Prova/); assert.equal(h.map.has(KEY), false); assert.equal(h.events.tracks, 0);
});

// A reference-only revision can keep the exact question source while changing
// its record revision. A fresh exam must select current bindings explicitly;
// an older unbound save must retain the resolver's ambiguity.
const REFERENCE_ONLY_QIDS = ['81740f2d', '1e2668d6', '940b2835'];
let publishedExamBundle;
function publishedBundle() {
  if (publishedExamBundle) return publishedExamBundle;
  const builder = require('../../tools/build-question-revision-manifest.cjs');
  const topics = builder.load('data/topics.js', 'topics'), refs = builder.load('data/refs.js', 'refsDB');
  const manifest = require('../../data/question-revision-manifest.js');
  const history = require('../../data/question-revision-history.js');
  const sources = { main: [], exam: [], study: [], offline: [] };
  topics.forEach((author, index) => Object.entries(builder.sources(author, index))
    .forEach(([profile, value]) => sources[profile].push(value)));
  const catalog = revisions.createCatalog({ manifest, history, authors: topics, sources, references: refs });
  assert.equal(topics.length, 741);
  publishedExamBundle = { topics, refs, manifest, history, sources, catalog };
  return publishedExamBundle;
}
function referenceOnlyFixture(qid) {
  const bundle = publishedBundle(), current = bundle.catalog.current(qid, 'exam');
  assert(current, qid + ': published current exam source');
  const question = answers.present(current.source, { preserveOrder: true });
  const unbound = bundle.catalog.inspect(question, { profile: 'exam' });
  assert.equal(unbound.status, 'ambiguous', qid + ': reference-only ambiguity precondition');
  const archived = unbound.candidates.find(value => value.historical &&
    value.sourceRevision === current.sourceRevision &&
    value.binding.recordRevision !== current.binding.recordRevision);
  assert(archived, qid + ': unchanged source with distinct archived card revision');
  return { ...bundle, question, binding: archived.binding, archived, current };
}
function publishedFreshHarness(qid, fault) {
  const f = referenceOnlyFixture(qid), h = harness({ f, initial: null });
  h.context.questionBank = clone(f.sources.exam);
  let timers = 0;
  h.context.setInterval = () => ++timers;
  // Only the draw is forced. Presentation, catalog, validation and persistence
  // still use their real implementations and the complete published bank.
  h.context.shuffle = values => {
    const target = values.find(question => question.id === qid);
    assert(target); assert.equal(values.length, 741);
    const first = fault === 'incompatible-source' ? { ...target, e: target.e + ' Technical fixture drift.' } : target;
    return [first, ...values.filter(question => !REFERENCE_ONLY_QIDS.includes(question.id)),
      ...values.filter(question => REFERENCE_ONLY_QIDS.includes(question.id) && question.id !== qid)];
  };
  if (fault === 'missing-catalog') h.context.window.questionRevisionCatalog = null;
  if (fault === 'missing-current') {
    h.context.window.questionRevisionCatalog = revisions.createCatalog({ manifest: f.manifest, history: f.history,
      authors: f.topics, sources: { ...f.sources, exam: f.sources.exam.filter(question => question.id !== qid) },
      references: f.refs });
    assert.equal(h.context.window.questionRevisionCatalog.current(qid, 'exam'), null);
  }
  return { ...h, timers: () => timers };
}
for (const qid of REFERENCE_ONLY_QIDS) {
  test('published reference-only ' + qid + ': fresh exam binds all 60 current questions and resumes exact save', async () => {
    const h = publishedFreshHarness(qid);
    await h.run('_examComecar()');
    const state = h.state();
    assert(state, 'fresh exam must start instead of preserving an ambiguous new draw');
    assert.match(h.page.innerHTML, /Quest\u00e3o 1 de 60/);
    assert.equal(state.questions.length, 60); assert.equal(state.questions[0].id, qid);
    assert.equal(new Set(state.questions.map(question => question.id)).size, 60);
    assert.equal(state.questionRevisionBindings.length, 60);
    for (const [index, question] of state.questions.entries()) {
      const expected = h.f.catalog.current(question.id, 'exam').binding;
      assert.deepEqual(state.questionRevisionBindings[index], expected);
      const checked = h.f.catalog.inspect(question, { profile: 'exam', binding: state.questionRevisionBindings[index] });
      assert.equal(checked.status, 'known'); assert.equal(checked.value.historical, false);
    }
    assert.equal(h.events.writes, 1); assert.equal(h.events.tracks, 0); assert.equal(h.timers(), 1);
    const raw = h.map.get(KEY), stored = JSON.parse(raw);
    assert.deepEqual(stored.questions, state.questions);
    assert.deepEqual(stored.questionRevisionBindings, state.questionRevisionBindings);
    const resumed = harness({ f: h.f, initial: stored });
    await resumed.run('_examRetomar()');
    for (const key of ['questions', 'questionRevisionBindings', 'answers', 'idx', 'startTime'])
      assert.deepEqual(resumed.state()[key], stored[key]);
    assert.equal(resumed.map.get(KEY), raw); assert.equal(resumed.events.writes, 0); assert.equal(resumed.events.tracks, 0);
  });

  test('published reference-only ' + qid + ': legacy unbound save remains ambiguous without writes, credit or timer', async () => {
    const f = referenceOnlyFixture(qid), initial = saved(f, { bindings: false }), h = harness({ f, initial });
    const raw = h.map.get(KEY); let timers = 0; h.context.setInterval = () => ++timers;
    await h.run('_examRetomar()');
    assert.equal(h.state(), null); assert.match(h.page.innerHTML, /Prova preservada/);
    assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0); assert.equal(h.events.tracks, 0); assert.equal(timers, 0);
    assert.equal(f.catalog.inspect(f.question, { profile: 'exam' }).status, 'ambiguous');
  });

  test('published reference-only ' + qid + ': explicit historical binding retains snapshot, grade and archived card', async () => {
    const f = referenceOnlyFixture(qid), initial = saved(f, { answered: true }), h = harness({ f, initial });
    const raw = h.map.get(KEY);
    await h.run('_examRetomar()');
    const state = h.state(); assert(state);
    assert.deepEqual(state.questions, initial.questions); assert.deepEqual(state.answers, initial.answers);
    assert.deepEqual(state.questionRevisionBindings, initial.questionRevisionBindings);
    assert.equal(state.revisionViews[0].historical, true);
    assert.equal(state.revisionViews[0].release, f.archived.release);
    assert.deepEqual(state.revisionViews[0].references, f.archived.references);
    assert.notDeepEqual(state.revisionViews[0].references.gitelman_kdigo_2017, f.current.references.gitelman_kdigo_2017);
    assert.match(h.page.innerHTML, /data-question-revision="historical"/);
    assert.equal(h.map.get(KEY), raw); assert.equal(h.events.writes, 0); assert.equal(h.events.tracks, 0);
  });
}
for (const fault of ['missing-catalog', 'missing-current', 'incompatible-source']) {
  test('fresh published exam fails closed for ' + fault + ' without storage writes, credit or timer', async () => {
    const h = publishedFreshHarness(REFERENCE_ONLY_QIDS[0], fault), before = [...h.map.entries()];
    await h.run('_examComecar()');
    assert.equal(h.state(), null); assert.match(h.page.innerHTML, /Prova preservada/);
    assert.deepEqual([...h.map.entries()], before);
    assert.equal(h.events.writes, 0); assert.equal(h.events.tracks, 0); assert.equal(h.timers(), 0);
  });
}
