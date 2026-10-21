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
  const key = await card.locator('.nqd-favorite').getAttribute('data-library-key');
  const original = await page.evaluate(key => {
    const item = key!.startsWith('__art_') ? (0, eval)('nefroArticles')[Number(key!.slice(6))] : (0, eval)('refsDB')[key!];
    return [item.resumo || 'Esta entrada não possui resumo cadastrado.', item.conclusao, item.curiosidade, item.impacto].filter(Boolean);
  }, key);
  const favorite = card.locator('.nqd-favorite');
  const read = card.getByRole('button', { name: 'Ler resumo', exact: true });
  await favorite.focus(); await page.keyboard.press('Tab');
  await expect(read).toBeFocused();
  await page.keyboard.press('Enter');
  const reader = page.locator('.bib-resumo-modal [role="dialog"]');
  await expect(reader).toBeVisible();
  expect(await reader.locator('.nqreader-sections p').allTextContents()).toEqual(original);
  await expect(reader.getByRole('button', { name: 'Concluir leitura', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(reader.getByRole('region')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(reader.getByRole('button', { name: 'Concluir leitura', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
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
    const reader = page.locator('.bib-resumo-modal [role="dialog"]');
    await expect(reader).toBeVisible();
    await expect(reader).toHaveAttribute('data-reader-rarity', rarity);
    expect(await reader.evaluate(el => el.scrollWidth <= el.clientWidth + 1), rarity + ': leitura sem corte horizontal').toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
    await expect(read).toBeFocused();
  }
  await page.getByRole('tab', { name: 'Fontes clínicas' }).click();
  await page.locator('#nqDashLibrarySearch').fill('ACR Manual');
  const source = page.locator('[data-library-item]:visible').first();
  await source.getByRole('button', { name: 'Ler resumo', exact: true }).click();
  await expect(page.locator('.bib-resumo-modal [role="dialog"]')).toBeVisible();
  const readerAudit = await new AxeBuilder({ page }).include('.bib-resumo-modal').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(readerAudit.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(source.getByRole('button', { name: 'Ler resumo', exact: true })).toBeFocused();
  expect(await source.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await page.locator('.nqd-main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const audit = await new AxeBuilder({ page }).include('[data-library-item]:not([hidden])').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(audit.violations).toEqual([]);
});
