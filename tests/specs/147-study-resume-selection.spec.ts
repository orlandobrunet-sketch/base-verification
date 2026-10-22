import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

const KEYS = ['nefroquest-save', 'nefroquest-save-v7', 'nefroquest-detailed-stats',
  'nefroquest-stats', 'nefroquest-sr-data', 'nefroquest-comp-stats', 'unlockedArticles'];
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page, context, baseURL }, info) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.setViewportSize(info.project.name === 'mobile'
    ? { width: 390, height: 844 } : { width: 1280, height: 800 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 }, { authUser: null });
});
async function openMap(page: Page) {
  await page.evaluate(() => (window as any).openDashboard({ tab: 'mapa' }));
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
}
test('confirmação acompanha os eixos alterados no seletor sem gravar antes da escolha', async ({ page }, info) => {
  await openMap(page);
  await train(page, 'acido_base');
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  await page.getByRole('button', { name: 'Pausar e voltar', exact: true }).click();
  await page.evaluate(() => (window as any).showAxesSelector());
  await page.locator('[data-action="_studySelectAll"][data-arg="false"]').click();
  await page.locator('#axis-card-drc').click();
  const before = await snapshot(page);
  await page.getByRole('button', { name: 'Iniciar Sessão', exact: true }).click();
  const notice = page.locator('[data-study-resume-choice]');
  await expect(notice.locator('[data-study-selected-areas]')).toHaveText('DRC');
  expect(await snapshot(page)).toEqual(before);
  await page.locator('#axis-card-drc').click();
  await expect(notice).toHaveCount(0);
  await page.locator('#axis-card-lra').click();
  await page.getByRole('button', { name: 'Iniciar Sessão', exact: true }).click();
  await expect(notice.locator('[data-study-selected-areas]')).toHaveText('Lesão Renal Aguda');
  expect(await snapshot(page)).toEqual(before);
  await page.locator('[data-action="_studySelectAll"][data-arg="true"]').click();
  await expect(notice).toHaveCount(0);
  await page.getByRole('button', { name: 'Iniciar Sessão', exact: true }).click();
  await expect(notice.locator('[data-study-selected-areas]')).toContainText('DRC');
  await page.locator('[data-action="_selectTrail"][data-arg="eletrolitos"]').click();
  await expect(notice).toHaveCount(0);
  await page.getByRole('button', { name: 'Iniciar Sessão', exact: true }).click();
  await expect(notice.locator('[data-study-selected-areas]')).toHaveText('Distúrbios Eletrolíticos, Ácido-Base');
  expect(await snapshot(page)).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('[data-action="_studySelectAll"][data-arg="false"]').click();
  await expect(notice).toHaveCount(0);
  await page.locator('#axis-card-lra').click();
  await page.getByRole('button', { name: 'Iniciar Sessão', exact: true }).click();
  await expect(notice.locator('[data-study-selected-areas]')).toHaveText('Lesão Renal Aguda');
  await notice.getByRole('button', { name: 'Iniciar nova sessão', exact: true }).click();
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  expect(await page.evaluate(() => [...new Set((0, eval)('studyModeQuestions').map((q: any) => q.cat))])).toEqual(['lra']);
  expect((await snapshot(page)).progress).toEqual(before.progress);
  await info.attach('selection-changed', { contentType: 'application/json', body: JSON.stringify({ from: 'drc', to: 'lra', savedOnlyAfterConfirmation: true }) });
});
async function train(page: Page, category: string) {
  await page.locator(`article[data-map-area] [data-action="_dashTrainCategories"][data-arg="${category}"]`).click();
}
async function snapshot(page: Page) {
  return page.evaluate(keys => ({
    progress: Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])),
    study: localStorage.getItem('nefroquest-study-state'),
    campaign: (0, eval)('({id:state.current.id,answered:state.answered,start:_questionStartTime})'),
    question: document.getElementById('question')!.outerHTML,
    timer: document.getElementById('timerDisplay')!.textContent,
  }), KEYS);
}
for (const existing of [false, true]) {
  test(`Treinar ${existing ? 'com sessão ativa' : 'sem sessão salva'} mantém contexto e campanha`, async ({ page }, info) => {
    await page.evaluate(() => (window as any).timerToggle());
    await expect(page.locator('#timerDisplay')).not.toHaveText('00:00');
    await page.evaluate(() => (window as any).timerToggle());
    await openMap(page);
    let priorQuestion = '';
    if (existing) {
      await train(page, 'acido_base');
      await expect(page.locator('#studyOptions button')).toHaveCount(4);
      priorQuestion = await page.locator('#studyQuestionArea h3').first().innerText();
      await page.getByRole('button', { name: 'Pausar e voltar', exact: true }).click();
      await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
    }
    const before = await snapshot(page);
    await train(page, 'drc');
    const choice = page.locator('[data-study-resume-choice]');
    if (existing) {
      await expect(choice.locator('[data-study-selected-areas]')).toHaveText('DRC');
      await expect(choice).toContainText('20 questões dos temas escolhidos');
      expect(await snapshot(page)).toEqual(before);
      await choice.getByRole('button', { name: 'Retomar estudo', exact: true }).click();
      await expect(page.locator('#studyQuestionArea h3').first()).toHaveText(priorQuestion);
      expect(await page.evaluate(() => [...new Set((0, eval)('studyModeQuestions').map((q: any) => q.cat))])).toEqual(['acido_base']);
      await page.getByRole('button', { name: 'Pausar e voltar', exact: true }).click();
      await train(page, 'drc');
      await choice.getByRole('button', { name: 'Iniciar nova sessão', exact: true }).focus();
      await page.keyboard.press('Enter');
    } else await expect(choice).toHaveCount(0);
    await expect(page.locator('#studyOptions button')).toHaveCount(4);
    const after = await snapshot(page);
    expect(after.progress).toEqual(before.progress);
    expect(after.campaign).toEqual(before.campaign);
    expect(after.question).toEqual(before.question);
    expect(after.timer).toEqual(before.timer);
    const session = await page.evaluate(() => ({
      categories: [...new Set((0, eval)('studyModeQuestions').map((q: any) => q.cat))],
      ids: (0, eval)('studyModeQuestions').map((q: any) => q.qid || q.id),
      resolved: (0, eval)('_studyRevisions').every((r: any) => r && !r.historical),
    }));
    expect(session.categories).toEqual(['drc']); expect(session.resolved).toBe(true);
    expect(JSON.parse(after.study!).questions).toEqual(session.ids);
    expect(JSON.parse(after.study!).presentations.every((q: any) => q.answer === null)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${existing ? 'active' : 'fresh'}-confirmed.png`), fullPage: true });
    await page.getByRole('button', { name: 'Pausar e voltar', exact: true }).click();
    await page.evaluate(() => (window as any).closeDashboard());
    await expect(page.locator('#mainApp')).toBeVisible();
    const returned = await snapshot(page);
    expect(returned.campaign).toEqual(before.campaign);
    expect(returned.question).toEqual(before.question);
    expect(returned.timer).toEqual(before.timer);
    expect(returned.progress).toEqual(before.progress);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
