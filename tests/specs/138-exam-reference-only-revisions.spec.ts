import {test, expect, type Page} from '@playwright/test';
import {enterGame, injectGameState} from '../helpers/game';

// Read the published bank/catalog intact. Only the new-exam draw is forced.
const EXAM = 'nefroquest-exam-state';
const affected = ['81740f2d', '1e2668d6', '940b2835'];
type Fault = 'missing-catalog' | 'missing-current' | 'incompatible-source';
const errors = new WeakMap<Page, string[]>();
const progressKeys = [EXAM, 'nefroquest-save-v7', 'nefroquest-stats', 'nefroquest-detailed-stats',
  'nefroquest-sr-data', 'nefroquest-mastered', 'nefroquest-mastered-ids', 'unlockedArticles', 'nq-unlocked-refs'];
test.use({serviceWorkers: 'block', reducedMotion: 'reduce'});

test.beforeEach(async ({page, context, baseURL}) => {
  const origin = new URL(baseURL || 'http://localhost:5500').origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const observed: string[] = []; errors.set(page, observed);
  page.on('pageerror', error => observed.push(error.message));
  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    return url.origin === origin && ['http:', 'https:'].includes(url.protocol) && request.method() === 'GET'
      ? route.continue() : route.abort();
  });
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await injectGameState(page, {gold: 0, score: 0, correctTotal: 0});
  await page.waitForFunction(() => (window as any).questionBank?.length === 741 &&
    typeof (window as any).questionRevisionCatalog?.current === 'function');
  await page.evaluate(() => { localStorage.removeItem('nefroquest-exam-state'); return document.fonts.ready; });
});

test.afterEach(async ({page}, info) => {
  const runtime = await page.evaluate(() => {
    const w = window as any, state = (0, eval)('_examState');
    return {forcedDraw: w.__referenceOnlyExamDraw || null, fault: w.__referenceOnlyExamFault || null,
      blocked: (0, eval)('_examRevisionBlocked'), questionIds: state?.questions.map((q: any) => q.id) || null,
      bindings: state?.questionRevisionBindings || null, raw: localStorage.getItem('nefroquest-exam-state'),
      heading: document.querySelector('#examPage h1')?.textContent || null};
  });
  await info.attach('reference-only-exam-runtime', {contentType: 'application/json',
    body: JSON.stringify({runtime, errors: errors.get(page), viewport: page.viewportSize()}, null, 2)});
  if (info.status === info.expectedStatus) expect(errors.get(page)).toEqual([]);
});

async function openExam(page: Page) {
  await page.evaluate(() => (window as any).openGameModesPopup());
  await page.locator('[data-action-seq="closeGameModesPopup,startExamMode"]').click();
  await expect(page.locator('#examPage')).toBeVisible();
}
async function saveIdle(page: Page) {
  const start = Date.now();
  await page.waitForFunction(since => Date.now() - since >= 900 && (0, eval)('_saveTimer === null'), start);
}
async function storageBytes(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), progressKeys);
}
async function forcePublishedDraw(page: Page, qid: string, fault?: Fault) {
  const precondition = await page.evaluate(({qid, affected, fault}) => {
    const w = window as any, catalog = w.questionRevisionCatalog, current = catalog.current(qid, 'exam');
    const question = w.NQAnswers.present(current.source, {preserveOrder: true});
    const unbound = catalog.inspect(question, {profile: 'exam'});
    const historical = unbound.candidates.find((value: any) => value.historical &&
      value.sourceRevision === current.sourceRevision && value.binding.recordRevision !== current.binding.recordRevision);
    const originalShuffle = w.shuffle;
    w.shuffle = (values: any[]) => {
      if (values.length !== w.questionBank.length || !values.every(q => q && Array.isArray(q.o) && typeof q.id === 'string'))
        return originalShuffle(values);
      const target = values.find(q => q.id === qid);
      if (!target) throw Error('Forced published exam question missing: ' + qid);
      const first = fault === 'incompatible-source' ? {...target, e: target.e + ' Technical fixture drift.'} : target;
      const ordered = [first, ...values.filter(q => !affected.includes(q.id)),
        ...values.filter(q => affected.includes(q.id) && q.id !== qid)];
      w.__referenceOnlyExamDraw = ordered.slice(0, 60).map(q => q.id);
      w.__referenceOnlyExamFault = fault || null;
      // Inject unavailable real dependencies after the genuine loader completes.
      // No resolver, validation, storage or production function is replaced.
      if (fault === 'missing-catalog') w.questionRevisionCatalog = null;
      if (fault === 'missing-current') w.questionRevisionCatalog = w.NQQuestionRevisions.createCatalog({
        manifest: w.NQQuestionRevisionManifest, history: w.NQQuestionRevisionHistory,
        authors: (0, eval)('topics'), references: (0, eval)('refsDB'),
        sources: {exam: w.questionBank.filter((q: any) => q.id !== qid)}});
      return ordered;
    };
    return {bankSize: w.questionBank.length, status: unbound.status, currentSource: current.sourceRevision,
      historicalSource: historical?.sourceRevision, currentRecord: current.binding.recordRevision,
      historicalRecord: historical?.binding.recordRevision};
  }, {qid, affected, fault});
  expect(precondition.bankSize).toBe(741);
  expect(precondition.status).toBe('ambiguous');
  expect(precondition.historicalSource).toBe(precondition.currentSource);
  expect(precondition.historicalRecord).toBeTruthy();
  expect(precondition.historicalRecord).not.toBe(precondition.currentRecord);
}
async function examSnapshot(page: Page) {
  return page.evaluate(() => {
    const w = window as any, state = (0, eval)('_examState');
    if (!state) return null;
    return {questions: state.questions, bindings: state.questionRevisionBindings, answers: state.answers,
      idx: state.idx, startTime: state.startTime,
      currentBindings: state.questions.map((q: any) => w.questionRevisionCatalog.current(q.id, 'exam')?.binding),
      inspected: state.questions.map((q: any, i: number) => {
        const checked = w.questionRevisionCatalog.inspect(q, {profile: 'exam', binding: state.questionRevisionBindings[i]});
        return {status: checked.status, historical: checked.value?.historical};
      })};
  });
}

for (const qid of affected) {
  test('fresh reference-only ' + qid + ': 60 current bindings survive native save and resume', async ({page}) => {
    await forcePublishedDraw(page, qid);
    await openExam(page);
    await page.getByRole('button', {name: 'Começar prova', exact: true}).click();
    await expect(page.getByRole('heading', {name: 'Questão 1 de 60', exact: true})).toBeVisible();
    const started = await examSnapshot(page);
    expect(started).not.toBeNull();
    expect(started!.questions).toHaveLength(60);
    expect(started!.questions[0].id).toBe(qid);
    expect(new Set(started!.questions.map((q: any) => q.id)).size).toBe(60);
    expect(started!.bindings).toHaveLength(60);
    expect(started!.bindings).toEqual(started!.currentBindings);
    expect(started!.inspected).toEqual(Array.from({length: 60}, () => ({status: 'known', historical: false})));
    const raw = await page.evaluate(key => localStorage.getItem(key), EXAM);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!);
    expect(stored.questions).toEqual(started!.questions);
    expect(stored.questionRevisionBindings).toEqual(started!.bindings);
    await page.reload({waitUntil: 'domcontentloaded'});
    await enterGame(page);
    await openExam(page);
    await expect(page.getByRole('heading', {name: 'Prova em andamento', exact: true})).toBeVisible();
    await page.getByRole('button', {name: 'Retomar prova', exact: true}).click();
    await expect(page.getByRole('heading', {name: 'Questão 1 de 60', exact: true})).toBeVisible();
    expect(await examSnapshot(page)).toEqual(started);
    expect(await page.evaluate(key => localStorage.getItem(key), EXAM)).toBe(raw);
  });
}

for (const fault of ['missing-catalog', 'missing-current', 'incompatible-source'] as Fault[]) {
  test('fresh reference-only exam holds ' + fault + ' without changing saved progress or starting its timer', async ({page}) => {
    await forcePublishedDraw(page, affected[0], fault);
    await openExam(page);
    await saveIdle(page);
    const before = await storageBytes(page);
    await page.getByRole('button', {name: 'Começar prova', exact: true}).click();
    await expect(page.getByRole('heading', {name: 'Prova preservada', exact: true})).toBeVisible();
    expect(await page.evaluate(() => (0, eval)('_examState'))).toBeNull();
    await expect(page.locator('#examTimer')).toHaveCount(0);
    await saveIdle(page);
    expect(await storageBytes(page)).toEqual(before);
  });
}

async function installHistoricalSave(page: Page, bindings: boolean) {
  return page.evaluate(({qid, bindings, key}) => {
    const w = window as any, current = w.questionRevisionCatalog.current(qid, 'exam');
    const question = w.NQAnswers.present(current.source, {preserveOrder: true});
    const unbound = w.questionRevisionCatalog.inspect(question, {profile: 'exam'});
    const historical = unbound.candidates.find((value: any) => value.historical &&
      value.sourceRevision === current.sourceRevision && value.binding.recordRevision !== current.binding.recordRevision);
    if (unbound.status !== 'ambiguous' || !historical) throw Error('Missing published reference-only archive');
    const chosen = question.a;
    const saved = {questions: [question], idx: 0,
      answers: [{qId: question.id, correct: true, chosen, answered: true,
        authoredChoice: w.NQAnswers.originalIndex(question, chosen), optionId: w.NQAnswers.optionId(question, chosen), cat: question.c}],
      ...(bindings ? {questionRevisionBindings: [historical.binding]} : {}), startTime: Date.now() - 1000, savedAt: Date.now()};
    const raw = JSON.stringify(saved); localStorage.setItem(key, raw);
    return {raw, saved, references: historical.references, release: historical.release};
  }, {qid: affected[0], bindings, key: EXAM});
}
test('legacy reference-only save remains ambiguous and preserves its original bytes and grade', async ({page}) => {
  const fixture = await installHistoricalSave(page, false);
  await openExam(page);
  await page.getByRole('button', {name: 'Retomar prova', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Prova preservada', exact: true})).toBeVisible();
  expect(await page.evaluate(() => (0, eval)('_examState'))).toBeNull();
  await expect(page.locator('#examTimer')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), EXAM)).toBe(fixture.raw);
});
test('explicit published historical binding preserves the recorded answer and archived card', async ({page}) => {
  const fixture = await installHistoricalSave(page, true);
  await openExam(page);
  await saveIdle(page);
  const before = await storageBytes(page);
  await page.getByRole('button', {name: 'Retomar prova', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Questão 1 de 1', exact: true})).toBeVisible();
  await expect(page.locator('[data-question-revision="historical"]')).toContainText('versão ' + fixture.release);
  await expect(page.locator('.nq-exam-veredito')).toHaveText('Correto.');
  const state = await page.evaluate(() => {
    const state = (0, eval)('_examState');
    return {questions: state.questions, answers: state.answers, bindings: state.questionRevisionBindings,
      references: state.revisionViews[0].references, historical: state.revisionViews[0].historical};
  });
  expect(state.questions).toEqual(fixture.saved.questions);
  expect(state.answers).toEqual(fixture.saved.answers);
  expect(state.bindings).toEqual((fixture.saved as any).questionRevisionBindings);
  expect(state.references).toEqual(fixture.references);
  expect(state.historical).toBe(true);
  await saveIdle(page);
  expect(await storageBytes(page)).toEqual(before);
});
