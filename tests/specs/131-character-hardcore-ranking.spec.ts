import { test, expect, type Page } from '@playwright/test';
import {
  answerTechnical, attachPilotFailureDiagnostics, installBackendRecorder,
  normalBytes, openPilotChoice, PILOT_KEY, pilotState, resumeNormalCharacter,
  seedLegacyPilot, setupPilotPage, startNormalCharacter, type Difficulty, type PilotClass,
} from '../helpers/pilot';

const SAVE_KEY = 'nefroquest-save-v7';
const HARDCORE_WARNING = 'No modo Hardcore, os bônus de personagem não se aplicam.';
const RULESET = 'normal-character-initial-v1';
const classes: PilotClass[] = ['nephros', 'glomerulus', 'aquaria'];
const modes: Difficulty[] = ['easy', 'normal', 'hard', 'hardcore'];
const characterNames = {
  nephros: 'Dr. Nephros', glomerulus: 'Dr. Glomerulus', aquaria: 'Dra. Aquaria',
};
const permanentStats = {
  nephros: { atk: 0, def: 0, kno: 2, luck: 0 },
  glomerulus: { atk: 2, def: 0, kno: 1, luck: 0 },
  aquaria: { atk: 0, def: 2, kno: 0, luck: 0 },
};
const bonusFeedback = [
  '+1 XP do personagem.', '+2 ouro do personagem.',
  'Proteção de Aquaria usada: nenhuma vida perdida.', 'Bônus inicial',
];

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => setupPilotPage(page, true));
test.afterEach(async ({ page }, testInfo) => attachPilotFailureDiagnostics(page, testInfo));

async function seedPreservedPilot(page: Page) {
  const envelope = await seedLegacyPilot(page, 'aquaria');
  const raw = await page.evaluate(key => localStorage.getItem(key), PILOT_KEY);
  expect(raw).not.toBeNull();
  return { envelope, raw };
}

async function expectPilotPreserved(page: Page, raw: string | null) {
  expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(raw);
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
}

async function savedNormal(page: Page): Promise<any> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), SAVE_KEY);
}

async function openCharacterChoice(page: Page, difficulty: Difficulty) {
  await openPilotChoice(page, difficulty);
  await page.locator('#diffConfirmBtn').click();
  const choice = page.locator('#charSelectModal');
  await expect(choice).toBeVisible();
  // Snapshot visibility now: a retrying text assertion could conceal delayed copy.
  const warning = choice.getByText(HARDCORE_WARNING, { exact: true });
  expect(await warning.isVisible()).toBe(difficulty === 'hardcore');
  if (difficulty === 'hardcore') expect(await warning.textContent()).toBe(HARDCORE_WARNING);
  const cards = choice.locator('[data-action="selectCharacter"]');
  await expect(cards).toHaveCount(3);
  for (const character of classes) {
    const card = choice.locator('[data-action="selectCharacter"][data-arg="' + character + '"]');
    await expect(card).toBeVisible();
    await expect(card).toBeEnabled();
    if (character === 'nephros') await expect(card).toContainText(/\+2\s+Conhecimento/);
    else if (character === 'aquaria') await expect(card).toContainText(/\+2\s+Defesa/);
    else {
      await expect(card).toContainText(/\+2\s+Ataque/);
      await expect(card).toContainText(/\+1\s+Conhecimento/);
    }
  }
  return choice;
}

async function beginChosenJourney(page: Page, character: PilotClass, difficulty: Difficulty) {
  const choice = await openCharacterChoice(page, difficulty);
  await choice.locator('[data-action="selectCharacter"][data-arg="' + character + '"]').click();
  await expect(page.locator('#charIntroOverlay')).toBeVisible();
  await page.locator('#charIntroOverlay [data-action="closeIntroAndStart"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
  const state = await pilotState(page);
  expect(state).toMatchObject({ character, difficulty, journeyDomain: 'normal', pilotLastAnswer: null });
  expect(await page.evaluate(() => (0, eval)('total()'))).toEqual(permanentStats[character]);
  expect(state.xp).toBe(0);
  expect(state.gold).toBe(0);
  expect(state.lives).toBe({ easy: 5, normal: 4, hard: 3, hardcore: 1 }[difficulty]);
  if (difficulty === 'hardcore') {
    expect(state.classBenefits).toBeNull();
    expect(state.characterLastAnswer).toBeNull();
    const save = await savedNormal(page);
    expect(save.schemaVersion).toBe(7);
    expect(save.classBenefits ?? null).toBeNull();
    expect(save.characterLastAnswer ?? null).toBeNull();
  } else {
    expect(state.classBenefits).toMatchObject({
      ruleset: RULESET, lockedClass: character, difficulty, windowAnswers: 0,
      xpGranted: 0, goldGranted: 0, shieldSpent: false,
    });
    expect((await savedNormal(page)).schemaVersion).toBe(9);
  }
  return state;
}

async function expectNormalRanking(page: Page, state: any, character: PilotClass) {
  await installBackendRecorder(page);
  const observed = await page.evaluate(async () => {
    const state = (0, eval)('state');
    const origin = (0, eval)('_pilotOrigin()');
    await (window as any).boardPush(state.score, state.level, 'Fixture técnica de ranking', origin);
    return { origin, writes: (window as any).__pilotBackendWrites,
      queued: localStorage.getItem('nq-pending-leaderboard') };
  });
  expect(observed.origin).toMatchObject({ domain: 'normal' });
  expect(observed.writes).toHaveLength(1);
  expect(observed.writes[0]).toMatchObject({ table: 'leaderboard', payload: {
    player_name: 'Fixture técnica de ranking', character_name: characterNames[character],
    score: state.score, level: state.level,
  } });
  expect(Object.keys(observed.writes[0].payload).sort()).toEqual([
    'best_streak', 'character_name', 'chests_opened', 'level', 'played_at', 'player_name', 'score',
  ]);
  expect(observed.queued).toBeNull();
}

for (const difficulty of modes) {
  for (const character of classes) {
    test(character + ' em ' + difficulty + ': seleção livre, regras iniciais, reload e ranking normal', async ({ page }) => {
      const legacy = await seedPreservedPilot(page);
      const before = await beginChosenJourney(page, character, difficulty);
      await expectPilotPreserved(page, legacy.raw);
      const after = await answerTechnical(page, true, true);
      const feedback = await page.locator('#feedback').textContent() || '';
      if (difficulty === 'hardcore') {
        expect(after.classBenefits).toBeNull();
        expect(after.characterLastAnswer).toBeNull();
        for (const text of bonusFeedback) expect(feedback).not.toContain(text);
        // The ordinary reward displayed by the real handler must equal the gain;
        // an unannounced extra XP or gold would fail this assertion as well.
        const xp = feedback.match(/\+(\d+) XP/), gold = feedback.match(/\+(\d+) ouro/);
        expect(xp).not.toBeNull();
        expect(gold).not.toBeNull();
        expect(after.xp - before.xp).toBe(Number(xp![1]));
        expect(after.gold - before.gold).toBe(Number(gold![1]));
        // Schema7 retains its native debounce. Await the real durable response.
        await page.waitForFunction(({ key, xp, gold, correctTotal }) => {
          const save = JSON.parse(localStorage.getItem(key) || 'null');
          return save?.schemaVersion === 7 && save.xp === xp && save.gold === gold && save.correctTotal === correctTotal;
        }, { key: SAVE_KEY, xp: after.xp, gold: after.gold, correctTotal: after.correctTotal });
      } else {
        expect(after.classBenefits).toMatchObject({
          ruleset: RULESET, lockedClass: character, difficulty, windowAnswers: 1,
          xpGranted: character === 'nephros' ? 1 : 0,
          goldGranted: character === 'glomerulus' ? 2 : 0, shieldSpent: false,
        });
        expect(after.characterLastAnswer).toMatchObject({
          correct: true, domain: 'normal', xp: character === 'nephros' ? 1 : 0,
          gold: character === 'glomerulus' ? 2 : 0, shield: false,
        });
        expect(feedback).toContain('Bônus inicial: 1/20 respostas.');
        expect(after.xp - before.xp).toBe(after.characterLastAnswer.baseXP + after.characterLastAnswer.xp);
        expect(after.gold - before.gold).toBe(after.characterLastAnswer.baseGold + after.characterLastAnswer.gold);
        const save = await savedNormal(page);
        expect(save.classBenefits).toEqual(after.classBenefits);
        expect(save.characterLastAnswer).toEqual(after.characterLastAnswer);
      }
      await expectPilotPreserved(page, legacy.raw);
      await resumeNormalCharacter(page);
      const resumed = await pilotState(page);
      expect(resumed).toMatchObject({ character, difficulty, journeyDomain: 'normal',
        level: after.level, xp: after.xp, gold: after.gold, score: after.score,
        correctTotal: after.correctTotal, lives: after.lives,
        classBenefits: after.classBenefits, characterLastAnswer: after.characterLastAnswer });
      expect(await page.evaluate(() => (0, eval)('total()'))).toEqual(permanentStats[character]);
      await expectPilotPreserved(page, legacy.raw);
      await expectNormalRanking(page, resumed, character);
      await expectPilotPreserved(page, legacy.raw);
      if (difficulty === 'hardcore') {
        const wrong = await answerTechnical(page, false);
        expect(wrong.lives).toBe(0);
        expect(wrong.classBenefits).toBeNull();
        expect(wrong.characterLastAnswer).toBeNull();
        const wrongFeedback = await page.locator('#feedback').textContent() || '';
        for (const text of bonusFeedback) expect(wrongFeedback).not.toContain(text);
        await expectPilotPreserved(page, legacy.raw);
      }
    });
  }
}

test('aviso Hardcore alterna imediatamente sem bloquear cards nem gravar o cancelamento', async ({ page }) => {
  const legacy = await seedPreservedPilot(page);
  const before = await normalBytes(page);
  for (const difficulty of ['hardcore', 'normal', 'hardcore', 'easy', 'hard'] as Difficulty[]) {
    const choice = await openCharacterChoice(page, difficulty);
    await choice.locator('[data-action="closeCharSelectModal"]').click();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    expect(await normalBytes(page)).toEqual(before);
    await expectPilotPreserved(page, legacy.raw);
  }
});

test('save schema7 Hardcore de Aquaria retoma sem retroativo nem proteção inicial', async ({ page }) => {
  const legacy = await seedPreservedPilot(page);
  await page.evaluate(({ save, key }) => {
    const historical = { ...save, schemaVersion: 7, journeyDomain: 'normal', difficulty: 'hardcore',
      lives: 1, maxLives: 1, classBenefits: null, pilotLastAnswer: null, characterLastAnswer: null };
    const raw = JSON.stringify(historical);
    localStorage.setItem(key, raw);
    localStorage.setItem('nefroquest-save', raw);
  }, { save: legacy.envelope.save, key: SAVE_KEY });
  await resumeNormalCharacter(page);
  const before = await pilotState(page);
  expect(before).toMatchObject({ character: 'aquaria', difficulty: 'hardcore',
    classBenefits: null, characterLastAnswer: null, lives: 1 });
  expect(await page.evaluate(() => (0, eval)('total()'))).toEqual(permanentStats.aquaria);
  const after = await answerTechnical(page, false);
  expect(after.classBenefits).toBeNull();
  expect(after.characterLastAnswer).toBeNull();
  expect(after.lives).toBe(0);
  const feedback = await page.locator('#feedback').textContent() || '';
  for (const text of bonusFeedback) expect(feedback).not.toContain(text);
  await expectPilotPreserved(page, legacy.raw);
});

for (const character of classes) {
  for (const answered of [false, true]) {
    test('schema9 Hardcore forjado ' + character + ' answered=' + answered + ': recusa retomada e preserva bytes', async ({ page }) => {
      const legacy = await seedPreservedPilot(page);
      await startNormalCharacter(page, character, 'normal');
      if (answered) await answerTechnical(page, character !== 'aquaria', character !== 'aquaria');
      const damaged = await page.evaluate(({ key }) => {
        const save = JSON.parse(localStorage.getItem(key) || 'null');
        if (!(0, eval)('_normalCharacterSaveValid')(save)) throw new Error('The source fixture is not a valid schema9 journey');
        save.difficulty = 'hardcore';
        save.classBenefits.difficulty = 'hardcore';
        save.lives = save.maxLives = 1;
        const raw = JSON.stringify(save);
        localStorage.setItem(key, raw);
        localStorage.setItem('nefroquest-save', raw);
        return raw;
      }, { key: SAVE_KEY });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof (window as any).continueGame === 'function');
      const guest = page.locator('#landingScreen [data-action="playAsGuest"]:visible').first();
      if (await guest.isVisible()) await guest.click();
      await page.locator('#welcomeScreen [data-action="continueGame"]').click();
      await page.waitForFunction(() => !(0, eval)('_continueGamePending'));
      await expect(page.locator('#mainApp')).toBeHidden();
      expect((await pilotState(page)).gameStarted).toBe(false);
      expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(damaged);
      expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(damaged);
      await expectPilotPreserved(page, legacy.raw);
    });
  }
}
