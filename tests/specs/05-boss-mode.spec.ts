import { test, expect } from '@playwright/test';
import { injectBossState, waitForGame, enterGame } from '../helpers/game';

test.describe('Boss mode (Fase Final)', () => {
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
    await expect(counter).toContainText('FASE FINAL');
  });

  test('botão de ataque tem texto correto', async ({ page }) => {
    // Responde para revelar o botão
    await page.locator('#options .option').first().click();
    const nextBtn = page.locator('#nextBtn:not(.hidden)');
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    const text = await nextBtn.textContent();
    expect(text).toMatch(/Próxima Carta|GOLPE FINAL/i);
  });

  test('botão NOVO JOGO aparece ao lado do botão de ataque', async ({ page }) => {
    await page.locator('#options .option').first().click();
    await expect(page.locator('#nextBtn:not(.hidden)')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#newBtn')).toBeVisible({ timeout: 3_000 });
  });

  test('alternativas têm marcador A B C D no boss mode', async ({ page }) => {
    const keys = page.locator('#options .option .opt-key');
    await expect(keys.nth(0)).toHaveText('A');
    await expect(keys.nth(1)).toHaveText('B');
  });

  test('classe arqui-nefromante-final está no body no boss mode', async ({ page }) => {
    // Aguarda updateBossUI() aplicar a classe
    await expect(page.locator('body.arqui-nefromante-final')).toBeAttached({ timeout: 5_000 });
  });

  test('HP bar diminui após resposta correta', async ({ page }) => {
    // O índice correto não é exposto antes de responder. Sondamos clicando a
    // opção 0: a classe .correct é revelada após responder. Se acertamos,
    // validamos a queda de HP; senão avançamos para a próxima carta e tentamos
    // de novo (sem reload — vidas altas via injectBossState dão folga).
    const hpFill = page.locator('#bossHpFill');
    let validated = false;

    for (let attempt = 0; attempt < 12 && !validated; attempt++) {
      const hpBefore = await hpFill.evaluate(el =>
        parseFloat((el as HTMLElement).style.width || '100'));

      await page.locator('#options .option[data-idx="0"]').click();
      const correctIdx = await page.locator('#options .option.correct').first()
        .getAttribute('data-idx');
      const nextBtn = page.locator('#nextBtn:not(.hidden)');
      await expect(nextBtn).toBeVisible({ timeout: 5_000 });

      if (correctIdx === '0') {
        await page.waitForTimeout(400); // animação da barra de HP
        const hpAfter = await hpFill.evaluate(el =>
          parseFloat((el as HTMLElement).style.width || '100'));
        expect(hpAfter).toBeLessThan(hpBefore);
        validated = true;
      } else {
        await nextBtn.click(); // próxima carta
        await expect(page.locator('#options .option')).toHaveCount(4, { timeout: 5_000 });
      }
    }

    expect(validated, 'não acertou a alternativa 0 em 12 cartas').toBe(true);
  });
});
