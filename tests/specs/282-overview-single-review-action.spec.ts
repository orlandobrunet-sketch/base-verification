import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const authors = Array.from({ length: 3 }, (_, index) => ({
  qid: 'overview-review-' + index, q: 'Questão técnica de navegação ' + index,
  opts: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'], ans: 0,
  exp: 'Fixture de interface, sem conteúdo clínico.', cat: 'geral',
}));
const keys = ['nefroquest-study-state', 'nefroquest-sr-data', 'nefroquest-save', 'nefroquest-save-v7', 'nefroquest-detailed-stats'];
const audits = new WeakMap<Page, { errors: string[], nonGET: string[], sockets: number }>();
const stored = (page: Page) => page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), keys);

test.afterEach(async ({ page }, info) => {
  const audit = audits.get(page);
  if (!audit) return;
  await info.attach('overview-runtime-audit', { body: JSON.stringify(audit), contentType: 'application/json' });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
});

async function open(page: Page, baseURL: string, session: boolean, overdue: boolean) {
  const origin = new URL(baseURL).origin, audit = { errors: [] as string[], nonGET: [] as string[], sockets: 0 };
  audits.set(page, audit); page.on('pageerror', error => audit.errors.push(error.message));
  await page.context().routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await page.context().route('**/*', route => {
    const q = route.request(), url = new URL(q.url());
    if (q.method() !== 'GET') { audit.nonGET.push(q.method() + ' ' + url.pathname); return route.abort(); }
    if (url.origin === origin || (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) && ['font', 'stylesheet'].includes(q.resourceType()))) return route.continue();
    return route.abort();
  });
  await routeTechnicalQuestionBank(page, authors);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.evaluate(() => (window as any)._loadTopics());
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.evaluate(({ session, overdue, ids }) => {
    const today = new Date().setHours(0, 0, 0, 0), day = 86400000;
    const card = (due: number) => ({ S: 3, D: 5, due, interval: 3, last: today - 3 * day, reps: 2, lapses: 0 });
    localStorage.setItem('nefroquest-sr-data', JSON.stringify({
      [ids[0]]: card(overdue ? today - day : today + day),
      [ids[1]]: card(overdue ? today : today + day),
      [ids[2]]: card(today + day),
    }));
    if (session) localStorage.setItem('nefroquest-study-state', JSON.stringify({
      questions: ids, index: 1, correct: 1, wrong: 0, axisStats: {}, savedAt: Date.now(),
    }));
  }, { session, overdue, ids: authors.map(question => question.qid) });
  const before = await stored(page);
  await page.locator('[data-atrium-route="dashboard"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect(page.locator('#nqdPane-overview')).toBeVisible();
  return before;
}

for (const state of [
  { name: 'paused study and due reviews', session: true, overdue: true },
  { name: 'due reviews without a paused study', session: false, overdue: true },
  { name: 'paused study without due reviews', session: true, overdue: false },
]) test(state.name + ': one review decision preserves calendar, totals and other actions', async ({ page, baseURL }) => {
  const before = await open(page, baseURL!, state.session, state.overdue);
  const overview = page.locator('#nqdPane-overview'), cards = overview.locator('.nqd-next-actions-list');
  await expect(cards.locator('.is-primary')).toHaveCount(1);
  await expect(overview.getByRole('button', { name: /^Revisar/ })).toHaveCount(state.overdue ? 1 : 0);
  if (state.overdue) {
    await expect(cards.getByRole('button', { name: 'Revisar agora', exact: true })).toBeVisible();
    await expect(cards.locator('[data-action-kind="review"]')).toContainText('2 revisões agendadas vencidas');
  }
  if (state.session) {
    await expect(cards.getByRole('button', { name: 'Retomar estudo', exact: true })).toBeVisible();
    await expect(cards.locator('[data-action-kind="study"]')).toContainText('Retomar 2 questões restantes');
    await expect(cards.locator('.is-primary')).toHaveAttribute('data-action-kind', 'study');
  } else await expect(cards.locator('.is-primary')).toHaveAttribute('data-action-kind', 'review');
  await expect(overview.getByRole('button', { name: /Escolher uma área e estudar/ })).toBeVisible();
  await expect(overview.locator('.nqd-memory-section .nqd-metric-value')).toHaveText([state.overdue ? '2' : '0', '3']);
  const calendar = overview.getByRole('group', { name: 'Revisões previstas para os próximos sete dias', exact: true });
  await expect(calendar).toBeVisible();
  await expect(calendar.locator('.nqd-memory-day strong')).toHaveText(['', state.overdue ? '1' : '3', '', '', '', '', '']);
  expect(await stored(page)).toEqual(before);
});

test('desktop newcomer hero uses its reading area and keeps complete words', async ({ page, baseURL }, info) => {
  test.skip(info.project.name !== 'chromium', 'Fixed desktop geometry is measured once.');
  const before = await open(page, baseURL!, true, true);
  await page.evaluate(async () => {
    await Promise.all(['Alegreya', 'Source Sans 3'].map(name => document.fonts.load(`400 16px "${name}"`)));
    await document.fonts.ready;
  });
  const stage = page.locator('.nqd-stage');
  const geometry = await stage.evaluate(element => {
    const style = getComputedStyle(element), body = element.querySelector('.nqd-stage-body')!;
    const words = ['.nqd-stage-name', '.nqd-stage-meta'].map(selector => {
      const node = element.querySelector(selector)!, text = node.firstChild!, value = text.textContent || '';
      const range = document.createRange(); range.setStart(text, value.lastIndexOf(' ') + 1); range.setEnd(text, value.length);
      return { text: value, width: node.getBoundingClientRect().width,
        wordLines: [...range.getClientRects()].filter(r => r.width && r.height).length };
    });
    return { bodyWidth: body.getBoundingClientRect().width,
      available: element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), words };
  });
  await info.attach('hero-geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
  expect(geometry.bodyWidth, 'The only content block uses the available hero area').toBeGreaterThanOrEqual(geometry.available - 1);
  expect(geometry.words.map(word => word.wordLines), 'Name and description remain complete words').toEqual([1, 1]);
  expect(await stored(page)).toEqual(before);
});

test('calendar at 320px and 32px keeps day words, order and totals', async ({ page, baseURL }, info) => {
  test.skip(info.project.name !== 'chromium', 'Fixed narrow geometry is measured once.');
  await page.setViewportSize({ width: 320, height: 740 });
  const before = await open(page, baseURL!, true, true);
  await page.addStyleTag({ content: 'html{font-size:32px!important}' });
  const calendar = page.getByRole('group', { name: 'Revisões previstas para os próximos sete dias', exact: true });
  const words = await calendar.locator('small').evaluateAll(nodes => nodes.map(node => {
    const text = node.firstChild!, value = text.textContent || '', range = document.createRange();
    range.setStart(text, value.lastIndexOf(' ') + 1); range.setEnd(text, value.length);
    return { text: value, wordLines: [...range.getClientRects()].filter(r => r.width && r.height).length };
  }));
  await info.attach('calendar-words', { body: JSON.stringify(words), contentType: 'application/json' });
  expect(words.map(word => word.wordLines), 'Day labels remain readable as complete words').toEqual([1, 1, 1, 1, 1, 1, 1]);
  expect(words.map(word => word.text)).toEqual(['hoje', 'amanhã', 'em 2 dias', 'em 3 dias', 'em 4 dias', 'em 5 dias', 'em 6 dias']);
  await expect(calendar.locator('strong')).toHaveText(['', '1', '', '', '', '', '']);
  await expect(page.locator('.nqd-memory-section .nqd-metric-value')).toHaveText(['2', '3']);
  expect(await stored(page)).toEqual(before);
});
