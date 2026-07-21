import { test, expect } from '@playwright/test';

/**
 * Characterization tests for game.js XP / level scoring invariants.
 * Pins current behavior — NOT a spec for desired behavior. If a value here
 * needs to change, it means game logic changed; update deliberately.
 */

test.describe('Game scoring — XP & level invariants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jogar/');
  });

  test('xpForLevel follows 200 * 1.15^(lv-1), floored', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).xpForLevel === 'function');
    const cases: [number, number][] = [
      [1, 200],
      [2, 229],
      [3, 264],
      [4, 304],
      [5, 349],
      [10, 703],
    ];
    for (const [lv, expected] of cases) {
      const xp = await page.evaluate((l) => (window as any).xpForLevel(l), lv);
      expect(xp).toBe(expected);
    }
  });

  test('level cap reaches 10 exactly at 90 correct (BOSS_START_CORRECT)', async ({ page }) => {
    await page.waitForFunction(() => typeof (window as any).levelCapForCorrect === 'function');
    const cases: [number, number][] = [
      [0, 1],
      [9, 1],
      [10, 2],
      [89, 9],
      [90, 10],
      [100, 10],
      [250, 10],
    ];
    for (const [correctTotal, expectedCap] of cases) {
      const cap = await page.evaluate((ct) => (window as any).levelCapForCorrect(ct), correctTotal);
      expect(cap).toBe(expectedCap);
    }
  });
});
