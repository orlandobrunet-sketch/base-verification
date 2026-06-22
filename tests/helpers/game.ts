import { Page, expect } from '@playwright/test';

/** True quando rodando contra o deploy real (não localhost) */
export const isLiveEnv = (process.env.BASE_URL || '').includes('nefroquest.com');

/**
 * Injeta save + premium no localStorage, recarrega e entra no jogo via
 * continueGame(). O app não auto-resume a partir do save: a welcome screen
 * mostra "Continuar Jornada" (data-action="continueGame"), que carrega o banco
 * de questões e renderiza a primeira pergunta. Chamamos continueGame()
 * diretamente (mais robusto que clicar e esperar o banco lazy-load de ~1.4MB).
 *
 * character DEVE ser uma chave válida atual (glomerulus/aquaria/nephros) —
 * 'guerreiro' (chave antiga) faz characters[c].name lançar em continueGame.
 */
export async function injectGameState(page: Page, overrides: Record<string, unknown> = {}) {
  const base = {
    schemaVersion: 2,
    level: 5, xp: 150, xpToNext: 400, score: 2500,
    lives: 3, streak: 2, gold: 80, bonusUses: 0,
    correctTotal: 15, narrativeShown: 0, bossIntroShown: false,
    gameOver: false, gameStarted: true,
    difficulty: 'normal',
    character: 'glomerulus',
    // equipment omitido de propósito → restoreGame mantém o default de 6 slots.
    idx: 0, queueIds: [], recentIds: [],
    chestsOpened: 2, timestamp: Date.now(),
  };
  await page.evaluate((s) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(s));
    localStorage.setItem('nefroquest-premium', '1');
  }, { ...base, ...overrides });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await enterGame(page);
}

/**
 * Entra no jogo a partir do save no localStorage (após um load/reload).
 * Dispensa a landing screen (que senão fica sobreposta interceptando cliques),
 * dispara continueGame() — que carrega o banco de questões e renderiza a
 * primeira pergunta — e espera a tela de jogo. Reutilizável por testes que
 * recarregam a página (o app não auto-resume a partir do save).
 */
export async function enterGame(page: Page) {
  await page.evaluate(() => {
    document.getElementById('landingScreen')?.classList.add('hidden');
    document.getElementById('welcomeScreen')?.classList.add('hidden');
  });
  await page.waitForFunction(() => typeof (window as any).continueGame === 'function', null, { timeout: 15_000 });
  await page.evaluate(() => (window as any).continueGame());
  await waitForGame(page);
}

/**
 * Injeta estado de boss mode (correctTotal = 90). Vidas altas dão folga para
 * testes que precisam sondar a alternativa correta (erro custa vida no boss).
 */
export async function injectBossState(page: Page) {
  return injectGameState(page, {
    correctTotal: 90, level: 12, score: 45000, bossIntroShown: true,
    lives: 99, maxLives: 99,
  });
}

/** Aguarda a tela de jogo principal (após injectGameState/continueGame). */
export async function waitForGame(page: Page) {
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#question')).not.toBeEmpty({ timeout: 10_000 });
}

/** Clica na primeira opção disponível */
export async function pickFirstOption(page: Page) {
  const option = page.locator('#options .option').first();
  await expect(option).toBeEnabled({ timeout: 5_000 });
  await option.click();
}

/** Responde e avança */
export async function answerAndAdvance(page: Page) {
  await pickFirstOption(page);
  const nextBtn = page.locator('#nextBtn:not(.hidden)');
  await expect(nextBtn).toBeVisible({ timeout: 5_000 });
  await nextBtn.click();
}
