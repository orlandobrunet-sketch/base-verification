import { test, expect } from '@playwright/test';

test.describe('Adaptive Learning Engine (IRT leve) Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jogar/');
  });

  test('getAdaptiveTargetDifficulty maps theta to easy/medium/hard correctly', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).getAdaptiveTargetDifficulty === 'function');
    
    const cases: [number, string][] = [
      [0.5, 'easy'],
      [1.0, 'easy'],
      [1.29, 'easy'],
      [1.3, 'medium'],
      [1.8, 'medium'],
      [2.3, 'medium'],
      [2.31, 'hard'],
      [3.0, 'hard'],
      [3.5, 'hard'],
    ];

    for (const [theta, expected] of cases) {
      const res = await page.evaluate((t) => (window as any).getAdaptiveTargetDifficulty(t), theta);
      expect(res).toBe(expected);
    }
  });

  test('calculateUserTheta defaults to 2.0 when no stats exist', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).calculateUserTheta === 'function');
    
    await page.evaluate(() => {
      localStorage.removeItem('nefroquest-detailed-stats');
    });

    const theta = await page.evaluate(() => (window as any).calculateUserTheta('glomerular'));
    expect(theta).toBe(2.0);
  });

  test('calculateUserTheta baseline matches cumulative stats logic', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).calculateUserTheta === 'function');
    
    // Test 80% correct in glomerular -> logit = ln(4) = 1.386 -> baseline = 2.0 + 0.5 * 1.386 = 2.693
    const theta80 = await page.evaluate(() => {
      localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
        byCategory: { glomerular: { correct: 8, total: 10 } },
        questionHistory: []
      }));
      return (window as any).calculateUserTheta('glomerular');
    });
    expect(theta80).toBeCloseTo(2.69, 1);

    // Test 20% correct in glomerular -> logit = ln(0.25) = -1.386 -> baseline = 2.0 + 0.5 * -1.386 = 1.307
    const theta20 = await page.evaluate(() => {
      localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
        byCategory: { glomerular: { correct: 2, total: 10 } },
        questionHistory: []
      }));
      return (window as any).calculateUserTheta('glomerular');
    });
    expect(theta20).toBeCloseTo(1.31, 1);
  });

  test('calculateUserTheta incorporates recent history with sequential SGD updates', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).calculateUserTheta === 'function');
    
    // We mock questionBank and localStorage, then run calculateUserTheta
    const theta = await page.evaluate(() => {
      // Mock questionBank with specific questions
      (window as any).questionBank = [
        { id: 'q_g1', c: 'glomerular', _d: 'medium' }, // b = 2.0
        { id: 'q_g2', c: 'glomerular', _d: 'medium' }  // b = 2.0
      ];

      // 50% baseline (theta = 2.0).
      // History has 2 questions:
      // q_g1: correct=false (oldest)
      // q_g2: correct=false (newest)
      localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
        byCategory: { glomerular: { correct: 5, total: 10 } },
        questionHistory: [
          { qid: 'q_g2', correct: false, date: new Date().toISOString() }, // newest (processed last)
          { qid: 'q_g1', correct: false, date: new Date(Date.now() - 1000).toISOString() } // oldest (processed first)
        ]
      }));

      return (window as any).calculateUserTheta('glomerular');
    });

    // Trace:
    // baseline = 2.0
    // step 1 (q_g1, wrong, b=2.0):
    //   pCorrect = 1 / (1 + exp(-(2.0 - 2.0))) = 0.5
    //   theta = 2.0 + 0.3 * (0.0 - 0.5) = 1.85
    // step 2 (q_g2, wrong, b=2.0):
    //   pCorrect = 1 / (1 + exp(-(1.85 - 2.0))) = 1 / (1 + exp(0.15)) = 0.46257
    //   theta = 1.85 + 0.3 * (0.0 - 0.46257) = 1.85 - 0.13877 = 1.7112
    expect(theta).toBeCloseTo(1.71, 2);
  });

  test('drawQuestion dynamically lookaheads and swaps matching difficulty question', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).drawQuestion === 'function');

    const result = await page.evaluate(() => {
      // Mock state and global objects
      const stateObj = (window as any).state;
      stateObj.gameStarted = true;
      stateObj.difficulty = 'normal';
      stateObj.idx = 0;
      
      // Mock isBossBattle and studyModeActive to false
      (window as any).isBossBattle = () => false;
      (window as any).studyModeActive = false;

      // Mock calculateUserTheta to return 3.0 for 'glomerular' -> target difficulty is 'hard'
      (window as any).calculateUserTheta = (cat) => {
        if (cat === 'glomerular') return 3.0;
        return 2.0;
      };

      // Mock queue:
      // Index 0: glomerular, easy (mismatch)
      // Index 1: transplante, easy (different category)
      // Index 2: glomerular, hard (matching category + matching target difficulty)
      // Index 3: glomerular, medium (different difficulty)
      stateObj.queue = [
        { id: 'q_easy', c: 'glomerular', _d: 'easy' },
        { id: 'q_tx', c: 'transplante', _d: 'easy' },
        { id: 'q_hard', c: 'glomerular', _d: 'hard' },
        { id: 'q_med', c: 'glomerular', _d: 'medium' }
      ];

      // Draw first question
      const drawn = (window as any).drawQuestion();

      return {
        drawnId: drawn.id,
        firstInQueue: stateObj.queue[0].id,
        swappedInQueue: stateObj.queue[2].id,
        newIdx: stateObj.idx
      };
    });

    // The hard question 'q_hard' should have been swapped to index 0, drawn, and idx advanced to 1
    expect(result.drawnId).toBe('q_hard');
    expect(result.firstInQueue).toBe('q_hard');
    expect(result.swappedInQueue).toBe('q_easy'); // q_easy was swapped to index 2
    expect(result.newIdx).toBe(1);
  });
});
