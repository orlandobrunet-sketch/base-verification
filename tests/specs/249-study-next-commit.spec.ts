import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank, technicalQuestionBundle } from '../helpers/technical-question-bank';

const STUDY = 'nefroquest-study-state';
const CREDIT_KEYS = ['nefroquest-detailed-stats', 'nefroquest-sr-data', 'nefroquest-comp-stats'];
const NOTICE = 'Não foi possível salvar o avanço. Tente novamente ou recarregue para conferir o estudo salvo.';
const authors = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => ({
  qid: `${prefix}-${index}`, t: 'Fluxo técnico', cat: 'geral',
  q: `Questão técnica ${prefix} ${index}: escolha uma alternativa.`,
  opts: ['Alternativa técnica A', 'Alternativa técnica B', 'Alternativa técnica C', 'Alternativa técnica D'],
  ans: index % 4, exp: 'Explicação exclusivamente técnica para verificar a confirmação do avanço.',
}));
const runtimeErrors = new WeakMap<BrowserContext, string[]>();

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

test.beforeEach(async ({ context, baseURL }) => {
  const errors: string[] = [];
  runtimeErrors.set(context, errors);
  const observe = (page: Page) => page.on('pageerror', error => errors.push(error.message));
  context.pages().forEach(observe);
  context.on('page', observe);
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => {
    const request = route.request();
    return request.method() === 'GET' && new URL(request.url()).origin === origin &&
      !['image', 'media', 'font'].includes(request.resourceType()) ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
});

test.afterEach(async ({ context }, info) => {
  await info.attach('study-next-runtime', { contentType: 'application/json',
    body: JSON.stringify({ errors: runtimeErrors.get(context) }) });
  if (info.status === info.expectedStatus) expect(runtimeErrors.get(context)).toEqual([]);
});

async function startStudy(page: Page, prefix: string, count: number) {
  await routeTechnicalQuestionBank(page, authors(prefix, count));
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  const guest = page.locator('[data-portal-route="guest"]');
  if (await guest.isVisible()) await guest.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.evaluate(() => (window as any)._loadTopics());
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="study"]:visible').click();
  await page.locator('[data-action="startFreeStudyMode"]').click();
  await expect(page.locator('#studyOptions button:not(:disabled)')).toHaveCount(4);
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}

async function answer(page: Page) {
  await page.locator('#studyOptions button').first().click();
  await expect(page.locator('#studyFeedback')).toBeVisible();
  await expect(page.locator('#studyOptions button:disabled')).toHaveCount(4);
}

async function next(page: Page, input: 'clique' | 'Enter' = 'clique') {
  const button = page.locator('#studyModePage [data-action="nextStudyQuestion"]');
  if (input === 'Enter') await button.press('Enter');
  else await button.click();
}

async function snapshot(page: Page) {
  return page.evaluate(({ key, creditKeys }) => ({
    runtime: (0, eval)(`({index:studyModeIndex,correct:studyModeCorrect,wrong:studyModeWrong,
      active:studyModeActive,consultationOnly:_studyConsultationOnly,
      questions:studyModeQuestions.map(q=>q.qid),answers:_studyAnswers,
      axisStats:_studyAxisStats,expectedRaw:_studySavedRaw})`),
    raw: localStorage.getItem(key),
    credit: Object.fromEntries(creditKeys.map(name => [name, localStorage.getItem(name)])),
    title: document.querySelector('.nq-study-question-title')?.textContent,
  }), { key: STUDY, creditKeys: CREDIT_KEYS });
}

async function assertHeldCorrection(page: Page, before: Awaited<ReturnType<typeof snapshot>>, after: Awaited<ReturnType<typeof snapshot>>) {
  expect(after.runtime).toEqual(before.runtime);
  expect(after.raw).toBe(before.raw);
  expect(after.credit).toEqual(before.credit);
  expect(after.title).toBe(before.title);
  const feedback = page.locator('#studyFeedback');
  await expect(feedback).toBeVisible();
  await expect(feedback).toBeInViewport();
  expect(await feedback.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await expect(page.locator('#studyOptions button:disabled')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Estudo concluído', exact: true })).toHaveCount(0);
  await expect(page.locator('.nq-toast').last()).toContainText(NOTICE);
}

async function refuseStudyWrite(page: Page) {
  await page.evaluate(key => {
    const originalSet = Storage.prototype.setItem;
    const originalGet = Storage.prototype.getItem;
    const originalRemove = Storage.prototype.removeItem;
    const attempts: string[] = [];
    const replacement = function(this: Storage, name: string, value: string) {
      if (this === localStorage && name === key) {
        attempts.push(String(value));
        throw new DOMException('Technical refusal of the next-index commit', 'QuotaExceededError');
      }
      return originalSet.call(this, name, value);
    };
    (window as any).__studyNextWriteRefusal = { originalSet, originalGet, originalRemove, replacement, attempts };
    Storage.prototype.setItem = replacement;
  }, STUDY);
}

async function restoreStudyWrite(page: Page) {
  return page.evaluate(() => {
    const state = (window as any).__studyNextWriteRefusal;
    if (!state) return { restored: false, attempts: [] as string[] };
    Storage.prototype.setItem = state.originalSet;
    const result = { attempts: [...state.attempts] as string[],
      restored: Storage.prototype.setItem === state.originalSet && Storage.prototype.getItem === state.originalGet &&
        Storage.prototype.removeItem === state.originalRemove };
    delete (window as any).__studyNextWriteRefusal;
    return result;
  });
}

async function waitForNextReady(page: Page) {
  await page.waitForFunction(() => (0, eval)('_loadingStudyNext === false'));
}

test('Próxima na aba antiga conserva a correção e a sessão respondida na outra aba', async ({ page, context }, info) => {
  await startStudy(page, 'study-next-a', 2);
  await answer(page);
  const originalA = await snapshot(page);
  const other = await context.newPage();
  await startStudy(other, 'study-next-b', 2);
  await answer(other);
  const before = await snapshot(page);
  const savedB = JSON.parse(before.raw!);
  expect(before.runtime.expectedRaw).toBe(originalA.raw);
  expect([...savedB.questions].sort()).toEqual(['study-next-b-0', 'study-next-b-1']);
  expect(savedB.presentations.filter((entry: any) => entry.answer)).toHaveLength(1);

  await next(page);
  const after = await snapshot(page);
  await info.attach('study-next-concurrent', { contentType: 'application/json',
    body: JSON.stringify({ originalA, before, after }) });
  await assertHeldCorrection(page, before, after);
  expect(await other.evaluate(key => localStorage.getItem(key), STUDY)).toBe(before.raw);

  await next(other);
  await expect(other.locator('#studyProgress')).toHaveText('2');
  await expect(other.locator('#studyOptions button:not(:disabled)')).toHaveCount(4);
  await answer(other);
  const continued = await snapshot(other);
  const payload = JSON.parse(continued.raw!);
  expect([...payload.questions].sort()).toEqual([...savedB.questions].sort());
  expect(payload.index).toBe(1);
  expect(payload.presentations.filter((entry: any) => entry.answer)).toHaveLength(2);
  expect(continued.runtime.correct + continued.runtime.wrong).toBe(2);
});

for (const { count, input, label } of [
  { count: 2, input: 'clique', label: 'questão intermediária por clique' },
  { count: 1, input: 'Enter', label: 'última questão por Enter' },
] as const) {
  test(`gravação recusada na ${label} mantém a correção e permite tentar novamente`, async ({ page }, info) => {
    await startStudy(page, `study-next-refusal-${count}`, count);
    await answer(page);
    const before = await snapshot(page);
    expect(JSON.parse(before.raw!).index).toBe(0);
    expect(before.runtime.correct + before.runtime.wrong).toBe(1);
    await refuseStudyWrite(page);
    let restored: Awaited<ReturnType<typeof restoreStudyWrite>>;
    try {
      await next(page, input);
      const after = await snapshot(page);
      await info.attach('study-next-refused', { contentType: 'application/json',
        body: JSON.stringify({ count, input, before, after }) });
      await assertHeldCorrection(page, before, after);
    } finally {
      restored = await restoreStudyWrite(page);
      await info.attach('study-next-io-restoration', { contentType: 'application/json', body: JSON.stringify(restored) });
      expect(restored.restored).toBe(true);
    }
    expect(restored.attempts).toHaveLength(1);
    expect(JSON.parse(restored.attempts[0]).index).toBe(1);

    await waitForNextReady(page);
    await next(page, input);
    const committed = await snapshot(page);
    const payload = JSON.parse(committed.raw!);
    expect(committed.runtime.index).toBe(1);
    expect(payload.index).toBe(1);
    expect(payload.presentations.filter((entry: any) => entry.answer)).toHaveLength(1);
    expect(committed.runtime.correct + committed.runtime.wrong).toBe(1);
    expect(committed.credit).toEqual(before.credit);
    if (count === 1) {
      await expect(page.getByRole('heading', { name: 'Estudo concluído', exact: true })).toBeVisible();
    } else {
      await expect(page.locator('#studyProgress')).toHaveText('2');
      await expect(page.locator('#studyOptions button:not(:disabled)')).toHaveCount(4);
      await answer(page);
      const answered = await snapshot(page);
      expect(answered.runtime.correct + answered.runtime.wrong).toBe(2);
      expect(JSON.parse(answered.raw!).presentations.filter((entry: any) => entry.answer)).toHaveLength(2);
    }
  });
}

test('fluxo normal confirma o índice da segunda questão e depois o resultado sem duplicar respostas', async ({ page }, info) => {
  await startStudy(page, 'study-next-normal', 2);
  await answer(page);
  const first = await snapshot(page);
  expect(JSON.parse(first.raw!).index).toBe(0);
  expect(JSON.parse(first.raw!).presentations.filter((entry: any) => entry.answer)).toHaveLength(1);
  await next(page);
  await expect(page.locator('#studyProgress')).toHaveText('2');
  await expect(page.locator('#studyOptions button:not(:disabled)')).toHaveCount(4);
  const second = await snapshot(page);
  expect(second.runtime.index).toBe(1);
  expect(JSON.parse(second.raw!).index).toBe(1);
  expect(second.credit).toEqual(first.credit);
  await answer(page);
  const answered = await snapshot(page);
  expect(answered.runtime.correct + answered.runtime.wrong).toBe(2);
  expect(JSON.parse(answered.raw!).index).toBe(1);
  await waitForNextReady(page);
  await next(page);
  await expect(page.getByRole('heading', { name: 'Estudo concluído', exact: true })).toBeVisible();
  const result = await snapshot(page);
  await info.attach('study-next-normal', { contentType: 'application/json',
    body: JSON.stringify({ first, second, answered, result }) });
  expect(result.runtime.index).toBe(2);
  expect(JSON.parse(result.raw!).index).toBe(2);
  expect(JSON.parse(result.raw!).presentations.filter((entry: any) => entry.answer)).toHaveLength(2);
  expect(result.runtime.correct + result.runtime.wrong).toBe(2);
  expect(result.credit).toEqual(answered.credit);
});

test('consulta histórica escolhida pelo catálogo ambíguo navega até o resultado sem gravar nem creditar', async ({ page }, info) => {
  const bank = authors('study-next-consultation', 2);
  // Two independently authored records share the study presentation. The old
  // published title changes the record digest, so an unbound snapshot really
  // is ambiguous in the production catalog; no consultation flag is injected.
  const oldAuthors = bank.map(author => ({ ...author, t: 'Arquivo técnico anterior' }));
  const oldBundle = technicalQuestionBundle(oldAuthors);
  const history = oldAuthors.map((author, index) => ({
    qid: author.qid, author,
    sources: Object.fromEntries(Object.entries(oldBundle.sources).map(([profile, rows]) =>
      [profile, (rows as any[])[index]])),
    references: {}, release: 'technical-earlier',
    policy: { material: true, pending: 'update-required' },
  }));
  await routeTechnicalQuestionBank(page, bank, {}, history);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  const guest = page.locator('[data-portal-route="guest"]');
  if (await guest.isVisible()) await guest.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.evaluate(() => (window as any)._loadTopics());
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="study"]:visible').click();
  await page.locator('[data-action="startFreeStudyMode"]').click();
  await answer(page);
  await next(page);
  await expect(page.locator('#studyProgress')).toHaveText('2');
  await answer(page);
  await waitForNextReady(page);
  const native = await snapshot(page);
  expect(JSON.parse(native.raw!).presentations.filter((entry: any) => entry.answer)).toHaveLength(2);
  await page.locator('#studyModePage [data-action="exitStudyMode"]').first().click();
  await expect(page.locator('#studyModePage')).toHaveCount(0);

  // Import the real answered v1 snapshot as a legacy review starting at item
  // zero, omitting its record bindings. Sources, answers and grading are the
  // values produced above by the native controller and identity module.
  const seeded = await page.evaluate(({ raw, key }) => {
    const saved = JSON.parse(raw!);
    saved.index = 0;
    saved.presentations.forEach((entry: any) => { delete entry.revisionBinding; });
    const catalog = (0, eval)('_studyRevisionCatalog')();
    const checks = saved.presentations.map((entry: any) => {
      const inspected = catalog.inspect(entry.question, { profile: 'study' });
      const historical = inspected.candidates?.find((candidate: any) => candidate.historical);
      const current = inspected.candidates?.find((candidate: any) => !candidate.historical);
      return { status: inspected.status, candidates: inspected.candidates?.length,
        sourceSame: !!historical && historical.sourceRevision === current?.sourceRevision,
        recordsDistinct: !!historical && historical.binding.recordRevision !== current?.binding.recordRevision };
    });
    const archiveRaw = JSON.stringify(saved);
    localStorage.setItem(key, archiveRaw);
    return { raw: archiveRaw, checks };
  }, { raw: native.raw, key: STUDY });
  expect(seeded.checks).toEqual(Array.from({ length: 2 }, () => ({
    status: 'ambiguous', candidates: 2, sourceSame: true, recordsDistinct: true,
  })));

  const observation = await page.evaluateHandle(keys => {
    const set = Storage.prototype.setItem, remove = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    const writes: { action: string; key?: string }[] = [];
    Storage.prototype.setItem = function(key, value) {
      if (this === localStorage && keys.includes(String(key))) writes.push({ action: 'set', key });
      return set.call(this, key, value);
    };
    Storage.prototype.removeItem = function(key) {
      if (this === localStorage && keys.includes(String(key))) writes.push({ action: 'remove', key });
      return remove.call(this, key);
    };
    Storage.prototype.clear = function() {
      if (this === localStorage) writes.push({ action: 'clear' });
      return clear.call(this);
    };
    return { set, remove, clear, writes };
  }, [STUDY, ...CREDIT_KEYS, 'nq_last_study']);
  try {
    await page.locator('[data-atrium-route="modes"]').click();
    await page.locator('[data-mode-route="study"]:visible').click();
    await page.locator('[data-action="resumeSavedStudyMode"]').click();
    for (const index of [0, 1]) {
      const notice = page.locator('#studyRevisionHold');
      await expect(notice.locator(`[data-action="consultSavedStudyRevision"][data-arg^="${index}|"]`)).toHaveCount(2);
      await notice.getByRole('button', { name: 'Consultar versão histórica (technical-earlier)', exact: true }).click();
    }
    await expect(page.locator('#studyProgress')).toHaveText('1');
    await expect(page.locator('#studyOptions button:disabled')).toHaveCount(4);
    const before = await snapshot(page);
    expect(before.runtime.consultationOnly).toBe(true);
    expect(before.runtime.answers.filter(Boolean)).toHaveLength(2);
    expect(before.runtime.correct).toBe(native.runtime.correct);
    expect(before.runtime.wrong).toBe(native.runtime.wrong);
    expect(before.raw).toBe(seeded.raw);
    expect(before.credit).toEqual(native.credit);
    expect(await page.evaluate(() => (0, eval)('_studyRevisions.every(revision => revision.historical)'))).toBe(true);

    await next(page);
    await expect(page.locator('#studyProgress')).toHaveText('2');
    await expect(page.locator('#studyOptions button:disabled')).toHaveCount(4);
    const second = await snapshot(page);
    expect(second.runtime.index).toBe(1);
    expect(second.runtime.answers).toEqual(before.runtime.answers);
    expect(second.raw).toBe(seeded.raw);
    expect(second.credit).toEqual(before.credit);
    await waitForNextReady(page);
    await next(page);
    await expect(page.getByRole('heading', { name: 'Estudo concluído', exact: true })).toBeVisible();
    const result = await snapshot(page);
    await info.attach('study-next-read-only-consultation', { contentType: 'application/json',
      body: JSON.stringify({ native, seeded, before, second, result }) });
    expect(result.runtime.index).toBe(2);
    expect(result.runtime.consultationOnly).toBe(true);
    expect(result.runtime.answers).toEqual(before.runtime.answers);
    expect(result.runtime.correct).toBe(before.runtime.correct);
    expect(result.runtime.wrong).toBe(before.runtime.wrong);
    expect(result.raw).toBe(seeded.raw);
    expect(result.credit).toEqual(before.credit);
    expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  } finally {
    const probe = await observation.evaluate(state => {
      Storage.prototype.setItem = state.set;
      Storage.prototype.removeItem = state.remove;
      Storage.prototype.clear = state.clear;
      return { writes: state.writes, restored: Storage.prototype.setItem === state.set &&
        Storage.prototype.removeItem === state.remove && Storage.prototype.clear === state.clear };
    });
    await observation.dispose();
    await info.attach('study-next-read-only-writes', { contentType: 'application/json', body: JSON.stringify(probe) });
    expect(probe.restored).toBe(true);
    expect(probe.writes).toEqual([]);
  }
});
