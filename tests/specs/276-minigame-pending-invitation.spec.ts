import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';
import { injectGameState } from '../helpers/game';
import { setupPilotPage, startPilot, seedLegacyPilot, pilotState, pilotEnvelope } from '../helpers/pilot';

const CLOCK = Date.UTC(2026, 10, 14, 15);
const authors = Array.from({ length: 3 }, (_, i) => ({ qid: 'pending-invite-' + i,
  t: 'Interface', cat: 'geral', q: 'Questão técnica ' + i, opts: ['A', 'B', 'C', 'D'],
  ans: 0, exp: 'Explicação técnica de interface.' }));
const rapid = Array.from({ length: 12 }, (_, i) => ({ qid: 'pending-rapid-' + i,
  q: 'Afirmação técnica ' + i, ans: true, cat: 'geral', exp: 'Explicação técnica.' }));
const audits = new WeakMap<Page, { errors: string[]; nonGET: string[]; sockets: number }>();

async function prepare(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const audit = { errors: [] as string[], nonGET: [] as string[], sockets: 0 }; audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await page.context().route('**/*', route => {
    const request = route.request();
    if (request.method() !== 'GET') { audit.nonGET.push(request.method()); return route.abort(); }
    // A neutral image fixture avoids exercising the separately reported broken
    // starter-image onerror handler when network boundaries are intentionally closed.
    if (new URL(request.url()).origin === origin && request.resourceType() === 'image') return route.fulfill({
      contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#18242d"/></svg>' });
    return new URL(request.url()).origin === origin && !['image', 'media', 'font'].includes(request.resourceType())
      ? route.continue() : route.abort();
  });
  await page.context().routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, authors);
  await page.route('**/data/rapid-quiz.js*', route => route.fulfill({ status: 200,
    contentType: 'application/javascript', body: 'const RAPID_QUIZ_QUESTIONS=' + JSON.stringify(rapid) + ';' }));
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await injectGameState(page, { correctTotal: 25, narrativeShown: 25 }, { asGuest: true });
  await page.waitForFunction(() => (0, eval)('!_continueGamePending'));
  await page.clock.install({ time: CLOCK - 1000 }); await page.clock.pauseAt(CLOCK);
}

async function schedule(page: Page, checkpoints = [25]) {
  await page.evaluate(points => points.forEach(point => (window as any).maybeTriggerMinigame(point)), checkpoints);
}

test.afterEach(async ({ page }, info) => {
  const audit = audits.get(page); if (!audit) return;
  await info.attach('pending-invitation-guards', { contentType: 'application/json', body: JSON.stringify(audit) });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
});

test.describe('convite do piloto legado', () => {
  test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

  test('o convite natural do acerto25 sobrevive à nova lease da mesma jornada', async ({ page }, info) => {
    await setupPilotPage(page); await startPilot(page, 'nephros', 'easy');
    await page.waitForFunction(() => (0, eval)('!_continueGamePending'));
    await page.clock.install({ time: CLOCK - 1000 }); await page.clock.pauseAt(CLOCK);
    let keptChestComparisons = 0;
    const closeNotices = async () => {
      await page.evaluate(() => (document.querySelector('#autoChestPopup .nqch-trigger') as HTMLButtonElement)?.click());
      await page.clock.runFor(20);
      await page.evaluate(() => {
        for (const popup of document.querySelectorAll('.narrative-popup,.evolution-popup,.forge-popup,#goldMilestonePopup')) {
          (popup.querySelector('[data-close-closest],[data-remove-id]') as HTMLButtonElement)?.click();
        }
        (document.getElementById('guestHookContinue') as HTMLButtonElement)?.click();
        if (document.getElementById('chestModal')?.classList.contains('show')) (window as any).closeChestModal();
      });
      const comparison = page.locator('#equipCompareOverlay');
      if (await comparison.isVisible()) {
        await comparison.locator('#ecpKeep').click();
        keptChestComparisons++;
        await expect(comparison).toHaveCount(0);
        const reward = page.locator('.forge-popup').last();
        await expect(reward).toBeVisible();
        await reward.locator('[data-close-closest=".forge-popup"]').click();
        await expect(reward).toHaveCount(0);
      }
      await expect(page.locator('#equipCompareOverlay, .forge-popup')).toHaveCount(0);
    };
    for (let index = 1; index <= 25; index++) {
      if (index > 1) {
        await page.clock.runFor(1000); await closeNotices();
        await page.evaluate(() => (0, eval)('renderQuestion()')); await page.clock.runFor(500);
        expect(await page.evaluate(() => (0, eval)('!state.answered && !_loadingNextQuestion'))).toBe(true);
      }
      await page.evaluate(() => {
        const state = (0, eval)('state');
        (document.querySelectorAll('#options .option')[state.current.a] as HTMLButtonElement).click();
      });
      expect((await pilotState(page)).correctTotal).toBe(index);
    }
    const before = await page.evaluate(() => ({ binding: (window as any).NQPilot.captureBinding(),
      count: (0, eval)('_minigameTriggerCount') }));
    expect(before.count).toBe(1);
    expect((await pilotState(page)).classBenefits.windowAnswers).toBe(20);
    expect((await pilotEnvelope(page)).save.correctTotal).toBe(25);
    await closeNotices();
    await info.attach('pilot-native-chest-comparisons', { contentType: 'application/json',
      body: JSON.stringify({ kept: keptChestComparisons }) });
    await page.locator('[data-action="goToWelcomeFromGame"]:visible').first().click();
    await page.locator('[data-atrium-route="modes"]').click();
    await page.locator('[data-mode-route="rapid"]:visible').click();
    await page.clock.runFor(1500);
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    await page.locator('#mgSair').click();
    await page.locator('#resumePilotBtn').click();
    await expect(page.locator('#mainApp')).toBeVisible(); await page.clock.runFor(1);
    await expect(page.locator('#acceptMinigameBtn')).toBeFocused();
    const after = await page.evaluate(() => ({ binding: (window as any).NQPilot.captureBinding(),
      count: (0, eval)('_minigameTriggerCount'), correct: (0, eval)('state.correctTotal') }));
    await info.attach('pilot-natural-invite-transfer', { contentType: 'application/json', body: JSON.stringify({ before, after }) });
    expect(after.binding.journeyId).toBe(before.binding.journeyId);
    expect(after.binding.generation).toBeGreaterThan(before.binding.generation);
    expect(after.count).toBe(1); expect(after.correct).toBe(25);
    await page.locator('#minigameIntroPopup [data-remove-id]').click();
    await page.clock.fastForward(60000); await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
  });

  test('token opaco é de uso único e não atravessa uma troca de dono', async ({ page }) => {
    await setupPilotPage(page); await startPilot(page);
    await page.waitForFunction(() => (0, eval)('!_continueGamePending'));
    await page.clock.install({ time: CLOCK - 1000 }); await page.clock.pauseAt(CLOCK);
    const shape = await page.evaluate(() => {
      (window as any).maybeTriggerMinigame(25);
      const token = (window as any)._capturePendingMinigamePilotResume();
      (window as any).__inviteToken = token;
      return { keys: Object.keys(token), frozen: Object.isFrozen(token) };
    });
    await page.evaluate(() => (window as any).goToWelcomeFromGame());
    await page.locator('#resumePilotBtn').click(); await expect(page.locator('#mainApp')).toBeVisible();
    const positive = await page.evaluate(() => {
      (window as any)._retireMinigameContext();
      const restored = (window as any)._restorePendingMinigamePilotResume((window as any).__inviteToken);
      const replay = (window as any)._restorePendingMinigamePilotResume((window as any).__inviteToken);
      (window as any).__foreignInviteToken = (window as any)._capturePendingMinigamePilotResume();
      return { restored, replay };
    });
    expect(positive).toEqual({ restored: true, replay: false });
    await page.clock.runFor(520);
    await page.evaluate(() => (window as any).goToWelcomeFromGame());
    await page.locator('#resumePilotBtn').click(); await expect(page.locator('#mainApp')).toBeVisible();
    const result = await page.evaluate(() => {
      (window as any)._retireMinigameContext();
      const original = (0, eval)('authUser');
      (window as any)._setAuthSessionUser({ id: 'technical-other-owner' });
      const observedOwner = (0, eval)('authUser.id');
      const foreign = (window as any)._restorePendingMinigamePilotResume((window as any).__foreignInviteToken);
      (window as any)._setAuthSessionUser(original);
      return { observedOwner, foreign,
        replay: (window as any)._restorePendingMinigamePilotResume((window as any).__foreignInviteToken),
        forged: (window as any)._restorePendingMinigamePilotResume(Object.freeze({})) };
    });
    expect(shape).toEqual({ keys: [], frozen: true });
    expect(result).toEqual({ observedOwner: 'technical-other-owner', foreign: false, replay: false, forged: false });
    await page.evaluate(() => (0, eval)('_stopLocalJourney()'));
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
  });

  test('sair do piloto e iniciar outra jornada descarta o convite anterior', async ({ page }) => {
    await setupPilotPage(page); await startPilot(page);
    await page.waitForFunction(() => (0, eval)('!_continueGamePending'));
    await page.clock.install({ time: CLOCK - 1000 }); await page.clock.pauseAt(CLOCK);
    const before = await page.evaluate(() => {
      (window as any).maybeTriggerMinigame(25);
      return (window as any).NQPilot.journeyId;
    });
    await page.locator('#leavePilotBtn').click();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    const created = await seedLegacyPilot(page);
    expect(created.journeyId).not.toBe(before);
    await page.locator('#resumePilotBtn').click(); await expect(page.locator('#mainApp')).toBeVisible();
    await page.clock.runFor(60000);
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    expect(await page.evaluate(() => (0, eval)('_minigameTriggerCount'))).toBe(0);
  });
});

for (const motion of ['reduce', 'no-preference'] as const) test.describe('convite adiado: ' + motion, () => {
  test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: motion } });

  test('Átrio e Julgamento aguardam a retomada da jornada; o convite aparece uma vez', async ({ page, baseURL }) => {
    await prepare(page, baseURL!); await schedule(page);
    await page.evaluate(() => (window as any).goToWelcomeFromGame());
    await page.locator('[data-atrium-route="modes"]').click();
    await page.locator('[data-mode-route="rapid"]:visible').click();
    await page.clock.runFor(1500);
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    await expect(page.locator('#mgQuestao')).toBeFocused();
    await expect(page.locator('#mgRelogio')).toHaveText('11 s');
    await page.locator('#mgSair').click();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    await page.locator('#welcomeScreen [data-action="continueGame"]').click();
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#acceptMinigameBtn')).toBeFocused();
    await expect(page.locator('#minigameInviteTitle')).toHaveText('A Pedra do Julgamento');
    await page.locator('#minigameIntroPopup [data-remove-id]').click();
    await page.clock.fastForward(60000);
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    expect(await page.evaluate(() => (0, eval)('_minigameTriggerCount'))).toBe(1);
  });

  test('aguarda outro diálogo, preserva os três convites e sua ordem', async ({ page, baseURL }) => {
    await prepare(page, baseURL!);
    await page.evaluate(() => (window as any).showActionConfirmPopup('forge'));
    await expect(page.locator('#mobileActionConfirm .nqcost-cancel')).toBeFocused();
    await schedule(page, [25, 50, 75, 25]);
    await page.clock.runFor(1500);
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    await expect(page.locator('#mobileActionConfirm .nqcost-cancel')).toBeFocused();
    await page.locator('#mobileActionConfirm .nqcost-cancel').click();
    for (const title of ['A Pedra do Julgamento', 'O Tribunal das Verdades Renais', 'O Oráculo do Abismo']) {
      await expect(page.locator('#minigameIntroPopup')).toHaveCount(1);
      await expect(page.locator('#minigameInviteTitle')).toHaveText(title);
      await expect(page.locator('#acceptMinigameBtn')).toBeFocused();
      await page.locator('#minigameIntroPopup [data-remove-id]').click();
    }
    await page.clock.fastForward(60000);
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    expect(await page.evaluate(() => (0, eval)('_minigameTriggerCount'))).toBe(3);
  });

  test('cancelar a jornada retira a espera e não contamina o próximo contexto', async ({ page, baseURL }) => {
    await prepare(page, baseURL!); await schedule(page);
    await page.evaluate(() => (window as any).goToWelcomeFromGame());
    await page.clock.runFor(1500);
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    await page.evaluate(() => (0, eval)('_stopLocalJourney()'));
    // A fronteira real de aposentadoria muda o epoch; nenhuma função é substituída.
    await page.locator('#welcomeScreen [data-action="continueGame"]').click();
    await expect(page.locator('#mainApp')).toBeVisible();
    await page.clock.runFor(5000);
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    expect(await page.evaluate(() => (0, eval)('_minigameTriggerCount'))).toBe(0);
    await schedule(page); await page.clock.runFor(1499);
    await expect(page.locator('#minigameIntroPopup')).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(page.locator('#acceptMinigameBtn')).toBeFocused();
  });
});
