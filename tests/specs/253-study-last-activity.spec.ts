import {test, expect, type Page} from '@playwright/test';
import {createHash} from 'node:crypto';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';

const STUDY = 'nefroquest-study-state';
const LAST_ACTIVITY = 'nq_last_study';
const authors = Array.from({length: 3}, (_, index) => ({
  qid: 'study-last-activity-technical-' + index, t: 'Fluxo técnico', cat: 'geral', diff: 'medium',
  q: 'Questão técnica de persistência ' + index + '.',
  opts: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'], ans: index,
  exp: 'Explicação técnica para conferir a persistência da resposta.',
}));
const reports = new WeakMap<Page, {errors: string[]; evidence: Record<string, unknown>}>();

test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'reduce'}});
test.beforeEach(async ({context, page, baseURL}) => {
  const origin = new URL(baseURL || 'http://localhost:5500').origin;
  expect(['localhost', '127.0.0.1', 'nefroquest.com']).toContain(new URL(origin).hostname);
  const report = {errors: [] as string[], evidence: {} as Record<string, unknown>};
  reports.set(page, report);
  page.on('pageerror', error => report.errors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (['font', 'media'].includes(request.resourceType())) return route.abort();
    return request.method() === 'GET' && url.origin === origin && ['http:', 'https:'].includes(url.protocol)
      ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await routeTechnicalQuestionBank(page, authors);
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.locator('[data-portal-route="guest"]').click();
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
});
test.afterEach(async ({page}, info) => {
  const report = reports.get(page);
  await info.attach('study-last-activity', {contentType: 'application/json',
    body: JSON.stringify({errors: report?.errors, ...report?.evidence})});
  expect(report?.errors, 'O fluxo da resposta não deve lançar erros de página').toEqual([]);
});

async function openStudyHub(page: Page) {
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="study"]:visible').click();
  await expect(page.locator('[data-action="startFreeStudyMode"]')).toBeVisible();
}
async function settleFrames(page: Page) {
  await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}
async function snapshot(page: Page, targetQid: string) {
  const value = await page.evaluate(({targetQid, studyKey, metadataKey}) => {
    const read = (source: string) => (0, eval)(source);
    const raw = localStorage.getItem(studyKey), saved = raw ? JSON.parse(raw) : null;
    const stats = JSON.parse(localStorage.getItem('nefroquest-detailed-stats') || 'null') || {};
    const sr = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
    const feedback = document.getElementById('studyFeedback');
    return {
      authUser: (window as any).authUser === null ? null : typeof (window as any).authUser,
      raw,
      primary: saved ? {index: saved.index, correct: saved.correct, wrong: saved.wrong,
        answers: saved.presentations.map((row: any) => ({id: row.id, answered: !!row.answer,
          correct: row.answer?.correct ?? null}))} : null,
      runtime: {index: read('studyModeIndex'), correct: read('studyModeCorrect'),
        wrong: read('studyModeWrong'), answered: read('_studyAnswers').filter(Boolean).length},
      metadata: localStorage.getItem(metadataKey),
      tracking: {totalQuestions: stats.totalQuestions || 0, totalCorrect: stats.totalCorrect || 0,
        totalWrong: stats.totalWrong || 0,
        targetHistory: (stats.questionHistory || []).filter((row: any) => row.qid === targetQid).length},
      srReps: sr[targetQid]?.reps || 0,
      ui: {feedbackVisible: !!feedback && feedback.getClientRects().length > 0 &&
          getComputedStyle(feedback).display !== 'none',
        nextAvailable: !!document.querySelector('#studyModePage [data-action="nextStudyQuestion"]'),
        enabledOptions: document.querySelectorAll('#studyOptions button:not(:disabled)').length,
        focusedId: document.activeElement?.id || null},
    };
  }, {targetQid, studyKey: STUDY, metadataKey: LAST_ACTIVITY});
  const {raw, ...rest} = value;
  return {...rest, rawSha256: raw === null ? null : createHash('sha256').update(raw).digest('hex')};
}

async function installActivityWriteFault(page: Page, refuseMetadata: boolean) {
  await page.evaluate(({refuseMetadata, studyKey, metadataKey}) => {
    const original = Storage.prototype.setItem;
    const trace = {metadataAttempts: 0, metadataFaults: 0, primaryWrites: 0, trackingWrites: 0};
    (window as any).__studyLastActivityIO = {original, trace};
    Storage.prototype.setItem = function(this: Storage, key: string, value: string) {
      if (this === localStorage && key === metadataKey) {
        trace.metadataAttempts++;
        if (refuseMetadata && trace.metadataFaults === 0) {
          trace.metadataFaults++;
          throw new DOMException('Technical refusal of last-study metadata only', 'QuotaExceededError');
        }
      }
      const result = original.call(this, key, value);
      if (this === localStorage && key === studyKey) trace.primaryWrites++;
      if (this === localStorage && key === 'nefroquest-detailed-stats') trace.trackingWrites++;
      return result;
    };
  }, {refuseMetadata, studyKey: STUDY, metadataKey: LAST_ACTIVITY});
}
async function restoreActivityWrite(page: Page) {
  return page.evaluate(() => {
    const probe = (window as any).__studyLastActivityIO;
    if (!probe) throw new Error('Last-study write probe missing');
    Storage.prototype.setItem = probe.original;
    return {restored: Storage.prototype.setItem === probe.original,
      trace: probe.trace as {metadataAttempts: number; metadataFaults: number;
        primaryWrites: number; trackingWrites: number}};
  });
}

for (const refuseMetadata of [false, true]) {
  test(`metadado ${refuseMetadata ? 'recusado' : 'gravado'} mantém correção e um único crédito após resposta e retomada`, async ({page}) => {
    const evidence = reports.get(page)!.evidence;
    evidence.refuseMetadata = refuseMetadata;
    let installed = false;
    try {
      await openStudyHub(page);
      await page.locator('[data-action="startFreeStudyMode"]').click();
      await expect(page.locator('#studyOptions button')).toHaveCount(4);
      await settleFrames(page);
      const target = await page.evaluate(() => ({
        qid: (0, eval)('_studyQuestionId(studyModeQuestions[studyModeIndex])') as string,
        correct: (0, eval)('_studyPresentations[studyModeIndex].a') as number,
      }));
      evidence.target = target;
      const before = await snapshot(page, target.qid);
      evidence.before = before;
      expect(before.authUser).toBeNull();
      expect(before.primary!.answers.filter((row: any) => row.answered)).toHaveLength(0);

      await installActivityWriteFault(page, refuseMetadata);
      installed = true;
      let restored: Awaited<ReturnType<typeof restoreActivityWrite>>;
      try {
        await page.locator('#studyOptions button').nth(target.correct).click();
      } finally {
        restored = await restoreActivityWrite(page);
        installed = false;
        evidence.io = restored;
      }
      await settleFrames(page);
      const afterClick = await snapshot(page, target.qid);
      evidence.afterClick = afterClick;

      // The real shortcut must not credit the answer again, whether focus has
      // reached feedback or remains on the option in a failing implementation.
      await page.keyboard.press(String(target.correct + 1));
      await settleFrames(page);
      const afterShortcut = await snapshot(page, target.qid);
      evidence.afterShortcut = afterShortcut;

      await page.getByRole('button', {name: 'Pausar e voltar', exact: true}).click();
      await page.reload({waitUntil: 'domcontentloaded'});
      // Guest survives reload: enter through the Atrium, without clicking a hidden portal.
      await openStudyHub(page);
      await page.getByRole('button', {name: 'Retomar estudo', exact: true}).click();
      await expect(page.locator('#studyOptions button')).toHaveCount(4);
      await settleFrames(page);
      const afterReload = await snapshot(page, target.qid);
      evidence.afterReload = afterReload;

      expect(restored!.restored).toBe(true);
      expect(restored!.trace.metadataAttempts).toBe(1);
      expect(restored!.trace.metadataFaults).toBe(refuseMetadata ? 1 : 0);
      expect(restored!.trace.primaryWrites).toBeGreaterThanOrEqual(1);
      expect(afterClick.primary!.correct + afterClick.primary!.wrong).toBe(1);
      expect(afterClick.primary!.answers.filter((row: any) => row.answered)).toHaveLength(1);
      expect(afterClick.runtime.answered).toBe(1);
      expect(afterShortcut.rawSha256).toBe(afterClick.rawSha256);
      expect(afterShortcut.tracking).toEqual(afterClick.tracking);
      expect(afterShortcut.srReps).toBe(afterClick.srReps);
      expect(afterReload.primary!.answers.filter((row: any) => row.answered)).toHaveLength(1);
      expect(afterReload.tracking).toEqual(afterClick.tracking);
      expect(afterReload.srReps).toBe(afterClick.srReps);
      expect(afterReload.authUser).toBeNull();

      expect(afterClick.ui.feedbackVisible, 'A resposta já salva precisa mostrar a correção').toBe(true);
      expect(afterClick.ui.nextAvailable).toBe(true);
      expect(afterClick.ui.enabledOptions).toBe(0);
      expect(afterClick.ui.focusedId).toBe('studyFeedback');
      expect(afterClick.tracking.totalQuestions - before.tracking.totalQuestions).toBe(1);
      expect(afterClick.tracking.totalCorrect - before.tracking.totalCorrect).toBe(1);
      expect(afterClick.tracking.targetHistory - before.tracking.targetHistory).toBe(1);
      expect(afterClick.srReps - before.srReps).toBe(1);
    } finally {
      if (installed) evidence.io = await restoreActivityWrite(page);
    }
  });
}
