import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {saveBase} from '../helpers/fixtures';

test.use({serviceWorkers: 'block', reducedMotion: 'reduce'});
test.beforeEach(async ({context, baseURL}) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
});

async function openRefined(page: Page) {
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(save => {
    localStorage.clear();
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({version: 1, totalQuestions: 300,
      totalCorrect: 200, totalWrong: 100, byCategory: {drc: {correct: 2, wrong: 8}}, byTopic: {},
      questionHistory: [], dailyActivity: {}, timeStats: {questionCount: 300, totalTime: 9000}, mostMissed: {}}));
    const id = (window as any).questionBank[0].id;
    localStorage.setItem('nefroquest-sr-data', JSON.stringify({[id]: {due: Date.now() - 86400000, interval: 3, reps: 2}}));
    const comp = (0, eval)('NQ_COMPETENCIES')[0];
    localStorage.setItem('nefroquest-comp-stats', JSON.stringify({[comp.id]: {c: 1, t: 8}}));
    document.getElementById('landingScreen')?.classList.add('hidden');
    (window as any).isAdminUser = () => false;
    return (window as any).openDashboard();
  }, saveBase({level: 3, correctTotal: 32}));
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.evaluate(() => document.fonts.ready);
}

test('Agora distingue revisão, atenção e Jornada sem colorir as descrições', async ({page}) => {
  await openRefined(page);
  const actions = page.locator('.nqd-next-actions');
  for (const [kind, color, kicker] of [
    ['review', 'rgb(241, 207, 122)', 'Memória ativa'],
    ['gap', 'rgb(242, 161, 142)', 'Ponto de atenção'],
    ['journey', 'rgb(145, 223, 227)', 'Jornada ativa'],
  ]) {
    const item = actions.locator(`[data-action-kind="${kind}"]`);
    await expect(item.locator('.nqd-next-action-copy small')).toHaveText(kicker);
    await expect(item.locator('.nqd-next-action-copy small')).toHaveCSS('color', color);
    await expect(item.locator('.nqd-next-action-copy strong')).toHaveCSS('color', color);
    await expect(item.locator('.nqd-next-action-copy p')).not.toHaveCSS('color', color);
  }
  await expect(actions.locator('[data-action-kind="gap"] strong')).toHaveText('DRC');
  await expect(actions.locator('[data-action-kind="review"] p')).toContainText('cerca de 1 min');
  await expect(page.locator('.nqd-main')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
});

test('superfícies distintas mantêm contraste AA, reflow e controles do Mapa com texto ampliado', async ({page}, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openRefined(page);
  const progress = await page.evaluate(() => [localStorage.getItem('nefroquest-save'), localStorage.getItem('nefroquest-comp-stats')]);
  const sizes = info.project.name === 'mobile' ? [[390, 16], [320, 32]] : [[1280, 16], [1280, 32]];
  for (const [width, size] of sizes) {
    await page.setViewportSize({width, height: 1000});
    await page.evaluate(value => { document.documentElement.style.fontSize = `${value}px`; }, size);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe(`${size}px`);
    for (const [tab, pane] of [['Visão geral', '#nqdPane-overview'], ['Mapa clínico', '#nqdPane-mapa']]) {
      await page.getByRole('tab', {name: tab, exact: true}).click();
      const main = page.locator('.nqd-main');
      expect(await main.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${tab}, ${width}px/${size}px`).toBe(true);
      const paneGeometry = await page.locator(pane).evaluate(el => ({id: el.id, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
        width: el.getBoundingClientRect().width, fontSize: getComputedStyle(el).fontSize, fontFamily: getComputedStyle(el).fontFamily}));
      expect(paneGeometry.scrollWidth, `${tab}, ${width}px/${size}px: ${JSON.stringify(paneGeometry)}`).toBeLessThanOrEqual(paneGeometry.clientWidth + 1);
      const contrast = await new AxeBuilder({page}).include(pane).withRules(['color-contrast']).analyze();
      expect(contrast.violations, `${tab}, ${width}px/${size}px: contraste AA`).toEqual([]);
    }
    await expect(page.locator('.nqd-map-suggestion')).toHaveCSS('background-color', 'rgb(39, 30, 22)');
    await expect(page.locator('.nqd-map-browse')).toHaveCSS('background-color', 'rgb(12, 37, 41)');
    await expect(page.locator('.nqd-memory-section')).toHaveCSS('background-color', 'rgb(35, 27, 51)');
    const group = page.locator('[data-map-area]').first().locator('[data-map-group]');
    await group.locator(':scope > summary').focus();
    await page.keyboard.press('Enter');
    await expect(group).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(group).not.toHaveAttribute('open', '');
    const action = page.locator('[data-map-area]').first().locator('[data-action="_dashTrainCategories"]');
    await action.scrollIntoViewIfNeeded();
    const target = await action.evaluate(el => {
      const r = el.getBoundingClientRect();
      return {width: r.width, height: r.height, hit: el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))};
    });
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
    expect(target.hit).toBe(true);
  }
  expect(await page.evaluate(() => [localStorage.getItem('nefroquest-save'), localStorage.getItem('nefroquest-comp-stats')])).toEqual(progress);
  const action = page.locator('[data-map-area]').first().locator('[data-action="_dashTrainCategories"]');
  const category = await action.getAttribute('data-arg');
  await action.click();
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  expect(await page.evaluate(() => [...new Set((0, eval)('studyModeQuestions').map((q: any) => q.cat))])).toEqual([category]);
  expect(errors).toEqual([]);
});
