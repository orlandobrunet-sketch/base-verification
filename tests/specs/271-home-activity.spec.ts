import { test, expect, Page, TestInfo } from '@playwright/test';

const audits = new WeakMap<Page, { errors: string[]; nonGET: string[]; sockets: number }>();
const scrollTo = (page: Page, selector: string) => page.locator(selector).evaluate(node =>
  node.scrollIntoView({ behavior: 'instant', block: 'center' }));
const shown = (page: Page) => page.locator('.chat-bubble.show').count();
const running = (page: Page, selector: string) => page.locator(selector).evaluate(node =>
  node.getAnimations({ subtree: true }).filter(animation => animation.effect?.getTiming().iterations === Infinity
    && (animation.playState === 'running' || animation.pending)).length);
async function freezeDemo(page: Page, info: TestInfo) {
  const start = new Date('2032-01-01T00:00:00Z');
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 1000));
  await info.attach('demo-clock', { contentType: 'text/plain', body: 'Controlled timer clock for deterministic demo stages; not a speed measurement.' });
}

test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const audit = { errors: [] as string[], nonGET: [] as string[], sockets: 0 }; audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { audit.nonGET.push(request.method() + ' ' + url.pathname); return route.abort(); }
    if (url.origin === origin || ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(url.origin)
      && ['font', 'stylesheet'].includes(request.resourceType())) return route.continue();
    return route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
});

test.afterEach(async ({ page }, info) => {
  const audit = audits.get(page)!;
  await info.attach('home-activity-audit', { contentType: 'application/json', body: JSON.stringify(audit) });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
});

test('atividade ambiental e corrente SVG acompanham a região visível', async ({ page }) => {
  await expect.poll(() => running(page, '.oracle-core')).toBe(0);
  await expect.poll(() => running(page, '.route')).toBe(0);
  await expect.poll(() => page.locator('.route-line').evaluate((svg: SVGSVGElement) => svg.animationsPaused())).toBe(true);
  await scrollTo(page, '.oracle-core');
  await expect.poll(() => running(page, '.oracle-core')).toBeGreaterThan(0);
  await scrollTo(page, '.route');
  const routeRendered = await page.locator('.route-line').evaluate(svg => svg.getClientRects().length > 0);
  if (routeRendered) await expect.poll(() => running(page, '.route')).toBeGreaterThan(0);
  else await expect.poll(() => running(page, '.route')).toBe(0);
  await expect.poll(() => page.locator('.route-line').evaluate((svg: SVGSVGElement) => svg.animationsPaused())).toBe(!routeRendered);
  await expect.poll(() => running(page, '.oracle-core')).toBe(0);
  await scrollTo(page, '#hero-title');
  await expect.poll(() => running(page, '.route')).toBe(0);
  await expect.poll(() => page.locator('.route-line').evaluate((svg: SVGSVGElement) => svg.animationsPaused())).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('demonstração conserva a etapa ao sair e continua uma única vez ao retornar', async ({ page }, info) => {
  await freezeDemo(page, info);
  const text = await page.locator('.chat').textContent();
  await scrollTo(page, '.chat');
  await expect(page.locator('.oracle-core')).toHaveClass(/is-thinking/);
  await scrollTo(page, '#hero-title');
  await expect.poll(() => page.locator('.chat').evaluate(node => node.getBoundingClientRect().top > innerHeight)).toBe(true);
  const before = await shown(page); expect(before).toBeLessThan(2);
  // The original second stage fires after1300ms. A negative assertion must
  // cross that deadline; this is a correctness check, not a speed benchmark.
  await page.clock.runFor(1450);
  expect(await shown(page)).toBe(before);
  await scrollTo(page, '.chat');
  // Scroll geometry updates before IntersectionObserver delivers visibility.
  // Wait for that real delivery before advancing the paused timer clock.
  await expect.poll(() => page.locator('.chat-typing span').first().evaluate(node => getComputedStyle(node).animationPlayState)).toBe('running');
  await page.clock.runFor(1600);
  await expect(page.locator('.chat-bubble.show')).toHaveCount(2);
  await expect(page.locator('[data-typing]')).toHaveClass(/hide/);
  await scrollTo(page, '#hero-title'); await scrollTo(page, '.chat');
  await expect(page.locator('.chat-bubble.show')).toHaveCount(2);
  expect(await page.locator('.chat').textContent()).toBe(text);
});

test('sinal de aba oculta pausa o exemplo e a atividade sem consumir a próxima etapa', async ({ page }, info) => {
  await freezeDemo(page, info);
  // Headless Chromium reports both real tabs as visible. Only this platform
  // signal is controlled; timers, observers, styles and page code stay real.
  await page.evaluate(() => {
    const w = window as any; w.__homeHidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => w.__homeHidden });
  });
  await info.attach('visibility-signal', { contentType: 'text/plain', body: 'Controlled document.hidden signal; not a claim of native background-tab behavior.' });
  await scrollTo(page, '.chat');
  await expect(page.locator('.oracle-core')).toHaveClass(/is-thinking/);
  await page.evaluate(() => { (window as any).__homeHidden = true; document.dispatchEvent(new Event('visibilitychange')); });
  const before = await shown(page); expect(before).toBeLessThan(2);
  await expect.poll(() => running(page, '.oracle-core')).toBe(0);
  await page.clock.runFor(1450);
  expect(await shown(page)).toBe(before);
  await page.evaluate(() => { (window as any).__homeHidden = false; document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.runFor(1600);
  await expect(page.locator('.chat-bubble.show')).toHaveCount(2);
});

test('preferência reduzida revela a conversa inteira e pausa a corrente SVG', async ({ page }, info) => {
  await freezeDemo(page, info);
  await scrollTo(page, '.chat');
  await expect(page.locator('.oracle-core')).toHaveClass(/is-thinking/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.chat-bubble.show')).toHaveCount(2);
  await expect(page.locator('[data-typing]')).toHaveClass(/hide/);
  await expect(page.locator('.oracle-core')).not.toHaveClass(/is-thinking/);
  await scrollTo(page, '.route');
  await expect.poll(() => page.locator('.route-line').evaluate((svg: SVGSVGElement) => svg.animationsPaused())).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const routeRendered = await page.locator('.route-line').evaluate(svg => svg.getClientRects().length > 0);
  await expect.poll(() => page.locator('.route-line').evaluate((svg: SVGSVGElement) => svg.animationsPaused())).toBe(!routeRendered);
  await scrollTo(page, '.chat');
  await expect(page.locator('.chat-bubble.show')).toHaveCount(2);
});
