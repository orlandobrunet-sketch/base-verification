import {test, expect, type Page} from '@playwright/test';
import {confirmCharacterStart} from '../helpers/cinema';

// Only saved records are seeded. The approved bank, catalog, native controllers and
// answer presentation run unchanged; no old identity is aliased to the new one.
const OLD = '6474ec20', NEW = 'b515e1c7', RELEASE = '17.26';
const MAIN = 'nefroquest-save-v7', PILOT = 'nefroquest-pilot-v1';
const KEYS = {exam: 'nefroquest-exam-state', study: 'nefroquest-study-state', offline: 'nefroquest-offline-study-state'};
const PROGRESS = ['nefroquest-stats', 'nefroquest-detailed-stats', 'nefroquest-sr-data',
  'nefroquest-mastered', 'nefroquest-mastered-ids', 'unlockedArticles', 'nq-unlocked-refs'];
type Mode = keyof typeof KEYS;
const audits = new WeakMap<Page, {errors: string[]; nonGET: string[]; sockets: number; guest: boolean; preparation?: unknown}>();

test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'reduce'}});
test.setTimeout(60000);
test.beforeEach(async ({page, context, baseURL}) => {
  const origin = new URL(baseURL || 'http://localhost:5500').origin;
  expect(['localhost', '127.0.0.1', 'nefroquest.com']).toContain(new URL(origin).hostname);
  const audit = {errors: [] as string[], nonGET: [] as string[], sockets: 0, guest: false};
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.routeWebSocket('**/*', socket => {audit.sockets++; socket.close();});
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') audit.nonGET.push(request.method() + ' ' + url.origin + url.pathname);
    if (request.method() === 'GET' && url.origin === origin && !['font', 'media'].includes(request.resourceType())) return route.continue();
    return route.abort();
  });
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await guest(page);
  // A missing approved record is a preparation failure, never a product RED.
  const preparation = await archive(page);
  expect(preparation.old.author.qid).toBe(OLD);
  expect(preparation.old.release).toBe(RELEASE);
  expect(preparation.oldDigest).toBe('sha256:c10a3764a028773d3b25e0bf3756d310670a17b38bf9a3fb94ba0186aaf9f51f');
  audits.get(page)!.preparation = {release: preparation.old.release, oldDigest: preparation.oldDigest,
    currentDigest: preparation.newDigest, bankCount: preparation.bankCount};
});
test.afterEach(async ({page}, info) => {
  await info.attach('objective-replacement-audit', {contentType: 'application/json',
    body: JSON.stringify({...audits.get(page), status: info.status, viewport: page.viewportSize()}, null, 2)});
  expect(audits.get(page)?.errors).toEqual([]);
  expect(audits.get(page)?.nonGET).toEqual([]);
  expect(audits.get(page)?.sockets).toBe(0);
  expect(audits.get(page)?.guest).toBe(true);
});

async function guest(page: Page) {
  await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function');
  const control = page.locator('[data-portal-route="guest"]:visible');
  if (await control.isVisible()) await control.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  if (await page.locator('#identityOverlay').isVisible())
    await page.locator('[data-action="_pickIdentity"][data-arg="combat"]').click();
  await page.evaluate(() => (window as any)._loadTopics());
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  audits.get(page)!.guest = true;
}
async function archive(page: Page): Promise<any> {
  return page.evaluate(({oldId, newId, release}) => {
    const w = window as any, catalog = w.questionRevisionCatalog;
    const old = w.NQQuestionRevisionHistory.find((row: any) => row.qid === oldId && row.release === release);
    if (!old || !catalog?.replacement) throw Error('PREPARATION: approved retirement archive/catalog not applied');
    const questions: any = {}, bindings: any = {}, replacements: any = {}, next: any = {};
    for (const profile of ['main', 'exam', 'study', 'offline']) {
      const question = w.NQAnswers.present(old.sources[profile], {preserveOrder: true});
      const inspected = catalog.inspect(question, {profile, binding: old.bindings[profile]});
      const replacement = catalog.replacement(oldId, profile);
      if (inspected.status !== 'known' || !inspected.value.historical || replacement?.binding.qid !== newId)
        throw Error('PREPARATION: approved identity transition unavailable: ' + profile);
      questions[profile] = question; bindings[profile] = inspected.value.binding; replacements[profile] = replacement;
      const other = w.questionBank.find((q: any) => q.id !== newId);
      const current = catalog.current(other.id, profile);
      next[profile] = {question: w.NQAnswers.present(current.source, {preserveOrder: true}), binding: current.binding};
    }
    return {old, questions, bindings, replacements, next, bankCount: w.questionBank.length,
      oldDigest: w.NQQuestionRevisions.digest(old.author), newDigest: w.NQQuestionRevisions.digest(replacements.main.author)};
  }, {oldId: OLD, newId: NEW, release: RELEASE});
}
async function progress(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), PROGRESS);
}
async function seedProgress(page: Page) {
  await page.evaluate(old => {
    localStorage.setItem('nefroquest-sr-data', JSON.stringify({[old]: {due: 4102444800000, stability: 12, difficulty: 5, reps: 3}}));
    localStorage.setItem('nefroquest-mastered', JSON.stringify([old]));
    localStorage.setItem('nefroquest-mastered-ids', JSON.stringify([old]));
  }, OLD);
}
async function mainState(page: Page): Promise<any> {
  return page.evaluate(() => JSON.parse((0, eval)(`JSON.stringify({current:state.current,answered:state.answered,
    xp:state.xp,gold:state.gold,lives:state.lives,score:state.score,correctTotal:state.correctTotal,
    classBenefits:state.classBenefits,characterLastAnswer:state.characterLastAnswer,
    journeyAnswerOrdinal:state.journeyAnswerOrdinal,revision:_currentQuestionRevision})`)));
}
async function begin(page: Page) {
  await page.locator('#welcomeScreen [data-action="startNewFromWelcome"]').click();
  await page.locator('.difficulty-card[data-diff-key="normal"]').click();
  await page.locator('#diffConfirmBtn').click();
  await page.locator('#charSelectModal [data-action="selectCharacter"][data-arg="nephros"]').click();
  await confirmCharacterStart(page);
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
}
async function resumeCampaign(page: Page, pilot = false) {
  await page.reload({waitUntil: 'domcontentloaded'}); await guest(page);
  await page.locator(pilot ? '#resumePilotBtn' : '#welcomeScreen [data-action="continueGame"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
}
async function seedCampaign(page: Page, answered: boolean, queue = false, pilot = false): Promise<any> {
  await begin(page);
  if (answered || queue) {
    const current = (await mainState(page)).current;
    await page.locator('#options .option').nth((current.a + 1) % current.o.length).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.answered === true);
  }
  const bundle = await archive(page);
  const seeded = await page.evaluate(({bundle, answered, queue, pilot, mainKey, pilotKey}) => {
    const w = window as any, save = JSON.parse(localStorage.getItem(mainKey)!);
    const primary = {canonical: localStorage.getItem(mainKey), legacy: localStorage.getItem('nefroquest-save')};
    if (!queue) {
      const q = bundle.questions.main, chosen = (q.a + 1) % q.o.length;
      const result = {questionId: q.id, choice: chosen, originalChoice: w.NQAnswers.originalIndex(q, chosen),
        optionId: w.NQAnswers.optionId(q, chosen), correct: false};
      save.questionPresentation = q; save.questionRevisionBinding = bundle.bindings.main;
      save.questionAnswer = answered ? result : null; save.currentQuestionId = q.id; save.answered = answered;
      save.characterLastAnswer = answered ? {...save.characterLastAnswer, ...result} : null;
      save.wrongAnswerSnapshots = answered ? [{questionPresentation: q, choice: chosen,
        originalChoice: result.originalChoice, optionId: result.optionId,
        eventId: save.characterLastAnswer.eventId || null, questionRevisionBinding: bundle.bindings.main}] : [];
    } else {
      const next = w.questionBank.find((q: any) => q.id !== save.currentQuestionId && q.id !== 'b515e1c7');
      save.queueIds = ['6474ec20', save.currentQuestionId, '6474ec20', next.id]; save.idx = 2;
      save.recentIds = [save.currentQuestionId];
    }
    let raw: string;
    if (pilot) {
      const journeyId = crypto.randomUUID();
      const ledger = {version: 1, journeyId, lockedClass: save.character, ruleset: 'class-boons-v1',
        windowAnswers: 0, seenQids: [], creditedEvents: [], xpGranted: 0, goldGranted: 0, shieldSpent: false};
      save.schemaVersion = 8; save.journeyDomain = 'pilot'; save.classBenefits = ledger;
      save.journeyAnswerOrdinal = 0; save.pilotLastAnswer = null; save.characterLastAnswer = null;
      const record = {schemaVersion: 8, domain: 'pilot', ruleset: 'class-boons-v1', journeyId, owner: null,
        revision: 1, save, classBenefits: ledger, progress: {}, createdAt: Date.now(), updatedAt: Date.now()};
      raw = JSON.stringify(record); localStorage.setItem(pilotKey, raw);
      if (!w.NQPilot.peek(null).resumable) throw Error('PREPARATION: invalid pilot envelope');
    } else {
      if (!(0, eval)('_normalCharacterSaveValid')(save) || !(0, eval)('_readQuestionSaveExtras')(save))
        throw Error('PREPARATION: invalid campaign save');
      raw = JSON.stringify(save); localStorage.setItem(mainKey, raw); localStorage.setItem('nefroquest-save', raw);
    }
    return {raw, save, primary};
  }, {bundle, answered, queue, pilot, mainKey: MAIN, pilotKey: PILOT});
  await seedProgress(page); await resumeCampaign(page, pilot);
  return {...seeded, bundle};
}
async function resumeAux(page: Page, mode: Mode, reload = false) {
  if (mode === 'offline') {
    await page.goto('/offline.html', {waitUntil: 'domcontentloaded'});
    await expect(page.locator('.nq-off-btn')).toHaveCount(4); return;
  }
  if (reload) {await page.reload({waitUntil: 'domcontentloaded'}); await guest(page);}
  if (mode === 'exam') {
    await page.locator('[data-atrium-route="modes"]').click();
    await page.locator('[data-mode-route="exam"]:visible').click();
    await page.getByRole('button', {name: 'Retomar prova', exact: true}).click();
    await expect(page.locator('#examQuestaoTitulo')).toBeVisible();
  } else {
    await page.evaluate(() => (window as any).showAxesSelector());
    await page.locator('.study-mode-popup [data-action="startStudyMode"]').click();
    await page.getByRole('button', {name: 'Retomar estudo', exact: true}).click();
    await expect(page.locator('#studyOptions button')).toHaveCount(4);
  }
}
async function seedAux(page: Page, mode: Mode, answered: boolean, future = false): Promise<any> {
  const bundle = await archive(page), key = KEYS[mode];
  const seeded = await page.evaluate(({bundle, mode, answered, future, key}) => {
    const w = window as any, old = bundle.questions[mode], head = future ? bundle.next[mode].question : old;
    const headBinding = future ? bundle.next[mode].binding : bundle.bindings[mode];
    const chosen = (head.a + 1) % head.o.length;
    const answer = answered || future ? {chosen, correct: false,
      authoredChoice: w.NQAnswers.originalIndex(head, chosen), optionId: w.NQAnswers.optionId(head, chosen)} : null;
    const questions = future ? [head, old] : [old], bindings = future ? [headBinding, bundle.bindings[mode]] : [headBinding];
    const saved = mode === 'exam' ? {questions, idx: 0,
      answers: answer ? [{...answer, qId: head.id, cat: head.c || 'geral', answered: true}] : [],
      questionRevisionBindings: bindings, startTime: Date.now() - 1000, savedAt: Date.now()}
      : mode === 'study' ? {questions: questions.map(q => q.id), index: 0, correct: 7, wrong: 3, axisStats: {},
        savedAt: Date.now(), presentationVersion: 1, presentations: questions.map((q, i) => ({id: q.id,
          question: q, answer: i === 0 ? answer : null, revisionBinding: bindings[i]}))}
      : {version: 1, questionIds: questions.map(q => q.id), index: 0, correctCount: 7,
        question: head, answer, revisionBinding: headBinding};
    const raw = JSON.stringify(saved); localStorage.setItem(key, raw); return {raw, saved};
  }, {bundle, mode, answered, future, key});
  await seedProgress(page); await resumeAux(page, mode);
  return {...seeded, bundle, key};
}
const optionSelector = {exam: '#examOpts button', study: '#studyOptions button', offline: '.nq-off-btn'};
const titleSelector = {exam: '.nq-exam-enunciado', study: '#studyQuestionArea .nq-study-question-title', offline: '.nq-off-question'};
const confirmSelector = {exam: '[data-action="_examUseCurrentRevision"]', study: '[data-action="useCurrentStudyRevision"]', offline: '[onclick="useCurrentOfflineRevision()"]'};
async function auxState(page: Page, mode: Mode): Promise<any> {
  return page.evaluate(mode => JSON.parse((0, eval)(mode === 'exam'
    ? 'JSON.stringify({question:_examState.questions[_examState.idx],answer:_examState.answers[_examState.idx],revision:_examState.revisionViews[_examState.idx]})'
    : mode === 'study' ? 'JSON.stringify({question:_studyPresentations[studyModeIndex],answer:_studyAnswers[studyModeIndex],revision:_studyRevisions[studyModeIndex],correct:studyModeCorrect,wrong:studyModeWrong})'
      : 'JSON.stringify({question:currentPresentation,answer:offlineAnswer,revision:offlineRevision,correct:correctCount})')), mode);
}
async function assertPending(page: Page, mode: Mode, seeded: any, expectedRaw?: string) {
  const before = await progress(page), raw = expectedRaw || seeded.raw;
  const prior = await auxState(page, mode);
  expect(prior.question.id).toBe(OLD); expect(prior.answer).toBeFalsy();
  expect(prior.revision.references).toEqual(seeded.bundle.old.references);
  await expect(page.locator(optionSelector[mode] + ':enabled')).toHaveCount(0);
  const control = page.locator(confirmSelector[mode]); await expect(control).toContainText('nova questão');
  expect(await page.evaluate(key => localStorage.getItem(key), seeded.key)).toBe(raw);
  await control.click();
  await expect(page.locator(titleSelector[mode])).toHaveText(seeded.bundle.replacements[mode].author.q);
  const after = await auxState(page, mode);
  expect(after.question.id).toBe(NEW); expect(after.answer).toBeFalsy();
  expect(after.revision.binding).toEqual(seeded.bundle.replacements[mode].binding);
  // Offline intentionally loads no current card registry. Its binding still
  // pins the reviewed record; historical cards were authenticated above.
  expect(after.revision.references).toEqual(mode === 'offline' ? undefined : seeded.bundle.replacements[mode].references);
  expect(after.revision.historical).toBe(false);
  expect(await progress(page)).toEqual(before);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), seeded.key);
  // Exam has already committed a native cursor advance before a queued item is
  // reached; its backup is the exact record being replaced, not the earlier cursor.
  expect(mode === 'exam' ? saved.questionRevisionOriginalRaw : saved.revisionOriginRaw).toBe(mode === 'exam' ? raw : seeded.raw);
  if (mode === 'exam') {
    expect(saved.questionRevisionOrigins.find((origin: any) => origin.index === saved.idx)).toMatchObject({question: seeded.bundle.questions.exam, binding: seeded.bundle.bindings.exam});
  } else if (mode === 'study') {expect(saved.correct).toBe(7); expect(saved.wrong).toBe(3);}
  else expect(saved.correctCount).toBe(7);
  await resumeAux(page, mode, true);
  expect((await auxState(page, mode)).question.id).toBe(NEW);
  expect(await progress(page)).toEqual(before);
}

test('fresh bank keeps 723 current identities and independently authenticates the retired 17.26 record in all four profiles', async ({page}) => {
  const report = await page.evaluate(({oldId, newId}) => {
    const w = window as any, c = w.questionRevisionCatalog;
    return {count: w.questionBank.length, oldInBank: w.questionBank.some((q: any) => q.id === oldId),
      newInBank: w.questionBank.some((q: any) => q.id === newId),
      rows: ['main', 'exam', 'study', 'offline'].map(profile => ({profile, oldCurrent: c.current(oldId, profile),
        retired: c.retired(oldId, profile), replacement: c.replacement(oldId, profile), current: c.current(newId, profile)}))};
  }, {oldId: OLD, newId: NEW});
  expect(report).toMatchObject({count: 723, oldInBank: false, newInBank: true});
  for (const row of report.rows) {
    expect(row.oldCurrent).toBeNull(); expect(row.retired.release).toBe(RELEASE);
    expect(row.retired.binding.qid).toBe(OLD); expect(row.retired.historical).toBe(true);
    expect(row.replacement).toEqual(row.current); expect(row.current.binding.qid).toBe(NEW);
  }
});

test('campaign answered retirement preserves grade, complete old references and FSRS while the new question is consultation only', async ({page}) => {
  const seeded = await seedCampaign(page, true), before = await progress(page), state = await mainState(page);
  expect(state.current).toEqual(seeded.bundle.questions.main); expect(state.answered).toBe(true);
  expect(state.characterLastAnswer.correct).toBe(false); expect(state.revision.references).toEqual(seeded.bundle.old.references);
  await expect(page.locator('#feedback')).toContainText(seeded.bundle.old.author.exp);
  await page.locator('#campaignQuestionRevisionNotice summary').click();
  await expect(page.locator('#campaignQuestionRevisionNotice details')).toContainText(seeded.bundle.replacements.main.author.q);
  const ref = page.locator('#refs [data-action="openRefResumo"]').first(); await ref.click();
  const oldCard: any = Object.values(seeded.bundle.old.references).find(Boolean);
  await expect(page.locator('.bib-resumo-modal .nqreader-resumo p')).toHaveText(oldCard.resumo);
  await page.keyboard.press('Escape');
  expect(await mainState(page)).toEqual(state); expect(await progress(page)).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), MAIN)).toBe(seeded.raw);
});

for (const pilot of [false, true]) test(`${pilot ? 'pilot' : 'campaign'} pending retirement changes identity only after explicit choice and preserves original bytes and benefits`, async ({page}) => {
  const seeded = await seedCampaign(page, false, false, pilot), before = await progress(page), state = await mainState(page);
  await expect(page.locator('#options .option:enabled')).toHaveCount(0);
  const control = page.locator('[data-action="useCurrentCampaignQuestionRevision"]');
  await expect(control).toHaveText('Responder nova questão'); await control.click();
  await expect(page.locator('#question')).toHaveText(seeded.bundle.replacements.main.author.q);
  const next = await mainState(page);
  expect(next.current.id).toBe(NEW); expect(next.revision.binding).toEqual(seeded.bundle.replacements.main.binding);
  for (const key of ['xp', 'gold', 'lives', 'score', 'correctTotal', 'classBenefits', 'journeyAnswerOrdinal']) expect(next[key]).toEqual(state[key]);
  expect(next.answered).toBe(false); expect(await progress(page)).toEqual(before);
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), pilot ? PILOT : MAIN);
  const save = pilot ? stored.save : stored;
  expect(save.questionRevisionOriginRaw).toBe(seeded.raw); expect(save.questionPresentation.id).toBe(NEW);
  expect(save.questionRevisionBinding).toEqual(seeded.bundle.replacements.main.binding);
  expect(save.questionAnswer).toBeNull();
  if (pilot) {
    expect(stored.classBenefits).toEqual(seeded.save.classBenefits);
    expect(stored.progress).toEqual({});
    expect(await page.evaluate(key => ({canonical: localStorage.getItem(key), legacy: localStorage.getItem('nefroquest-save')}), MAIN)).toEqual(seeded.primary);
  }
  await resumeCampaign(page, pilot); expect((await mainState(page)).current.id).toBe(NEW);
  expect(await progress(page)).toEqual(before);
});

test('campaign future retired queue entries do not skip the next live identity or silently enqueue the replacement', async ({page}) => {
  const seeded = await seedCampaign(page, false, true), before = await progress(page);
  const queue = await page.evaluate(() => (0, eval)('({ids:state.queue.map(q=>q.id),idx:state.idx,current:state.current.id})'));
  expect(queue.ids).toEqual(seeded.save.queueIds.filter((id: string) => id !== OLD));
  expect(queue.idx).toBe(1);
  expect(queue.ids.filter((id: string) => id === NEW)).toHaveLength(seeded.save.queueIds.filter((id: string) => id === NEW).length);
  await page.locator('#nextBtn').click();
  await expect(page.locator('#options .option:enabled')).toHaveCount(4);
  expect((await mainState(page)).current.id).toBe(seeded.save.queueIds[3]);
  expect(await progress(page)).toEqual(before);
});

for (const mode of ['exam', 'study', 'offline'] as const) {
  test(`${mode} answered retirement preserves the old grade, full reference object and FSRS through new-question consultation and reload`, async ({page}) => {
    const seeded = await seedAux(page, mode, true), before = await progress(page), state = await auxState(page, mode);
    expect(state.question).toEqual(seeded.bundle.questions[mode]); expect(state.answer.correct).toBe(false);
    expect(state.revision.references).toEqual(seeded.bundle.old.references); expect(state.revision.release).toBe(RELEASE);
    if (mode === 'exam') {
      await page.getByRole('button', {name: 'Ver resultado', exact: true}).click();
      await expect(page.locator('#examResultado')).toContainText('0%');
      await expect(page.locator('#examResultado')).toContainText(seeded.bundle.old.author.exp);
      await page.locator('[data-question-revision="historical"] summary').click();
      await expect(page.locator('[data-question-revision="historical"] details')).toContainText(seeded.bundle.replacements.exam.author.q);
    } else {
      await expect(page.locator(mode === 'study' ? '#studyFeedback' : '.nq-off-feedback')).toContainText(seeded.bundle.old.author.exp);
      if (mode === 'study') await page.locator('[data-action="viewCurrentStudyRevision"]').click();
      else await page.getByRole('button', {name: 'Consultar nova questão', exact: true}).click();
      await expect(page.locator(mode === 'study' ? '#studyCurrentRevision' : '#nqOffCurrentRevision')).toContainText(seeded.bundle.replacements[mode].author.q);
    }
    expect(await progress(page)).toEqual(before);
    expect(await page.evaluate(key => localStorage.getItem(key), seeded.key)).toBe(seeded.raw);
    await resumeAux(page, mode, true);
    expect(await auxState(page, mode)).toEqual(state); expect(await progress(page)).toEqual(before);
    expect(await page.evaluate(key => localStorage.getItem(key), seeded.key)).toBe(seeded.raw);
  });
  test(`${mode} pending retirement requires a new-question choice and preserves old raw, progress and separate bindings after reload`, async ({page}) => {
    const seeded = await seedAux(page, mode, false); await assertPending(page, mode, seeded);
  });
  test(`${mode} a future queued retired identity remains resumable and requires its own explicit replacement choice`, async ({page}) => {
    const seeded = await seedAux(page, mode, false, true), before = await progress(page);
    if (mode === 'offline') await page.getByRole('button', {name: 'Próxima Questão', exact: true}).click();
    else await page.locator(mode === 'exam' ? '[data-action="_examNext"]' : '[data-action="nextStudyQuestion"]').click();
    await expect(page.locator(titleSelector[mode])).toHaveText(seeded.bundle.old.author.q);
    expect((await auxState(page, mode)).question.id).toBe(OLD); expect(await progress(page)).toEqual(before);
    const raw = await page.evaluate(key => localStorage.getItem(key)!, seeded.key);
    await assertPending(page, mode, seeded, raw);
  });
}
