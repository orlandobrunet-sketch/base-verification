import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * NQ-02: fim de jornada → nova jornada, sem contar duas vezes.
 *
 * As estatísticas vitalícias (`nefroquest-stats`) são o que a Central mostra
 * como "partidas jogadas", "melhor nível" e "melhor pontuação". Elas só sobem
 * em `updateGameStats()`, chamada por `finishGame()`. E `finishGame()` tem dois
 * caminhos de entrada — a vitória, por `finishGameCompletely()`, e o fim por
 * falta de vidas — nenhum deles com trava contra reentrada.
 *
 * Números vitalícios que sobem sozinhos são a pior classe de defeito neste
 * app: ninguém percebe, e a Central passa a prescrever a partir de um passado
 * que não aconteceu.
 */

const CHAVE_STATS = 'nefroquest-stats';

async function abrirJogo(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
}

const lerStats = (page: Page) => page.evaluate((chave) => {
  try { return JSON.parse(localStorage.getItem(chave) || '{}'); } catch { return {}; }
}, CHAVE_STATS);

test.describe('Fim de jornada não conta duas vezes', () => {
  test('encerrar a jornada soma exatamente uma partida', async ({ page }) => {
    await abrirJogo(page);
    const antes = await lerStats(page);

    await page.evaluate(() => (window as any).finishGame?.());
    await page.waitForTimeout(400);

    const depois = await lerStats(page);
    expect(
      (depois.gamesPlayed || 0) - (antes.gamesPlayed || 0),
      'encerrar uma vez precisa somar exatamente uma partida',
    ).toBe(1);
  });

  test('encerrar duas vezes seguidas não soma duas partidas', async ({ page }) => {
    await abrirJogo(page);
    const antes = await lerStats(page);

    // O caminho real: clique duplo no botão de encerrar, ou fim por falta de
    // vidas disparando enquanto o modal de vitória ainda está aberto. Os dois
    // desembocam em finishGame() duas vezes para a MESMA jornada.
    await page.evaluate(() => {
      const g = window as any;
      g.finishGame?.();
      g.finishGame?.();
    });
    await page.waitForTimeout(400);

    const depois = await lerStats(page);
    expect(
      (depois.gamesPlayed || 0) - (antes.gamesPlayed || 0),
      'a mesma jornada foi contada mais de uma vez',
    ).toBe(1);
  });

  test('a melhor pontuação e o melhor nível não sobem numa jornada zerada', async ({ page }) => {
    await abrirJogo(page);
    await page.evaluate(() => (window as any).finishGame?.());
    await page.waitForTimeout(300);
    const referencia = await lerStats(page);

    // Nova jornada: nível 1, pontuação 0. Encerrá-la não pode rebaixar nem
    // inflar o melhor histórico.
    await page.evaluate(() => {
      const g = window as any;
      g.state.level = 1;
      g.state.score = 0;
      g.finishGame?.();
    });
    await page.waitForTimeout(300);

    const depois = await lerStats(page);
    expect(depois.bestLevel, 'o melhor nível não pode cair').toBe(referencia.bestLevel);
    expect(depois.bestScore, 'a melhor pontuação não pode cair').toBe(referencia.bestScore);
  });
});
