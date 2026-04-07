import { test, expect } from '@playwright/test';
import { injectGameState, waitForGame, pickFirstOption, answerAndAdvance , isLiveEnv } from '../helpers/game';

test.describe('Gameplay básico', () => {
  test.beforeEach(async () => {
    if (!isLiveEnv) test.skip();
  });
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectGameState(page);
    await waitForGame(page);
  });

  test('questão renderiza com texto e 4 alternativas', async ({ page }) => {
    const question = page.locator('#question');
    await expect(question).not.toBeEmpty();

    const options = page.locator('#options .option');
    await expect(options).toHaveCount(4);
  });

  test('alternativas têm prefixo A) B) C) D) em texto', async ({ page }) => {
    const options = page.locator('#options .option');
    const texts = await options.allTextContents();
    expect(texts[0]).toMatch(/^A\)/);
    expect(texts[1]).toMatch(/^B\)/);
    expect(texts[2]).toMatch(/^C\)/);
    expect(texts[3]).toMatch(/^D\)/);
  });

  test('selecionar alternativa habilita botão de avançar', async ({ page }) => {
    const nextBtn = page.locator('#nextBtn');
    await expect(nextBtn).toHaveClass(/hidden/);

    await pickFirstOption(page);

    await expect(nextBtn).not.toHaveClass(/hidden/, { timeout: 3_000 });
  });

  test('feedback aparece após selecionar alternativa', async ({ page }) => {
    await pickFirstOption(page);
    const feedback = page.locator('#feedback');
    // feedback deve ter conteúdo além de "Escolha a melhor resposta."
    const text = await feedback.textContent();
    expect(text).toBeTruthy();
    expect(text).not.toBe('Escolha a melhor resposta.');
  });

  test('avançar para próxima questão carrega nova pergunta', async ({ page }) => {
    const firstQuestion = await page.locator('#question').textContent();
    await answerAndAdvance(page);
    // Aguarda a questão mudar
    await expect(page.locator('#question')).not.toHaveText(firstQuestion!, { timeout: 5_000 });
  });

  test('HUD exibe pontos, nível e vidas', async ({ page }) => {
    // Painél esquerdo deve mostrar dados do player
    const hud = page.locator('.hud');
    await expect(hud).toBeVisible();
    // Deve haver tiles com valores numéricos
    const tiles = page.locator('.hud .tile strong');
    const count = await tiles.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
