import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
async function abrir(page: Page) {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 });
  await page.waitForLoadState('load');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
  await page.evaluate(() => (0, eval)('state.score=25000;state.level=15;state.gold=800;state.correctTotal=100;state.gameCompleted=true;showGameCompletionModal();'));
  const card = page.getByRole('dialog', { name: 'Jornada concluída', exact: true });
  await expect(card).toBeVisible();
  return card;
}

test('conclusão mostra arte e resultados reais; continuar preserva a jornada', async ({ page }) => {
  const card = await abrir(page);
  await expect(card.locator('.nqvictory-stats dd')).toHaveText(['25.000', '15', '100', '800']);
  await expect(card.locator('.nqvictory-champion')).toContainText('Título de Campeão');
  await expect.poll(() => card.locator('img').evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
  expect(await card.locator('img').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
  const shareBox = (await card.getByRole('button', { name: 'Compartilhar', exact: true }).boundingBox())!;
  const cardBox = (await card.boundingBox())!;
  expect(Math.abs(shareBox.x + shareBox.width / 2 - cardBox.x - cardBox.width / 2)).toBeLessThanOrEqual(1);
  const button = card.getByRole('button', { name: 'Continuar jogando', exact: true });
  await expect(button).toBeFocused();
  for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await card.evaluate(e => e.contains(document.activeElement))).toBe(true);
  }
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/conclusao-integrada-' + test.info().project.name + '.png' });
  await button.click();
  await expect(page.locator('#victoryModal')).toHaveCount(0);
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save')!).correctTotal)).toBe(100);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save')!));
  expect(await page.evaluate(() => (0, eval)('state.completedGame'))).toBe(true);
  expect(saved.correctTotal).toBe(100);
  expect(saved.score).toBe(25000);
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});

test('encerrar remove celebração e deixa o envio da pontuação acessível', async ({ page }) => {
  const card = await abrir(page);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-stats') || '{}').gamesPlayed || 0);
  await card.getByRole('button', { name: 'Encerrar jornada', exact: true }).click();
  await expect(page.locator('#victoryModal')).toHaveCount(0);
  await expect(page.locator('#nameModal')).toHaveClass(/show/);
  await expect(page.locator('#playerName')).toBeFocused();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-stats') || '{}').gamesPlayed || 0)).toBe(before + 1);
  expect(await page.evaluate(() => (0, eval)('state.completedGame'))).toBe(true);
});

test('compartilhar mantém o resumo da conquista sem encerrar o jogo', async ({ page }) => {
  const card = await abrir(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).victoryShareText = text; } } });
  });
  await card.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).victoryShareText || '')).toContain('25000 pontos · Nível 15');
  await expect(card).toBeVisible();
  expect(await page.evaluate(() => (0, eval)('state.completedGame'))).not.toBe(true);
});

for (const width of [320, 390]) test('resultado a 200% mantém leitura e ações em ' + width, async ({ page }) => {
  await page.setViewportSize({ width, height: 700 });
  const card = await abrir(page);
  await page.evaluate(() => document.documentElement.style.fontSize = '32px');
  expect(await card.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  for (const button of await card.locator('button').all()) {
    const r = (await button.boundingBox())!;
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(width);
    expect(r.y + r.height).toBeLessThanOrEqual(700);
    expect(r.height).toBeGreaterThanOrEqual(44);
  }
  const reading = card.getByRole('region');
  await reading.focus(); await page.keyboard.press('End');
  await expect.poll(() => reading.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  expect(await reading.evaluate(e => getComputedStyle(e).scrollbarWidth)).toBe('none');
  expect(await page.evaluate(medirContraste, '#victoryModal')).toEqual([]);
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/conclusao-integrada-' + width + '-200.png' });
});
