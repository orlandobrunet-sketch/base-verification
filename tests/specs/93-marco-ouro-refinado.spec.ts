import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
for (const width of [1100, 390, 320]) test('ouro mantém custos, foco e leitura em ' + width, async ({ page }) => {
  await page.setViewportSize({ width, height: 700 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const origin = page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first();
  await origin.focus();
  await page.evaluate(() => (0, eval)('showGoldMilestonePopup()'));
  const card = page.getByRole('dialog', { name: '100 de Ouro!', exact: true });
  await expect(card).toBeVisible();
  await expect(card.locator('.nqgold-cost')).toHaveText(['300 / 1000 ouro', '1500 ouro']);
  const go = card.getByRole('button', { name: 'Entendido!', exact: true });
  await expect(go).toBeFocused();
  expect(await card.locator('.nqgold-emblem').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
  for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await card.evaluate(e => e.contains(document.activeElement))).toBe(true);
  }
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/ouro-integrado-' + width + '.png' });
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  expect(await card.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  for (const button of await card.locator('button').all()) {
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(700);
  }
  await go.click();
  await expect(card).toHaveCount(0);
  await expect(origin).toBeFocused();
  expect(await page.evaluate(() => (0, eval)('state.gold'))).toBe(0);
  await page.evaluate(() => (0, eval)('showGoldMilestonePopup()'));
  await page.keyboard.press('Escape');
  await expect(page.locator('#goldMilestonePopup')).toHaveCount(0);
});
