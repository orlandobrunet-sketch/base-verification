import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test('referência expande na questão, preserva os textos e recolhe pelo teclado', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/');
  // O cenário de leitura não deve cruzar o marco de 100 de ouro.
  await injectGameState(page, { gold: 0 });
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
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    for (const percent of [100, 200]) {
      await test.step('referência em ' + width + 'px, texto a ' + percent + '%', async () => {
        await page.evaluate(async percent => {
          document.documentElement.style.fontSize = percent === 200 ? '32px' : '16px';
          await document.fonts.ready;
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        }, percent);
        const metrics = await detail.evaluate(el => {
          const box = el.getBoundingClientRect();
          const cut: string[] = [];
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!(node.textContent || '').trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            if (Array.from(range.getClientRects()).some(rect => rect.width && rect.height &&
              (rect.left < box.left - 1 || rect.right > box.right + 1 ||
               rect.top < box.top - 1 || rect.bottom > box.bottom + 1))) {
              cut.push(node.textContent || '');
            }
          }
          return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, cut };
        });
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
        expect(metrics.cut, 'os títulos e parágrafos devem permanecer dentro da referência').toEqual([]);
        expect(await snapshot()).toBe(before);
      });
    }
  }
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(detail).toBeHidden();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  expect(await snapshot()).toBe(before);
});
