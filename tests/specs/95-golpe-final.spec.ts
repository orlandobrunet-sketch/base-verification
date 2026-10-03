import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
async function abrir(page: Page) {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const origin = page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first();
  await origin.focus();
  await page.evaluate(() => (0, eval)('showBattleFinalPopup()'));
  const card = page.getByRole('dialog', { name: 'Golpe final', exact: true });
  await expect(card).toBeVisible();
  return card;
}
test('enfrentar mantém a questão e o progresso; foco retorna à jornada', async ({ page }) => {
  const card = await abrir(page);
  const question = await page.locator('#question').innerText();
  const snapshot = () => page.evaluate(() => (0, eval)('JSON.stringify({gold:state.gold,score:state.score,correct:state.correctTotal,lives:state.lives})'));
  const before = await snapshot();
  const go = card.getByRole('button', { name: 'Enfrentar o destino', exact: true });
  await expect(go).toBeFocused();
  await expect.poll(() => card.locator('img').evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
  for (const key of ['Tab','Tab','Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await card.evaluate(e => e.contains(document.activeElement))).toBe(true);
  }
  await go.click();
  await expect(page.locator('#battleFinalPopup')).toHaveCount(0);
  await expect(page.locator('#question')).toHaveText(question);
  expect(await snapshot()).toBe(before);
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
  await page.evaluate(() => (0, eval)('showBattleFinalPopup()'));
  await page.keyboard.press('Escape');
  await expect(page.locator('#battleFinalPopup')).toHaveCount(0);
  expect(await snapshot()).toBe(before);
});
for (const width of [320,390,1100]) test('golpe final conserva leitura e ação a 200% em ' + width, async ({ page }) => {
  await page.setViewportSize({ width, height: 700 });
  const card = await abrir(page);
  await expect.poll(() => card.locator('img').evaluate((e: HTMLImageElement) => e.complete)).toBe(true);
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/golpe-integrado-' + width + '.png' });
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  expect(await card.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  const go = card.getByRole('button', { name: 'Enfrentar o destino', exact: true });
  const box = (await go.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(700);
  expect(await card.locator('img').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
  const region = card.getByRole('region');
  await region.focus(); await page.keyboard.press('End');
  await expect.poll(() => region.evaluate(e => e.scrollHeight <= e.clientHeight || e.scrollTop > 0)).toBe(true);
  if (width < 600) expect(await region.evaluate(e => getComputedStyle(e).scrollbarWidth)).toBe('none');
  expect(await page.evaluate(medirContraste, '#battleFinalPopup')).toEqual([]);
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/golpe-integrado-' + width + '-200.png' });
});
