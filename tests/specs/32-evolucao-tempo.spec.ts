import { test, expect, Page } from '@playwright/test';

/**
 * Evolução no tempo (v14.62).
 *
 * A Central sabia dizer onde o jogador está, nunca para onde está indo. A
 * solução não exigiu coleta nova: `dailyActivity` já grava {count, correct}
 * por dia e não sofre poda — retém a série inteira desde a primeira partida.
 *
 * As regras que estes cenários protegem:
 *  - só compara com amostra mínima nas DUAS janelas;
 *  - a variação vem sempre com os dois números e os dois tamanhos de amostra;
 *  - duas janelas não viram curva extrapolada.
 */

const SAVE = {
  schemaVersion: 6, level: 6, xp: 210, xpToNext: 480, score: 4820,
  lives: 4, maxLives: 4, streak: 3, gold: 640, difficulty: 'normal',
  correctTotal: 47, character: 'nephros', selectedCharacter: 'nephros',
  gameStarted: true, gameOver: false, idx: 0, queueIds: [], recentIds: [],
  chestsOpened: 5, narrativeShown: 2, bossIntroShown: false, timestamp: Date.now(),
};

function chave(offset: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Constrói dailyActivity com uma janela atual e uma anterior controladas. */
function atividade(agora: [number, number], antes: [number, number]) {
  const a: Record<string, { count: number; correct: number }> = {};
  a[chave(1)] = { count: agora[0], correct: agora[1] };
  a[chave(9)] = { count: antes[0], correct: antes[1] };
  return a;
}

async function abrir(page: Page, dailyActivity: Record<string, unknown>) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(({ save, dailyActivity }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
      totalQuestions: 200, totalCorrect: 130, totalWrong: 70,
      byCategory: { drc: { correct: 9, wrong: 14 } }, dailyActivity,
    }));
    localStorage.setItem('nefroquest-premium', '1');
  }, { save: SAVE, dailyActivity });
  await page.reload();
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
}

test.describe('Evolução entre semanas', () => {
  test('quando sobe, declara a alta com os dois números', async ({ page }) => {
    // 20 respostas / 18 certas = 90% agora; 20 / 12 = 60% antes -> +30
    await abrir(page, atividade([20, 18], [20, 12]));
    const evo = page.locator('#nqdPane-overview .nqd-evolution');
    await expect(evo).toBeVisible();
    await expect(evo).toHaveAttribute('data-trend', 'sobe');
    await expect(evo).toContainText('Subiu 30 pontos');
    await expect(evo).toContainText('90% em 20 respostas');
    await expect(evo).toContainText('60% em 20');
  });

  test('quando cai, diz que caiu — sem maquiar', async ({ page }) => {
    await abrir(page, atividade([20, 10], [20, 16]));
    const evo = page.locator('#nqdPane-overview .nqd-evolution');
    await expect(evo).toHaveAttribute('data-trend', 'desce');
    await expect(evo).toContainText('Caiu 30 pontos');
  });

  test('sem amostra mínima nas duas janelas, não afirma variação', async ({ page }) => {
    // 4 respostas na janela anterior: abaixo do mínimo de 10.
    await abrir(page, atividade([20, 18], [4, 1]));
    const evo = page.locator('#nqdPane-overview .nqd-evolution');
    await expect(evo).toHaveClass(/is-forming/);
    await expect(evo).not.toContainText('Subiu');
    await expect(evo).not.toContainText('Caiu');
  });

  test('nunca extrapola tendência a partir de duas janelas', async ({ page }) => {
    await abrir(page, atividade([20, 18], [20, 12]));
    const texto = await page.locator('#nqdPane-overview .nqd-evolution').innerText();
    expect(texto).not.toMatch(/tendência|projeção|no ritmo|vai atingir|continuando assim/i);
  });

  test('não inventa comparação para quem nunca jogou', async ({ page }) => {
    await abrir(page, {});
    const evo = page.locator('#nqdPane-overview .nqd-evolution');
    await expect(evo).toHaveClass(/is-forming/);
    await expect(evo).toContainText('10 respostas');
  });
});
