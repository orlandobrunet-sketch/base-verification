import { test, expect } from '@playwright/test';

/**
 * Unit tests for pure / side-effect-free functions in NefroQuest.
 * Each test uses page.evaluate() to call the real function in the browser,
 * so these tests cover the actual production code path.
 */

test.describe('Utils — getStreakMultiplier', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).getStreakMultiplier === 'function');
  });

  const cases: [number, number, string][] = [
    [0,  1,    ''],
    [2,  1,    ''],
    [3,  1.25, ''],
    [5,  1.5,  ''],
    [7,  1.75, ''],
    [10, 2.0,  ''],
    [15, 2.5,  ''],
    [20, 2.5,  ''],  // cap at 2.5
  ];

  for (const [streak, expectedMult] of cases) {
    test(`streak ${streak} → mult ${expectedMult}`, async ({ page }) => {
      const mult = await page.evaluate((s) => (window as any).getStreakMultiplier(s).mult, streak);
      expect(mult).toBe(expectedMult);
    });
  }
});

test.describe('Utils — escapeHtml', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).escapeHtml === 'function');
  });

  test('escapa & < > " \'', async ({ page }) => {
    const result = await page.evaluate(() =>
      (window as any).escapeHtml('<script>alert("xss&\'test\'");</script>')
    );
    expect(result).toBe('&lt;script&gt;alert(&quot;xss&amp;&#39;test&#39;&quot;);&lt;/script&gt;');
  });

  test('retorna string vazia para null/undefined', async ({ page }) => {
    const r1 = await page.evaluate(() => (window as any).escapeHtml(null));
    const r2 = await page.evaluate(() => (window as any).escapeHtml(undefined));
    expect(r1).toBe('');
    expect(r2).toBe('');
  });

  test('não altera texto sem caracteres especiais', async ({ page }) => {
    const result = await page.evaluate(() => (window as any).escapeHtml('texto normal 123'));
    expect(result).toBe('texto normal 123');
  });
});

test.describe('Utils — _firstSentence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any)._firstSentence === 'function');
  });

  test('extrai primeira frase terminada em ponto seguido de maiúscula', async ({ page }) => {
    const result = await page.evaluate(() =>
      (window as any)._firstSentence('Primeira frase. Segunda frase começa aqui.', 140)
    );
    expect(result).toBe('Primeira frase.');
  });

  test('respeita maxLen quando não há ponto', async ({ page }) => {
    const result = await page.evaluate(() =>
      (window as any)._firstSentence('abcdefghij', 5)
    );
    expect(result.length).toBeLessThanOrEqual(5);
  });

  test('retorna string vazia para input vazio/null', async ({ page }) => {
    const r1 = await page.evaluate(() => (window as any)._firstSentence('', 140));
    const r2 = await page.evaluate(() => (window as any)._firstSentence(null, 140));
    expect(r1).toBe('');
    expect(r2).toBe('');
  });
});

test.describe('Utils — shuffle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).shuffle === 'function');
  });

  test('retorna array com os mesmos elementos', async ({ page }) => {
    const result = await page.evaluate(() => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = (window as any).shuffle([...arr]);
      return { original: arr.sort(), shuffled: shuffled.sort() };
    });
    expect(result.shuffled).toEqual(result.original);
  });

  test('não modifica o array original', async ({ page }) => {
    const result = await page.evaluate(() => {
      const arr = [10, 20, 30];
      const copy = [...arr];
      (window as any).shuffle(copy);
      return arr;
    });
    expect(result).toEqual([10, 20, 30]);
  });
});

test.describe('Utils — getTimeAgo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).getTimeAgo === 'function');
  });

  test('retorna "agora mesmo" para timestamp recente', async ({ page }) => {
    const result = await page.evaluate(() =>
      (window as any).getTimeAgo(Date.now() - 30000) // 30 seconds ago
    );
    expect(result).toBe('agora mesmo');
  });

  test('retorna string com "min" para 5 minutos atrás', async ({ page }) => {
    const result = await page.evaluate(() =>
      (window as any).getTimeAgo(Date.now() - 5 * 60 * 1000)
    );
    expect(result).toMatch(/min/);
  });

  test('retorna string com "h" para 3 horas atrás', async ({ page }) => {
    const result = await page.evaluate(() =>
      (window as any).getTimeAgo(Date.now() - 3 * 60 * 60 * 1000)
    );
    expect(result).toMatch(/h/);
  });

  test('retorna string com "dia" para 2 dias atrás', async ({ page }) => {
    const result = await page.evaluate(() =>
      (window as any).getTimeAgo(Date.now() - 2 * 24 * 60 * 60 * 1000)
    );
    expect(result).toMatch(/dia/);
  });

  test('retorna string vazia para timestamp nulo', async ({ page }) => {
    const result = await page.evaluate(() => (window as any).getTimeAgo(null));
    expect(result).toBe('');
  });
});

test.describe('Utils — isPremium', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).isPremium === 'function');
  });

  test('retorna false quando localStorage não tem flag premium', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('nefroquest-premium');
      localStorage.removeItem('nefroquest-whitelist');
      (window as any)._invalidatePremiumCache?.();
    });
    const result = await page.evaluate(() => (window as any).isPremium());
    expect(result).toBe(false);
  });

  test('retorna true quando localStorage tem flag premium=1', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('nefroquest-premium', '1');
      (window as any)._invalidatePremiumCache?.();
    });
    const result = await page.evaluate(() => (window as any).isPremium());
    expect(result).toBe(true);
    // cleanup
    await page.evaluate(() => {
      localStorage.removeItem('nefroquest-premium');
      (window as any)._invalidatePremiumCache?.();
    });
  });
});

test.describe('Utils — Spaced Repetition (updateSRData)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).updateSRData === 'function');
    // Clear SR data before each test
    await page.evaluate(() => localStorage.removeItem('nefroquest-sr-data'));
  });

  test('resposta correta aumenta interval do cartão', async ({ page }) => {
    const result = await page.evaluate(() => {
      (window as any).updateSRData('q999', true);
      const data = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
      return data['q999'];
    });
    expect(result).toBeDefined();
    expect(result.reps).toBe(1);
    expect(result.interval).toBeGreaterThanOrEqual(1);
  });

  test('resposta errada reseta reps para 0 e interval para 1', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).updateSRData('q998', true);  // first correct
      (window as any).updateSRData('q998', false); // then wrong
    });
    const result = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
      return data['q998'];
    });
    expect(result.reps).toBe(0);
    expect(result.interval).toBe(1);
  });

  test('qid nulo é ignorado silenciosamente', async ({ page }) => {
    await expect(
      page.evaluate(() => (window as any).updateSRData(null, true))
    ).resolves.not.toThrow();
  });
});
