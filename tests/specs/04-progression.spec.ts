import { test, expect } from '@playwright/test';
import { injectGameState, waitForGame, answerAndAdvance } from '../helpers/game';

test.describe('Progressão e salvamento', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectGameState(page, { score: 1000, level: 3 });
    await waitForGame(page);
  });

  test('save é gravado no localStorage após responder', async ({ page }) => {
    await page.locator('#options .option').first().click();

    // Aguarda debounce do save (300ms + margem)
    await page.waitForTimeout(600);

    const save = await page.evaluate(() => {
      const raw = localStorage.getItem('nefroquest-save');
      return raw ? JSON.parse(raw) : null;
    });

    expect(save).not.toBeNull();
    expect(save.schemaVersion).toBe(2);
    expect(save.character).toBeTruthy();
    expect(typeof save.score).toBe('number');
    expect(typeof save.level).toBe('number');
  });

  test('save tem todos os campos obrigatórios do schema v2', async ({ page }) => {
    await page.waitForTimeout(400);
    const save = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('nefroquest-save') || 'null')
    );
    const required = ['schemaVersion','level','xp','score','lives','correctTotal',
                      'character','bossIntroShown','chestsOpened','timestamp'];
    for (const field of required) {
      expect(save, `Campo '${field}' ausente no save`).toHaveProperty(field);
    }
  });

  test('recarregar página restaura progresso salvo', async ({ page }) => {
    const scoreBefore = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('nefroquest-save') || '{}').score
    );

    await page.reload();
    await waitForGame(page);

    const scoreAfter = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('nefroquest-save') || '{}').score
    );

    expect(scoreAfter).toBe(scoreBefore);
  });
});
