import { test, expect, Page } from '@playwright/test';

/**
 * Trilha dos selos com memória (v14.61).
 *
 * O selo continua sendo da jornada — chegar aos 100 acertos nesta partida é o
 * desafio. Mas quem já venceu não pode ser rebaixado ao dia zero ao começar de
 * novo com outra classe.
 *
 * `nefroquest-announced-badges` NÃO serve para isso: deleteSave() a apaga
 * exatamente no início da nova jornada. O histórico vive em
 * `nefroquest-badge-history`, que sobrevive e só some em reset total.
 */

const SAVE_NOVA_JORNADA = {
  schemaVersion: 6, level: 1, xp: 0, xpToNext: 100, score: 0,
  lives: 4, maxLives: 4, streak: 0, gold: 0, difficulty: 'normal',
  correctTotal: 4, character: 'aquaria', selectedCharacter: 'aquaria',
  gameStarted: true, gameOver: false, idx: 0, queueIds: [], recentIds: [],
  chestsOpened: 0, narrativeShown: 0, bossIntroShown: false, timestamp: Date.now(),
};

async function abrirConquistas(page: Page, historico: Record<string, unknown> | null) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(({ save, historico }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
      totalQuestions: 340, totalCorrect: 240, totalWrong: 100,
      byCategory: { drc: { correct: 9, wrong: 14 } }, dailyActivity: {},
    }));
    if (historico) localStorage.setItem('nefroquest-badge-history', JSON.stringify(historico));
    else localStorage.removeItem('nefroquest-badge-history');
    localStorage.setItem('nefroquest-premium', '1');
  }, { save: SAVE_NOVA_JORNADA, historico });
  await page.reload();
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
  await page.getByRole('tab', { name: 'Conquistas', exact: true }).click();
}

test.describe('Selos: memória entre jornadas', () => {
  test('quem já venceu não é rebaixado ao dia zero na jornada seguinte', async ({ page }) => {
    // Venceu tudo na 1ª jornada; agora está com 4 acertos na 2ª.
    await abrirConquistas(page, {
      1: { jornada: 1 }, 2: { jornada: 1 }, 3: { jornada: 1 },
      4: { jornada: 1 }, 5: { jornada: 1 },
    });

    const comMemoria = page.locator('#nqdPane-achievements .nqd-badge-node[data-memoria="true"]');
    expect(await comMemoria.count(), 'os selos já ganhos precisam ser reconhecidos').toBeGreaterThan(0);
    await expect(comMemoria.first()).toContainText('seu');
    await expect(comMemoria.first()).toContainText('1ª jornada');
  });

  test('sem histórico, a trilha se comporta como antes', async ({ page }) => {
    await abrirConquistas(page, null);
    const comMemoria = page.locator('#nqdPane-achievements .nqd-badge-node[data-memoria="true"]');
    await expect(comMemoria).toHaveCount(0);
    // E continua mostrando o requisito em acertos.
    await expect(page.locator('#nqdPane-achievements .nqd-badge-node').first()).toContainText('acertos');
  });

  test('o selo alcançado NESTA jornada conta como conquistado, não como memória', async ({ page }) => {
    await abrirConquistas(page, { 1: { jornada: 1 } });
    // correctTotal 4 não alcança nenhum marco nesta jornada, então badge1
    // aparece como posse — não como desbloqueado agora.
    const badge = page.locator('#nqdPane-achievements .nqd-badge-node').first();
    await expect(badge).toHaveAttribute('data-state', 'current');
    await expect(badge).toHaveAttribute('data-memoria', 'true');
  });

  test('histórico corrompido não derruba a trilha', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', e => erros.push(String(e)));
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => (window as any)._loadTopics?.());
    await page.evaluate(save => {
      localStorage.setItem('nefroquest-save', JSON.stringify(save));
      localStorage.setItem('nefroquest-badge-history', '["isto","nao","e","objeto"]');
      localStorage.setItem('nefroquest-premium', '1');
    }, SAVE_NOVA_JORNADA);
    await page.reload();
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => (window as any)._loadTopics?.());
    await page.evaluate(() => (window as any).openDashboard());
    await page.getByRole('tab', { name: 'Conquistas', exact: true }).click();
    await expect(page.locator('#nqdPane-achievements .nqd-badge-node')).toHaveCount(5);
    expect(erros).toEqual([]);
  });

  test('o histórico sobrevive a deleteSave — que é o início de uma nova jornada', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).deleteSave === 'function' || typeof (window as any)._confirmDiff === 'function');
    const sobreviveu = await page.evaluate(() => {
      localStorage.setItem('nefroquest-badge-history', JSON.stringify({ 1: { jornada: 1 } }));
      localStorage.setItem('nefroquest-announced-badges', JSON.stringify([1]));
      (window as any)._pendingDiff = 'normal';
      (window as any)._confirmDiff(false); // chama deleteSave internamente
      return {
        historico: localStorage.getItem('nefroquest-badge-history'),
        anunciados: localStorage.getItem('nefroquest-announced-badges'),
      };
    });
    expect(sobreviveu.historico, 'o histórico não pode ser apagado ao começar nova jornada').toContain('"1"');
    expect(sobreviveu.anunciados, 'a lista de anúncio continua sendo limpa, como antes').toBeNull();
  });
});
