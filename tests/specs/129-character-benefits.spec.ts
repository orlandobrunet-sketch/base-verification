import { characterIntro } from '../helpers/cinema';
import { test, expect, type Page } from '@playwright/test';
import {
  advanceTechnical, answerTechnical, attachPilotFailureDiagnostics, changeState,
  normalBytes, openPilotChoice, PILOT_KEY, pilotState, resumeNormalCharacter,
  seedLegacyPilot, setupPilotPage, startNormalCharacter, type PilotClass,
} from '../helpers/pilot';

const NORMAL_SAVE_KEY = 'nefroquest-save-v7';
const RULESET = 'normal-character-initial-v1';
const classes: PilotClass[] = ['nephros', 'glomerulus', 'aquaria'];
const firstDifficulty = { nephros: 'normal', glomerulus: 'easy', aquaria: 'hard' } as const;
const creditText = {
  nephros: '+1 XP do personagem.',
  glomerulus: '+2 ouro do personagem.',
  aquaria: 'Proteção de Aquaria usada: nenhuma vida perdida.',
};

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => setupPilotPage(page, true));
test.afterEach(async ({ page }, testInfo) => attachPilotFailureDiagnostics(page, testInfo));

async function seedUntouchedLegacy(page: Page) {
  const envelope = await seedLegacyPilot(page, 'glomerulus');
  const raw = await page.evaluate(key => localStorage.getItem(key), PILOT_KEY);
  expect(envelope).toMatchObject({ schemaVersion: 8, domain: 'pilot', ruleset: 'class-boons-v1' });
  expect(raw).not.toBeNull();
  return { envelope, raw };
}

async function expectLegacyUnchanged(page: Page, raw: string | null) {
  expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(raw);
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
}

async function normalSave(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), NORMAL_SAVE_KEY);
}

async function expectDurable(page: Page, state: any) {
  const saved = await normalSave(page);
  expect(saved).toMatchObject({
    schemaVersion: 9, journeyDomain: 'normal', character: state.character, difficulty: state.difficulty,
    level: state.level, xp: state.xp, gold: state.gold, lives: state.lives,
    score: state.score, streak: state.streak, correctTotal: state.correctTotal,
    currentQuestionId: state.currentId, answered: state.answered,
  });
  expect(saved.classBenefits).toEqual(state.classBenefits);
  expect(saved.characterLastAnswer).toEqual(state.characterLastAnswer);
  return saved;
}

async function expectImmediateFeedback(page: Page, state: any) {
  // Snapshot the DOM directly: waiting for text could conceal a delayed refresh.
  const text = await page.locator('#feedback').textContent();
  expect(text).toContain(state.classBenefits.windowAnswers < 20
    ? `Bônus inicial: ${state.classBenefits.windowAnswers}/20 respostas.`
    : 'Bônus inicial encerrado (20/20).');
  const result = state.characterLastAnswer;
  for (const character of classes) {
    const granted = character === 'nephros' ? result.xp === 1
      : character === 'glomerulus' ? result.gold === 2 : result.shield === true;
    if (granted) expect(text).toContain(creditText[character]);
    else expect(text).not.toContain(creditText[character]);
  }
}

async function refuseCanonicalWrites(page: Page) {
  await page.evaluate(key => {
    const target = window as any;
    const original = Storage.prototype.setItem;
    const observation = { original, refused: 0 };
    target.__normalCharacterStorageRefusal = observation;
    Storage.prototype.setItem = function(k, value) {
      if (this === localStorage && k === key) {
        observation.refused++;
        throw new DOMException('Synthetic normal save failure', 'QuotaExceededError');
      }
      return original.call(this, k, value);
    };
  }, NORMAL_SAVE_KEY);
}

async function restoreCanonicalWrites(page: Page) {
  await page.evaluate(() => {
    const target = window as any;
    const observation = target.__normalCharacterStorageRefusal;
    if (observation) Storage.prototype.setItem = observation.original;
    delete target.__normalCharacterStorageRefusal;
  });
}

async function expectWriteRefused(page: Page) {
  expect(await page.evaluate(() => (window as any).__normalCharacterStorageRefusal.refused)).toBeGreaterThan(0);
}

async function expectInvalidAnsweredSaveRejected(page: Page, originalRaw: string, legacyRaw: string | null) {
  for (const corruption of ['missing-result', 'wrong-journey'] as const) {
    const damaged = await page.evaluate(({ raw, corruption, key }) => {
      const saved = JSON.parse(raw);
      if (corruption === 'missing-result') saved.characterLastAnswer = null;
      else saved.characterLastAnswer.journeyId = 'mismatched-journey';
      const damagedRaw = JSON.stringify(saved);
      localStorage.setItem(key, damagedRaw);
      localStorage.setItem('nefroquest-save', damagedRaw);
      return damagedRaw;
    }, { raw: originalRaw, corruption, key: NORMAL_SAVE_KEY });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof (window as any).continueGame === 'function');
    const guest = page.locator('#landingScreen [data-action="playAsGuest"]:visible').first();
    if (await guest.isVisible()) await guest.click();
    await page.locator('#welcomeScreen [data-action="continueGame"]').click();
    await page.waitForFunction(() => !(0, eval)('_continueGamePending'));
    await expect(page.locator('#mainApp')).toBeHidden();
    expect((await pilotState(page)).gameStarted).toBe(false);
    expect(await page.evaluate(key => localStorage.getItem(key), NORMAL_SAVE_KEY)).toBe(damaged);
    expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(damaged);
    await expectLegacyUnchanged(page, legacyRaw);
  }
}

async function expectReadbackCompensated(page: Page, legacyRaw: string | null) {
  await advanceTechnical(page);
  const before = await pilotState(page);
  const bytes = await normalBytes(page);
  try {
    // Arm and answer in one browser job so an unrelated autosave cannot consume the injection.
    const observation = await page.evaluate(key => {
      const target = window as any;
      const originalSet = Storage.prototype.setItem, originalGet = Storage.prototype.getItem;
      let armed = true, pendingReadback = false, failedReads = 0;
      const writes: string[] = [];
      target.__normalCharacterReadback = { originalSet, originalGet };
      Storage.prototype.setItem = function(k, value) {
        originalSet.call(this, k, value);
        if (this === localStorage && k === key) {
          writes.push(value);
          if (armed) { armed = false; pendingReadback = true; }
        }
      };
      Storage.prototype.getItem = function(k) {
        if (this === localStorage && k === key && pendingReadback) {
          pendingReadback = false;
          failedReads++;
          throw new DOMException('Synthetic one-time readback failure', 'SecurityError');
        }
        return originalGet.call(this, k);
      };
      (0, eval)('answer(state.current.a, document.querySelectorAll("#options .option")[state.current.a])');
      return { failedReads, writes };
    }, NORMAL_SAVE_KEY);
    expect(observation.failedReads).toBe(1);
    expect(observation.writes).toHaveLength(2);
    expect(observation.writes[0]).not.toBe(bytes[NORMAL_SAVE_KEY]);
    expect(observation.writes[1]).toBe(bytes[NORMAL_SAVE_KEY]);
    expect(await normalBytes(page)).toEqual(bytes);
    await expectLegacyUnchanged(page, legacyRaw);
  } finally {
    await page.evaluate(() => {
      const target = window as any;
      const original = target.__normalCharacterReadback;
      if (original) {
        Storage.prototype.setItem = original.originalSet;
        Storage.prototype.getItem = original.originalGet;
      }
      delete target.__normalCharacterReadback;
    });
  }
  await resumeNormalCharacter(page);
  expect(await pilotState(page)).toMatchObject({
    classBenefits: before.classBenefits, characterLastAnswer: before.characterLastAnswer,
    level: before.level, xp: before.xp, gold: before.gold, lives: before.lives,
    score: before.score, streak: before.streak, correctTotal: before.correctTotal,
    currentId: before.currentId, answered: false,
  });
  await expectLegacyUnchanged(page, legacyRaw);
}

for (const character of classes) {
  for (const correct of [true, false]) {
    test(`${character} ${firstDifficulty[character]}: bônus automático após resposta ${correct ? 'certa' : 'errada'} e reload`, async ({ page }) => {
      const legacy = await seedUntouchedLegacy(page);
      await startNormalCharacter(page, character, firstDifficulty[character]);
      await changeState(page, { score: 100, streak: 3 });
      const before = await pilotState(page);
      const after = await answerTechnical(page, correct, correct);
      await expectImmediateFeedback(page, after);
      expect(after).toMatchObject({ journeyDomain: 'normal', pilotLastAnswer: null });
      expect(after.classBenefits).toMatchObject({
        version: 1, ruleset: RULESET, owner: null, difficulty: firstDifficulty[character],
        lockedClass: character, windowAnswers: 1,
        xpGranted: correct && character === 'nephros' ? 1 : 0,
        goldGranted: correct && character === 'glomerulus' ? 2 : 0,
        shieldSpent: !correct && character === 'aquaria',
      });
      expect(after.classBenefits.journeyId).not.toBe(legacy.envelope.journeyId);
      expect(after.classBenefits.seenQids).toEqual([before.currentId]);
      expect(after.classBenefits.creditedEvents).toEqual([`${after.classBenefits.journeyId}:1:${before.currentId}`]);
      expect(after.characterLastAnswer).toMatchObject({
        correct, domain: 'normal', journeyId: after.classBenefits.journeyId,
        questionId: before.currentId, windowAnswers: 1,
        xp: correct && character === 'nephros' ? 1 : 0,
        gold: correct && character === 'glomerulus' ? 2 : 0,
        shield: !correct && character === 'aquaria',
      });
      expect(after.correctTotal).toBe(before.correctTotal + (correct ? 1 : 0));
      expect(after.lives).toBe(before.lives - (!correct && character !== 'aquaria' ? 1 : 0));
      expect(after.gold - before.gold).toBe(after.characterLastAnswer.baseGold + after.characterLastAnswer.gold);
      expect(after.xp - before.xp).toBe(after.characterLastAnswer.baseXP + after.characterLastAnswer.xp);
      await expectDurable(page, after);
      await expectLegacyUnchanged(page, legacy.raw);
      const question = await page.locator('#question').textContent();

      await resumeNormalCharacter(page);
      const resumed = await pilotState(page);
      expect(resumed).toMatchObject({
        journeyDomain: 'normal', classBenefits: after.classBenefits, characterLastAnswer: after.characterLastAnswer,
        level: after.level, xp: after.xp, gold: after.gold, lives: after.lives,
        score: after.score, streak: after.streak, correctTotal: after.correctTotal,
        currentId: after.currentId, answered: true,
      });
      expect(await page.locator('#question').textContent()).toBe(question);
      await expectImmediateFeedback(page, resumed);
      expect(await page.locator('#options .option').evaluateAll(options =>
        options.length === 4 && options.every(option => (option as HTMLButtonElement).disabled))).toBe(true);
      const duplicate = await page.evaluate(key => {
        const beforeRaw = localStorage.getItem(key);
        (0, eval)('answer(0, document.querySelector("#options .option"))');
        return { beforeRaw, afterRaw: localStorage.getItem(key) };
      }, NORMAL_SAVE_KEY);
      expect(duplicate.afterRaw).toBe(duplicate.beforeRaw);
      expect((await pilotState(page)).classBenefits).toEqual(after.classBenefits);
      await expectDurable(page, resumed);
      await expectLegacyUnchanged(page, legacy.raw);
    });
  }

  test(`${character}: respostas 20 e 21 encerram o bônus sem renovar crédito`, async ({ page }) => {
    test.setTimeout(45_000);
    const legacy = await seedUntouchedLegacy(page);
    await startNormalCharacter(page, character, 'easy');
    const results: any[] = [];
    for (let ordinal = 1; ordinal <= 21; ordinal++) {
      if (ordinal > 1) await advanceTechnical(page);
      await changeState(page, { lives: 50, maxLives: 50 });
      results.push(await answerTechnical(page, character !== 'aquaria'));
    }
    const twentieth = results[19];
    const final = results[20];
    expect(final.classBenefits).toEqual(twentieth.classBenefits);
    expect(final.classBenefits).toMatchObject({ ruleset: RULESET, windowAnswers: 20 });
    expect(final.classBenefits.seenQids).toHaveLength(20);
    expect(final.classBenefits.creditedEvents).toHaveLength(20);
    expect(final.classBenefits.xpGranted).toBeLessThanOrEqual(20);
    expect(final.classBenefits.goldGranted).toBe(character === 'glomerulus' ? 40 : 0);
    expect(final.characterLastAnswer).toMatchObject({ xp: 0, gold: 0, shield: false });
    if (character === 'aquaria') {
      expect(results.filter(result => result.characterLastAnswer.shield)).toHaveLength(1);
      expect(results[0].lives).toBe(50);
      expect(results[1].lives).toBe(49);
      expect(final.classBenefits.shieldSpent).toBe(true);
    }
    expect(final.gameOver).toBe(false);
    await expectImmediateFeedback(page, final);
    await expectDurable(page, final);
    await expectLegacyUnchanged(page, legacy.raw);
  });

  test(`${character}: qid repetido consome posição sem repetir o benefício`, async ({ page }) => {
    const legacy = await seedUntouchedLegacy(page);
    await startNormalCharacter(page, character);
    const first = await answerTechnical(page, character !== 'aquaria');
    await advanceTechnical(page, first.currentId);
    const beforeRepeat = await pilotState(page);
    const repeated = await answerTechnical(page, character !== 'aquaria');
    expect(repeated.currentId).toBe(first.currentId);
    expect(repeated.classBenefits.windowAnswers).toBe(2);
    expect(repeated.classBenefits.seenQids).toEqual([first.currentId]);
    expect(repeated.classBenefits.creditedEvents).toEqual([
      `${first.classBenefits.journeyId}:1:${first.currentId}`,
      `${first.classBenefits.journeyId}:2:${first.currentId}`,
    ]);
    expect(repeated.classBenefits.xpGranted).toBe(first.classBenefits.xpGranted);
    expect(repeated.classBenefits.goldGranted).toBe(first.classBenefits.goldGranted);
    expect(repeated.classBenefits.shieldSpent).toBe(first.classBenefits.shieldSpent);
    expect(repeated.characterLastAnswer).toMatchObject({ xp: 0, gold: 0, shield: false });
    if (character === 'aquaria') expect(repeated.lives).toBe(beforeRepeat.lives - 1);
    await expectImmediateFeedback(page, repeated);
    await expectDurable(page, repeated);
    await expectLegacyUnchanged(page, legacy.raw);
  });

  test(`${character}: recusa da resposta conserva bytes e permite retomar e creditar uma vez`, async ({ page }) => {
    const legacy = await seedUntouchedLegacy(page);
    await startNormalCharacter(page, character);
    const before = await pilotState(page);
    const bytes = await normalBytes(page);
    await refuseCanonicalWrites(page);
    try {
      await answerTechnical(page, character !== 'aquaria');
      await expectWriteRefused(page);
      expect(await normalBytes(page)).toEqual(bytes);
      await expectLegacyUnchanged(page, legacy.raw);
      await expect(page.locator('#welcomeScreen')).toBeVisible();
      expect((await pilotState(page)).gameStarted).toBe(false);
      await expect(page.locator('.nq-toast').last()).toContainText('Não foi possível confirmar a resposta');
    } finally {
      await restoreCanonicalWrites(page);
    }
    await resumeNormalCharacter(page);
    expect(await pilotState(page)).toMatchObject({
      classBenefits: before.classBenefits, characterLastAnswer: before.characterLastAnswer,
      level: before.level, xp: before.xp, gold: before.gold, lives: before.lives,
      score: before.score, streak: before.streak, correctTotal: before.correctTotal,
      currentId: before.currentId, answered: false,
    });
    const retried = await answerTechnical(page, character !== 'aquaria');
    expect(retried.classBenefits).toMatchObject({
      windowAnswers: 1, xpGranted: character === 'nephros' ? 1 : 0,
      goldGranted: character === 'glomerulus' ? 2 : 0, shieldSpent: character === 'aquaria',
    });
    expect(retried.classBenefits.creditedEvents).toHaveLength(1);
    expect(retried.classBenefits.seenQids).toEqual([before.currentId]);
    await expectImmediateFeedback(page, retried);
    await expectDurable(page, retried);
    await expectLegacyUnchanged(page, legacy.raw);
  });
}

for (const stage of ['difficulty', 'character', 'intro'] as const) {
  test(`cancelar em ${stage} conserva save normal e envelope legado byte a byte`, async ({ page }) => {
    const legacy = await seedUntouchedLegacy(page);
    const bytes = await normalBytes(page);
    await openPilotChoice(page);
    expect(await page.locator('#characterPilotOptIn').count()).toBe(0);
    if (stage === 'difficulty') {
      await page.locator('#diffSelectorOverlay [data-action="_closeDifficultySelector"]').click();
    } else {
      await page.locator('#diffConfirmBtn').click();
      if (stage === 'character') await page.locator('#charSelectModal [data-action="closeCharSelectModal"]').click();
      else {
        await page.locator('#charSelectModal [data-action="selectCharacter"][data-arg="aquaria"]').click();
        await (await characterIntro(page)).cancel.click();
      }
    }
    expect(await normalBytes(page)).toEqual(bytes);
    await expectLegacyUnchanged(page, legacy.raw);
    expect((await pilotState(page)).classBenefits).toBeNull();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
  });
}

test('início recusado retorna false síncrono e restaura estado e saves sem tombstone', async ({ page }) => {
  const legacy = await seedUntouchedLegacy(page);
  await page.evaluate(() => (0, eval)('_loadTopics()'));
  const bytes = await normalBytes(page);
  const before = await pilotState(page);
  await refuseCanonicalWrites(page);
  try {
    const attempt = await page.evaluate(() => {
      const api = (window as any)._startNormalCharacterJourney;
      const state = (0, eval)('state');
      let initialized = 0, nestedInitialized = 0, nestedResult: unknown;
      const result = api({ character: 'glomerulus', difficulty: 'normal', initialize: () => {
        initialized++;
        const question = (window as any).questionBank[0];
        Object.assign(state, { gameStarted: true, gameOver: false, lives: 4, maxLives: 4, gold: 99, score: 123,
          current: question, queue: [question], idx: 1, answered: false, characterLastAnswer: null });
        nestedResult = api({ character: 'aquaria', difficulty: 'normal', initialize: () => {
          nestedInitialized++;
          return true;
        } });
        return true;
      } });
      return { result, type: typeof result, thenable: !!result?.then, initialized, nestedInitialized, nestedResult };
    });
    expect(attempt).toEqual({ result: false, type: 'boolean', thenable: false,
      initialized: 1, nestedInitialized: 0, nestedResult: false });
    await expectWriteRefused(page);
    expect(await normalBytes(page)).toEqual(bytes);
    expect(await pilotState(page)).toEqual(before);
    await expectLegacyUnchanged(page, legacy.raw);
    await expect(page.locator('#welcomeScreen')).toBeVisible();
  } finally {
    await restoreCanonicalWrites(page);
  }
});

test('save schema 7 sem ledger retoma e responde sem bônus retroativo', async ({ page }) => {
  const legacy = await seedUntouchedLegacy(page);
  const initial = await page.evaluate(key => JSON.parse(
    localStorage.getItem(key) ?? localStorage.getItem('nefroquest-save') ?? 'null'), NORMAL_SAVE_KEY);
  expect(initial.schemaVersion).toBe(7);
  await resumeNormalCharacter(page);
  const before = await pilotState(page);
  expect(before.classBenefits).toBeNull();
  expect(before.characterLastAnswer).toBeNull();
  const after = await answerTechnical(page, true, true);
  expect(after.classBenefits).toBeNull();
  expect(after.characterLastAnswer).toBeNull();
  expect(after.correctTotal).toBe(before.correctTotal + 1);
  // Historical saves use the existing debounce; wait for the actual durable result.
  await page.waitForFunction(({ key, correctTotal }) => {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    return saved?.schemaVersion === 7 && saved.correctTotal === correctTotal;
  }, { key: NORMAL_SAVE_KEY, correctTotal: after.correctTotal });
  const saved = await normalSave(page);
  expect(saved.schemaVersion).toBe(7);
  expect(saved.classBenefits ?? null).toBeNull();
  expect(saved.characterLastAnswer ?? null).toBeNull();
  const feedback = await page.locator('#feedback').textContent();
  expect(feedback).not.toContain('Bônus inicial');
  for (const character of classes) expect(feedback).not.toContain(creditText[character]);
  await expectLegacyUnchanged(page, legacy.raw);
});

test('save respondido com resultado ausente ou de outra jornada não retoma nem regrava os bytes', async ({ page }) => {
  const legacy = await seedUntouchedLegacy(page);
  await startNormalCharacter(page, 'glomerulus');
  const answered = await answerTechnical(page, true, true);
  await expectImmediateFeedback(page, answered);
  await expectDurable(page, answered);
  const raw = await page.evaluate(key => localStorage.getItem(key), NORMAL_SAVE_KEY);
  expect(raw).not.toBeNull();
  await expectInvalidAnsweredSaveRejected(page, raw!, legacy.raw);
});

test('readback recusado uma vez compensa o save e permite retry sem duplicar crédito', async ({ page }) => {
  const legacy = await seedUntouchedLegacy(page);
  await startNormalCharacter(page, 'glomerulus');
  const first = await answerTechnical(page, true, true);
  await expectDurable(page, first);
  await expectReadbackCompensated(page, legacy.raw);
  const retried = await answerTechnical(page, true, true);
  expect(retried.classBenefits).toMatchObject({ windowAnswers: 2, goldGranted: 4 });
  expect(retried.classBenefits.creditedEvents).toHaveLength(2);
  expect(retried.classBenefits.seenQids).toHaveLength(2);
  expect(retried.correctTotal).toBe(2);
  await expectImmediateFeedback(page, retried);
  await expectDurable(page, retried);
  await expectLegacyUnchanged(page, legacy.raw);
});
