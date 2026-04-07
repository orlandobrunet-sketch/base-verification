import { Page, expect } from '@playwright/test';

/** Injeta um save de estado no localStorage e recarrega a página */
export async function injectGameState(page: Page, overrides: Record<string, unknown> = {}) {
  const base = {
    schemaVersion: 2,
    level: 5,
    xp: 150,
    xpToNext: 400,
    score: 2500,
    lives: 3,
    streak: 2,
    gold: 80,
    bonusUses: 0,
    correctTotal: 15,
    narrativeShown: 0,
    bossIntroShown: false,
    character: 'guerreiro',
    equipment: [null, null, null],
    idx: 0,
    queueIds: [],
    recentIds: [],
    chestsOpened: 2,
    timestamp: Date.now(),
  };
  const save = { ...base, ...overrides };
  await page.evaluate((s) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(s));
    localStorage.setItem('nefroquest-premium', '1'); // evitar paywall nos testes
  }, save);
  await page.reload();
}

/** Injeta estado de boss mode (correctTotal = 90) */
export async function injectBossState(page: Page) {
  return injectGameState(page, {
    correctTotal: 90,
    level: 12,
    score: 45000,
    bossIntroShown: true, // pula o popup de intro para testar o jogo em si
  });
}

/** Aguarda a tela de jogo principal estar pronta */
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

/** Responde uma questão e clica em "Próxima" / "Atacar" */
export async function answerAndAdvance(page: Page) {
  await pickFirstOption(page);
  const nextBtn = page.locator('#nextBtn:not(.hidden)');
  await expect(nextBtn).toBeVisible({ timeout: 5_000 });
  await nextBtn.click();
}
