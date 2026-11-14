import { test, expect } from '@playwright/test';
import { setupPilotPage, startPilot, seedLegacyPilot } from '../helpers/pilot';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

test('uma retomada nativa na mesma aba aguarda a liberação da lease anterior', async ({ page }, info) => {
  await setupPilotPage(page); await startPilot(page);
  await page.waitForFunction(() => (0, eval)('!_continueGamePending'));
  const before = await page.evaluate(() => (window as any).NQPilot.captureBinding());
  await page.evaluate(() => (window as any).goToWelcomeFromGame());
  await page.locator('#resumePilotBtn').click();
  await page.waitForFunction(() => (0, eval)('!_pilotResumePending'));
  const after = await page.evaluate(() => ({ binding: (window as any).NQPilot.captureBinding(),
    error: (window as any).NQPilot.error, hidden: document.getElementById('mainApp')!.classList.contains('hidden') }));
  await info.attach('pilot-same-tab-lease', { contentType: 'application/json', body: JSON.stringify({ before, after }) });
  expect(after.hidden).toBe(false); expect(after.error).toBeNull();
  expect(after.binding.journeyId).toBe(before.journeyId);
  expect(after.binding.owner).toBe(before.owner);
  expect(after.binding.generation).toBeGreaterThan(before.generation);
});

test('outra aba realmente dona da lease continua impedindo a retomada', async ({ page }, info) => {
  await setupPilotPage(page); await startPilot(page);
  const before = await page.evaluate(() => (window as any).NQPilot.captureBinding());
  const second = await page.context().newPage();
  try {
    await setupPilotPage(second);
    await second.locator('#resumePilotBtn').click();
    await second.waitForFunction(() => (0, eval)('!_pilotResumePending'));
    const blocked = await second.evaluate(() => ({ active: (window as any).NQPilot.active,
      hidden: document.getElementById('mainApp')!.classList.contains('hidden') }));
    await info.attach('pilot-other-tab-lease', { contentType: 'application/json', body: JSON.stringify(blocked) });
    expect(blocked).toEqual({ active: false, hidden: true });
    expect(await page.evaluate(() => (window as any).NQPilot.captureBinding())).toEqual(before);
  } finally { await second.close(); }
});

test('sem Web Locks a jornada protegida continua indisponível', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true }));
  await setupPilotPage(page); await seedLegacyPilot(page);
  const saved = await page.evaluate(() => localStorage.getItem((window as any).NQPilot.KEY));
  await page.locator('#resumePilotBtn').click();
  await page.waitForFunction(() => (0, eval)('!_pilotResumePending'));
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem((window as any).NQPilot.KEY))).toBe(saved);
});
