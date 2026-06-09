import { test, expect } from '@playwright/test';

/**
 * Unit tests for pure / side-effect-free functions in NefroQuest.
 * Optimized to minimize page loads (which can flood the local server).
 */

test.describe('Utils — Pure Functions Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Streak Multiplier cases', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).getStreakMultiplier === 'function');
    const cases: [number, number][] = [
      [0,  1],
      [2,  1],
      [3,  1.25],
      [5,  1.5],
      [7,  1.75],
      [10, 2.0],
      [15, 2.5],
      [20, 2.5]
    ];
    for (const [streak, expectedMult] of cases) {
      const mult = await page.evaluate((s) => (window as any).getStreakMultiplier(s).mult, streak);
      expect(mult).toBe(expectedMult);
    }
  });

  test('escapeHtml cases', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).escapeHtml === 'function');
    
    // Test special chars
    const r1 = await page.evaluate(() =>
      (window as any).escapeHtml('<script>alert("xss&\'test\'");</script>')
    );
    expect(r1).toBe('&lt;script&gt;alert(&quot;xss&amp;&#39;test&#39;&quot;);&lt;/script&gt;');

    // Test null/undefined
    const r2 = await page.evaluate(() => (window as any).escapeHtml(null));
    const r3 = await page.evaluate(() => (window as any).escapeHtml(undefined));
    expect(r2).toBe('');
    expect(r3).toBe('');

    // Test normal text
    const r4 = await page.evaluate(() => (window as any).escapeHtml('texto normal 123'));
    expect(r4).toBe('texto normal 123');
  });

  test('_firstSentence cases', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any)._firstSentence === 'function');

    // Test dot extraction (>30 chars index)
    const r1 = await page.evaluate(() =>
      (window as any)._firstSentence('Esta é uma primeira frase longa o suficiente para passar do limite. Segunda frase começa aqui.', 140)
    );
    expect(r1).toBe('Esta é uma primeira frase longa o suficiente para passar do limite.');

    // Test respect maxLen when no dot
    const r2 = await page.evaluate(() =>
      (window as any)._firstSentence('abcdefghij', 5)
    );
    expect(r2.length).toBeLessThanOrEqual(5);

    // Test empty/null input
    const r3 = await page.evaluate(() => (window as any)._firstSentence('', 140));
    const r4 = await page.evaluate(() => (window as any)._firstSentence(null, 140));
    expect(r3).toBe('');
    expect(r4).toBe('');
  });

  test('shuffle cases', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).shuffle === 'function');

    const result = await page.evaluate(() => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = (window as any).shuffle([...arr]);
      return { original: arr.sort(), shuffled: shuffled.sort() };
    });
    expect(result.shuffled).toEqual(result.original);

    const untouched = await page.evaluate(() => {
      const arr = [10, 20, 30];
      const copy = [...arr];
      (window as any).shuffle(copy);
      return arr;
    });
    expect(untouched).toEqual([10, 20, 30]);
  });

  test('getTimeAgo cases', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).getTimeAgo === 'function');

    // Recent timestamp
    const r1 = await page.evaluate(() => (window as any).getTimeAgo(Date.now() - 30000));
    expect(r1).toBe('agora mesmo');

    // 5 minutes ago
    const r2 = await page.evaluate(() => (window as any).getTimeAgo(Date.now() - 5 * 60 * 1000));
    expect(r2).toMatch(/min/);

    // 3 hours ago
    const r3 = await page.evaluate(() => (window as any).getTimeAgo(Date.now() - 3 * 60 * 60 * 1000));
    expect(r3).toMatch(/h/);

    // 2 days ago
    const r4 = await page.evaluate(() => (window as any).getTimeAgo(Date.now() - 2 * 24 * 60 * 60 * 1000));
    expect(r4).toMatch(/dia/);

    // Null timestamp
    const r5 = await page.evaluate(() => (window as any).getTimeAgo(null));
    expect(r5).toBe('');
  });

  test('isPremium validation', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).isPremium === 'function');

    // 1. Returns false when no premium flag
    const r1 = await page.evaluate(() => {
      (window as any).authUser = { id: 'test-user', email: 'test@example.com' };
      localStorage.removeItem('nefroquest-premium');
      localStorage.removeItem('nefroquest-premium-sig');
      localStorage.removeItem('nefroquest-whitelist');
      localStorage.removeItem('nefroquest-whitelist-sig');
      (window as any)._invalidatePremiumCache?.();
      return (window as any).isPremium();
    });
    expect(r1).toBe(false);

    // 2. Returns true when premium flag & valid signature are present
    const r2 = await page.evaluate(() => {
      (window as any).authUser = { id: 'test-user', email: 'test@example.com' };
      localStorage.setItem('nefroquest-premium', '1');
      const sig = (window as any)._generatePremiumSignature('test-user');
      localStorage.setItem('nefroquest-premium-sig', sig);
      (window as any)._invalidatePremiumCache?.();
      return (window as any).isPremium();
    });
    expect(r2).toBe(true);

    // Cleanup
    await page.evaluate(() => {
      (window as any).authUser = null;
      localStorage.removeItem('nefroquest-premium');
      localStorage.removeItem('nefroquest-premium-sig');
      (window as any)._invalidatePremiumCache?.();
    });
  });

  test('Spaced Repetition (updateSRData) cases — FSRS', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).updateSRData === 'function');

    // Clear SR data first
    await page.evaluate(() => localStorage.removeItem('nefroquest-sr-data'));

    // Primeira revisão (acerto): cria card FSRS com S/D/interval/due
    const r1 = await page.evaluate(() => {
      (window as any).updateSRData('q999', true);
      const data = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
      return data['q999'];
    });
    expect(r1).toBeDefined();
    expect(r1.reps).toBe(1);
    expect(r1.interval).toBeGreaterThanOrEqual(1);
    expect(r1.S).toBeGreaterThan(0);            // Estabilidade
    expect(r1.D).toBeGreaterThanOrEqual(1);     // Dificuldade 1..10
    expect(r1.D).toBeLessThanOrEqual(10);

    // Acertos seguidos (em dias diferentes) aumentam o intervalo.
    // Backdate de `last` simula que se passaram dias até a revisão devida —
    // revisar no mesmo instante (t=0, R=1) corretamente NÃO aumenta o intervalo.
    const grow = await page.evaluate(() => {
      (window as any).updateSRData('q997', true); // 1ª revisão
      let data = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
      const a = data['q997'].interval;
      data['q997'].last = data['q997'].last - 3 * 86400000; // 3 dias atrás
      localStorage.setItem('nefroquest-sr-data', JSON.stringify(data));
      (window as any).updateSRData('q997', true); // 2ª revisão
      data = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
      const b = data['q997'].interval;
      return { a, b };
    });
    expect(grow.b).toBeGreaterThan(grow.a);

    // Erro traz o card de volta logo (intervalo curto) e conta um lapse
    const r2 = await page.evaluate(() => {
      (window as any).updateSRData('q998', true);  // acerto
      (window as any).updateSRData('q998', false); // depois erro
      const data = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
      return data['q998'];
    });
    expect(r2.interval).toBeLessThanOrEqual(2);   // volta em ~1 dia
    expect(r2.lapses).toBeGreaterThanOrEqual(1);

    // qid nulo é ignorado silenciosamente
    await expect(
      page.evaluate(() => (window as any).updateSRData(null, true))
    ).resolves.not.toThrow();
  });
});
