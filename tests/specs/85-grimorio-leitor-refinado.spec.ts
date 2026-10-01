import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
async function openLibrary(page: Page) {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/');
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => { (window as any).isAdminUser = () => true; });
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
}
test('leitura segue o favorito pelo teclado e mantém texto e foco ao fechar', async ({ page }) => {
  await openLibrary(page);
  const card = page.locator('[data-library-item]:visible').first();
  const original = await card.locator('.nqd-library-detail p').allTextContents();
  const favorite = card.locator('.nqd-favorite');
  const read = card.getByRole('button', { name: 'Ler resumo', exact: true });
  await favorite.focus(); await page.keyboard.press('Tab');
  await expect(read).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(card.getByRole('region')).toBeVisible();
  expect(await card.locator('.nqd-library-detail p').allTextContents()).toEqual(original);
  await page.keyboard.press('Enter');
  await expect(card.getByRole('region')).toBeHidden();
  await expect(read).toBeFocused();
  await favorite.click();
  await page.getByRole('tab', { name: 'Favoritos' }).click();
  await favorite.focus(); await page.keyboard.press('Space');
  await expect(card).toBeHidden();
  await expect(page.getByRole('tab', { name: 'Favoritos' })).toBeFocused();
});
test('raridades e fonte longa mantêm comandos acessíveis em 320px e texto a 200%', async ({ page }) => {
  await openLibrary(page);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  for (const rarity of ['comum', 'raro', 'épico', 'lendário']) {
    await page.locator('#nqDashLibraryFilter').selectOption('rarity:' + rarity);
    const card = page.locator('[data-library-item]:visible').first();
    const read = card.getByRole('button', { name: 'Ler resumo', exact: true });
    const favorite = card.locator('.nqd-favorite');
    await favorite.scrollIntoViewIfNeeded();
    expect(await favorite.evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.width >= 44 && r.height >= 44 && el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), rarity + ': favorito alcançável').toBe(true);
    await read.click();
    await expect(card.getByRole('region')).toBeVisible();
    expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth + 1), rarity + ': leitura sem corte').toBe(true);
    await card.getByRole('button', { name: 'Fechar resumo', exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Fontes clínicas' }).click();
  await page.locator('#nqDashLibrarySearch').fill('ACR Manual');
  const source = page.locator('[data-library-item]:visible').first();
  await source.getByRole('button', { name: 'Ler resumo', exact: true }).click();
  expect(await source.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await page.locator('.nqd-main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const audit = await new AxeBuilder({ page }).include('[data-library-item]:not([hidden])').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(audit.violations).toEqual([]);
});
