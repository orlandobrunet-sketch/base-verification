import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ context, baseURL, page }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
});

test('admin surface stays scoped to the local admin preview without granting discoveries', async ({ page }) => {
  await page.locator('[data-portal-route="guest"]').click();
  await page.locator('[data-atrium-route="library"]').click();
  const summary = page.locator('.nqd-library-summary');
  await expect(summary).toBeVisible();
  await expect(page.locator('#nqDashLibraryDiscovery option[value="all"]')).toHaveCount(0);
  await expect(page.locator('[data-library-item]')).toHaveCount(0);
  const before = await page.evaluate(() => [localStorage.getItem('unlockedArticles'), localStorage.getItem('nq-unlocked-refs')]);
  await page.keyboard.press('Escape');
  await page.evaluate(() => { (window as any).isAdminUser = () => true; void (window as any).openBibliotecaModal(); });
  await expect(summary).toContainText('Catálogo completo');
  await expect(page.locator('#nqDashLibraryDiscovery option[value="all"]')).toHaveCount(1);
  expect(await page.locator('[data-library-item]').count()).toBeGreaterThan(0);
  const contrast = await new AxeBuilder({ page }).include('.nqd-library-summary').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
  expect(await page.evaluate(() => [localStorage.getItem('unlockedArticles'), localStorage.getItem('nq-unlocked-refs')])).toEqual(before);
  await page.keyboard.press('Escape');
  await page.evaluate(() => { (window as any).isAdminUser = () => false; void (window as any).openBibliotecaModal(); });
  await expect(summary).toContainText('estudos descobertos');
  await expect(page.locator('#nqDashLibraryDiscovery option[value="all"]')).toHaveCount(0);
  await expect(page.locator('[data-library-item]')).toHaveCount(0);
});

test('admin summary reflows at 320px with enlarged text and preserves keyboard access', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => { (window as any).isAdminUser = () => true; });
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('.nqd-library-summary')).toContainText('Catálogo completo');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const box = await page.locator('.nqd-library-summary').evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
  expect(box.scroll).toBeLessThanOrEqual(box.client + 1);
  const contrast = await new AxeBuilder({ page }).include('.nqd-library-summary').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
});

test('collection count follows discoveries and the full admin catalogue without granting discoveries', async ({ page }) => {
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => { (window as any).isAdminUser = () => true; });
  await page.locator('[data-atrium-route="library"]').click();
  const entries = page.locator('[data-library-entry]');
  const total = await entries.count();
  const discovered = await page.locator('[data-library-entry][data-library-discovered="true"]').count();
  const badge = page.locator('#nqDashLibraryTab-all [data-library-count]');
  const before = await page.evaluate(() => [localStorage.getItem('unlockedArticles'), localStorage.getItem('nq-unlocked-refs')]);
  await expect(badge).toHaveText(String(total));
  await expect(page.locator('#nqDashLibraryCollectionCount')).toHaveText(`${total} estudos na prévia administrativa`);
  await page.locator('#nqDashLibraryDiscovery').selectOption('unlocked');
  await expect(badge).toHaveText(String(discovered));
  await page.locator('#nqDashLibraryDiscovery').selectOption('locked');
  await expect(badge).toHaveText(String(total - discovered));
  await page.locator('#nqDashLibraryDiscovery').selectOption('all');
  await page.locator('#nqDashLibrarySearch').fill('zzzz-sem-resultado');
  await expect(page.locator('#nqDashLibraryCollectionCount')).toHaveText('0 estudos na prévia administrativa nesta busca');
  await expect(badge).toHaveText(String(total));
  expect(await page.evaluate(() => [localStorage.getItem('unlockedArticles'), localStorage.getItem('nq-unlocked-refs')])).toEqual(before);
});

test('stronger rarity strip preserves card and content geometry across rarities', async ({ page }) => {
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => { (window as any).isAdminUser = () => true; });
  await page.locator('[data-atrium-route="library"]').click();
  const cards = page.locator('[data-library-item]');
  expect(await cards.count()).toBeGreaterThan(0);
  const sample = cards.first();
  await expect(sample).toHaveCSS('border-left-width', '5px');
  const geometry = () => sample.evaluate(el => {
    const r = el.getBoundingClientRect(), content = el.querySelector('.nqd-library-main')!.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, contentX: content.x, contentWidth: content.width,
      accent: getComputedStyle(el).borderLeftColor };
  });
  const current = await geometry();
  const left = await sample.evaluate(el => parseFloat(getComputedStyle(el).paddingLeft));
  const oldStyle = await page.addStyleTag({ content: `#nqDashboard[data-nq-ui="lumen"] .nqd-library-item{border-left-width:3px!important;padding-left:${left + 2}px!important}` });
  expect(await geometry()).toEqual(current);
  await oldStyle.evaluate(el => el.remove());
  expect(await geometry()).toEqual(current);
  const palette = await cards.evaluateAll(els => [...new Map(els.map(el => [el.getAttribute('data-library-rarity'), getComputedStyle(el).borderLeftColor])).entries()]);
  expect(new Set(palette.map(([, color]) => color)).size).toBeGreaterThanOrEqual(3);
});
