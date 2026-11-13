import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

const STUDY = 'nefroquest-study-state';
const authors = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => ({
  qid: `${prefix}-${index}`, t: 'Fluxo técnico', cat: 'geral',
  q: `Questão técnica ${prefix} ${index}: escolha uma alternativa.`,
  opts: ['Alternativa técnica A', 'Alternativa técnica B', 'Alternativa técnica C', 'Alternativa técnica D'],
  ans: index % 4, exp: 'Explicação técnica para verificar a conservação da sessão de estudo.',
}));
const firstSession = authors('study-concurrent-a', 1);
const secondSession = authors('study-concurrent-b', 2);
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
  await info.attach('study-concurrent-runtime', {
    contentType: 'application/json', body: JSON.stringify({ errors: runtimeErrors.get(context) }),
  });
  if (info.status === info.expectedStatus) expect(runtimeErrors.get(context)).toEqual([]);
});

async function startStudy(page: Page, bank: ReturnType<typeof authors>) {
  await routeTechnicalQuestionBank(page, bank);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  const guest = page.locator('[data-portal-route="guest"]');
  if (await guest.isVisible()) await guest.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.evaluate(() => (window as any)._loadTopics());
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="study"]:visible').click();
  await page.locator('[data-action="startFreeStudyMode"]').click();
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
}

async function answer(page: Page, wrong = false) {
  const option = wrong
    ? await page.evaluate(() => (0, eval)('(_studyPresentations[studyModeIndex].a + 1) % 4')) : 0;
  await page.locator('#studyOptions button').nth(option).click();
  await expect(page.locator('#studyFeedback')).toBeVisible();
  await expect(page.locator('#studyOptions button:disabled')).toHaveCount(4);
}

async function rawStudy(page: Page) {
  return page.evaluate(key => localStorage.getItem(key), STUDY);
}

async function completeStudy(page: Page) {
  await page.locator('[data-action="nextStudyQuestion"]').click();
  await expect(page.getByRole('heading', { name: 'Estudo concluído', exact: true })).toBeVisible();
}

async function newAnsweredSession(context: BrowserContext) {
  const other = await context.newPage();
  await startStudy(other, secondSession);
  await answer(other);
  const raw = await rawStudy(other);
  expect(raw).not.toBeNull();
  const saved = JSON.parse(raw!);
  expect([...saved.questions].sort()).toEqual(['study-concurrent-b-0', 'study-concurrent-b-1']);
  expect(saved.presentations.filter((entry: any) => entry.answer)).toHaveLength(1);
  return { other, raw, saved };
}

async function continueOtherSession(other: Page, saved: any) {
  await other.locator('[data-action="nextStudyQuestion"]').click();
  await expect(other.locator('#studyProgress')).toHaveText('2');
  await answer(other);
  const continued = JSON.parse((await rawStudy(other))!);
  expect([...continued.questions].sort()).toEqual([...saved.questions].sort());
  expect(continued.presentations.filter((entry: any) => entry.answer)).toHaveLength(2);
}

async function studyRuntime(page: Page) {
  return page.evaluate(() => (0, eval)(`({
    index: studyModeIndex, correct: studyModeCorrect, wrong: studyModeWrong,
    active: studyModeActive, questions: studyModeQuestions.map(q => q.qid),
    answers: _studyAnswers, axisStats: _studyAxisStats, expectedRaw: _studySavedRaw
  })`));
}

async function offerReplacement(page: Page, action: 'restartStudyMode' | 'startReinforcementSession') {
  if (action === 'startReinforcementSession') {
    // Only the real renderer is invoked with a technical ready response to make
    // its native button available to a Guest. No function is replaced, and the
    // weak area comes from the native wrong answer. Authentication and the AI
    // service are deliberately outside this navigation/storage regression.
    await page.evaluate(() => (0, eval)('_desenharDiagnostico')({
      estado: 'pronto', texto: 'Resultado exclusivamente técnico para testar a ação de reforço.',
    }));
  }
  await expect(page.locator(`#studyModePage [data-action="${action}"]`)).toBeVisible();
}

for (const exitFrom of ['correção', 'resultado'] as const) {
  test(`sair da tela de ${exitFrom} de uma aba antiga preserva a sessão respondida na outra aba`, async ({ page, context }, info) => {
    await startStudy(page, firstSession);
    await answer(page);
    if (exitFrom === 'resultado') {
      await completeStudy(page);
    }
    const rawA = await rawStudy(page);
    expect(rawA).not.toBeNull();
    expect(JSON.parse(rawA!).questions).toEqual(['study-concurrent-a-0']);

    // The pages deliberately share a context: both native sessions use the same
    // origin storage, as two tabs of one visitor do. Each bank is technical.
    const { other, raw: rawB, saved: savedB } = await newAnsweredSession(context);
    expect(rawB).not.toBe(rawA);

    await page.locator('#studyModePage [data-action="exitStudyMode"]').first().click();
    await expect(page.locator('#studyModePage')).toHaveCount(0);
    const afterOldExit = await rawStudy(other);
    await info.attach('study-concurrent-clear', { contentType: 'application/json',
      body: JSON.stringify({ exitFrom, rawA, rawB, afterOldExit }) });
    expect(afterOldExit, 'Leaving the old tab must not delete the newer answered session').toBe(rawB);

    // The protected session remains writable through its native next/answer flow.
    await continueOtherSession(other, savedB);
  });
}

test('sair de uma sessão concluída sem outra aba ainda limpa o próprio estudo salvo', async ({ page }, info) => {
  await startStudy(page, firstSession);
  await answer(page);
  await completeStudy(page);
  const beforeExit = await rawStudy(page);
  expect(beforeExit).not.toBeNull();
  expect(JSON.parse(beforeExit!).index).toBe(1);
  await page.locator('#studyModePage [data-action="exitStudyMode"]').first().click();
  await expect(page.locator('#studyModePage')).toHaveCount(0);
  const afterExit = await rawStudy(page);
  await info.attach('study-own-clear', { contentType: 'application/json',
    body: JSON.stringify({ beforeExit, afterExit }) });
  expect(afterExit).toBeNull();
});

for (const action of ['restartStudyMode', 'startReinforcementSession'] as const) {
  test(`${action} na aba antiga não substitui a sessão respondida na outra aba`, async ({ page, context }, info) => {
    await startStudy(page, firstSession);
    await answer(page, true);
    await completeStudy(page);
    await offerReplacement(page, action);
    const before = await studyRuntime(page);
    const { other, raw: rawB, saved: savedB } = await newAnsweredSession(context);

    await page.locator(`#studyModePage [data-action="${action}"]`).click();
    const afterRaw = await rawStudy(other);
    const after = await studyRuntime(page);
    await info.attach('study-concurrent-replacement', { contentType: 'application/json',
      body: JSON.stringify({ action, before, after, rawB, afterRaw,
        diagnosisRendererOnly: action === 'startReinforcementSession' }) });
    expect(afterRaw, 'An old result must not replace another tab\'s answered session').toBe(rawB);
    expect(after).toEqual(before);
    await expect(page.getByRole('heading', { name: 'Estudo concluído', exact: true })).toBeVisible();
    await expect(page.locator('.nq-toast').last()).toContainText(/estudo|sessão/i);
    await expect(page.locator('.nq-toast').last()).toContainText(/outra aba|recarreg/i);
    await continueOtherSession(other, savedB);
  });

  test(`${action} sem conflito continua criando uma sessão respondível`, async ({ page }, info) => {
    await startStudy(page, firstSession);
    await answer(page, true);
    await completeStudy(page);
    await offerReplacement(page, action);
    const oldRaw = await rawStudy(page);
    await page.locator(`#studyModePage [data-action="${action}"]`).click();
    await expect(page.locator('#studyOptions button:not(:disabled)')).toHaveCount(4);
    await expect(page.locator('#studyProgress')).toHaveText('1');
    await expect(page.locator('#studyCorrect')).toHaveText('0');
    await expect(page.locator('#studyWrong')).toHaveText('0');
    await expect(page.locator('#studyModePage h1')).toHaveText(action === 'startReinforcementSession'
      ? 'Sessão de reforço' : 'Estudo e Revisão');
    const newRaw = await rawStudy(page);
    expect(newRaw).not.toBeNull();
    expect(newRaw).not.toBe(oldRaw);
    expect(JSON.parse(newRaw!).presentations.every((entry: any) => entry.answer === null)).toBe(true);
    await answer(page);
    const answered = await rawStudy(page);
    await info.attach('study-own-replacement', { contentType: 'application/json',
      body: JSON.stringify({ action, oldRaw, newRaw, answered,
        diagnosisRendererOnly: action === 'startReinforcementSession' }) });
    expect(JSON.parse(answered!).presentations.filter((entry: any) => entry.answer)).toHaveLength(1);
  });
}
