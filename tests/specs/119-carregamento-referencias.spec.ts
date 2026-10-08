import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

for (const bancoPronto of [false, true]) {
  test(bancoPronto
    ? 'retomada com banco pronto aguarda as referências antes de renderizar a carta'
    : 'entrada rápida na Jornada aguarda as referências antes de renderizar a carta', async ({ page }) => {
    await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost'
      ? route.continue() : route.abort());
    let releaseReferences!: () => void;
    const referencesGate = new Promise<void>(resolve => { releaseReferences = resolve; });
    let referenceRequests = 0, topicRequests = 0;
    await page.route('**/data/topics.js', route => { topicRequests++; return route.continue(); });
    await page.route('**/data/refs.js', async route => {
      referenceRequests++;
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
      await page.evaluate(bancoPronto => {
        (window as any).playAsGuest();
        localStorage.setItem('nefroquest-save', JSON.stringify({
          schemaVersion: 6, character: 'glomerulus', level: 2, xp: 0, xpToNext: 200,
          score: 0, gold: 0, streak: 0, lives: 3, maxLives: 3, correctTotal: 0,
          gameStarted: true, gameOver: false, difficulty: 'normal', idx: 0,
          queueIds: ['1e5e88e9'], timestamp: Date.now(),
        }));
        (window as any).refreshWelcomeSave();
        if (bancoPronto) (window as any).__preloadTopics = (window as any)._loadTopics();
        else (window as any).__resumeJourney = (window as any).continueGame();
      }, bancoPronto);
      await page.waitForFunction(() => Array.isArray((window as any).questionBank) && (window as any).questionBank.length > 0);
      if (bancoPronto) {
        expect(await page.evaluate(() => (0, eval)('typeof refsDB'))).toBe('undefined');
        await page.evaluate(() => { (window as any).__resumeJourney = (window as any).continueGame(); });
      }
      await expect(page.locator('#options .option')).toHaveCount(0);
      expect(await page.evaluate(() => (0, eval)('_continueGamePending'))).toBe(true);
      expect(runtimeErrors).toEqual([]);

      releaseReferences();
      await page.evaluate(() => (window as any).__resumeJourney);
      await expect(page.locator('#mainApp')).toBeVisible();
      await expect(page.locator('#options .option')).toHaveCount(4);
      await expect(page.locator('#options .option').first()).toBeEnabled();
      expect(await page.locator('#refs .ref-card').count()).toBeGreaterThan(0);
      expect(referenceRequests).toBe(1);
      expect(topicRequests).toBe(1);
      expect(runtimeErrors).toEqual([]);
    } finally {
      releaseReferences();
    }
  });
}

test('falha nas referências com questões em voo recupera sem duplicar o banco', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost'
    ? route.continue() : route.abort());
  await page.addInitScript(() => {
    window.requestIdleCallback = () => 1;
    (window as any).rejeicoes = [];
    window.addEventListener('unhandledrejection', event => (window as any).rejeicoes.push(String(event.reason)));
  });
  let releaseTopics!: () => void;
  const topicsGate = new Promise<void>(resolve => { releaseTopics = resolve; });
  let referenceRequests = 0, articleRequests = 0, topicRequests = 0;
  await page.route('**/data/refs.js', route => ++referenceRequests === 1 ? route.abort() : route.continue());
  await page.route('**/data/articles.js', route => { articleRequests++; return route.continue(); });
  await page.route('**/data/topics.js', async route => {
    topicRequests++;
    await topicsGate;
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
      const g = window as any;
      g.playAsGuest();
      localStorage.setItem('nefroquest-save', JSON.stringify({
        schemaVersion: 6, character: 'glomerulus', level: 2, xp: 0, xpToNext: 200,
        score: 0, gold: 0, streak: 0, lives: 3, maxLives: 3, correctTotal: 0,
        gameStarted: true, gameOver: false, difficulty: 'normal', idx: 0,
        queueIds: ['1e5e88e9'], timestamp: Date.now(),
      }));
      g.refreshWelcomeSave();
      g.__firstTopicsLoad = g._loadTopics().then(
        () => ({ ok: true }),
        (error: Error) => ({ ok: false, message: error.message }),
      );
    });
    expect(await page.evaluate(() => (window as any).__firstTopicsLoad)).toEqual({
      ok: false, message: 'Não foi possível carregar data/refs.js',
    });
    await expect.poll(() => topicRequests).toBe(1);
    await expect.poll(() => articleRequests).toBe(1);
    expect(referenceRequests).toBe(1);
    expect(await page.evaluate(() => (window as any).questionBank)).toBeUndefined();

    await page.evaluate(() => {
      const g = window as any;
      g.__resumeJourney = g.continueGame();
      g.__concurrentTopicsLoad = g._loadTopics();
    });
    await expect.poll(() => referenceRequests).toBe(2);
    await expect(page.locator('script[src="data/topics.js"]')).toHaveCount(1);
    await expect(page.locator('#options .option')).toHaveCount(0);
    expect(await page.evaluate(() => (0, eval)('_continueGamePending'))).toBe(true);
    expect(topicRequests).toBe(1);
    expect(runtimeErrors).toEqual([]);

    releaseTopics();
    await page.evaluate(() => Promise.all([
      (window as any).__resumeJourney, (window as any).__concurrentTopicsLoad,
    ]));
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#options .option')).toHaveCount(4);
    await expect(page.locator('#options .option').first()).toBeEnabled();
    expect(await page.locator('#refs .ref-card').count()).toBeGreaterThan(0);
    await page.evaluate(() => (window as any)._loadTopics());
    expect(referenceRequests).toBe(2);
    expect(articleRequests).toBe(1);
    expect(topicRequests).toBe(1);
    expect(runtimeErrors).toEqual([]);
    expect(await page.evaluate(() => (window as any).rejeicoes)).toEqual([]);
  } finally {
    releaseTopics();
  }
});
