import { test, expect, type Page } from '@playwright/test';

/**
 * O preview do chefe e o atalho administrativo usavam o mesmo estado da
 * jornada real. Como o state agenda save automaticamente, os valores fictícios
 * do confronto (90 acertos, equipamentos e score) vazavam para o perfil.
 * Responder no preview ainda gravava domínio, competências, Grimório e
 * conquistas. Estes testes protegem o contrato de demonstração sem progresso.
 */

const SAVE_REAL = {
  schemaVersion: 6,
  level: 2, xp: 37, xpToNext: 230, score: 740,
  lives: 4, maxLives: 4, streak: 1, gold: 86, bonusUses: 0,
  correctTotal: 7, narrativeShown: 5, bossIntroShown: false,
  battleFinalShown: false, gameOver: false, gameStarted: true,
  difficulty: 'normal', character: 'nephros',
  idx: 0, queueIds: [], recentIds: [], chestsOpened: 1,
  obtainedItems: [], allItemsCollectedNotified: false,
  legendaryAbilityUsed: {}, extraLifeGiven: false,
  chestCorrectCount: 2, chestTarget: 5, timestamp: 1_786_000_000_000,
};

const DADOS_REAIS: Record<string, string> = {
  'nefroquest-save': JSON.stringify(SAVE_REAL),
  'nefroquest-stats': JSON.stringify({ gamesPlayed: 2, bestLevel: 3, bestScore: 1800, questionsAnsweredAllTime: 18 }),
  'nefroquest-detailed-stats': JSON.stringify({
    schemaVersion: 2, totalQuestions: 18, totalCorrect: 11, totalWrong: 7,
    byTopic: {}, byCategory: {}, dailyActivity: {}, mostMissed: {},
    timeStats: { totalTime: 240, questionCount: 18 }, questionHistory: [], syncedMastered: ['real-1'],
  }),
  'nefroquest-comp-stats': JSON.stringify({ drc_screening: { c: 2, t: 3 } }),
  'nefroquest-mastered': JSON.stringify(['real-1']),
  'nq-unlocked-refs': JSON.stringify(['KDIGO-DRC-2024']),
  'nefroquest-all-answered-qids': JSON.stringify(['real-1', 'real-2']),
  'nefroquest-achievements': JSON.stringify(['century_club']),
  'nefroquest-announced-badges': JSON.stringify([]),
  'nefroquest-badge-history': JSON.stringify({ 1: { jornada: 2 } }),
  'nefroquest-error-reasons': JSON.stringify({ counts: { guess: 1 }, log: [] }),
};

const CHAVES_PROTEGIDAS = [
  ...Object.keys(DADOS_REAIS),
  'nefroquest-arqui-defeated',
  'nefroquest-hardcore-completed',
  'nefroquest-gold-milestone-shown',
];

async function snapshotProtegido(page: Page) {
  return page.evaluate((keys) => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), CHAVES_PROTEGIDAS);
}

async function abrirPreviewComProgressoReal(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).startBossPreview === 'function', undefined, { timeout: 15_000 });
  // O menu administrativo carrega o banco antes de chamar o preview. Repetimos
  // a mesma pré-condição para que a falha observada seja a contaminação dos
  // dados, não a ausência do deck lazy-loaded.
  await page.evaluate(async () => {
    await Promise.all([
      (window as any)._loadTopics(),
      (window as any).carregarDadosGrimorio(),
    ]);
  });
  await page.evaluate((dados) => {
    localStorage.clear();
    Object.entries(dados).forEach(([key, value]) => localStorage.setItem(key, value));
  }, DADOS_REAIS);
  const antes = await snapshotProtegido(page);
  await page.evaluate(() => (window as any).startBossPreview());
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#question')).not.toBeEmpty({ timeout: 15_000 });
  return antes;
}

test.describe('Preview isolado do Confronto Final', () => {
  test('atalho administrativo entra no mesmo sandbox sem tocar no save', async ({ page }) => {
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof (window as any).adminJumpToBoss === 'function', undefined, { timeout: 15_000 });
    await page.evaluate(async (dados) => {
      await Promise.all([
        (window as any)._loadTopics(),
        (window as any).carregarDadosGrimorio(),
      ]);
      localStorage.clear();
      Object.entries(dados).forEach(([key, value]) => localStorage.setItem(key, value as string));
      (window as any).isAdminUser = () => true;
    }, DADOS_REAIS);
    const antes = await snapshotProtegido(page);

    await page.evaluate(async () => { await (window as any).adminJumpToBoss(); });
    await expect(page.getByRole('status', { name: 'Modo de demonstração' })).toBeVisible();
    await page.waitForTimeout(1_100);

    expect(await snapshotProtegido(page), 'o atalho administrativo ainda escreveu os 90 acertos fictícios').toEqual(antes);
  });

  test('entrar e responder não altera jornada, aprendizagem ou conquistas reais', async ({ page }) => {
    const antes = await abrirPreviewComProgressoReal(page);

    await page.waitForTimeout(1_100); // atravessa os dois debounces do save antigo
    expect(await snapshotProtegido(page), 'o simples ato de abrir o preview já contaminou o perfil').toEqual(antes);
    await expect(page.getByRole('status', { name: 'Modo de demonstração' })).toBeVisible();

    await page.evaluate(() => {
      const g = window as any;
      const correta = g.state.current.a;
      const botao = document.querySelectorAll<HTMLButtonElement>('#options .option')[correta];
      g.answer(correta, botao);
    });
    await page.waitForTimeout(1_100);

    expect(await snapshotProtegido(page), 'uma resposta do preview foi registrada como aprendizagem real').toEqual(antes);
    await expect(page.locator('.question-rating')).toHaveCount(0);
  });

  test('reflexão de erro não grava padrão clínico nem envia evento ao backend', async ({ page }) => {
    const antes = await abrirPreviewComProgressoReal(page);
    const inserts: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/question_error_reasons')) inserts.push(request.url());
    });

    await page.evaluate(() => {
      const g = window as any;
      const errada = (g.state.current.a + 1) % g.state.current.o.length;
      const botao = document.querySelectorAll<HTMLButtonElement>('#options .option')[errada];
      g.answer(errada, botao);
    });
    const chip = page.locator('.err-reflect-chip').first();
    if (await chip.count()) {
      await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('.err-reflect-chip');
        if (el) (window as any)._pickErrorReason(el);
      });
    }
    await page.waitForTimeout(500);

    expect(await snapshotProtegido(page)).toEqual(antes);
    expect(inserts, 'a demonstração enviou um erro clínico fictício ao backend').toEqual([]);
  });

  test('concluir a demonstração não concede vitória, conquista ou pontuação real', async ({ page }) => {
    const antes = await abrirPreviewComProgressoReal(page);
    await page.evaluate(() => {
      const g = window as any;
      g.state.correctTotal = 99;
      g.state.narrativeShown = 98;
      g.state.gameCompleted = false;
      const correta = g.state.current.a;
      const botao = document.querySelectorAll<HTMLButtonElement>('#options .option')[correta];
      g.answer(correta, botao);
    });

    await expect(page.locator('#victoryModal')).toBeVisible({ timeout: 10_000 });
    await page.evaluate(() => (window as any).finishGameCompletely());
    await page.waitForTimeout(600);

    expect(await snapshotProtegido(page), 'a vitória simulada foi promovida a conquista real').toEqual(antes);
  });

  test('sair da demonstração recarrega a jornada real intacta', async ({ page }) => {
    const antes = await abrirPreviewComProgressoReal(page);
    await page.getByRole('button', { name: 'Sair da demonstração' }).click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof (window as any).loadGame === 'function', undefined, { timeout: 15_000 });

    const restaurado = await page.evaluate(() => ({
      save: (window as any).loadGame(),
      sandbox: (window as any).isProgressSandbox?.() || false,
      bossParam: new URL(location.href).searchParams.has('boss'),
    }));
    expect(restaurado.save.correctTotal).toBe(7);
    expect(restaurado.save.score).toBe(740);
    expect(restaurado.sandbox).toBe(false);
    expect(restaurado.bossParam).toBe(false);
    expect(await snapshotProtegido(page)).toEqual(antes);
  });
});
