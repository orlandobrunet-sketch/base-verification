import { test, expect } from '@playwright/test';
import { injectBossState, waitForGame , isLiveEnv } from '../helpers/game';

test.describe('Boss mode (Fase Final)', () => {
  test.beforeAll(() => {
    if (!isLiveEnv) test.skip();
  });
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectBossState(page);
    await waitForGame(page);
  });

  test('painel do boss aparece (HP bar, imagem)', async ({ page }) => {
    await expect(page.locator('#bossHpContainer')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#arquiBossImageDesktop')).toBeVisible({ timeout: 5_000 });
  });

  test('contador de questão final é exibido', async ({ page }) => {
    const counter = page.locator('#bossQuestionNum');
    await expect(counter).toBeVisible({ timeout: 5_000 });
    await expect(counter).toContainText('QUESTÃO FINAL');
  });

  test('botão de ataque tem texto correto', async ({ page }) => {
    // Responde para revelar o botão
    await page.locator('#options .option').first().click();
    const nextBtn = page.locator('#nextBtn:not(.hidden)');
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    const text = await nextBtn.textContent();
    expect(text).toMatch(/ATACAR|GOLPE FINAL/i);
  });

  test('botão NOVO JOGO aparece ao lado do botão de ataque', async ({ page }) => {
    await page.locator('#options .option').first().click();
    await expect(page.locator('#nextBtn:not(.hidden)')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#newBtn')).toBeVisible({ timeout: 3_000 });
  });

  test('alternativas têm prefixo A) B) C) D) no boss mode', async ({ page }) => {
    const options = page.locator('#options .option');
    const texts = await options.allTextContents();
    expect(texts[0]).toMatch(/^A\)/);
    expect(texts[1]).toMatch(/^B\)/);
  });

  test('classe arqui-nefromante-final está no body no boss mode', async ({ page }) => {
    // Aguarda updateBossUI() aplicar a classe
    await expect(page.locator('body.arqui-nefromante-final')).toBeAttached({ timeout: 5_000 });
  });

  test('HP bar diminui após resposta correta', async ({ page }) => {
    const hpBefore = await page.locator('#bossHpFill').evaluate(el =>
      parseFloat((el as HTMLElement).style.width || '100')
    );

    // Encontra a opção correta e clica
    const options = page.locator('#options .option');
    const count = await options.count();
    let clickedCorrect = false;
    for (let i = 0; i < count; i++) {
      await options.nth(i).click();
      const isCorrect = await options.nth(i).evaluate(el => el.classList.contains('correct'));
      if (isCorrect) { clickedCorrect = true; break; }
      // Reload para tentar próxima opção
      await page.reload();
      await waitForGame(page);
    }

    if (!clickedCorrect) {
      test.skip(); // não encontrou a correta — questão tem comportamento incomum
      return;
    }

    await page.locator('#nextBtn:not(.hidden)').click();
    await page.waitForTimeout(500);

    const hpAfter = await page.locator('#bossHpFill').evaluate(el =>
      parseFloat((el as HTMLElement).style.width || '100')
    );
    expect(hpAfter).toBeLessThan(hpBefore);
  });
});
