import {test, expect, type Page, type BrowserContext} from '@playwright/test';
import {saveBase} from '../helpers/fixtures';

// Future native contract. This file is prepared externally and runs only after
// its product patch is reviewed/copied; no bank, renderer or function is replaced.
test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'reduce'}});

const audits = new WeakMap<Page, {errors: string[]; nonGET: string[]; sockets: number}>();
async function openDashboardFixture(page: Page, context: BrowserContext, baseURL: string) {
  const origin = new URL(baseURL).origin;
  const audit = {errors: [] as string[], nonGET: [] as string[], sockets: 0};
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { audit.nonGET.push(request.method() + ' ' + url.pathname); return route.abort(); }
    const font = url.protocol === 'https:' &&
      (url.hostname === 'fonts.googleapis.com' && request.resourceType() === 'stylesheet' ||
       url.hostname === 'fonts.gstatic.com' && request.resourceType() === 'font');
    return url.origin === origin || font ? route.continue() : route.abort();
  });
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(save => {
    // Seed only the three records used by the dashboard. Guest, authentication,
    // preferences and all product functions remain under the native controls.
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({version: 1, totalQuestions: 300,
      totalCorrect: 200, totalWrong: 100, byTopic: {}, questionHistory: [], dailyActivity: {}, timeStats: {}, mostMissed: {},
      byCategory: {drc: {correct: 9, wrong: 1}, glomerular: {correct: 2, wrong: 8}, dialise: {correct: 6, wrong: 4}}}));
    const comps = (0, eval)('NQ_COMPETENCIES');
    localStorage.setItem('nefroquest-comp-stats', JSON.stringify(Object.fromEntries(comps.slice(0, 8).map((comp: any) => [comp.id, {c: 1, t: 8}]))));
  }, saveBase());
  await page.locator('[data-atrium-route="dashboard"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  const fonts = await page.evaluate(async () => {
    const body = await document.fonts.load('400 16px "Source Sans 3"');
    const title = await document.fonts.load('600 24px "Alegreya"');
    await document.fonts.ready;
    return {body: body.map(face => face.family.replaceAll('"', '')), title: title.map(face => face.family.replaceAll('"', ''))};
  });
  expect(fonts.body).toContain('Source Sans 3');
  expect(fonts.title).toContain('Alegreya');
}
test.afterEach(async ({page}, info) => {
  const audit = audits.get(page)!;
  await info.attach('dashboard-context-audit', {contentType: 'application/json', body: JSON.stringify(audit)});
  expect(audit.errors).toEqual([]);
  expect(audit.nonGET).toEqual([]);
  expect(audit.sockets).toBe(0);
});
const visualProgress = (page: Page) => page.evaluate(() => ['nefroquest-save', 'nefroquest-detailed-stats',
  'nefroquest-comp-stats', 'unlockedArticles', 'nq-unlocked-refs'].map(key => localStorage.getItem(key)));
async function open(page: Page, context: BrowserContext, baseURL: string, tab = 'skills') {
  await openDashboardFixture(page, context, baseURL);
  await page.locator(`[data-dash-tab="${tab}"]`).click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
}
const bytes = (page: Page) => page.evaluate(() => Object.fromEntries([
  'nefroquest-save', 'nefroquest-save-v7', 'nefroquest-error-reasons',
  'nefroquest-comp-stats', 'nefroquest-detailed-stats', 'nefroquest-study-state'
].map(key => [key, localStorage.getItem(key)])));

test('only an actual area change fades its detail; chart data, focus and native CTA remain stable', async ({page, context, baseURL}) => {
  await open(page, context, baseURL!);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const component = page.locator('[data-nqs-component]'), before = await bytes(page);
  await expect.poll(() => component.evaluate(element => element.getAnimations({subtree: true})
    .filter(animation => animation.playState === 'running' || animation.pending).length)).toBe(0);
  const observation = await component.evaluate(element => {
    const graph = () => ({points: element.querySelector('.nqs-profile-fill')?.getAttribute('points'),
      paths: [...element.querySelectorAll('.nqs-profile-line')].map(path => path.getAttribute('d')),
      values: [...element.querySelectorAll('.nqs-area-score')].map(node => node.textContent)});
    const before = graph();
    const chart = element.querySelector('.nqs-chart')!;
    const entranceNames = new Set(['nqs-reveal-shape', 'nqs-reveal-fill', 'nqs-illuminate-orbit']);
    const entrances = () => chart.getAnimations({subtree: true}).filter(animation => entranceNames.has((animation as CSSAnimation).animationName));
    const entranceState = (animation: Animation) => {
      const timing = animation.effect!.getComputedTiming();
      return {name: (animation as CSSAnimation).animationName, playState: animation.playState, pending: animation.pending,
        startTime: animation.startTime == null ? null : Number(animation.startTime),
        currentTime: animation.currentTime == null ? null : Number(animation.currentTime),
        duration: Number(timing.duration), delay: timing.delay, endTime: Number(timing.endTime), fill: timing.fill, iterations: timing.iterations};
    };
    const entranceBefore = entrances(), entranceStatesBefore = entranceBefore.map(entranceState);
    const next = element.querySelector<HTMLButtonElement>('[data-nqs-card][aria-pressed="false"]')!;
    next.click();
    const detail = element.querySelector<HTMLElement>('[data-nqs-detail]:not([hidden])')!;
    const durations = detail.getAnimations().map(animation => Number(animation.effect!.getComputedTiming().duration));
    const entranceAfter = entrances();
    const sameEntranceInstances = entranceAfter.length === entranceBefore.length && entranceAfter.every(animation => entranceBefore.includes(animation));
    const activeEntrances = entranceAfter.filter(animation => animation.playState === 'running' || animation.pending).length;
    const action = detail.querySelector<HTMLButtonElement>('[data-action]')!;
    action.focus();
    const focused = document.activeElement === action, afterFocus = detail.getAnimations().length;
    next.click();
    return {before, after: graph(), durations, entranceStatesBefore, entranceStatesAfter: entranceBefore.map(entranceState), sameEntranceInstances, activeEntrances, focused, afterFocus,
      afterSameSelection: detail.getAnimations().length, actionHidden: !!action.closest('[hidden], [inert]')};
  });
  expect(observation.durations).toEqual([200]);
  // Finished fill-mode:both entrances remain registered. Selection may retain
  // existing color/halo transitions, but cannot create or restart an entrance.
  expect(observation.entranceStatesBefore.length).toBeGreaterThan(0);
  expect(observation.entranceStatesBefore.every(animation => animation.playState === 'finished' && !animation.pending)).toBe(true);
  expect(observation.activeEntrances).toBe(0);
  expect(observation.sameEntranceInstances).toBe(true);
  expect(observation.entranceStatesAfter).toEqual(observation.entranceStatesBefore);
  expect(observation.after).toEqual(observation.before);
  expect(observation.focused).toBe(true);
  expect(observation.actionHidden).toBe(false);
  expect(observation.afterFocus).toBe(0);
  expect(observation.afterSameSelection).toBe(0);
  expect(await bytes(page)).toEqual(before);
});

test('reduced motion, native tab hiding and teardown leave no selection fade', async ({page, context, baseURL}) => {
  await open(page, context, baseURL!);
  const component = page.locator('[data-nqs-component]'), before = await visualProgress(page);
  const first = component.locator('[data-nqs-card]').first();
  await first.focus(); await page.keyboard.press('End');
  await expect(component.locator('[data-nqs-card]').last()).toBeFocused();
  expect(await component.locator('[data-nqs-detail]:not([hidden])').evaluate(element => element.getAnimations().length)).toBe(0);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const hidden = await component.evaluate(element => new Promise<boolean>(resolve => {
    element.querySelector<HTMLButtonElement>('[data-nqs-card][aria-pressed="false"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-dash-tab="mapa"]')!.click();
    queueMicrotask(() => resolve(element.querySelector('.nqs-detail.is-selecting') === null));
  }));
  expect(hidden).toBe(true);
  await page.locator('[data-dash-tab="skills"]').click();
  const closed = await component.evaluate(element => {
    element.querySelector<HTMLButtonElement>('[data-nqs-card][aria-pressed="false"]')!.click();
    document.querySelector<HTMLButtonElement>('#nqDashboard [data-action="closeDashboard"]')!.click();
    return element.querySelector('.nqs-detail.is-selecting') === null;
  });
  expect(closed).toBe(true);
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  expect(await visualProgress(page)).toEqual(before);
});

test('map pool and capped session match native category selection without changing filters or grouping', async ({page, context, baseURL}) => {
  await open(page, context, baseURL!, 'mapa');
  const before = await visualProgress(page);
  const counts = await page.locator('[data-map-area] [data-map-study-preview]').evaluateAll(elements => elements.map(element => {
    const node = element as HTMLElement, w = window as any;
    const axes = (0, eval)('NEFRO_AXES'), topics = (0, eval)('topics');
    const cats = new Set(axes.filter((axis: any) => axis.cat === node.dataset.category).map((axis: any) => axis.cat));
    const pool = topics.filter((question: any) => cats.has(question.cat)).length;
    return {category: node.dataset.category!, pool: Number(node.dataset.pool), session: Number(node.dataset.session),
      expectedPool: pool, expectedSession: Math.min(20, pool)};
  }));
  expect(counts.length).toBeGreaterThan(1);
  for (const row of counts) { expect(row.pool).toBe(row.expectedPool); expect(row.session).toBe(row.expectedSession); }
  const target = counts.find(row => row.pool > 0 && row.pool < 20) || counts.find(row => row.pool > 0)!;
  const area = page.locator('[data-map-area]').filter({has: page.locator(`[data-map-study-preview][data-category="${target.category}"]`)});
  const title = (await area.locator('h3').textContent() || '').trim();
  expect(title).not.toBe('');
  await page.locator('#nqDashMapSearch').fill(title);
  await expect(area).toBeVisible();
  const preview = await area.locator('[data-map-study-preview]').textContent();
  const group = area.locator('[data-map-group]');
  if (await group.getAttribute('open') === null) await group.locator('summary').click();
  await expect(page.locator('#nqDashMapSearch')).toHaveValue(title);
  await expect(area.locator('[data-map-study-preview]')).toHaveText(preview!);
  await expect(group).toHaveAttribute('open', '');
  expect(await visualProgress(page)).toEqual(before);
  await area.locator('[data-action="_dashTrainCategories"]').click();
  await expect(page.locator('#studyModePage')).toBeVisible();
  const session = await page.evaluate(() => {
    const w = window as any, axes = (0, eval)('NEFRO_AXES');
    return {categories: axes.filter((axis: any) => w._studySelectedAxes.has(axis.id)).map((axis: any) => axis.cat),
      questions: (0, eval)('studyModeQuestions').map((question: any) => question.cat)};
  });
  expect(session.categories).toEqual([target.category]);
  expect(session.questions).toHaveLength(target.session);
  expect(session.questions.every((category: string) => category === target.category)).toBe(true);
});

async function reflections(page: Page, context: BrowserContext, baseURL: string) {
  await openDashboardFixture(page, context, baseURL);
  const fixture = await page.evaluate(() => {
    const now = Date.now(), day = 86400000;
    const data = {counts: {knowledge: 5, misread: 1}, log: [
      {qid: '66b811c3', idx: 0, reason: 'knowledge', ts: now - 3600000},
      {qid: 'opaque-log-only-id', idx: 2, reason: 'knowledge', ts: now - 7200000},
      {qid: 'old', idx: 1, reason: 'knowledge', ts: now - 31 * day},
      {qid: 'future', idx: 1, reason: 'knowledge', ts: now + day},
      {qid: 'malformed-time', reason: 'knowledge', ts: 'recent'},
      {qid: {invalid: true}, reason: 'knowledge', ts: now - 1},
      {qid: 'different-reason', idx: 1, reason: 'misread', ts: now - 10800000}
    ]};
    localStorage.setItem('nefroquest-error-reasons', JSON.stringify(data));
    return {raw: localStorage.getItem('nefroquest-error-reasons'), dates: [now - 3600000, now - 7200000].map(value => new Date(value).toISOString())};
  });
  await page.locator('#nqDashboard [data-action="closeDashboard"]').first().click();
  await page.evaluate(() => (window as any).openDashboard({tab: 'skills'}));
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  return {panel: page.locator('.nqd-error-patterns'), fixture};
}

test('reflection details use only validated stored activity and keep cumulative frequency intact', async ({page, context, baseURL}) => {
  const {panel, fixture} = await reflections(page, context, baseURL!), before = await bytes(page);
  await expect(panel.locator('.nqd-error-count strong')).toHaveText(['5', '1']);
  await expect(panel.locator('.nqd-error-total')).toHaveText('6');
  const detail = panel.locator('.nqd-error-detail').first();
  await detail.locator('summary').focus(); await page.keyboard.press('Enter');
  await expect(detail).toHaveAttribute('open', '');
  await expect(detail.locator('time')).toHaveCount(2);
  expect(await detail.locator('time').evaluateAll(nodes => nodes.map(node => node.getAttribute('datetime')))).toEqual(fixture.dates);
  await expect(detail).toContainText('últimos 30 dias');
  await expect(panel.locator('[data-qid], [data-question-id], [data-action="answerQuestion"]')).toHaveCount(0);
  await expect(panel).not.toContainText('66b811c3');
  await expect(panel).not.toContainText('opaque-log-only-id');
  expect(await bytes(page)).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-error-reasons'))).toBe(fixture.raw);
  const study = panel.getByRole('button', {name: 'Escolher uma área de estudo', exact: true});
  await study.click();
  await expect(page.locator('.study-mode-popup [data-action="showTopicSelector"]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-error-reasons'))).toBe(fixture.raw);
});

test('new context and native activity disclosures reflow at320px and200 percent text', async ({page, context, baseURL}) => {
  await page.setViewportSize({width: 320, height: 844});
  const {panel} = await reflections(page, context, baseURL!), before = await bytes(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await panel.locator('.nqd-error-detail').first().locator('summary').click();
  expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  const action = panel.locator('.nqd-error-study button');
  await action.focus(); await action.scrollIntoViewIfNeeded();
  await expect(action).toBeFocused();
  const box = await action.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(321);
  expect(await bytes(page)).toEqual(before);
});
