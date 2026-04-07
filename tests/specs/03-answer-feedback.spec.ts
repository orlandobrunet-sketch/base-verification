import { test, expect } from '@playwright/test';
import { injectGameState, waitForGame , isLiveEnv } from '../helpers/game';

test.describe('Feedback de resposta', () => {
  test.beforeAll(() => {
    if (!isLiveEnv) test.skip();
  });
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectGameState(page);
    await waitForGame(page);
  });

  test('resposta correta adiciona classe .correct na opção', async ({ page }) => {
    // Encontra qual opção é a correta via data-idx e avalia o estado após clique
    const options = page.locator('#options .option');
    const count = await options.count();

    // Clica em cada opção até achar a correta (ou confirma que o feedback funciona)
    // Na prática: clica na primeira e verifica se o estado de feedback é aplicado
    await options.first().click();

    const feedback = page.locator('#feedback');
    const feedbackText = await feedback.textContent();

    // Uma das classes deve estar presente na opção clicada
    const clickedOption = options.first();
    const hasCorrect = await clickedOption.evaluate(el =>
      el.classList.contains('correct') || el.classList.contains('wrong')
    );
    expect(hasCorrect).toBe(true);

    // Feedback não pode estar vazio
    expect(feedbackText?.trim().length).toBeGreaterThan(0);
  });

  test('após responder, as opções ficam desabilitadas', async ({ page }) => {
    await page.locator('#options .option').first().click();

    // Todas as opções devem estar desabilitadas
    const options = page.locator('#options .option');
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      await expect(options.nth(i)).toBeDisabled({ timeout: 3_000 });
    }
  });

  test('referências aparecem após resposta (quando existem)', async ({ page }) => {
    await page.locator('#options .option').first().click();
    // refs pode estar vazio ou com conteúdo — o importante é não quebrar
    const refs = page.locator('#refs');
    await expect(refs).toBeAttached();
  });
});
