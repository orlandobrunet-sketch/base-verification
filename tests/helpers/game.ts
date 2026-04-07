import { Page, expect } from '@playwright/test';

/** True quando rodando contra o deploy real (não localhost) */
export const isLiveEnv = (process.env.BASE_URL || '').includes('nefroquest.com');

/** Injeta save + premium no localStorage e recarrega */
export async function injectGameState(page: Page, overrides: Record<string, unknown> = {}) {
  const base = {
    schemaVersion: 2,
    level: 5, xp: 150, xpToNext: 400, score: 2500,
    lives: 3, streak: 2, gold: 80, bonusUses: 0,
    correctTotal: 15, narrativeShown: 0, bossIntroShown: false,
    gameOver: false, gameStarted: true,
    character: 'guerreiro',
    equipment: [null, null, null],
    idx: 0, queueIds: [], recentIds: [],
    chestsOpened: 2, timestamp: Date.now(),
  };
  await page.evaluate((s) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(s));
    localStorage.setItem('nefroquest-premium', '1');
  }, { ...base, ...overrides });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}

/** Injeta estado de boss mode (correctTotal = 90) */
export async function injectBossState(page: Page) {
  return injectGameState(page, {
    correctTotal: 90, level: 12, score: 45000, bossIntroShown: true,
  });
}

/** Aguarda a tela de jogo principal — só funciona com sessão autenticada */
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
