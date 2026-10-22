import {test, expect, type Page} from '@playwright/test';
import {saveBase} from '../helpers/fixtures';

test.use({serviceWorkers: 'block', reducedMotion: 'reduce'});
test.beforeEach(async ({context, baseURL}) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
});

async function openDashboard(page: Page) {
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(save => {
    localStorage.clear();
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({version: 1,
      totalQuestions: 300, totalCorrect: 200, totalWrong: 100, byTopic: {}, byCategory: {},
      questionHistory: [], dailyActivity: {}, timeStats: {questionCount: 300, totalTime: 9000}, mostMissed: {}}));
    const id = (window as any).questionBank[0].id;
    localStorage.setItem('nefroquest-sr-data', JSON.stringify({[id]: {due: Date.now() - 86400000, reps: 2, interval: 3}}));
    (window as any).isAdminUser = () => false;
    document.getElementById('landingScreen')?.classList.add('hidden');
    return (window as any).openDashboard();
  }, saveBase({level: 3, correctTotal: 32}));
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.evaluate(() => document.fonts.ready);
}

test('Visão geral usa a largura principal na ordem solicitada, sem galeria e com títulos inteiros', async ({page}) => {
  await openDashboard(page);
  for (const [width, fontSize] of [[1280, 16], [390, 16], [320, 32]]) {
    await page.setViewportSize({width, height: 900});
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, fontSize);
    const main = page.locator('.nqd-main');
    const overview = page.locator('#nqdPane-overview');
    await expect(main).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(overview.locator('.nqd-journey,.nqd-form-trail')).toHaveCount(0);
    const geometry = await overview.evaluate(pane => {
      const sections = [...pane.querySelectorAll<HTMLElement>('[data-overview-section]')];
      const boxes = sections.map(el => el.getBoundingClientRect());
      return {order: sections.map(el => el.dataset.overviewSection),
        vertical: boxes.every((b, i) => !i || b.top >= boxes[i - 1].bottom - 1),
        fullWidth: boxes.every(b => Math.abs(b.width - pane.getBoundingClientRect().width) <= 2)};
    });
    expect(geometry).toEqual({order: ['pace', 'now', 'review', 'reward'], vertical: true, fullWidth: true});
    expect(await main.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const title = overview.locator('.nqd-next-action.is-primary .nqd-next-action-copy strong');
    await title.scrollIntoViewIfNeeded();
    const text = await title.evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el);
      const box = el.getBoundingClientRect(), next = el.nextElementSibling!.getBoundingClientRect();
      return {inside: [...range.getClientRects()].every(r => r.left >= box.left - 1 && r.right <= box.right + 1
        && r.top >= box.top - 1 && r.bottom <= box.bottom + 1), separate: next.top >= box.bottom,
        description: el.nextElementSibling!.textContent};
    });
    expect(text.inside).toBe(true);
    expect(text.separate).toBe(true);
    expect(text.description).toContain('cerca de 1 min');
  }
});

test('Mapa explica a ação e abre estudo da área inteira mesmo após buscar um único tema', async ({page}) => {
  await openDashboard(page);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.getByRole('tab', {name: 'Mapa clínico', exact: true}).click();
  const map = page.locator('#nqdPane-mapa');
  const target = await page.evaluate(() => {
    const competencies = (0, eval)('NQ_COMPETENCIES');
    const item = competencies.find((c: any) => c.cat === 'acido_base');
    return {label: item.label, cat: item.cat,
      questionCount: Math.min(20, (0, eval)('topics').filter((q: any) => q.cat === item.cat).length)};
  });
  const progressBefore = await page.evaluate(() => localStorage.getItem('nefroquest-save'));
  await map.locator('#nqDashMapSearch').fill(target.label);
  await expect(map.locator('.nqd-map-node:not([hidden])')).toHaveCount(1);
  const area = map.locator('[data-map-area]:not([hidden])');
  await expect(area).toHaveCount(1);
  await expect(area.locator('.nqd-map-session-note')).toHaveText('Questões de toda a área · até 20 por sessão');
  const detail = area.locator('[data-map-group]');
  // Searching reveals its first matching group; keyboard can close and reopen it.
  await expect(detail).toHaveAttribute('open', '');
  await detail.locator(':scope > summary').focus();
  await page.keyboard.press('Enter');
  await expect(detail).not.toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(detail).toHaveAttribute('open', '');
  await expect(detail.locator('.nqd-map-node:not([hidden])')).toBeVisible();
  await area.getByRole('button', {name: /^Estudar esta área:/}).click();
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  const current = await page.evaluate(() => {
    const questions = (0, eval)('studyModeQuestions');
    const presentations = (0, eval)('_studyPresentations');
    const revisions = (0, eval)('_studyRevisions');
    const catalog = (window as any).questionRevisionCatalog;
    return {categories: [...new Set(questions.map((q: any) => q.cat))], count: questions.length,
      lengthsMatch: questions.length > 0 && revisions.length === questions.length && presentations.length === questions.length,
      bound: revisions.every((r: any, i: number) => r && !r.historical && r.binding?.version === 1
        && r.binding.qid === String(questions[i].qid || questions[i].id) && r.binding.profile === 'study'
        && /^sha256:[a-f0-9]{64}$/.test(r.binding.recordRevision)
        && r.binding.recordRevision === catalog.current(r.binding.qid, 'study')?.binding.recordRevision),
      resolved: presentations.every((q: any, i: number) => !!catalog.resolve(q, {profile: 'study', binding: revisions[i]?.binding}))};
  });
  expect(current).toEqual({categories: [target.cat], count: target.questionCount, lengthsMatch: true, bound: true, resolved: true});
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(progressBefore);
  const correct = await page.evaluate(() => (0, eval)('_studyPresentations[studyModeIndex].a'));
  await page.locator('#studyOptions button').nth(correct).click();
  await expect(page.locator('#studyCorrect')).toHaveText('1');
  await page.locator('[data-action="nextStudyQuestion"]').click();
  await expect(page.locator('#studyProgress')).toHaveText('2');
  await page.getByRole('button', {name: 'Pausar e voltar', exact: true}).click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect(page.locator('#nqdTab-mapa')).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-study-state')!).index)).toBe(1);
  expect(errors).toEqual([]);
});
