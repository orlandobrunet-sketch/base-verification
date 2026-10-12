import { test, expect, type Page } from '@playwright/test';
import {
  advanceTechnical, answerTechnical, attachPilotFailureDiagnostics, changeState, installBackendRecorder,
  normalBytes, normalSave, openPilotChoice, PILOT_KEY, pilotEnvelope,
  pilotState, resumePilot, seedLegacyPilot, setupPilotPage, startPilot,
} from '../helpers/pilot';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => setupPilotPage(page, true));
test.afterEach(async ({ page }, testInfo) => attachPilotFailureDiagnostics(page, testInfo));

async function occupyForgeSlots(page: Page) {
  // An occupied slot exercises the real pending-choice branch for any roll.
  const equipment = await page.evaluate(() => {
    const bank = (0, eval)('items');
    return Object.fromEntries(['helmet', 'glove', 'armor', 'weapon', 'relic', 'boot']
      .map(slot => [slot, { ...bank[slot][0] }]));
  });
  expect(Object.values(equipment).every(item => item.n && item.n !== 'Vazio')).toBe(true);
  await changeState(page, { equipment });
}

async function dismissCampaignOverlays(page: Page) {
  const overlays = page.locator('.nq-overlay:visible, .narrative-popup:visible, .forge-popup:visible, #chestModal.show, #equipCompareOverlay:visible');
  const controls = [
    '#guestHookContinue', '[data-close-closest=".narrative-popup"]',
    '[data-close-closest=".evolution-popup"]', '[data-close-closest=".extra-life-popup"]',
    '[data-remove-id="goldMilestonePopup"]', '.nqch-trigger[data-action="_animateAndClaimChest"]',
    '[data-action="closeChestModal"]', '#ecpKeep', '[data-close-closest=".forge-popup"]',
  ].join(', ');
  for (let dismissed = 0; dismissed < 16; dismissed++) {
    const ranked = await overlays.evaluateAll(nodes => nodes
      .map((node, index) => ({ index, z: Number.parseFloat(getComputedStyle(node).zIndex) || 0,
        inert: !!node.closest('[inert]') }))
      .filter(node => !node.inert)
      .sort((a, b) => a.z - b.z || a.index - b.index));
    if (!ranked.length) {
      await expect(overlays).toHaveCount(0);
      return;
    }
    // DOM order alone misses the guest invitation above later narrative dialogs.
    const top = overlays.nth(ranked[ranked.length - 1].index);
    const control = top.locator(controls).first();
    await expect(control, 'Campaign overlay must have an expected native control').toBeVisible();
    const original = await top.elementHandle();
    expect(original).not.toBeNull();
    try {
      // Keep the original identity: opening a chest can replace it with a reward.
      await control.click();
      await original!.waitForElementState('hidden');
    } finally {
      await original?.dispose();
    }
  }
  throw new Error('Campaign overlays did not close through their native controls');
}

async function observePilotAutosave(page: Page) {
  await page.evaluate(key => {
    const view = window as any;
    const saveGame = (0, eval)('saveGame');
    const nativeSetTimeout = window.setTimeout;
    const nativeClearTimeout = window.clearTimeout;
    const probe = { pending: new Set<number>(), running: 0, scheduled: 0, cancelled: 0, completed: 0,
      last: null as { beforeRaw: string | null; raw: string | null } | null };
    const readRaw = () => {
      try { return localStorage.getItem(key); } catch { return null; }
    };
    // Observe the real Proxy debounce; every timer still uses its native clock and ID.
    window.setTimeout = function (this: Window, handler: TimerHandler, delay?: number, ...args: unknown[]) {
      if (handler !== saveGame || delay !== 500) {
        return Reflect.apply(nativeSetTimeout, this, [handler, delay, ...args]);
      }
      let id: number;
      const callback = function (this: unknown, ...nativeArgs: unknown[]) {
        const beforeRaw = readRaw();
        probe.running++;
        try { return Reflect.apply(saveGame, this, nativeArgs); }
        finally {
          probe.last = { beforeRaw, raw: readRaw() };
          probe.completed++;
          probe.running--;
          probe.pending.delete(id);
        }
      };
      id = Reflect.apply(nativeSetTimeout, this, [callback, delay, ...args]);
      probe.pending.add(id);
      probe.scheduled++;
      return id;
    } as typeof window.setTimeout;
    window.clearTimeout = function (this: Window, ...args: Parameters<typeof nativeClearTimeout>) {
      const result = Reflect.apply(nativeClearTimeout, this, args);
      if (probe.pending.delete(Number(args[0]))) probe.cancelled++;
      return result;
    } as typeof window.clearTimeout;
    view.__pilotAutosaveProbe = probe;
    view.__restorePilotAutosaveObserver = () => {
      window.setTimeout = nativeSetTimeout;
      window.clearTimeout = nativeClearTimeout;
      delete view.__pilotAutosaveProbe;
      delete view.__restorePilotAutosaveObserver;
    };
  }, PILOT_KEY);
  const restore = () => page.evaluate(() => (window as any).__restorePilotAutosaveObserver?.());
  return {
    restore,
    settledBytes: async () => {
      try {
        await page.waitForFunction(() => {
          const probe = (window as any).__pilotAutosaveProbe;
          return probe?.completed > 0 && probe.pending.size === 0 && probe.running === 0;
        });
        // Read the full baseline and idle state in the same browser task.
        const snapshot = await page.evaluate(key => {
          const probe = (window as any).__pilotAutosaveProbe;
          return { raw: localStorage.getItem(key), pending: probe.pending.size, running: probe.running,
            scheduled: probe.scheduled, cancelled: probe.cancelled, completed: probe.completed, last: probe.last };
        }, PILOT_KEY);
        expect(snapshot).toMatchObject({ pending: 0, running: 0 });
        expect(snapshot.completed).toBeGreaterThan(0);
        expect(snapshot.last?.beforeRaw).not.toBeNull();
        expect(snapshot.raw).not.toBeNull();
        expect(snapshot.raw).toBe(snapshot.last.raw);
        const beforeWrite = JSON.parse(snapshot.last.beforeRaw);
        const durable = JSON.parse(snapshot.raw!);
        // A failed or skipped persistence callback must fail this fixture too.
        expect(durable.revision).toBe(beforeWrite.revision + 1);
        expect(durable.save.timestamp).toBeGreaterThanOrEqual(beforeWrite.save.timestamp);
        expect(durable.updatedAt).toBeGreaterThanOrEqual(beforeWrite.updatedAt);
        expect(durable).toEqual({ ...beforeWrite, revision: beforeWrite.revision + 1,
          save: { ...beforeWrite.save, timestamp: durable.save.timestamp }, updatedAt: durable.updatedAt });
        expect(durable.save).toMatchObject({ gameOver: true, pilotJourneyAccounted: true, lives: 0 });
        expect(JSON.parse(durable.progress['nefroquest-stats']).gamesPlayed).toBe(1);
        return snapshot.raw!;
      } finally { await restore(); }
    },
  };
}

test('cancelar a escolha de dificuldade conserva todos os bytes normais e não cria piloto', async ({ page }) => {
  const before = await normalBytes(page);
  await openPilotChoice(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#diffSelectorOverlay')).toHaveCount(0);
  expect(await normalBytes(page)).toEqual(before);
  expect(await pilotEnvelope(page)).toBeNull();
});

test('navegador sem Web Locks rejeita a retomada do legado antes de tocar nos dados normais', async ({ page }) => {
  await seedLegacyPilot(page);
  const before = await normalBytes(page);
  const legacyRaw = await page.evaluate(key => localStorage.getItem(key), PILOT_KEY);
  await page.evaluate(() => Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }));
  await page.locator('#resumePilotBtn').click();
  await expect(page.locator('.nq-toast').last()).toContainText('O piloto está indisponível ou aberto em outra aba');
  await expect(page.locator('#charSelectModal')).not.toHaveClass(/show/);
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
  expect(await normalBytes(page)).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(legacyRaw);
});

test('mudança forçada para Hardcore aborta sem gravar crédito ou converter a jornada', async ({ page }) => {
  await startPilot(page);
  const before = await page.evaluate(key => localStorage.getItem(key), PILOT_KEY);
  const normal = await normalBytes(page);
  await changeState(page, { difficulty: 'hardcore' });
  await answerTechnical(page);
  expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(before);
  expect(await normalBytes(page)).toEqual(normal);
  expect((await pilotEnvelope(page)).classBenefits).toMatchObject({ windowAnswers: 0, xpGranted: 0 });
});

for (const stage of ['character', 'intro']) {
  test(`cancelar ${stage} preserva o save normal sem criar piloto ou bônus retroativo`, async ({ page }) => {
    const before = await normalBytes(page);
    await openPilotChoice(page);
    await page.locator('#diffConfirmBtn').click();
    await expect(page.locator('#charSelectModal')).toHaveClass(/show/);
    if (stage === 'character') await page.keyboard.press('Escape');
    else {
      await page.locator('#charSelectModal [data-action="selectCharacter"][data-arg="nephros"]').click();
      await page.locator('#charIntroOverlay [data-action="cancelCharacterIntro"]').click();
    }
    expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
    expect(await pilotEnvelope(page)).toBeNull();
    expect(await normalBytes(page)).toEqual(before);
  });
}

test('iniciar, responder, recarregar, retomar e sair preservam as chaves normais byte a byte', async ({ page }) => {
  const before = await normalBytes(page);
  expect(before).toMatchObject({
    'nefroquest-minigame-best': '11', 'nefroquest-recommended-difficulty': 'hard',
    'nefroquest-ritual-done': 'normal-ritual-history',
  });
  await startPilot(page, 'glomerulus');
  expect((await pilotState(page)).obtainedItems).toEqual([]);
  const answered = await answerTechnical(page);
  expect(await normalBytes(page)).toEqual(before);
  await resumePilot(page);
  const resumed = await pilotState(page);
  expect(resumed.classBenefits).toEqual(answered.classBenefits);
  expect(resumed.pilotLastAnswer).toEqual(answered.pilotLastAnswer);
  expect(resumed.currentId).toBe(answered.currentId);
  expect(resumed.answered).toBe(true);
  await expect(page.locator('#options .option').first()).toBeDisabled();
  expect(await normalBytes(page)).toEqual(before);
  await page.locator('#leavePilotBtn').click();
  expect(await normalBytes(page)).toEqual(before);
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
  const welcome = page.locator('#welcomeScreen');
  await expect(welcome).toBeVisible();
  await expect(welcome).toHaveCSS('opacity', '1');
  const normalContinue = welcome.locator('[data-action="continueGame"]');
  for (let tabs = 0; tabs < 24; tabs++) {
    await page.keyboard.press('Tab');
    if (await normalContinue.evaluate(element => document.activeElement === element)) break;
  }
  await expect(normalContinue).toBeFocused();
  await expect(normalContinue).toBeVisible();
  expect(await normalContinue.evaluate(element => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return hit === element || element.contains(hit);
  })).toBe(true);
  await page.locator('#welcomeScreen [data-action="continueGame"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  const normal = await pilotState(page);
  expect(normal).toMatchObject({
    character: normalSave.character, gold: normalSave.gold,
    score: normalSave.score, correctTotal: normalSave.correctTotal, classBenefits: null,
  });
  expect(normal.obtainedItems).toEqual(normalSave.obtainedItems);
  await expect(page.locator('#characterPilotBanner')).toBeHidden();
});

test('cota soma o histórico próprio somente no piloto e mantém a cota normal depois da saída', async ({ page }) => {
  const normal = await normalBytes(page);
  const quota = () => page.evaluate(() => (window as any).getEntitlementQuestionsAnswered());
  expect(await quota()).toBe(7);
  await startPilot(page, 'nephros');
  expect(await quota()).toBe(7);
  await answerTechnical(page);
  expect(await quota()).toBe(8);
  expect(await normalBytes(page)).toEqual(normal);
  await page.locator('#leavePilotBtn').click();
  expect(await quota()).toBe(7);
  expect(await normalBytes(page)).toEqual(normal);
  await page.locator('#resumePilotBtn').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  expect(await quota()).toBe(8);
  await page.locator('#leavePilotBtn').click();
  await startPilot(page, 'glomerulus');
  // Restarting a pilot does not erase its own all-time usage.
  expect(await quota()).toBe(8);
  await answerTechnical(page);
  expect(await quota()).toBe(9);
  await page.locator('#leavePilotBtn').click();
  expect(await quota()).toBe(7);
  expect(await normalBytes(page)).toEqual(normal);
});

test('início parcial gravado pela API real não oferece retomada nem cria uma jornada após recarga', async ({ page }) => {
  const normal = await normalBytes(page);
  const created = await page.evaluate(async () => {
    const pilot = (window as any).NQPilot;
    const reserved = await pilot.reserve('normal', null);
    const started = reserved && pilot.start('nephros', 'normal', null);
    pilot.release();
    (window as any).refreshCharacterPilotUI();
    return started;
  });
  expect(created).toBe(true);
  const partial = await pilotEnvelope(page);
  expect(partial.save.gameStarted).toBe(false);
  expect(partial.save.lives).toBeUndefined();
  const raw = await page.evaluate(key => localStorage.getItem(key), PILOT_KEY);
  await expect(page.locator('#characterPilotSaved')).toBeVisible();
  await expect(page.locator('#resumePilotBtn')).toBeVisible();
  await expect(page.locator('#resumePilotBtn')).toBeDisabled();
  await expect(page.locator('#resumePilotBtn')).toHaveText('Piloto não iniciado');
  await expect(page.locator('#characterPilotSavedDescription')).toContainText('Piloto não iniciado');
  expect(await page.evaluate(() => (window as any).resumePilotGame())).toBe(false);
  expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(raw);
  expect(await normalBytes(page)).toEqual(normal);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).resumePilotGame === 'function');
  const guest = page.locator('#landingScreen [data-action="playAsGuest"]:visible').first();
  if (await guest.isVisible()) await guest.click();
  await expect(page.locator('#characterPilotSaved')).toBeVisible();
  await expect(page.locator('#resumePilotBtn')).toBeVisible();
  await expect(page.locator('#resumePilotBtn')).toBeDisabled();
  await expect(page.locator('#resumePilotBtn')).toHaveText('Piloto não iniciado');
  await expect(page.locator('#characterPilotSavedDescription')).toContainText('Piloto não iniciado');
  expect(await page.evaluate(() => (window as any).resumePilotGame())).toBe(false);
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
  expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(raw);
  expect(await normalBytes(page)).toEqual(normal);
});

test('vitória própria não conclui a próxima jornada ao recarregar e renova apenas seus anúncios', async ({ page }) => {
  const normal = await normalBytes(page);
  await startPilot(page, 'nephros');
  const first = await pilotEnvelope(page);
  expect(first.progress['nefroquest-journey-count']).toBe('1');
  await changeState(page, { correctTotal: 99, bossIntroShown: true, battleFinalShown: true });
  await answerTechnical(page);
  await expect(page.locator('#victoryModal')).toBeVisible();
  expect((await pilotState(page)).gameCompleted).toBe(true);
  await page.evaluate(() => (window as any).finishGameCompletely());
  const won = await pilotEnvelope(page);
  expect(won.save).toMatchObject({ gameCompleted: true, gameOver: true, pilotJourneyAccounted: true });
  expect(won.progress['nefroquest-arqui-defeated']).toBe('1');
  expect(JSON.parse(won.progress['nefroquest-stats']).gamesPlayed).toBe(1);
  // A genuine victory has its own announced badges; those announcements are
  // per journey while the historical badge records remain in the pilot domain.
  expect(JSON.parse(won.progress['nefroquest-announced-badges'])).not.toHaveLength(0);
  const badgeHistory = won.progress['nefroquest-badge-history'];
  await page.evaluate(() => (window as any).leavePilotGame());
  await startPilot(page, 'aquaria');
  const second = await pilotEnvelope(page);
  expect(second.journeyId).not.toBe(first.journeyId);
  expect(second.progress['nefroquest-journey-count']).toBe('2');
  expect(second.progress['nefroquest-arqui-defeated']).toBe('1');
  expect(second.progress['nefroquest-badge-history']).toBe(badgeHistory);
  expect(second.progress['nefroquest-announced-badges']).toBeUndefined();
  expect(second.classBenefits).toMatchObject({ lockedClass: 'aquaria', windowAnswers: 0, shieldSpent: false });
  await resumePilot(page);
  const resumed = await pilotState(page);
  expect(resumed).toMatchObject({ gameStarted: true, gameCompleted: false,
    completedGame: false, gameOver: false, correctTotal: 0, pilotJourneyAccounted: false });
  expect((await pilotEnvelope(page)).progress['nefroquest-journey-count']).toBe('2');
  expect(await normalBytes(page)).toEqual(normal);
  const answered = await answerTechnical(page, false);
  expect(answered.classBenefits).toMatchObject({ windowAnswers: 1, shieldSpent: true });
});

test('recarregar uma pergunta ainda pendente conserva identidade e janela sem crédito antecipado', async ({ page }) => {
  await startPilot(page, 'nephros');
  const pending = await pilotState(page);
  await resumePilot(page);
  const resumed = await pilotState(page);
  expect(resumed.currentId).toBe(pending.currentId);
  expect(resumed.answered).toBe(false);
  expect(resumed.classBenefits).toEqual(pending.classBenefits);
  const answered = await answerTechnical(page);
  expect(answered.classBenefits).toMatchObject({ windowAnswers: 1, xpGranted: 1 });
  await resumePilot(page);
  await page.evaluate(() => (0, eval)('answer(0, document.querySelector("#options .option"))'));
  expect((await pilotState(page)).classBenefits).toEqual(answered.classBenefits);
});

test('dois cliques aceitos no mesmo turno gravam uma única resposta e um único crédito', async ({ page }) => {
  await startPilot(page, 'glomerulus');
  await page.evaluate(() => (0, eval)(`const option = document.querySelector('#options .option');
    answer(0, option); answer(0, option);`));
  const state = await pilotState(page);
  expect(state.correctTotal).toBe(1);
  expect(state.classBenefits).toMatchObject({ windowAnswers: 1, goldGranted: 2 });
  expect(state.classBenefits.creditedEvents).toHaveLength(1);
  expect((await pilotEnvelope(page)).save.pilotLastAnswer.gold).toBe(2);
});

for (const character of ['nephros', 'glomerulus', 'aquaria'] as const) {
  test(`${character}: falha na gravação aborta resultado, saldo e carga juntos`, async ({ page }) => {
    await startPilot(page, character);
    const beforeNormal = await normalBytes(page);
    const beforeRaw = await page.evaluate(key => localStorage.getItem(key), PILOT_KEY);
    const before = await pilotEnvelope(page);
    await page.evaluate(key => {
      const windowAny = window as any;
      windowAny.__pilotOriginalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, value) {
        if (k === key) throw new DOMException('Synthetic pilot persistence failure', 'QuotaExceededError');
        return windowAny.__pilotOriginalSetItem.call(this, k, value);
      };
    }, PILOT_KEY);
    await answerTechnical(page, character !== 'aquaria');
    expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(beforeRaw);
    expect(await normalBytes(page)).toEqual(beforeNormal);
    await expect(page.locator('.nq-toast').last()).toContainText('Nenhum bônus foi confirmado');
    await page.evaluate(() => { Storage.prototype.setItem = (window as any).__pilotOriginalSetItem; });
    await resumePilot(page);
    const restored = await pilotState(page);
    expect(restored.classBenefits).toEqual(before.classBenefits);
    expect(restored).toMatchObject({ gold: before.save.gold, xp: before.save.xp, lives: before.save.lives, answered: false });
    const after = await answerTechnical(page, character !== 'aquaria');
    expect(after.classBenefits.windowAnswers).toBe(1);
    expect(after.pilotLastAnswer).toMatchObject({
      xp: character === 'nephros' ? 1 : 0,
      gold: character === 'glomerulus' ? 2 : 0,
      shield: character === 'aquaria',
    });
  });
}

test('duas abas: a segunda não toma a jornada nem duplica crédito; retoma após liberação', async ({ page, context }) => {
  await startPilot(page, 'glomerulus');
  const beforeNormal = await normalBytes(page);
  const second = await context.newPage();
  try {
    await setupPilotPage(second);
    await expect(second.locator('#resumePilotBtn')).toBeVisible();
    await second.locator('#resumePilotBtn').click();
    await expect(second.locator('#mainApp')).toBeHidden();
    expect(await second.evaluate(() => (window as any).NQPilot.active)).toBe(false);
    const answer = await answerTechnical(page);
    expect((await pilotEnvelope(second)).classBenefits).toEqual(answer.classBenefits);
    expect(await normalBytes(second)).toEqual(beforeNormal);
    await page.locator('#leavePilotBtn').click();
    await second.locator('#resumePilotBtn').click();
    await expect(second.locator('#mainApp')).toBeVisible();
    expect((await pilotState(second)).classBenefits).toEqual(answer.classBenefits);
    await advanceTechnical(second);
    const next = await answerTechnical(second);
    expect(next.classBenefits).toMatchObject({ windowAnswers: 2, goldGranted: 4 });
    expect(await normalBytes(second)).toEqual(beforeNormal);
  } finally { await second.close(); }
});

test('troca de identidade encerra o contexto sem transferir registro ou créditos', async ({ page }) => {
  await startPilot(page);
  const before = await pilotEnvelope(page);
  const normal = await normalBytes(page);
  await page.evaluate(() => (0, eval)('_prepareProgressOwner("pilot-other-owner"); authUser = {id:"pilot-other-owner"};'));
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
  const after = await pilotEnvelope(page);
  expect(after.owner).toBe(before.owner);
  expect(after.classBenefits).toEqual(before.classBenefits);
  expect(after.save.correctTotal).toBe(0);
  expect(await normalBytes(page)).toEqual(normal);
  expect(await page.evaluate(() => (window as any).resumePilotGame())).toBe(false);
});

for (const corruption of ['missing', 'malformed', 'over-cap']) {
  test(`registro ${corruption} não é reconstruído com carga nova nem migra ao save normal`, async ({ page }) => {
    await startPilot(page, 'aquaria');
    await answerTechnical(page, false);
    await page.locator('#leavePilotBtn').click();
    const normal = await normalBytes(page);
    const damaged = await page.evaluate(({ key, corruption }) => {
      const envelope = JSON.parse(localStorage.getItem(key)!);
      if (corruption === 'missing') delete envelope.classBenefits;
      if (corruption === 'malformed') envelope.classBenefits.seenQids = 'invalid';
      if (corruption === 'over-cap') envelope.classBenefits.windowAnswers = 21;
      const raw = JSON.stringify(envelope); localStorage.setItem(key, raw); return raw;
    }, { key: PILOT_KEY, corruption });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof (window as any).resumePilotGame === 'function');
    expect(await page.evaluate(() => (window as any).resumePilotGame())).toBe(false);
    expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(damaged);
    expect(await normalBytes(page)).toEqual(normal);
    expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
  });
}

test('reset do piloto remove seu domínio e mantém os saves e coleções normais', async ({ page }) => {
  const normal = await normalBytes(page);
  await startPilot(page, 'nephros');
  await answerTechnical(page);
  expect(await page.evaluate(() => (window as any).clearLocalProgress('reset'))).toBe(true);
  expect(await pilotEnvelope(page)).toBeNull();
  expect(await normalBytes(page)).toEqual(normal);
});

test('piloto e sua origem pendente continuam fora do ranking após janela e após saída', async ({ page }) => {
  test.setTimeout(45_000);
  const normal = await normalBytes(page);
  await startPilot(page, 'glomerulus');
  for (let n = 0; n < 21; n++) {
    if (n) await advanceTechnical(page);
    await dismissCampaignOverlays(page);
    const before = await pilotState(page);
    const announcements = await page.evaluate(() => (0, eval)(`({
      chestDue: (state.chestCorrectCount || 0) + 1 >= state.chestTarget,
      goldShown: _goldMilestoneShown, goldThreshold: GOLD_MILESTONE
    })`));
    const answered = await answerTechnical(page);
    // Wait only for announcements actually scheduled by this accepted answer.
    if (announcements.chestDue) await expect(page.locator('#autoChestPopup')).toBeVisible();
    if (answered.level > before.level) await expect(page.locator('.evolution-popup')).toBeVisible();
    if (!announcements.goldShown && before.gold < announcements.goldThreshold && answered.gold >= announcements.goldThreshold) {
      await expect(page.locator('#goldMilestonePopup')).toBeVisible();
    }
    await dismissCampaignOverlays(page);
  }
  const completed = await pilotState(page);
  expect(completed.correctTotal).toBe(21);
  expect(completed.classBenefits).toMatchObject({ windowAnswers: 20, goldGranted: 40 });
  expect(completed.pilotLastAnswer.gold).toBe(0);
  expect(await normalBytes(page)).toEqual(normal);
  const journeyId = completed.classBenefits.journeyId;
  await installBackendRecorder(page);
  await page.evaluate(async id => {
    await (window as any).boardPush(800, 3, 'Fixture', { domain: 'pilot', journeyId: id });
  }, journeyId);
  expect(await page.evaluate(() => (window as any).__pilotBackendWrites)).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('nq-pending-leaderboard'))).toBeNull();
  await page.locator('#leavePilotBtn').click();
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
  expect(await normalBytes(page)).toEqual(normal);
  await page.evaluate(async id => {
    await (window as any).boardPush(800, 3, 'Fixture', { domain: 'pilot', journeyId: id });
  }, journeyId);
  expect(await page.evaluate(() => (window as any).__pilotBackendWrites)).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('nq-pending-leaderboard'))).toBeNull();
  expect(await normalBytes(page)).toEqual(normal);
});

test('Perfil Global usa acumulados normais quando o piloto está ativo; cloud não exporta nem importa piloto', async ({ page }) => {
  await startPilot(page, 'nephros');
  await answerTechnical(page);
  await installBackendRecorder(page);
  const before = await pilotEnvelope(page);
  await page.evaluate(async () => {
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({ totalCorrect: 17 }));
    localStorage.setItem('nefroquest-stats', JSON.stringify({ gamesPlayed: 4, bestLevel: 6 }));
    (0, eval)('authUser = {id:"pilot-profile-fixture"}');
    await (window as any).profileStatsPush();
    await (0, eval)('_syncProgressToCloud()');
    (0, eval)('_mergeCloudProgress({save:{classBenefits:{shieldSpent:false},gold:99999},updated_at:new Date().toISOString()})');
  });
  const writes = await page.evaluate(() => (window as any).__pilotBackendWrites);
  expect(writes).toHaveLength(1);
  expect(writes[0]).toMatchObject({ table: 'profiles_stats', payload: { total_correct: 17, total_games: 4, best_level: 6 } });
  expect(writes.some((write: any) => write.table === 'game_progress')).toBe(false);
  expect((await pilotEnvelope(page)).classBenefits).toEqual(before.classBenefits);
  expect((await pilotEnvelope(page)).save.gold).toBe(before.save.gold);
});

test('Forja pendente do piloto é retomada e callbacks antigos não atravessam a saída', async ({ page }) => {
  await startPilot(page, 'glomerulus');
  const normal = await normalBytes(page);
  await changeState(page, { gold: 5000 });
  await occupyForgeSlots(page);
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().click();
  await expect(page.locator('#forjaPage')).toBeVisible();
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const paid = await pilotState(page);
  expect(paid.gold).toBe(4700);
  expect(paid.forjaPending).not.toBeNull();
  expect(paid.forjaPending.atual.n).not.toBe('Vazio');
  expect(await normalBytes(page)).toEqual(normal);
  await resumePilot(page, 'forge');
  await expect(page.locator('#forjaPage')).toBeVisible();
  expect((await pilotState(page)).forjaPending).toEqual(paid.forjaPending);
  await page.evaluate(() => {
    (window as any).__pilotOldForjaDecision = (window as any).decidirForja;
    (window as any).leavePilotGame();
  });
  const saved = await pilotEnvelope(page);
  await page.evaluate(() => (window as any).__pilotOldForjaDecision('substituir'));
  expect((await pilotEnvelope(page)).save.forjaPending).toEqual(saved.save.forjaPending);
  expect((await pilotEnvelope(page)).save.gold).toBe(saved.save.gold);
  expect(await normalBytes(page)).toEqual(normal);
  await expect(page.locator('#forjaPage')).toHaveCount(0);
});

test('save normal schema 7 com Forja pendente atravessa o piloto sem crédito retroativo ou perda do sorteio', async ({ page }) => {
  await page.locator('#welcomeScreen [data-action="continueGame"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !_loadingNextQuestion'));
  await occupyForgeSlots(page);
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().click();
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const normalPaid = await pilotState(page);
  expect(normalPaid.gold).toBe(normalSave.gold - 300);
  expect(normalPaid.forjaPending).not.toBeNull();
  expect(normalPaid.forjaPending.atual.n).not.toBe('Vazio');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).NQPilot === 'object');
  const guest = page.locator('#landingScreen [data-action="playAsGuest"]:visible').first();
  if (await guest.isVisible()) await guest.click();
  const bytes = await normalBytes(page);
  expect(JSON.parse(bytes['nefroquest-save-v7']!).schemaVersion).toBe(7);
  await startPilot(page, 'nephros');
  await answerTechnical(page);
  expect(await normalBytes(page)).toEqual(bytes);
  await page.locator('#leavePilotBtn').click();
  expect(await normalBytes(page)).toEqual(bytes);
  await page.locator('#welcomeScreen [data-action="continueGame"]').click();
  await expect(page.locator('#forjaPage')).toBeVisible();
  const resumed = await pilotState(page);
  expect(resumed.forjaPending).toEqual(normalPaid.forjaPending);
  expect(resumed.gold).toBe(normalPaid.gold);
  expect(resumed.obtainedItems).toEqual(normalPaid.obtainedItems);
  expect(resumed.classBenefits).toBeNull();
  await page.locator('[data-action="decidirForja"][data-arg="manter"]').click();
  expect((await pilotState(page)).forjaPending).toBeNull();
});

test('demonstração usa o handler real sem consumir janela, carga, saldo persistido ou chaves normais', async ({ page }) => {
  await startPilot(page, 'aquaria');
  await page.evaluate(() => (0, eval)('beginProgressSandbox("pilot-test")'));
  const normal = await normalBytes(page);
  const raw = await page.evaluate(key => localStorage.getItem(key), PILOT_KEY);
  const before = await pilotState(page);
  await expect(page.locator('#progressSandboxBanner')).toBeVisible();
  await answerTechnical(page, false);
  expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(raw);
  expect(await normalBytes(page)).toEqual(normal);
  expect((await pilotState(page)).classBenefits).toEqual(before.classBenefits);
});

test('resposta real no estudo fica no domínio piloto sem consumir janela nem renovar carga ao voltar', async ({ page }) => {
  await startPilot(page, 'aquaria');
  await answerTechnical(page, false);
  const before = await pilotState(page);
  const normal = await normalBytes(page);
  await page.evaluate(() => (window as any).showTopicSelector());
  await page.getByRole('button', { name: 'Iniciar estudo livre' }).click();
  await expect(page.locator('#studyModePage')).toBeVisible();
  await page.locator('#studyOptions button').first().click();
  await expect(page.locator('#studyFeedback')).toBeVisible();
  expect((await pilotState(page)).classBenefits).toEqual(before.classBenefits);
  expect((await pilotState(page)).correctTotal).toBe(before.correctTotal);
  expect(await normalBytes(page)).toEqual(normal);
  await page.getByRole('button', { name: 'Pausar e voltar' }).click();
  expect((await pilotState(page)).classBenefits).toEqual(before.classBenefits);
  expect((await pilotEnvelope(page)).classBenefits.shieldSpent).toBe(true);
  expect(await normalBytes(page)).toEqual(normal);
});

test('resposta real no simulado não dá extra, não consome campanha e mantém o estado normal da prova', async ({ page }) => {
  await startPilot(page, 'nephros');
  const before = await pilotState(page);
  const normal = await normalBytes(page);
  await page.evaluate(() => (window as any).openGameModesPopup());
  await page.locator('[data-action-seq="closeGameModesPopup,startExamMode"]').click();
  await expect(page.locator('#examPage')).toBeVisible();
  await page.getByRole('button', { name: 'Começar prova' }).click();
  await page.locator('#examPage [data-action="_examAnswer"][data-arg="0"]').click();
  await expect(page.locator('#examCorrecao')).toBeVisible();
  expect((await pilotState(page)).classBenefits).toEqual(before.classBenefits);
  expect((await pilotState(page)).correctTotal).toBe(0);
  expect(await normalBytes(page)).toEqual(normal);
  await page.getByRole('button', { name: 'Sair e continuar depois' }).click();
  expect((await pilotState(page)).classBenefits).toEqual(before.classBenefits);
  expect(await normalBytes(page)).toEqual(normal);
});

for (const identity of ['guest', 'authenticated']) {
  test(`derrota real ${identity}: fechamento é contado uma vez, não envia score e não revive no reload`, async ({ page }) => {
    await installBackendRecorder(page);
    if (identity === 'authenticated') {
      await page.evaluate(() => (0, eval)('authUser = {id:"pilot-final-fixture",app_metadata:{premium:true}}'));
    }
    const normal = await normalBytes(page);
    await startPilot(page, 'nephros');
    const autosave = await observePilotAutosave(page);
    try {
      await changeState(page, { lives: 1, score: 100 });
      const result = await answerTechnical(page, false);
      expect(result.lives).toBe(0);
      await page.waitForFunction(() => (0, eval)('state.gameOver'));
      await expect(page.locator('#question')).toContainText('Fim da jornada!');
      await expect(page.locator('#nameModal')).toBeHidden();
      expect(await page.evaluate(() => (0, eval)('pendingScore'))).toBeNull();
      await page.evaluate(() => (0, eval)('finishGame(); finishGame();'));
      const closed = await pilotEnvelope(page);
      expect(closed.save).toMatchObject({ gameOver: true, pilotJourneyAccounted: true, lives: 0 });
      expect(JSON.parse(closed.progress['nefroquest-stats']).gamesPlayed).toBe(1);
      expect(await page.evaluate(() => (window as any).__pilotBackendWrites)).toEqual([]);
      expect(await page.evaluate(() => localStorage.getItem('nq-pending-leaderboard'))).toBeNull();
      expect(await normalBytes(page)).toEqual(normal);
      const raw = await autosave.settledBytes();
      const durable = JSON.parse(raw);
      expect(durable.classBenefits).toEqual(closed.classBenefits);
      expect(durable.progress).toEqual(closed.progress);
      expect(await normalBytes(page)).toEqual(normal);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof (window as any).NQPilot === 'object');
      if (identity === 'authenticated') {
        await page.evaluate(() => (0, eval)('authUser = {id:"pilot-final-fixture",app_metadata:{premium:true}}'));
      }
      expect(await page.evaluate(() => (window as any).resumePilotGame())).toBe(false);
      expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(raw);
      expect(await normalBytes(page)).toEqual(normal);
    } finally { await autosave.restore(); }
  });
}
