import { test, expect, type Page } from '@playwright/test';
import { saveBase, statsBase } from '../helpers/fixtures';

const STUDY = 'nefroquest-study-state';
const progressKeys = ['nefroquest-save', 'nefroquest-save-v7', 'nefroquest-stats',
  'nefroquest-detailed-stats', 'nefroquest-sr-data', 'nefroquest-comp-stats',
  'nefroquest-mastered', 'nefroquest-mastered-ids', 'unlockedArticles', 'nq-unlocked-refs'];
const errors = new WeakMap<Page, string[]>();

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page, context, baseURL }, info) => {
  const origin = new URL(baseURL!).origin;
  const runtimeErrors: string[] = []; errors.set(page, runtimeErrors);
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request();
    return request.method() === 'GET' && new URL(request.url()).origin === origin
      ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.setViewportSize(info.project.name === 'mobile'
    ? { width: 390, height: 844 } : { width: 1280, height: 800 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('#landingScreen [data-action="playAsGuest"]:visible').first().click();
  if (await page.locator('#identityOverlay').isVisible())
    await page.locator('[data-action="_pickIdentity"][data-arg="combat"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.evaluate(({ save, stats }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
  }, { save: saveBase(), stats: statsBase() });
});
test.afterEach(async ({ page }, info) => {
  await info.attach('study-recovery-runtime', { contentType: 'application/json',
    body: JSON.stringify({ errors: errors.get(page), viewport: page.viewportSize() }) });
  if (info.status === info.expectedStatus) expect(errors.get(page)).toEqual([]);
});

async function bytes(page: Page) {
  return page.evaluate(({ key, keys }) => ({ study: localStorage.getItem(key),
    progress: Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])) }),
  { key: STUDY, keys: progressKeys });
}
async function openMap(page: Page) {
  await page.evaluate(() => (window as any).openDashboard({ tab: 'mapa' }));
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect(page.locator('#nqdTab-mapa')).toHaveAttribute('aria-selected', 'true');
}
async function practiceArea(page: Page, category: string) {
  const group = page.locator('article[data-map-area]').filter({
    has: page.locator(`[data-action="_dashTrainCategories"][data-arg="${category}"]`),
  });
  await group.locator('[data-action="_dashTrainCategories"]').click();
}

for (const held of ['expired', 'complete'] as const) {
  test(`Mapa explica sessão ${held}, preserva ao voltar e inicia novo estudo somente após confirmar`, async ({ page }, info) => {
    await openMap(page);
    await practiceArea(page, 'acido_base');
    await expect(page.locator('#studyOptions button')).toHaveCount(4);
    // Build the held fixture from a real, currently bound session. No old
    // question is migrated or reinterpreted to make it resumable.
    const originalRaw = await page.evaluate(({ held, key }) => {
      const saved = JSON.parse(localStorage.getItem(key)!);
      if (held === 'expired') saved.savedAt = Date.now() - 25 * 60 * 60 * 1000;
      else saved.index = saved.questions.length;
      const raw = JSON.stringify(saved); localStorage.setItem(key, raw); return raw;
    }, { held, key: STUDY });
    await info.attach('preserved-session-fixture', { contentType: 'application/json', body: originalRaw });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => document.getElementById('landingScreen')?.classList.add('hidden'));
    await openMap(page);
    const before = await bytes(page);
    expect(before.study).toBe(originalRaw);
    await practiceArea(page, 'drc');
    const notice = page.locator('[data-study-resume-choice]');
    await expect(notice).toBeVisible();
    await expect(notice.locator('[data-study-selected-areas]')).toHaveText('DRC');
    await expect(notice).toContainText('20 questões dos temas escolhidos');
    const heading = page.locator('.study-mode-popup .nq-study-heading');
    await expect(heading.getByRole('heading', { name: 'Estudo e Revisão', exact: true })).toBeVisible();
    expect((await heading.boundingBox())!.y + (await heading.boundingBox())!.height)
      .toBeLessThan((await notice.boundingBox())!.y);
    expect(await notice.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Source Sans 3');
    expect(await notice.locator('p').first().evaluate(el => getComputedStyle(el).fontFamily)).toContain('Source Sans 3');
    await expect(notice).toContainText(held === 'expired'
      ? 'Esta sessão ultrapassou o prazo de 24 horas para retomada.'
      : 'Esta sessão está marcada como concluída.');
    await expect(notice).toContainText('você substitui somente a sessão salva');
    await expect(notice).toContainText('Voltar mantém a sessão salva como está.');
    await expect(notice.locator('[data-action="resumeSavedStudyMode"]')).toHaveCount(0);
    await expect(notice.getByRole('button', { name: 'Iniciar nova sessão' })).toBeFocused();
    expect(await bytes(page)).toEqual(before);
    await page.screenshot({ path: info.outputPath(`held-${held}-explanation.png`), fullPage: true });
    await page.locator('.study-mode-popup [data-action="closeStudySetup"]').click();
    await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
    await expect(page.locator('#nqdTab-mapa')).toHaveAttribute('aria-selected', 'true');
    expect(await bytes(page)).toEqual(before);
    await practiceArea(page, 'drc');
    await expect(notice).toBeVisible();
    expect(await bytes(page)).toEqual(before);
    await notice.getByRole('button', { name: 'Iniciar nova sessão' }).click();
    await expect(page.locator('#studyOptions button')).toHaveCount(4);
    await page.screenshot({ path: info.outputPath(`held-${held}-confirmed-session.png`), fullPage: true });
    const after = await bytes(page);
    expect(after.progress).toEqual(before.progress);
    expect(after.study).not.toBe(originalRaw);
    const fresh = JSON.parse(after.study!);
    expect(fresh.index).toBe(0); expect(fresh.correct).toBe(0); expect(fresh.wrong).toBe(0);
    const current = await page.evaluate(() => {
      const questions = (0, eval)('studyModeQuestions');
      const presentations = (0, eval)('_studyPresentations');
      const revisions = (0, eval)('_studyRevisions');
      const catalog = (window as any).questionRevisionCatalog;
      return { categories: [...new Set(questions.map((q: any) => q.cat))],
        bound: revisions.every((r: any) => r && !r.historical),
        resolved: presentations.every((q: any, i: number) => !!catalog.resolve(q,
          { profile: 'study', binding: revisions[i]?.binding })) };
    });
    expect(current).toEqual({ categories: ['drc'], bound: true, resolved: true });
    const correctIndex = await page.evaluate(() => (0, eval)('_studyPresentations[studyModeIndex].a'));
    await page.locator('#studyOptions button').nth(correctIndex).click();
    await expect(page.locator('#studyFeedback')).toBeVisible();
    await expect(page.locator('#studyCorrect')).toHaveText('1');
    await page.locator('[data-action="nextStudyQuestion"]').click();
    await expect(page.locator('#studyProgress')).toHaveText('2');
    const question = await page.locator('#studyQuestionArea h3').first().innerText();
    const progressAfterAnswer = (await bytes(page)).progress;
    await page.getByRole('button', { name: 'Pausar e voltar', exact: true }).click();
    await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => document.getElementById('landingScreen')?.classList.add('hidden'));
    await openMap(page);
    await practiceArea(page, 'drc');
    await notice.getByRole('button', { name: 'Retomar estudo', exact: true }).click();
    await expect(page.locator('#studyProgress')).toHaveText('2');
    await expect(page.locator('#studyCorrect')).toHaveText('1');
    await expect(page.locator('#studyQuestionArea h3').first()).toHaveText(question);
    expect((await bytes(page)).progress).toEqual(progressAfterAnswer);
    const resumed = JSON.parse((await bytes(page)).study!);
    expect(resumed.presentations[0].answer.correct).toBe(true);
    expect(resumed.presentations.filter((p: any) => p.answer)).toHaveLength(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
