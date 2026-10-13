import { test, expect, type Page } from '@playwright/test';
import {
  advanceTechnical, answerTechnical, attachPilotFailureDiagnostics, installBackendRecorder,
  PILOT_KEY, seedLegacyPilot, setupPilotPage, startNormalCharacter,
} from '../helpers/pilot';

const SAVE_KEY = 'nefroquest-save-v7';
const OWNER_A = 'character-cloud-fixture-a';
const OWNER_B = 'character-cloud-fixture-b';

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

async function snapshot(page: Page) {
  return page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return { raw, save: JSON.parse(raw || 'null') };
  }, SAVE_KEY);
}

async function prepareOwnedJourney(page: Page) {
  await installCloudRecorder(page);
  await page.evaluate(owner => {
    (0, eval)('authUser = ' + JSON.stringify({ id: owner, app_metadata: { premium: true } }));
  }, OWNER_A);
  await seedLegacyPilot(page, 'nephros');
  const legacyRaw = await page.evaluate(key => localStorage.getItem(key), PILOT_KEY);
  expect(legacyRaw).not.toBeNull();
  await startNormalCharacter(page, 'glomerulus', 'normal');
  await answerTechnical(page, true, true);
  const local = await snapshot(page);
  expect(local.raw).not.toBeNull();
  expect(local.save).toMatchObject({ schemaVersion: 9, saveOwner: OWNER_A,
    journeyDomain: 'normal', answered: true,
    classBenefits: { ruleset: 'normal-character-initial-v1', owner: OWNER_A,
      lockedClass: 'glomerulus', windowAnswers: 1, goldGranted: 2 } });
  return { ...local, raw: local.raw!, legacyRaw };
}

async function expectLegacyUnchanged(page: Page, raw: string | null) {
  expect(await page.evaluate(key => localStorage.getItem(key), PILOT_KEY)).toBe(raw);
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
}

async function syncNow(page: Page) {
  return page.evaluate(async () => {
    const target = window as any;
    target.__pilotBackendWrites = [];
    target.__pilotBackendReads = [];
    await (0, eval)('_syncProgressToCloud()');
    return { writes: target.__pilotBackendWrites, reads: target.__pilotBackendReads };
  });
}

async function validateRemote(page: Page, save: any, owner = OWNER_A) {
  expect(await page.evaluate(({ save, owner }) =>
    (0, eval)('_normalCharacterSaveValid')(save, owner), { save, owner }),
  'A rejected history must still be a structurally valid normal snapshot').toBe(true);
}

test('remoto sem ledger mais novo preserva save local completo e pausa upload', async ({ page }) => {
  const local = await prepareOwnedJourney(page);
  const remote = { ...local.save, schemaVersion: 7, timestamp: local.save.timestamp + 1000,
    gold: 90001, score: 90002 };
  delete remote.classBenefits;
  delete remote.characterLastAnswer;
  await page.evaluate(save => (window as any)._mergeCloudProgress({ save }), remote);
  expect((await snapshot(page)).raw).toBe(local.raw);
  await expect(page.locator('.nq-toast').last()).toContainText('save local foi preservado');
  expect(await syncNow(page)).toEqual({ writes: [], reads: [] });
  expect((await snapshot(page)).raw).toBe(local.raw);
  await expectLegacyUnchanged(page, local.legacyRaw);
});

test('journeyId ou prefixo divergente mantém ledger e recursos locais juntos', async ({ page }) => {
  const local = await prepareOwnedJourney(page);
  for (const divergence of ['journey', 'prefix']) {
    const remote = JSON.parse(JSON.stringify(local.save));
    remote.timestamp += 1000;
    remote.gold += 100;
    remote.score += 100;
    if (divergence === 'journey') {
      const journeyId = 'different-' + remote.classBenefits.journeyId;
      remote.classBenefits.journeyId = journeyId;
      remote.classBenefits.creditedEvents = remote.classBenefits.seenQids
        .map((qid: string, index: number) => journeyId + ':' + (index + 1) + ':' + qid);
      remote.characterLastAnswer.journeyId = journeyId;
    } else {
      const different = await page.evaluate(current => {
        const bank = (window as any).questionBank;
        const original = bank.find((question: any) => question.id === current);
        const question = bank.find((question: any) => question.id !== current && question.d === original.d);
        const answers = (window as any).NQAnswers;
        const presentation = answers.present(question);
        const revision = (window as any).questionRevisionCatalog.inspect(presentation, { profile: 'main' });
        if (revision.status !== 'known') throw new Error('Technical fixture source must be known');
        return { questionPresentation: answers.snapshot(presentation), questionRevisionBinding: revision.value.binding,
          questionId: question.id,
          choice: presentation.a, originalChoice: answers.originalIndex(presentation, presentation.a),
          optionId: answers.optionId(presentation, presentation.a) };
      }, remote.currentQuestionId);
      const { questionPresentation, questionRevisionBinding, ...answerIdentity } = different;
      const differentQid = answerIdentity.questionId;
      remote.currentQuestionId = differentQid;
      remote.classBenefits.seenQids = [differentQid];
      remote.classBenefits.creditedEvents = [remote.classBenefits.journeyId + ':1:' + differentQid];
      // A divergent history still needs one coherent presented question and answer.
      remote.questionPresentation = questionPresentation;
      remote.questionRevisionBinding = questionRevisionBinding;
      Object.assign(remote.questionAnswer, answerIdentity);
      Object.assign(remote.characterLastAnswer, answerIdentity);
    }
    await validateRemote(page, remote);
    await page.evaluate(save => (window as any)._mergeCloudProgress({ save }), remote);
    expect((await snapshot(page)).raw, divergence).toBe(local.raw);
    expect(await syncNow(page), divergence).toEqual({ writes: [], reads: [] });
    await expectLegacyUnchanged(page, local.legacyRaw);
  }
});

test('logout confirmado aposenta hold do owner A e permite upload válido do owner B', async ({ page }) => {
  const local = await prepareOwnedJourney(page);
  const remote = { ...local.save, schemaVersion: 7, timestamp: local.save.timestamp + 1000 };
  delete remote.classBenefits;
  delete remote.characterLastAnswer;
  await page.evaluate(save => (window as any)._mergeCloudProgress({ save }), remote);
  expect(await syncNow(page)).toEqual({ writes: [], reads: [] });
  const ownerBSave = JSON.parse(JSON.stringify(local.save));
  ownerBSave.saveOwner = OWNER_B;
  ownerBSave.classBenefits.owner = OWNER_B;
  ownerBSave.saveRevision = 'owned-b-fixture';
  await validateRemote(page, ownerBSave, OWNER_B);
  const switched = await page.evaluate(({ owner, save, key }) => {
    // The real confirmed logout must retire A's hold before importing B's stored snapshot.
    const cleaned = (window as any)._prepareProgressOwner(owner);
    (0, eval)('authUser = ' + JSON.stringify({ id: owner, app_metadata: { premium: true } }));
    localStorage.setItem(key, JSON.stringify(save));
    (0, eval)('refreshWelcomeSave()');
    return { cleaned, hold: (0, eval)('_characterCloudConflict') };
  }, { owner: OWNER_B, save: ownerBSave, key: SAVE_KEY });
  expect(switched).toEqual({ cleaned: true, hold: false });
  const uploaded = await syncNow(page);
  expect(uploaded.reads).toEqual(['profiles']);
  expect(uploaded.writes).toHaveLength(1);
  expect(uploaded.writes[0]).toMatchObject({ table: 'profiles',
    payload: { game_progress: { save: ownerBSave } } });
  await expectLegacyUnchanged(page, local.legacyRaw);
});

test('snapshot remoto válido da mesma jornada é aceito inteiro com recursos e resposta', async ({ page }) => {
  const local = await prepareOwnedJourney(page);
  await advanceTechnical(page);
  await answerTechnical(page);
  const remote = (await snapshot(page)).save;
  remote.timestamp = Math.max(remote.timestamp, local.save.timestamp + 1000);
  await validateRemote(page, remote);
  expect(remote.classBenefits).toMatchObject({ journeyId: local.save.classBenefits.journeyId,
    windowAnswers: 2, goldGranted: 4 });
  expect(remote.classBenefits.creditedEvents.slice(0, 1)).toEqual(local.save.classBenefits.creditedEvents);
  await page.evaluate(({ raw, save }) => {
    (window as any)._stopLocalJourney();
    localStorage.setItem('nefroquest-save-v7', raw);
    (0, eval)('refreshWelcomeSave()');
    (window as any)._mergeCloudProgress({ save });
  }, { raw: local.raw, save: remote });
  const imported = (await snapshot(page)).save;
  expect(imported).toEqual({ ...remote, saveRevision: imported.saveRevision });
  expect(imported.saveRevision).not.toBe(local.save.saveRevision);
  expect(imported.saveRevision).not.toBe(remote.saveRevision);
  const uploaded = await syncNow(page);
  expect(uploaded.reads).toEqual(['profiles']);
  expect(uploaded.writes).toHaveLength(1);
  expect(uploaded.writes[0]).toMatchObject({ table: 'profiles',
    payload: { game_progress: { save: imported } } });
  await expectLegacyUnchanged(page, local.legacyRaw);
});


test('cleanup recusado conserva hold; retry confirmado aposenta hold e permite sync da nova jornada A', async ({ page }) => {
  const local = await prepareOwnedJourney(page);
  const remote = { ...local.save, schemaVersion: 7, timestamp: local.save.timestamp + 1000 };
  delete remote.classBenefits;
  delete remote.characterLastAnswer;
  await page.evaluate(save => (window as any)._mergeCloudProgress({ save }), remote);
  expect(await syncNow(page)).toEqual({ writes: [], reads: [] });

  const held = await page.evaluate(() => (0, eval)('_characterCloudConflict'));
  expect(held).toMatchObject({ owner: OWNER_A, journeyId: local.save.classBenefits.journeyId });
  try {
    const failed = await page.evaluate(({ key, owner }) => {
      const target = window as any;
      const original = Storage.prototype.setItem;
      const observation = { original, refused: 0 };
      target.__characterCloudCleanupRefusal = observation;
      Storage.prototype.setItem = function(k, value) {
        if (this === localStorage && k === key) {
          const candidate = JSON.parse(value);
          if (candidate?.save === null && candidate.resetReason === 'logout' && candidate.saveOwner === owner) {
            observation.refused++;
            throw new DOMException('Synthetic tombstone refusal', 'QuotaExceededError');
          }
        }
        return original.call(this, k, value);
      };
      const result = (window as any).clearLocalProgress('logout', owner);
      return { result, refused: observation.refused, raw: localStorage.getItem(key),
        hold: (0, eval)('_characterCloudConflict'), blocked: (0, eval)('_saveCleanupBlocked'),
        gameStarted: (0, eval)('state.gameStarted') };
    }, { key: SAVE_KEY, owner: OWNER_A });
    expect(failed).toMatchObject({ result: false, blocked: true, gameStarted: false });
    expect(failed.refused).toBe(2);
    expect(failed.raw).toBe(local.raw);
    expect(failed.hold).toEqual(held);
    expect(await syncNow(page)).toEqual({ writes: [], reads: [] });
    await expectLegacyUnchanged(page, local.legacyRaw);
  } finally {
    await page.evaluate(() => {
      const target = window as any;
      const observation = target.__characterCloudCleanupRefusal;
      if (observation) Storage.prototype.setItem = observation.original;
      delete target.__characterCloudCleanupRefusal;
    });
  }

  const confirmed = await page.evaluate(({ key, owner }) => {
    const result = (window as any).clearLocalProgress('logout', owner);
    return { result, marker: JSON.parse(localStorage.getItem(key) || 'null'),
      hold: (0, eval)('_characterCloudConflict'), blocked: (0, eval)('_saveCleanupBlocked') };
  }, { key: SAVE_KEY, owner: OWNER_A });
  expect(confirmed).toMatchObject({ result: true, hold: false, blocked: false,
    marker: { save: null, saveOwner: OWNER_A, resetReason: 'logout' } });

  const nextJourney = JSON.parse(JSON.stringify(local.save));
  const journeyId = 'next-' + nextJourney.classBenefits.journeyId;
  nextJourney.timestamp += 1000;
  nextJourney.classBenefits.journeyId = journeyId;
  nextJourney.classBenefits.creditedEvents = nextJourney.classBenefits.seenQids
    .map((qid: string, index: number) => journeyId + ':' + (index + 1) + ':' + qid);
  nextJourney.characterLastAnswer.journeyId = journeyId;
  await validateRemote(page, nextJourney);
  await page.evaluate(save => (window as any)._mergeCloudProgress({ save }), nextJourney);
  const imported = (await snapshot(page)).save;
  expect(imported).toEqual({ ...nextJourney, saveRevision: imported.saveRevision });
  const uploaded = await syncNow(page);
  expect(uploaded.reads).toEqual(['profiles']);
  expect(uploaded.writes).toHaveLength(1);
  expect(uploaded.writes[0]).toMatchObject({ table: 'profiles',
    payload: { game_progress: { save: imported } } });
  await expectLegacyUnchanged(page, local.legacyRaw);
});
