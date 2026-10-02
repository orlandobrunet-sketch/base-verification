import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
async function abrir(page: Page) {
 await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
 await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
 await injectGameState(page);
 await page.waitForLoadState('load');
 await page.evaluate(() => document.fonts.ready);
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(() => (0, eval)('triggerChestRewardPopup()'));
 await expect(page.getByRole('dialog', { name: 'Baú de Relíquias Ancestrais' })).toBeVisible();
}

test('arte carregada, ação principal e foco no diálogo', async ({ page }) => {
 await abrir(page);
 const popup = page.locator('#autoChestPopup');
 await expect.poll(() => popup.locator('img').first().evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
 expect(await popup.locator('img').first().evaluate(el => (el as HTMLImageElement).naturalWidth / (el as HTMLImageElement).naturalHeight)).toBe(2);
 await expect(popup.getByRole('button', { name: 'Abrir baú', exact: true })).toBeFocused();
 for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab']) {
  await page.keyboard.press(key);
  expect(await popup.evaluate(el => el.contains(document.activeElement))).toBe(true);
 }
 await page.keyboard.press('Escape');
 await expect(popup).toBeVisible();
 if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/bau-integrado-' + test.info().project.name + '.png' });
});

test('a animação só recebe a recompensa uma vez, mesmo pelas duas ações', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'no-preference' });
 await abrir(page);
 await page.evaluate(() => (0, eval)('window._bauClaims = 0; claimChestReward = () => { window._bauClaims++; };'));
 await page.getByRole('button', { name: 'Abrir baú', exact: true }).click();
 await expect(page.locator('#autoChestPopup .nqch-dialog')).toHaveAttribute('aria-busy', 'true');
 await expect(page.getByRole('button', { name: 'Abrindo baú…' })).toBeDisabled();
 await page.evaluate(() => (0, eval)("_animateAndClaimChest(document.querySelector('.nqch-art')); _animateAndClaimChest(document.querySelector('.nqch-trigger'));"));
 expect(await page.evaluate(() => (window as any)._bauClaims)).toBe(0);
 await expect(page.locator('#autoChestPopup')).toHaveCount(0);
 expect(await page.evaluate(() => (window as any)._bauClaims)).toBe(1);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});

test('abrir pela ilustração mantém o recebimento do pergaminho', async ({ page }) => {
 await abrir(page);
 await page.evaluate(() => (0, eval)("unlockedArticles = []; Math.random = () => 0.1;"));
 await page.getByRole('button', { name: 'Abrir baú pela ilustração' }).click();
 await expect(page.locator('#chestModal')).toHaveClass(/show/);
 await expect(page.locator('#chestArticle')).not.toBeEmpty();
 expect(await page.evaluate(() => (0, eval)('state.chestsOpened'))).toBe(3);
 expect(await page.evaluate(() => (0, eval)('state.score'))).toBe(2560);
 expect(await page.evaluate(() => (0, eval)('unlockedArticles.length'))).toBe(1);
 expect(await page.evaluate(() => document.querySelector('#chestModal')!.contains(document.activeElement))).toBe(true);
});

test('equipamento chega à comparação e a escolha conserva a venda', async ({ page }) => {
 await abrir(page);
 await page.evaluate(() => (0, eval)(`Math.random = () => 0.9;
 state.equipment.helmet = { n:'Gorro de CTI', rar:'rare', atk:1, def:2, kno:1, luck:0 };
 rollItem = () => ({ slot:'helmet', item:{ n:'Elmo do Néfron', rar:'legendary', atk:4, def:4, kno:4, luck:4 } });`));
 await page.getByRole('button', { name: 'Abrir baú', exact: true }).click();
 await expect(page.getByRole('dialog', { name: 'Escolha seu capacete' })).toBeVisible();
 await page.getByRole('button', { name: /^Equipar novo: Elmo do Néfron/ }).click();
 expect(await page.evaluate(() => (0, eval)('state.equipment.helmet.n'))).toBe('Elmo do Néfron');
 expect(await page.evaluate(() => (0, eval)('state.gold'))).toBe(160);
 await expect(page.locator('.forge-popup')).toBeVisible();
});

for (const width of [320, 390]) test('botão visível e narrativa percorrível a 200% em ' + width, async ({ page }) => {
 await page.setViewportSize({ width, height: 700 });
 await abrir(page);
 await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
 const popup = page.locator('#autoChestPopup');
 for (const button of await popup.getByRole('button').all()) {
  const r = (await button.boundingBox())!;
  expect(r.x).toBeGreaterThanOrEqual(0);
  expect(r.x + r.width).toBeLessThanOrEqual(width);
  expect(r.height).toBeGreaterThanOrEqual(44);
 }
 const action = (await popup.getByRole('button', { name: 'Abrir baú', exact: true }).boundingBox())!;
 expect(action.y + action.height).toBeLessThanOrEqual(700);
 const reading = popup.getByRole('region');
 await reading.focus(); await page.keyboard.press('End');
 await expect.poll(() => reading.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
 expect(await reading.evaluate(el => getComputedStyle(el).scrollbarWidth)).toBe('none');
 expect(await page.evaluate(medirContraste, '#autoChestPopup')).toEqual([]);
 if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/bau-integrado-' + width + '-200.png' });
});
