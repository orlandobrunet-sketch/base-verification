import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
async function abrir(page: Page, index: number) {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
  await page.evaluate(i => (0, eval)('showMinigameIntroPopup(' + [25,50,75][i] + ',' + i + ')'), index);
  const card = page.locator('#minigameIntroPopup [role=dialog]');
  await expect(card).toBeVisible();
  return card;
}
for (const index of [0,1,2]) test('evento ' + index + ' preserva narrativa e permite continuar sem recompensa', async ({ page }) => {
  const card = await abrir(page, index);
  const expected = await page.evaluate(i => (0, eval)('_minigameIntros[' + i + ']'), index);
  await expect(card.locator('h2')).toHaveText(expected.title);
  await expect(card.locator('.nqinvite-story')).toHaveText(expected.text);
  await expect(card.locator('.nqinvite-reward p')).toHaveText(expected.reward);
  await expect(card.getByRole('button', { name: 'Aceitar o desafio!', exact: true })).toBeFocused();
  const before = await page.evaluate(() => (0, eval)('JSON.stringify({gold:state.gold,score:state.score,correct:state.correctTotal,lives:state.lives})'));
  for (const key of ['Tab','Tab','Tab','Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await card.evaluate(e => e.contains(document.activeElement))).toBe(true);
  }
  await card.getByRole('button', { name: 'Continuar jornada', exact: true }).click();
  await expect(page.locator('#minigameIntroPopup, #rapidQuizPage')).toHaveCount(0);
  expect(await page.evaluate(() => (0, eval)('JSON.stringify({gold:state.gold,score:state.score,correct:state.correctTotal,lives:state.lives})'))).toBe(before);
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});
test('aceitar abre o Julgamento Rápido; Escape fecha apenas o convite', async ({ page }) => {
  const card = await abrir(page, 0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#minigameIntroPopup, #rapidQuizPage')).toHaveCount(0);
  await page.evaluate(() => (0, eval)('showMinigameIntroPopup(25,0)'));
  await card.getByRole('button', { name: 'Aceitar o desafio!', exact: true }).click();
  await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
  await expect(page.locator('#rapidQuizPage')).toBeVisible();
  await expect(page.locator('#mgQuestao')).toHaveText('Afirmação 1 de 10');
});
for (const width of [320,390,1100]) test('convite mantém leitura e ações com texto a 200% em ' + width, async ({ page }) => {
  await page.setViewportSize({ width, height: 700 });
  const card = await abrir(page, 1);
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/convite-integrado-' + width + '.png' });
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  expect(await card.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  for (const button of await card.locator('button').all()) {
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(700);
  }
  expect(await card.locator('.nqinvite-rune').first().evaluate(e => getComputedStyle(e).animationName)).toBe('none');
  const region = card.getByRole('region');
  await region.focus(); await page.keyboard.press('End');
  await expect.poll(() => region.evaluate(e => e.scrollHeight <= e.clientHeight || e.scrollTop > 0)).toBe(true);
  if (width < 600) expect(await region.evaluate(e => getComputedStyle(e).scrollbarWidth)).toBe('none');
  expect(await page.evaluate(medirContraste, '#minigameIntroPopup')).toEqual([]);
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/convite-integrado-' + width + '-200.png' });
});
