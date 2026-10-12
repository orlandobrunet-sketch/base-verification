import { test, expect, type Page } from '@playwright/test';
import {
  answerTechnical, attachPilotFailureDiagnostics, installBackendRecorder,
  PILOT_KEY, seedLegacyPilot, setupPilotPage, startNormalCharacter,
} from '../helpers/pilot';

const SAVE_KEY = 'nefroquest-save-v7';
const MIRROR_KEY = 'nefroquest-save';
const OWNER = 'character-invalid-cloud-fixture';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => setupPilotPage(page));
test.afterEach(async ({ page }, testInfo) => attachPilotFailureDiagnostics(page, testInfo));

async function installCloudRecorder(page: Page) {
  await installBackendRecorder(page);
  await page.evaluate(() => {
    const target = window as any;
    const client = target.__pilotBackend;
    const from = client.from.bind(client);
    client.from = (table: string) => {
      const chain = from(table);
      return { ...chain, update: (payload: unknown) => {
        target.__pilotBackendWrites.push({ table, payload });
        return chain;
      } };
    };
  });
}

for (const answered of [false, true]) {
  test('schema9 Hardcore inválido answered=' + answered + ': bloqueia upload sem apagar o snapshot', async ({ page }) => {
    await installCloudRecorder(page);
    await page.evaluate(owner => {
      (0, eval)('authUser = ' + JSON.stringify({ id: owner, app_metadata: { premium: true } }));
    }, OWNER);
    await seedLegacyPilot(page, 'aquaria');
    const legacyRaw = await page.evaluate(key => localStorage.getItem(key), PILOT_KEY);
    expect(legacyRaw).not.toBeNull();
    await startNormalCharacter(page, 'aquaria', 'normal');
    if (answered) await answerTechnical(page, false);

    // A real valid upload proves the recorder, owner and sync path can write.
    const valid = await page.evaluate(async ({ key, owner }) => {
      const target = window as any;
      const save = JSON.parse(localStorage.getItem(key) || 'null');
      const structurallyValid = (0, eval)('_normalCharacterSaveValid')(save, owner);
      target.__pilotBackendWrites = [];
      target.__pilotBackendReads = [];
      await (0, eval)('_syncProgressToCloud()');
      return { save, structurallyValid, owner: (0, eval)('_currentSaveOwner()'),
        writes: target.__pilotBackendWrites };
    }, { key: SAVE_KEY, owner: OWNER });
    expect(valid.owner).toBe(OWNER);
    expect(valid.structurallyValid).toBe(true);
    expect(valid.save).toMatchObject({ schemaVersion: 9, saveOwner: OWNER,
      journeyDomain: 'normal', difficulty: 'normal', character: 'aquaria', answered,
      classBenefits: { ruleset: 'normal-character-initial-v1', owner: OWNER,
        difficulty: 'normal', lockedClass: 'aquaria', windowAnswers: answered ? 1 : 0,
        shieldSpent: answered } });
    if (answered) {
      expect(valid.save.characterLastAnswer).toMatchObject({ correct: false, shield: true,
        domain: 'normal', journeyId: valid.save.classBenefits.journeyId,
        questionId: valid.save.currentQuestionId, windowAnswers: 1, xp: 0, gold: 0 });
    } else expect(valid.save.characterLastAnswer).toBeNull();
    expect(valid.writes).toHaveLength(1);
    expect(valid.writes[0]).toEqual({ table: 'profiles',
      payload: { game_progress: expect.objectContaining({ save: valid.save }) } });

    const invalid = await page.evaluate(async ({ key, mirror, pilot, owner }) => {
      const target = window as any;
      const save = JSON.parse(localStorage.getItem(key) || 'null');
      if (!(0, eval)('_normalCharacterSaveValid')(save, owner)) {
        throw new Error('The source fixture must remain a valid normal schema9 snapshot');
      }
      // Retire the in-memory journey and its native timers before replacing storage.
      // This isolates an inactive same-owner save, without an artificial cloud hold.
      target._stopLocalJourney();
      save.difficulty = 'hardcore';
      save.classBenefits.difficulty = 'hardcore';
      const raw = JSON.stringify(save);
      localStorage.setItem(key, raw);
      localStorage.setItem(mirror, raw);
      target.__pilotBackendWrites = [];
      target.__pilotBackendReads = [];
      const before = { canonical: localStorage.getItem(key), mirror: localStorage.getItem(mirror),
        pilot: localStorage.getItem(pilot) };
      const guardState = (0, eval)(`({owner:_currentSaveOwner(), gameStarted:state.gameStarted,
        pilotActive:!!window.NQPilot.active, hold:_characterCloudConflict,
        cleanupBlocked:_saveCleanupBlocked})`);
      const structurallyValid = (0, eval)('_normalCharacterSaveValid')(save, owner);
      await (0, eval)('_syncProgressToCloud()');
      return { save, before, guardState, structurallyValid,
        after: { canonical: localStorage.getItem(key), mirror: localStorage.getItem(mirror),
          pilot: localStorage.getItem(pilot) }, writes: target.__pilotBackendWrites };
    }, { key: SAVE_KEY, mirror: MIRROR_KEY, pilot: PILOT_KEY, owner: OWNER });
    expect(invalid.save).toEqual({ ...valid.save, difficulty: 'hardcore',
      classBenefits: { ...valid.save.classBenefits, difficulty: 'hardcore' } });
    expect(invalid.guardState).toEqual({ owner: OWNER, gameStarted: false, pilotActive: false,
      hold: false, cleanupBlocked: false });
    expect(invalid.structurallyValid).toBe(false);
    expect(invalid.before.canonical).toBe(JSON.stringify(invalid.save));
    expect(invalid.before.mirror).toBe(invalid.before.canonical);
    expect(invalid.before.pilot).toBe(legacyRaw);
    expect(invalid.writes).toEqual([]);
    expect(invalid.writes.filter((write: any) =>
      write.table === 'profiles' && write.payload?.game_progress?.save === null)).toEqual([]);
    expect(invalid.after).toEqual(invalid.before);
  });
}
