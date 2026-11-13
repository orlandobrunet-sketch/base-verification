import {test, expect, type Page} from '@playwright/test';

// Synthetic saves use the real published 17.09 archive. No product function or bank is replaced.
const KEY = 'nefroquest-exam-state';
const evidence = new WeakMap<Page, {errors: string[]; blocked: string[]; fixture?: unknown}>();
test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'reduce'}});
test.beforeEach(async ({page, context, baseURL}) => {
  const origin = new URL(baseURL || 'http://localhost:5500').origin;
  expect(['localhost', '127.0.0.1', 'nefroquest.com']).toContain(new URL(origin).hostname);
  const report = {errors: [] as string[], blocked: [] as string[], fixture: undefined as unknown};
  evidence.set(page, report);
  page.on('pageerror', error => report.errors.push(error.message));
  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    if (req.method() === 'GET' && url.origin === origin && !['media', 'font'].includes(req.resourceType())) return route.continue();
    report.blocked.push(req.method() + ' ' + url.origin + url.pathname);
    return route.abort();
  });
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.waitForFunction(() => typeof (window as any)._loadTopics === 'function');
  await page.evaluate(() => (window as any)._loadTopics());
  await page.waitForFunction(() => (window as any).questionBank?.length === 741 &&
    typeof (window as any).questionRevisionCatalog?.current === 'function');
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
});
test.afterEach(async ({page}, info) => {
  await info.attach('medical-revision-history', {contentType: 'application/json', body: JSON.stringify({
    ...evidence.get(page), viewport: page.viewportSize(), status: info.status,
  }, null, 2)});
  expect(evidence.get(page)?.errors).toEqual([]);
  expect(evidence.get(page)?.blocked.filter(value => !value.startsWith('GET '))).toEqual([]);
});
async function seed(page: Page, qid: string, answered: boolean, binding = true) {
  const fixture = await page.evaluate(({qid, answered, binding, key}) => {
    const w = window as any;
    const old = w.NQQuestionRevisionHistory.find((entry: any) => entry.qid === qid && entry.release === '17.09');
    if (!old) throw Error('Missing trusted published archive: ' + qid);
    const question = w.NQAnswers.present(old.sources.exam, {preserveOrder: true});
    const saved = {questions: [question], idx: 0,
      answers: answered ? [{qId: qid, correct: true, chosen: question.a, answered: true,
        authoredChoice: w.NQAnswers.originalIndex(question, question.a), optionId: w.NQAnswers.optionId(question, question.a), cat: question.c}] : [],
      ...(binding ? {questionRevisionBindings: [old.bindings.exam]} : {}),
      startTime: Date.now() - 1000, savedAt: Date.now()};
    const raw = JSON.stringify(saved); localStorage.setItem(key, raw);
    return {raw, saved, old, current: w.questionRevisionCatalog.current(qid, 'exam')};
  }, {qid, answered, binding, key: KEY});
  evidence.get(page)!.fixture = fixture;
  return fixture;
}
async function openSaved(page: Page) {
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="exam"]:visible').click();
  await expect(page.locator('#examPage')).toBeVisible();
  await page.getByRole('button', {name: 'Retomar prova', exact: true}).click();
}
for (const qid of ['32661acb', '67035e0e']) {
  test('answered ' + qid + ' keeps the saved grade, wording and complete previous reference cards', async ({page}) => {
    const fixture = await seed(page, qid, true);
    await openSaved(page);
    await expect(page.locator('[data-question-revision="historical"]')).toContainText('versão 17.09');
    await expect(page.locator('.nq-exam-enunciado')).toHaveText(fixture.old.sources.exam.q);
    const state = await page.evaluate(() => {
      const s = (0, eval)('_examState');
      return {questions: s.questions, answers: s.answers, references: s.revisionViews[0].references, historical: s.revisionViews[0].historical};
    });
    expect(state.questions).toEqual(fixture.saved.questions);
    expect(state.answers).toEqual(fixture.saved.answers);
    expect(state.references).toEqual(fixture.old.references);
    expect(state.historical).toBe(true);
    await page.getByRole('button', {name: 'Ver resultado', exact: true}).click();
    await expect(page.locator('#examResultado')).toContainText('100%');
    await expect(page.locator('.nq-exam-revisao-demais')).toContainText(fixture.old.sources.exam.e);
    const since = Date.now();
    await page.waitForFunction(start => Date.now() - start >= 900 && (0, eval)('_saveTimer === null'), since);
    expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(fixture.raw);
  });
}
test('pending old answer requires explicit current-content confirmation before enabling the revised alternatives', async ({page}) => {
  const fixture = await seed(page, '32661acb', false);
  await openSaved(page);
  await expect(page.locator('[data-question-revision="historical"]')).toContainText('Confirme a versão atual');
  await expect(page.locator('#examOpts button:enabled')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(fixture.raw);
  await page.locator('[data-action="_examUseCurrentRevision"]').click();
  await expect(page.locator('.nq-exam-enunciado')).toHaveText(fixture.current.source.q);
  await expect(page.locator('#examOpts button:enabled')).toHaveCount(4);
  const bound = await page.evaluate(() => {
    const s = (0, eval)('_examState');
    const presentation = (window as any).NQAnswers.restore(s.questions[0]);
    return {binding: s.questionRevisionBindings[0], historical: s.revisionViews[0].historical,
      source: presentation?._answerPresentation?.sourceQuestion, references: s.revisionViews[0].references};
  });
  expect(bound.binding).toEqual(fixture.current.binding);
  expect(bound.historical).toBe(false);
  expect(bound.source).toEqual(fixture.current.source);
  expect(bound.references).toEqual(fixture.current.references);
  await page.getByRole('button', {name: fixture.current.source.o[fixture.current.source.a], exact: true}).click();
  await page.getByRole('button', {name: 'Ver resultado', exact: true}).click();
  await expect(page.locator('#examResultado')).toContainText('100%');
});
test('a card-only legacy save without revision binding is held rather than silently assigned the new summary', async ({page}) => {
  const fixture = await seed(page, '061c9bcb', true, false);
  expect(fixture.current.source).toEqual(fixture.old.sources.exam);
  expect(fixture.current.references).not.toEqual(fixture.old.references);
  await openSaved(page);
  await expect(page.getByRole('heading', {name: 'Prova preservada', exact: true})).toBeVisible();
  expect(await page.evaluate(() => (0, eval)('_examState'))).toBeNull();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(fixture.raw);
});
