import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

test('entrada rápida na Jornada aguarda as referências antes de renderizar a carta', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost'
    ? route.continue() : route.abort());
  let releaseReferences!: () => void;
  const referencesGate = new Promise<void>(resolve => { releaseReferences = resolve; });
  await page.route('**/data/refs.js', async route => {
    await referencesGate;
    await route.continue();
  });
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /refsDB|continueGame: falha inesperada/.test(message.text())) {
      runtimeErrors.push(message.text());
    }
  });
  try {
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof (window as any).continueGame === 'function');
    await page.evaluate(() => {
      (window as any).playAsGuest();
      localStorage.setItem('nefroquest-save', JSON.stringify({
        schemaVersion: 6, character: 'glomerulus', level: 2, xp: 0, xpToNext: 200,
        score: 0, gold: 0, streak: 0, lives: 3, maxLives: 3, correctTotal: 0,
        gameStarted: true, gameOver: false, difficulty: 'normal', idx: 0,
        queueIds: ['1e5e88e9'], timestamp: Date.now(),
      }));
      (window as any).refreshWelcomeSave();
      (window as any).__resumeJourney = (window as any).continueGame();
    });
    await page.waitForFunction(() => Array.isArray((window as any).questionBank) && (window as any).questionBank.length > 0);
    await expect(page.locator('#options .option')).toHaveCount(0);
    expect(await page.evaluate(() => (0, eval)('_continueGamePending'))).toBe(true);
    expect(runtimeErrors).toEqual([]);

    releaseReferences();
    await page.evaluate(() => (window as any).__resumeJourney);
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#options .option')).toHaveCount(4);
    await expect(page.locator('#options .option').first()).toBeEnabled();
    expect(await page.locator('#refs .ref-card').count()).toBeGreaterThan(0);
    expect(runtimeErrors).toEqual([]);
  } finally {
    releaseReferences();
  }
});
