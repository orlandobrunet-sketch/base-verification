import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

test('buscar no catálogo preserva os cartões e só a mudança de ordem os reposiciona', async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => {
    const request = route.request();
    return request.method() === 'GET' && new URL(request.url()).origin === origin &&
      !['image', 'media', 'font'].includes(request.resourceType()) ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  const cards = page.locator('[data-library-entry]');
  const total = await cards.count();
  expect(total).toBeGreaterThan(100);
  const search = page.locator('#nqDashLibrarySearch');
  const query = (await cards.first().getAttribute('data-library-title'))!.slice(0, 24);
  await page.evaluate(() => {
    const win = window as any;
    const list = document.getElementById('nqDashLibraryList')!;
    win.__libraryNodes = [...list.children];
    win.__libraryMoves = 0;
    new MutationObserver(records => {
      for (const record of records) win.__libraryMoves += record.addedNodes.length + record.removedNodes.length;
    }).observe(list, { childList: true });
  });
  await search.fill(query);
  await expect.poll(() => page.locator('[data-library-entry]:visible').count()).toBeLessThan(total);
  expect(await page.locator('[data-library-entry]:visible').count()).toBeGreaterThan(0);
  await expect(search).toBeFocused();
  await search.fill('');
  await expect(page.locator('[data-library-entry]:visible')).toHaveCount(total);
  expect(await page.evaluate(() => (window as any).__libraryMoves)).toBe(0);
  expect(await page.evaluate(() => [...document.getElementById('nqDashLibraryList')!.children]
    .every((node, index) => node === (window as any).__libraryNodes[index]))).toBe(true);
  await page.locator('#nqDashLibrarySort').selectOption('oldest');
  await expect.poll(() => page.evaluate(() => (window as any).__libraryMoves)).toBeGreaterThan(0);
  const years = await cards.evaluateAll(entries => entries.map(entry => Number.parseInt((entry as HTMLElement).dataset.libraryYear || '', 10))
    .filter(Number.isFinite));
  expect(years.length).toBeGreaterThan(1);
  expect(years).toEqual([...years].sort((a, b) => a - b));
  await page.evaluate(() => { (window as any).__libraryMoves = 0; });
  await search.fill(query);
  await expect.poll(() => page.locator('[data-library-entry]:visible').count()).toBeLessThan(total);
  await search.fill('');
  await expect(page.locator('[data-library-entry]:visible')).toHaveCount(total);
  expect(await page.evaluate(() => (window as any).__libraryMoves)).toBe(0);
});
