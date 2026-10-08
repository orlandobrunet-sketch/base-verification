import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function prepare(page: Page, mode: 'jornada' | 'estudo') {
  await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
    ? route.continue() : route.abort());
  await page.goto('/jogar/');
  await injectGameState(page, { gold: 0, streak: 0 });
  if (mode === 'estudo') {
    await page.evaluate(() => (0, eval)("_studySelectedAxes.clear(); _studySelectedAxes.add('drc'); startStudyMode()"));
  }
  const selector = mode === 'jornada' ? '#options .option' : '#studyQuestionArea .study-option-btn';
  const options = page.locator(selector);
  await expect(options).toHaveCount(4);
  await expect(options.first()).toBeVisible();
  await page.evaluate(selector => {
    (window as any).__nqAnswerClicks = [];
    document.querySelectorAll(selector).forEach((button, index) => {
      button.addEventListener('click', () => (window as any).__nqAnswerClicks.push(index), true);
    });
  }, selector);
  return options;
}

for (const mode of ['jornada', 'estudo'] as const) {
  for (const key of ['1', 'd', 'Enter', 'Space']) {
    test(mode + ': alternativa focada aceita ' + key + ' uma vez', async ({ page }) => {
      const options = await prepare(page, mode);
      await options.nth(1).focus();
      await page.keyboard.press(key);
      const expected = key === '1' ? 0 : key === 'd' ? 3 : 1;
      await expect.poll(() => page.evaluate(() => (window as any).__nqAnswerClicks)).toEqual([expected]);
      if (mode === 'jornada') {
        expect(await page.evaluate(() => (0, eval)('state.answered'))).toBe(true);
        await expect(page.locator('#feedback')).toBeVisible();
      } else {
        for (const option of await options.all()) await expect(option).toBeDisabled();
        expect(await page.evaluate(() => (0, eval)('studyModeCorrect + studyModeWrong'))).toBe(1);
      }
      if (key === '1' || key === 'd') {
        await page.keyboard.press(key);
        expect(await page.evaluate(() => (window as any).__nqAnswerClicks)).toEqual([expected]);
      }
    });
  }

  test(mode + ': modificadores no botão não respondem a questão', async ({ page }) => {
    const options = await prepare(page, mode);
    await options.nth(1).focus();
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
      await options.nth(1).dispatchEvent('keydown', { key: 'd', [modifier]: true, bubbles: true, cancelable: true });
    }
    expect(await page.evaluate(() => (window as any).__nqAnswerClicks)).toEqual([]);
    await expect(options.first()).toBeEnabled();
    if (mode === 'jornada') expect(await page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
    else expect(await page.evaluate(() => (0, eval)('studyModeCorrect + studyModeWrong'))).toBe(0);
  });
}

test('atalhos em um atributo focado preservam a questão sem resposta', async ({ page }) => {
  await prepare(page, 'jornada');
  if (await page.locator('#mobileHeroBtn').isVisible()) await page.locator('#mobileHeroBtn').click();
  const badge = page.locator('.equip-total-attributes .stat-badge').first();
  await badge.focus();
  await page.keyboard.press('1');
  await page.keyboard.press('d');
  expect(await page.evaluate(() => (window as any).__nqAnswerClicks)).toEqual([]);
  expect(await page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
});
