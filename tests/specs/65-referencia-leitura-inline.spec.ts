import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test('referência expande na questão, preserva os textos e recolhe pelo teclado', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/');
  await injectGameState(page);
  await page.locator('#options button').first().click();
  const source = await page.evaluate(() => {
    return (0, eval)(`(() => {
      const key = Object.keys(refsDB).find(key => refsDB[key].resumo && refsDB[key].conclusao && refsDB[key].curiosidade);
      renderRefs([key]); setLumenEvidenceAvailable(true);
      return { key, ...refsDB[key] };
    })()`);
  });
  const snapshot = () => page.evaluate(() => (0, eval)('JSON.stringify({idx:state.idx,score:state.score,lives:state.lives,correctTotal:state.correctTotal})'));
  const before = await snapshot();
  const button = page.locator('.ref-resumo-btn').first();
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  const detail = page.locator('.ref-reading');
  await expect(detail).toBeVisible();
  await expect(detail.locator('section').nth(0).locator('p')).toHaveText(source.resumo);
  await expect(detail.locator('section').nth(1).locator('p')).toHaveText(source.conclusao);
  await expect(detail.locator('section').nth(2).locator('p')).toHaveText(source.curiosidade);
  expect(await snapshot()).toBe(before);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await detail.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(detail).toBeHidden();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  expect(await snapshot()).toBe(before);
});
