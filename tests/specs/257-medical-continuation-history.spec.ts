import {test, expect, type Page} from '@playwright/test';

// Actual published records from the parent release. Only local saves are synthetic;
// the bank, catalog, revision helpers and native Guest navigation remain intact.
const ARCHIVED_RELEASE = '17.11';
const KEY = 'nefroquest-exam-state';
const REWRITTEN = [
  '02814d6c', '0c1d09c3', '0e1a838d', '12328a3e', '18784ef8', '1b4ebca6', '23635484',
  '236ed8f1', '26804856', '3a01ea4b', '3e0788ac', '4b27ea54', '4c7566cf', '4decf9f9',
  '5d6677ab', '5e5b8558', '5eb00a6e', '66b811c3', '68091841', '69177b72', '795d4589',
  '9961a406', '9fadb7da', '9fd2cfdb', 'b1b484d1', 'b7a93d7a', 'c1089f2e', 'cb6c4aae',
  'ce79d609', 'd314fb0a', 'd81defbb', 'ddb4938a', 'e3246f2c', 'ea37c153', 'ee80e444',
  'f3ab76f3', 'f4de7965', 'f7107bc3', 'f7fd9e8a', 'faac594e', 'fe70507d', 'ff676013',
];
const PROGRESS_KEYS = ['nefroquest-save-v7', 'nefroquest-save', 'nefroquest-stats',
  'nefroquest-detailed-stats', 'nefroquest-sr-data', 'nefroquest-mastered',
  'nefroquest-mastered-ids', 'unlockedArticles', 'nq-unlocked-refs'];
const evidence = new WeakMap<Page, {errors: string[]; blocked: string[]; fixture?: unknown}>();
test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'reduce'}});
test.setTimeout(60000);

async function enterGuest(page: Page) {
  const control = page.locator('[data-portal-route="guest"]');
  if (await control.isVisible()) await control.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.waitForFunction(() => typeof (window as any)._loadTopics === 'function');
  await page.evaluate(() => (window as any)._loadTopics());
  await page.waitForFunction(() => (window as any).questionBank?.length === 741 &&
    typeof (window as any).questionRevisionCatalog?.current === 'function');
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
}
test.beforeEach(async ({page, context, baseURL}) => {
  const origin = new URL(baseURL || 'http://localhost:5500').origin;
  expect(['localhost', '127.0.0.1', 'nefroquest.com']).toContain(new URL(origin).hostname);
  const report = {errors: [] as string[], blocked: [] as string[], fixture: undefined as unknown};
  evidence.set(page, report);
  page.on('pageerror', error => report.errors.push(error.message));
  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === 'GET' && url.origin === origin &&
        !['media', 'font'].includes(request.resourceType())) return route.continue();
    report.blocked.push(request.method() + ' ' + url.origin + url.pathname);
    return route.abort();
  });
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await enterGuest(page);
});
test.afterEach(async ({page}, info) => {
  await info.attach('medical-continuation-history', {contentType: 'application/json', body: JSON.stringify({
    ...evidence.get(page), viewport: page.viewportSize(), status: info.status,
    storageWrites: await page.evaluate(() => (window as any).__continuationStorageWrites || []),
  }, null, 2)});
  expect(evidence.get(page)?.errors).toEqual([]);
  expect(evidence.get(page)?.blocked.filter(value => !value.startsWith('GET '))).toEqual([]);
});

function installWriteProbe(keys: string[]) {
  const w = window as any, set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
  w.__continuationStorageWrites = [];
  Storage.prototype.setItem = function (key, value) {
    if (this === localStorage && keys.includes(key)) w.__continuationStorageWrites.push({action: 'set', key});
    return set.call(this, key, value);
  };
  Storage.prototype.removeItem = function (key) {
    if (this === localStorage && keys.includes(key)) w.__continuationStorageWrites.push({action: 'remove', key});
    return remove.call(this, key);
  };
}
async function watchSavedProgress(page: Page) {
  const keys = [KEY, ...PROGRESS_KEYS];
  await page.addInitScript(installWriteProbe, keys);
  await page.evaluate(installWriteProbe, keys);
}
async function progress(page: Page) {
  return page.evaluate(keys => ({
    storage: Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])),
    journey: JSON.parse((0, eval)('JSON.stringify({xp:state.xp,gold:state.gold,score:state.score,' +
      'correctTotal:state.correctTotal,journeyAnswerOrdinal:state.journeyAnswerOrdinal,classBenefits:state.classBenefits})')),
  }), PROGRESS_KEYS);
}
async function settleSaveTimer(page: Page) {
  const since = Date.now();
  await page.waitForFunction(start => Date.now() - start >= 900 && (0, eval)('_saveTimer === null'), since);
}
async function seed(page: Page, qid: string, answered: boolean, binding = true) {
  const fixture = await page.evaluate(({qid, answered, binding, key, release}) => {
    const w = window as any;
    const matches = w.NQQuestionRevisionHistory.filter((row: any) => row.qid === qid && row.release === release);
    if (matches.length !== 1) throw Error('Expected one actual published archive: ' + release + ':' + qid);
    const old = matches[0], current = w.questionRevisionCatalog.current(qid, 'exam');
    const question = w.NQAnswers.present(old.sources.exam, {preserveOrder: true});
    const saved = {questions: [question], idx: 0,
      answers: answered ? [{qId: qid, correct: true, chosen: question.a, answered: true,
        authoredChoice: w.NQAnswers.originalIndex(question, question.a),
        optionId: w.NQAnswers.optionId(question, question.a), cat: question.c}] : [],
      ...(binding ? {questionRevisionBindings: [old.bindings.exam]} : {}),
      startTime: Date.now() - 1000, savedAt: Date.now()};
    const raw = JSON.stringify(saved); localStorage.setItem(key, raw);
    return {raw, saved, old, current};
  }, {qid, answered, binding, key: KEY, release: ARCHIVED_RELEASE});
  evidence.get(page)!.fixture = fixture;
  await watchSavedProgress(page);
  return fixture;
}
async function openSaved(page: Page) {
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="exam"]:visible').click();
  await expect(page.locator('#examPage')).toBeVisible();
  await page.getByRole('button', {name: 'Retomar prova', exact: true}).click();
}

test('actual 17.11 archive contains precisely the approved42 plus the card-only consumer in all four profiles', async ({page}, info) => {
  const report = await page.evaluate(release => {
    const w = window as any, api = w.NQQuestionRevisions;
    const archive = w.NQQuestionRevisionHistory.filter((row: any) => row.release === release);
    const rewritten = archive.filter((old: any) =>
      api.digest(old.author) !== api.digest(w.questionRevisionCatalog.current(old.qid, 'main').author));
    const rows = archive.flatMap((old: any) => ['main', 'exam', 'study', 'offline'].map(profile => {
      const question = w.NQAnswers.present(old.sources[profile], {preserveOrder: true});
      const checked = w.questionRevisionCatalog.inspect(question, {profile, binding: old.bindings[profile]});
      const unbound = w.questionRevisionCatalog.inspect(question, {profile});
      const current = w.questionRevisionCatalog.current(old.qid, profile);
      return {qid: old.qid, profile, status: checked.status, historical: checked.value?.historical,
        release: checked.value?.release,
        sourceExact: api.digest(checked.value?.source) === api.digest(old.sources[profile]),
        authorExact: api.digest(checked.value?.author) === api.digest(old.author),
        cardsExact: api.digest(checked.value?.references) === api.digest(old.references),
        bindingExact: api.digest(checked.value?.binding) === api.digest(old.bindings[profile]),
        currentSeparate: current.binding.recordRevision !== old.bindings[profile].recordRevision,
        policy: checked.value?.policy, unboundStatus: unbound.status,
        unboundHistorical: unbound.value?.historical};
    }));
    const ddb = archive.find((row: any) => row.qid === 'ddb4938a');
    const cardOnly = archive.find((row: any) => row.qid === '5530b59c');
    const currentCardOnly = w.questionRevisionCatalog.current('5530b59c', 'exam');
    return {totalHistory: w.NQQuestionRevisionHistory.length, qids: archive.map((row: any) => row.qid).sort(),
      rewrittenQids: rewritten.map((row: any) => row.qid).sort(), rows,
      retiredCardStored: !!ddb?.references.kdigo_igan_2021,
      retiredCardCurrent: Object.hasOwn((0, eval)('refsDB'), 'kdigo_igan_2021'),
      cardOnlySourceUnchanged: api.digest(cardOnly?.sources.exam) === api.digest(currentCardOnly.source),
      cardOnlySummaryChanged: api.digest(cardOnly?.references.moeller_plosone_2014) !==
        api.digest(currentCardOnly.references.moeller_plosone_2014)};
  }, ARCHIVED_RELEASE);
  expect(new Set(REWRITTEN).size).toBe(42);
  expect(report.totalHistory).toBe(169);
  expect(report.qids).toEqual([...REWRITTEN, '5530b59c'].sort());
  expect(report.rewrittenQids).toEqual(REWRITTEN);
  expect(report.rows).toHaveLength(172);
  for (const row of report.rows) {
    expect(row).toMatchObject({status: 'known', historical: true, release: ARCHIVED_RELEASE,
      sourceExact: true, authorExact: true, cardsExact: true, bindingExact: true, currentSeparate: true,
      policy: {material: true, pending: 'update-required', answered: 'historical'}});
    if (row.qid === '5530b59c') expect(row.unboundStatus).toBe('ambiguous');
    else expect(row).toMatchObject({unboundStatus: 'known', unboundHistorical: true});
  }
  expect(report).toMatchObject({retiredCardStored: true, retiredCardCurrent: false,
    cardOnlySourceUnchanged: true, cardOnlySummaryChanged: true});
  await info.attach('actual-17.11-43-records-172-bindings', {contentType: 'application/json', body: JSON.stringify(report)});
});

for (const binding of [true, false]) {
  test(`answered retired-card question stays historical ${binding ? 'with' : 'without'} binding and earns no second credit`, async ({page}) => {
    const fixture = await seed(page, 'ddb4938a', true, binding), before = await progress(page);
    expect(fixture.old.references.kdigo_igan_2021).toBeTruthy();
    expect(fixture.current.references.kdigo_igan_2021).toBeUndefined();
    await openSaved(page);
    await expect(page.locator('[data-question-revision="historical"]')).toContainText('versão ' + ARCHIVED_RELEASE);
    await expect(page.locator('.nq-exam-enunciado')).toHaveText(fixture.old.sources.exam.q);
    const view = await page.evaluate(() => {
      const s = (0, eval)('_examState');
      return {questions: s.questions, answers: s.answers, references: s.revisionViews[0].references,
        historical: s.revisionViews[0].historical};
    });
    expect(view).toEqual({questions: fixture.saved.questions, answers: fixture.saved.answers,
      references: fixture.old.references, historical: true});
    await page.getByRole('button', {name: 'Ver resultado', exact: true}).click();
    await expect(page.locator('#examResultado')).toContainText('100%');
    await expect(page.locator('.nq-exam-revisao-demais')).toContainText(fixture.old.sources.exam.e);
    await settleSaveTimer(page);
    expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(fixture.raw);
    expect(await progress(page)).toEqual(before);
    expect(await page.evaluate(() => (window as any).__continuationStorageWrites)).toEqual([]);
  });
}

test('answered card-only save uses its bound old summary through result and reload without a second credit', async ({page}) => {
  const fixture = await seed(page, '5530b59c', true), before = await progress(page);
  expect(fixture.current.source).toEqual(fixture.old.sources.exam);
  expect(fixture.current.references.moeller_plosone_2014).not.toEqual(fixture.old.references.moeller_plosone_2014);
  await openSaved(page);
  await expect(page.locator('[data-question-revision="historical"]')).toContainText('versão ' + ARCHIVED_RELEASE);
  expect(await page.evaluate(() => (0, eval)('_examState.revisionViews[0].references'))).toEqual(fixture.old.references);
  await page.getByRole('button', {name: 'Ver resultado', exact: true}).click();
  await expect(page.locator('#examResultado')).toContainText('100%');
  await settleSaveTimer(page);
  expect(await progress(page)).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(fixture.raw);
  expect(await page.evaluate(() => (window as any).__continuationStorageWrites)).toEqual([]);
  await page.reload({waitUntil: 'domcontentloaded'});
  await enterGuest(page);
  await openSaved(page);
  expect(await page.evaluate(() => (0, eval)('_examState.revisionViews[0].references'))).toEqual(fixture.old.references);
  await settleSaveTimer(page);
  expect(await progress(page)).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(fixture.raw);
  expect(await page.evaluate(() => (window as any).__continuationStorageWrites)).toEqual([]);
});

test('card-only save without binding stays preserved instead of guessing either summary or crediting it again', async ({page}) => {
  const fixture = await seed(page, '5530b59c', true, false), before = await progress(page);
  await openSaved(page);
  await expect(page.getByRole('heading', {name: 'Prova preservada', exact: true})).toBeVisible();
  expect(await page.evaluate(() => (0, eval)('_examState'))).toBeNull();
  await settleSaveTimer(page);
  expect(await progress(page)).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(fixture.raw);
  expect(await page.evaluate(() => (window as any).__continuationStorageWrites)).toEqual([]);
});

test('pending retired-card answer changes revision only after the native confirmation, preserving prior raw and progress', async ({page}) => {
  const fixture = await seed(page, 'ddb4938a', false), before = await progress(page);
  await openSaved(page);
  await expect(page.locator('[data-question-revision="historical"]')).toContainText('Confirme a versão atual');
  await expect(page.locator('#examOpts button:enabled')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(fixture.raw);
  await page.locator('[data-action="_examUseCurrentRevision"]').click();
  await expect(page.locator('.nq-exam-enunciado')).toHaveText(fixture.current.source.q);
  await expect(page.locator('#examOpts button:enabled')).toHaveCount(4);
  const state = await page.evaluate(key => {
    const w = window as any, s = (0, eval)('_examState');
    const raw = localStorage.getItem(key), saved = JSON.parse(raw!);
    return {binding: s.questionRevisionBindings[0], historical: s.revisionViews[0].historical,
      source: w.NQAnswers.restore(s.questions[0])?._answerPresentation?.sourceQuestion,
      references: s.revisionViews[0].references, answers: s.answers,
      originalRaw: saved.questionRevisionOriginalRaw, origins: saved.questionRevisionOrigins, raw};
  }, KEY);
  expect(state.binding).toEqual(fixture.current.binding);
  expect(state.historical).toBe(false);
  expect(state.source).toEqual(fixture.current.source);
  expect(state.references).toEqual(fixture.current.references);
  expect(state.references.kdigo_igan_2021).toBeUndefined();
  expect(state.answers).toEqual(fixture.saved.answers);
  expect(state.originalRaw).toBe(fixture.raw);
  expect(state.origins).toHaveLength(1);
  expect(state.origins[0]).toMatchObject({index: 0, question: fixture.saved.questions[0], binding: fixture.old.bindings.exam});
  expect(state.raw).not.toBe(fixture.raw);
  expect(await progress(page)).toEqual(before);
  expect((await page.evaluate(() => (window as any).__continuationStorageWrites))
    .filter((entry: any) => entry.key !== KEY)).toEqual([]);
});
