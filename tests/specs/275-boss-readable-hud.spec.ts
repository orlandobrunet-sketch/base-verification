import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
const audits = new WeakMap<Page, { errors: string[]; nonGET: string[]; sockets: number }>();
const native = (page: Page) => page.evaluate(() => {
  const state = (0, eval)('state');
  return { score: state.score, gold: state.gold, correct: state.correctTotal, lives: state.lives,
    hp: (window as any).getBossHP() };
});
async function sizeText(page: Page, pixels: number) {
  await page.evaluate(async pixels => {
    document.documentElement.style.fontSize = pixels + 'px';
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, pixels);
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
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.evaluate(() => (window as any).startBossPreview());
  await expect(page.locator('body')).toHaveAttribute('data-progress-sandbox', 'boss-preview');
  await expect(page.locator('#options .option')).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
});

test.afterEach(async ({ page }, info) => {
  const audit = audits.get(page)!;
  await info.attach('boss-readability-audit', { contentType: 'application/json', body: JSON.stringify(audit) });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
});

test('Pontos permanece inteiro, legível e separado do rótulo em16px e32px', async ({ page }) => {
  const expected = await native(page);
  const drawer = page.locator('.mobile-bottom-dock [data-action="openMobileDrawer"]');
  if (await drawer.isVisible()) await drawer.click();
  for (const font of [16, 32]) {
    await sizeText(page, font);
    await page.locator('#score').scrollIntoViewIfNeeded();
    await expect(page.locator('#score')).toBeVisible();
    await expect(page.locator('#score')).toHaveText(String(expected.score));
    const geometry = await page.locator('#score').evaluate(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      const text = [...range.getClientRects()], tile = node.closest('.tile')!.getBoundingClientRect();
      const label = node.closest('.tile')!.querySelector('span')!.getBoundingClientRect();
      return { lines: new Set(text.map(box => Math.round(box.top))).size,
        inside: text.every(box => box.left >= tile.left - 1 && box.right <= tile.right + 1
          && box.top >= tile.top - 1 && box.bottom <= tile.bottom + 1),
        labelAbove: text.every(box => box.top >= label.bottom - 1),
        actualFont: getComputedStyle(document.documentElement).fontSize };
    });
    expect(geometry).toEqual({ lines: 1, inside: true, labelAbove: true, actualFont: font + 'px' });
    expect(await native(page)).toEqual(expected);
  }
});

test('texto ampliado permite ler a cena inteira sem rolagem dentro da narrativa', async ({ page }) => {
  const expected = await native(page);
  await sizeText(page, 32);
  const cinematic = await page.locator('#nqBossStatic').isVisible();
  if (cinematic) {
    await expect.poll(() => page.evaluate(() => (window as any).NQBossCinema.inspection.image.ready)).toBe(true);
    const geometry = await page.locator('#nqBossStatic').evaluate(root => {
      const copy = root.querySelector('.nq-static-copy')!, image = root.querySelector('.nq-static-art:not([aria-hidden="true"])')!;
      const quote = root.querySelector('#nqStaticNarration')!, range = document.createRange(); range.selectNodeContents(quote);
      const bounds = copy.getBoundingClientRect(), art = image.getBoundingClientRect();
      const texts = [...range.getClientRects()];
      return { allTextInside: texts.length > 0 && texts.every(box => box.left >= bounds.left - 1 && box.right <= bounds.right + 1
          && box.top >= bounds.top - 1 && box.bottom <= bounds.bottom + 1),
        noInnerScroll: copy.scrollHeight <= copy.clientHeight + 1,
        belowArt: quote.getBoundingClientRect().top >= art.bottom - 1,
        controlsInside: [...copy.querySelectorAll('button')].every(button => button.getBoundingClientRect().bottom <= bounds.bottom + 1) };
    });
    expect(geometry).toEqual({ allTextInside: true, noInnerScroll: true, belowArt: true, controlsInside: true });
  } else {
    await expect(page.locator('#nqBossEncounter')).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Vida do Arqui-Nefromante' })).toHaveAttribute('aria-valuenow', String(expected.hp));
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await native(page)).toEqual(expected);
});
