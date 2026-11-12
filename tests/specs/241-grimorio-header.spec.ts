import { test, expect, type Page } from '@playwright/test';

// Layout contract shared by direct access and the library tab.
test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

test.beforeEach(async ({ context, baseURL, page, isMobile }) => {
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => {
    await (window as any)._loadTopics({ refsOnly: true });
    await (window as any).carregarDadosGrimorio();
    const refs = (0, eval)('refsDB');
    const articles = (0, eval)('nefroArticles');
    const keys = Object.keys(refs).slice(0, 2);
    const indices = articles.slice(0, 2).map((_: unknown, index: number) => index);
    localStorage.setItem('nq-unlocked-refs', JSON.stringify(keys));
    localStorage.setItem('unlockedArticles', JSON.stringify(indices));
    localStorage.setItem('nq-bib-favorites', JSON.stringify([keys[0], '__art_' + indices[0]]));
  });
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
});

const ledger = (page: Page) => page.evaluate(() => Object.fromEntries(
  ['nq-unlocked-refs', 'unlockedArticles', 'nq-bib-favorites'].map(key => [key, localStorage.getItem(key)])));

test('cabeçalho e busca aproximam os artigos sem transformar acesso em descoberta', async ({ page, isMobile }, testInfo) => {
  const before = await ledger(page);
  const total = await page.evaluate(() => Object.keys((0, eval)('refsDB')).length + (0, eval)('nefroArticles').length);
  await expect(page.locator('[data-library-entry]')).toHaveCount(total);
  await expect(page.locator('.nqd-library-summary')).toHaveText(`Referências descobertas até o momento: 4/${total}`);
  await expect(page.locator('#nqDashLibraryTab-all [data-library-count]')).toHaveText(String(total));
  await expect(page.locator('#nqDashLibraryTab-favorites [data-library-count]')).toHaveText('2');
  await expect(page.locator('#nqDashLibrarySearch')).toBeVisible();
  await expect(page.locator('#nqDashLibrarySearch')).toHaveAccessibleName('Buscar no Grimório');
  await expect(page.locator('#nqDashLibrarySearch')).toHaveAttribute('placeholder', isMobile ? 'Buscar artigos' : 'Buscar título, autor, tema ou ano');
  await expect(page.locator('#nqDashLibrarySort')).toBeVisible();
  expect.soft(await page.locator('#nqDashLibrarySort').evaluate((element: HTMLSelectElement) => {
    const style = getComputedStyle(element);
    const context = document.createElement('canvas').getContext('2d')!;
    context.font = style.font;
    const textWidth = context.measureText(element.selectedOptions[0].text).width;
    return textWidth <= element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 24;
  }), 'ordenação exibe a opção selecionada sem cortar o texto').toBe(true);
  const header = await page.locator('.nqd-grimoire-header').boundingBox();
  const firstArticle = await page.locator('[data-library-entry]:visible').first().boundingBox();
  expect(header).not.toBeNull();
  expect(firstArticle).not.toBeNull();
  await testInfo.attach('header-geometry', { body: JSON.stringify({ header, firstArticle, total }), contentType: 'application/json' });
  await expect.soft(page.locator('[data-library-explore]')).toBeHidden();
  if (!isMobile) {
    expect.soft(header!.height).toBeGreaterThanOrEqual(140);
    expect.soft(header!.height).toBeLessThanOrEqual(180);
    expect.soft(firstArticle!.y).toBeLessThanOrEqual(460);
  } else {
    expect.soft(firstArticle!.y).toBeLessThanOrEqual(650);
  }
  expect(await page.locator('.nqd-main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await ledger(page)).toEqual(before);
});

test('filtros expandem inline com teclado e refluem em 320 px com texto a 200%', async ({ page }) => {
  const before = await ledger(page);
  const toggle = page.getByRole('button', { name: 'Filtros', exact: true });
  const filters = page.locator('[data-library-explore]');
  await expect(toggle).toHaveAttribute('aria-controls', 'nqDashLibraryFilters');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(filters).toBeVisible();
  await expect(toggle).toBeFocused();
  await expect(page.locator('#nqDashboard [role="dialog"]')).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  for (const selector of ['.nqd-main', '.nqd-library-controls', '[data-library-explore]']) {
    expect(await page.locator(selector).evaluate(el => el.scrollWidth <= el.clientWidth + 1), selector).toBe(true);
  }
  for (const selector of ['[data-library-filter-toggle]', '#nqDashLibrarySearch', '#nqDashLibrarySort', '#nqDashLibraryDiscovery', '#nqDashLibraryFilter', '[data-library-rarity-filter="raro"]']) {
    const box = await page.locator(selector).boundingBox();
    expect(box, selector).not.toBeNull();
    expect(box!.height, selector).toBeGreaterThanOrEqual(44);
    expect(box!.width, selector).toBeGreaterThanOrEqual(44);
    expect(box!.x, selector).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, selector).toBeLessThanOrEqual(321);
  }
  await page.locator('[data-library-rarity-filter="raro"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-library-rarity-filter="raro"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#nqDashLibraryFilter')).toHaveValue('all');
  await expect(toggle).toHaveAttribute('data-filter-active', 'true');
  await expect(toggle).toHaveAccessibleDescription(/Raridade: Raro/);
  await expect(page.locator('#nqDashLibrarySearch')).toHaveAttribute('placeholder', 'Buscar artigos');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(filters).toBeHidden();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(filters).toBeVisible();
  await expect(page.locator('[data-library-rarity-filter="raro"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await ledger(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any).openDashboard({ tab: 'library' }));
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(filters).toBeHidden();
  await expect(page.locator('[data-library-rarity-filter="raro"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAttribute('data-filter-active', 'true');
  await expect(toggle).toHaveAccessibleDescription(/Raridade: Raro/);
  expect(await ledger(page)).toEqual(before);
});
