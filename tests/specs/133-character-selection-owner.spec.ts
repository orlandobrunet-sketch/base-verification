import { test, expect, type Page } from '@playwright/test';
import {
  answerTechnical, attachPilotFailureDiagnostics, PILOT_KEY, pilotState,
  seedLegacyPilot, setupPilotPage, startNormalCharacter,
} from '../helpers/pilot';

const SAVE_KEY = 'nefroquest-save-v7';
const MIRROR_KEY = 'nefroquest-save';
const stages = [
  { name: 'introdução aberta', intro: true, reason: 'reset' },
  { name: 'cards abertos', intro: false, reason: 'logout' },
] as const;

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => setupPilotPage(page));
test.afterEach(async ({ page }, testInfo) => attachPilotFailureDiagnostics(page, testInfo));

async function storedBytes(page: Page) {
  return page.evaluate(({ save, mirror, pilot }) => ({
    canonical: localStorage.getItem(save), mirror: localStorage.getItem(mirror),
    pilot: localStorage.getItem(pilot),
  }), { save: SAVE_KEY, mirror: MIRROR_KEY, pilot: PILOT_KEY });
}

async function openChoiceFromActiveGame(page: Page, intro: boolean) {
  // Lumen exposes #newBtn in its real debrief on desktop and mobile. The accepted
  // technical answer made this control available; no selection function is called
  // by evaluation, and the existing journey stays active until ownership changes.
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect(page.locator('#newBtn')).toBeVisible();
  await page.locator('#newBtn').click();
  await expect(page.locator('#diffSelectorOverlay')).toBeVisible();
  await expect(page.locator('#diffConfirmBtn')).toHaveAttribute('data-arg', 'false');
  await page.locator('#diffSelectorOverlay .difficulty-card[data-diff-key="hard"]').click();
  await page.locator('#diffConfirmBtn').click();
  await expect(page.locator('#charSelectModal')).toBeVisible();
  await expect(page.locator('#charSelectModal [data-action="selectCharacter"]')).toHaveCount(3);
  expect(await page.evaluate(() => (window as any)._pendingDiff)).toBe('hard');
  if (intro) {
    await page.locator('#charSelectModal [data-action="selectCharacter"][data-arg="aquaria"]').click();
    await expect(page.locator('#charIntroOverlay')).toBeVisible();
    await expect(page.locator('#charIntroOverlay [data-action="cancelCharacterIntro"]')).toBeVisible();
    await expect(page.locator('#charIntroOverlay [data-action="closeIntroAndStart"]')).toBeVisible();
  }
  expect(await pilotState(page)).toMatchObject({ gameStarted: true, character: 'nephros',
    difficulty: 'normal', classBenefits: { lockedClass: 'nephros', windowAnswers: 1 } });
}

async function expectRetiredChoice(page: Page) {
  // Poll only observations on tab A: the browser's natural storage event must
  // perform the cleanup. No synthetic event, reset or state override runs here.
  await expect.poll(async () => (await pilotState(page)).gameStarted).toBe(false);
  await expect(page.locator('#charIntroOverlay')).toHaveCount(0);
  await expect(page.locator('#charSelectModal')).toBeHidden();
  await expect(page.locator('#charSelectModal')).not.toHaveClass(/show/);
  await expect(page.locator('#diffSelectorOverlay')).toHaveCount(0);
  await expect(page.locator('#mainApp')).toBeHidden();
  const welcome = page.locator('#welcomeScreen');
  await expect(welcome).toBeVisible();
  // Await the native CSS transition rather than snapshotting a fading welcome.
  await expect(welcome).toHaveCSS('opacity', '1');
  await expect(welcome).toHaveJSProperty('inert', false);
  await expect(page.locator('#mainApp')).toHaveJSProperty('inert', false);
  expect(await page.evaluate(() => (window as any)._pendingDiff)).toBeNull();
  expect(await pilotState(page)).toMatchObject({ gameStarted: false, character: null,
    classBenefits: null, characterLastAnswer: null });
  await expect(page.locator([
    '#charIntroOverlay [data-action="cancelCharacterIntro"]',
    '#charIntroOverlay [data-action="closeIntroAndStart"]',
    '#charSelectModal.show [data-action="closeCharSelectModal"]',
    '#charSelectModal.show [data-action="selectCharacter"]',
  ].join(', '))).toHaveCount(0);
  await expect(page.locator('#welcomeContinueBtn')).toBeHidden();
}

for (const stage of stages) {
  test(stage.name + ': tombstone real de outra aba retira escolha e preserva piloto legado', async ({ page, context }) => {
    await seedLegacyPilot(page, 'glomerulus');
    const legacyRaw = (await storedBytes(page)).pilot;
    expect(legacyRaw).not.toBeNull();
    await startNormalCharacter(page, 'nephros', 'normal');
    await answerTechnical(page, true, true);
    const original = await storedBytes(page);
    expect(original.canonical).not.toBeNull();
    expect(original.mirror).toBe(original.canonical);
    expect(JSON.parse(original.canonical!)).toMatchObject({ schemaVersion: 9,
      gameStarted: true, answered: true, classBenefits: { windowAnswers: 1 } });

    const second = await context.newPage();
    try {
      // Same BrowserContext/origin, with the same local-only technical bank and
      // host guard. Tab B never seeds or replaces the normal journey itself.
      await setupPilotPage(second);
      expect(await storedBytes(second)).toEqual(original);
      await openChoiceFromActiveGame(page, stage.intro);
      expect(await storedBytes(page)).toEqual(original);

      const reset = await second.evaluate(({ reason, save, mirror, pilot }) => {
        const result = (window as any).clearLocalProgress(reason);
        const raw = localStorage.getItem(save);
        return { result, raw, marker: JSON.parse(raw || 'null'),
          mirror: localStorage.getItem(mirror), pilot: localStorage.getItem(pilot) };
      }, { reason: stage.reason, save: SAVE_KEY, mirror: MIRROR_KEY, pilot: PILOT_KEY });
      expect(reset.result).toBe(true);
      expect(reset.raw).not.toBeNull();
      expect(reset.raw).not.toBe(original.canonical);
      expect(reset.marker).toMatchObject({ schemaVersion: 7, save: null,
        saveOwner: null, resetReason: stage.reason });
      expect(Object.keys(reset.marker).sort()).toEqual([
        'resetReason', 'save', 'saveOwner', 'saveRevision', 'schemaVersion',
      ]);
      expect(reset.marker.saveRevision).toEqual(expect.any(String));
      expect(reset.marker.saveRevision).not.toBe(JSON.parse(original.canonical!).saveRevision);
      expect(reset.mirror).toBeNull();
      expect(reset.pilot).toBe(legacyRaw);

      await expectRetiredChoice(page);
      const expected = { canonical: reset.raw, mirror: null, pilot: legacyRaw };
      expect(await storedBytes(page)).toEqual(expected);
      expect(await storedBytes(second)).toEqual(expected);
      expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
    } finally {
      await second.close();
    }
  });
}
