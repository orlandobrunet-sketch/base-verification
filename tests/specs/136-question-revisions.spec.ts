import { test, expect, type Page, type TestInfo } from '@playwright/test';

// Published archive and separate technical fixtures. Product scripts run intact in Chromium.
const CAMPAIGN = 'nefroquest-save-v7', EXAM = 'nefroquest-exam-state';
const STUDY = 'nefroquest-study-state', OFFLINE = 'nefroquest-offline-study-state';
const progressKeys = ['nefroquest-stats', 'nefroquest-detailed-stats', 'nefroquest-sr-data',
  'nefroquest-mastered', 'nefroquest-mastered-ids', 'unlockedArticles', 'nq-unlocked-refs'];
const runtimeErrors = new WeakMap<Page, string[]>();
const blockedRequests = new WeakMap<Page, { method: string; origin: string; path: string }[]>();
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1 });
test.setTimeout(90000);
test.beforeEach(async ({ page, context }, info) => {
  await page.setViewportSize(info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 800 });
  const errors: string[] = []; runtimeErrors.set(page, errors); page.on('pageerror', error => errors.push(error.message));
  const blocked: { method: string; origin: string; path: string }[] = []; blockedRequests.set(page, blocked);
  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (['localhost', '127.0.0.1'].includes(url.hostname) && request.method() === 'GET') return route.continue();
    blocked.push({ method: request.method(), origin: url.origin, path: url.pathname });
    return route.abort();
  });
  await page.addInitScript(() => {
    localStorage.setItem('pwa-dismissed', '1');
    Object.defineProperty(crypto, 'getRandomValues', { configurable: true,
      value: (values: Uint32Array) => { values.fill(0); return values; } });
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any)._loadTopics === 'function');
  await guest(page);
  await page.evaluate(() => (window as any)._loadTopics());
});
test.afterEach(async ({ page }, info) => {
  await info.attach('question-revision-runtime', { contentType: 'application/json', body: JSON.stringify({
    browserVersion: page.context().browser()?.version(), viewport: page.viewportSize(),
    errors: runtimeErrors.get(page), blockedRequests: blockedRequests.get(page), url: page.url(), title: info.title, status: info.status,
    storageWrites: await page.evaluate(() => (window as any).__revisionStorageWrites || null)
  }, null, 2) });
  if (info.status === info.expectedStatus) expect(runtimeErrors.get(page)).toEqual([]);
});

async function guest(page: Page) {
  await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function');
  const control = page.locator('#landingScreen [data-action="playAsGuest"]:visible').first();
  if (await control.isVisible()) await control.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  if (await page.locator('#identityOverlay').isVisible())
    await page.locator('[data-action="_pickIdentity"][data-arg="combat"]').click();
}
async function begin(page: Page) {
  await page.locator('#welcomeScreen [data-action="startNewFromWelcome"]').click();
  await page.locator('.difficulty-card[data-diff-key="normal"]').click();
  await page.locator('#diffConfirmBtn').click();
  await page.locator('#charSelectModal [data-action="selectCharacter"][data-arg="nephros"]').click();
  await page.locator('#charIntroOverlay [data-action="closeIntroAndStart"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
}
async function bytes(page: Page, key: string) {
  return page.evaluate(({ key, keys }) => ({ raw: localStorage.getItem(key),
    progress: Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])) }), { key, keys: progressKeys });
}
function installStorageWriteProbe(keys: string[]) {
  const w = window as any, set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
  w.__revisionStorageWrites = [];
  Storage.prototype.setItem = function (key, value) {
    if (this === localStorage && keys.includes(key)) w.__revisionStorageWrites.push({ action: 'set', key, value });
    return set.call(this, key, value);
  };
  Storage.prototype.removeItem = function (key) {
    if (this === localStorage && keys.includes(key)) w.__revisionStorageWrites.push({ action: 'remove', key });
    return remove.call(this, key);
  };
}
async function watchReadOnlyStorage(page: Page, key: string) {
  const keys = [key, ...progressKeys, ...(key === CAMPAIGN ? ['nefroquest-save'] : [])];
  await page.addInitScript(installStorageWriteProbe, keys);
  await page.evaluate(installStorageWriteProbe, keys);
}
async function assertZeroStorageWrites(page: Page) {
  expect(await page.evaluate(() => (window as any).__revisionStorageWrites)).toEqual([]);
}
async function observed(page: Page): Promise<any> {
  return page.evaluate(() => JSON.parse((0, eval)(`JSON.stringify({current:state.current,answered:state.answered,
    xp:state.xp,gold:state.gold,lives:state.lives,score:state.score,correctTotal:state.correctTotal,
    classBenefits:state.classBenefits,characterLastAnswer:state.characterLastAnswer,
    journeyAnswerOrdinal:state.journeyAnswerOrdinal,forjaPending:state.forjaPending,errors:_sessionWrongAnswers})`)));
}
function installFixtureRuntime(bundle: any) {
  const w = window as any;
  let loaded = w.NQQuestionRevisions;
  const build = () => {
    if (!loaded || !w.NQAnswers) return;
    w.questionRevisionCatalog = loaded.createCatalog({ manifest: bundle.manifest, history: bundle.history,
      authors: [bundle.currentAuthor], sources: bundle.sources, references: bundle.currentRefs });
  };
  // These are published fixture inputs, built independently of any saved snapshot.
  Object.defineProperty(w, 'NQQuestionRevisionManifest', { configurable: true, get: () => bundle.manifest, set() {} });
  Object.defineProperty(w, 'NQQuestionRevisionHistory', { configurable: true, get: () => bundle.history, set() {} });
  Object.defineProperty(w, 'NQQuestionRevisions', { configurable: true, get: () => loaded, set: value => { loaded = value; build(); } });
  w.__revisionFixture = bundle; build();
  addEventListener('DOMContentLoaded', () => {
    if (location.pathname.endsWith('/offline.html') || location.pathname === '/offline') (0, eval)('offlineCatalog = window.questionRevisionCatalog');
  }, { once: true });
}
async function fixture(page: Page, qid?: string): Promise<any> {
  const bundle = await page.evaluate(id => {
    const w = window as any, api = w.NQQuestionRevisions;
    const qid = id || w.questionBank[0].id, ref = 'technical-revision-card';
    const oldAuthor = { qid, t: 'Fixture técnica de revisão', q: 'Questão técnica anterior: selecione o marcador antigo.',
      opts: ['Marcador antigo correto', 'Distrator antigo um', 'Distrator antigo dois', 'Distrator antigo três'],
      ans: 0, exp: 'Explicação técnica anterior, pertencente ao registro histórico.', cat: 'geral', diff: 'medium', refs: [ref] };
    const currentAuthor = { ...oldAuthor, q: 'Questão técnica atual: selecione o marcador atualizado.',
      opts: ['Distrator atual zero', 'Marcador atual correto', 'Distrator atual dois', 'Distrator atual três'], ans: 1,
      exp: 'Explicação técnica atual, separada da avaliação histórica.' };
    const card = (label: string, text: string) => ({ label, journal: 'Registro técnico sintético', ano: '2026', badge: 'REF',
      resumo: text, conclusao: text, curiosidade: '', impacto: '', icon: '•' });
    const oldRefs = { [ref]: card('Card técnico anterior', 'Resumo técnico anterior preservado.') };
    const currentRefs = { [ref]: card('Card técnico atual', 'Resumo técnico atual separado.') };
    const profiles = (author: any) => {
      const plain = { id: qid, q: author.q, o: [...author.opts], a: author.ans, e: author.exp };
      return { main: { ...plain, d: 4, _d: 'medium', c: 'geral', r: [ref] },
        exam: { ...plain, d: 4, _d: 'medium', c: 'geral', r: [ref] },
        study: { ...plain, refs: [ref] }, offline: plain };
    };
    const sourcesByProfile = profiles(currentAuthor), oldSources = profiles(oldAuthor);
    const authorRevision = api.digest(currentAuthor), referenceRevisions = { [ref]: api.digest(currentRefs[ref]) };
    const manifest = { version: 1, release: 'technical-current', current: { [qid]: { authorRevision, referenceRevisions,
      recordRevision: api.digest({ authorRevision, referenceRevisions }),
      sourceRevisions: Object.fromEntries(Object.entries(sourcesByProfile).map(([profile, source]) => [profile, api.digest(source)])) } } };
    const history = [{ qid, author: oldAuthor, sources: oldSources, references: oldRefs, release: 'technical-earlier',
      policy: { material: true, pending: 'update-required' } }];
    const sources = Object.fromEntries(Object.entries(sourcesByProfile).map(([profile, source]) => [profile, [source]]));
    const catalog = api.createCatalog({ manifest, history, authors: [currentAuthor], sources, references: currentRefs });
    const oldQuestions = Object.fromEntries(Object.entries(oldSources).map(([profile, source]) => [profile, w.NQAnswers.present(source, { random: () => 0 })]));
    const oldBindings = Object.fromEntries(Object.entries(oldQuestions).map(([profile, question]) => [profile, catalog.inspect(question, { profile }).value.binding]));
    return { qid, ref, currentAuthor, oldAuthor, currentRefs, oldRefs, sources, manifest, history, oldQuestions, oldBindings };
  }, qid);
  await page.addInitScript(installFixtureRuntime, bundle);
  await page.evaluate(installFixtureRuntime, bundle);
  // The offline page must load the same independently authored current source
  // as its real manifest/history, including before DOMContentLoaded fires.
  await page.route('**/data/topics.js*', route => {
    const referer = route.request().headers()['referer'];
    if (!referer || !['/offline.html', '/offline'].includes(new URL(referer).pathname)) return route.fallback();
    return route.fulfill({ status: 200, contentType: 'application/javascript',
      body: `const topics = ${JSON.stringify([bundle.currentAuthor])};` });
  });
  return bundle;
}
async function reloadCampaign(page: Page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  const diagnostics = await page.evaluate(() => {
    const w = window as any, raw = localStorage.getItem('nefroquest-save-v7'), save = raw && JSON.parse(raw);
    const call = (name: string) => { try { return (0, eval)(name)(save); } catch (error) { return String(error); } };
    return { raw, revisionRequired: w.NQ_REQUIRES_QUESTION_REVISIONS, catalogPresent: !!w.questionRevisionCatalog,
      manifestQids: Object.keys(w.NQQuestionRevisionManifest?.current || {}), recovery: document.getElementById('nqSaveRecovery')?.textContent,
      normalValid: call('_normalCharacterSaveValid'), benefitsValid: call('_normalBenefitsValid'), extras: call('_readQuestionSaveExtras') };
  });
  await test.info().attach('campaign-reload-diagnostics', { contentType: 'application/json', body: JSON.stringify(diagnostics) });
  await expect(page.locator('#nqSaveRecovery')).toBeHidden({ timeout: 1000 });
  await guest(page);
  await page.locator('#welcomeScreen [data-action="continueGame"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
}
async function publishedArchive(page: Page): Promise<any> {
  return page.evaluate(() => {
    const w = window as any, archive = w.NQQuestionRevisionHistory.find((row: any) => row.qid === '7c0daeca');
    if (!archive) throw new Error('The approved published archive is required for this test.');
    const oldQuestions: any = {}, oldBindings: any = {};
    for (const profile of ['main', 'exam', 'study', 'offline']) {
      const question = w.NQAnswers.present(archive.sources[profile], { random: () => 0 });
      const inspected = w.questionRevisionCatalog.inspect(question, { profile });
      if (inspected.status !== 'known' || !inspected.value.historical)
        throw new Error('The actual published historical source was not recognized: ' + profile);
      oldQuestions[profile] = question; oldBindings[profile] = inspected.value.binding;
    }
    const current = w.questionRevisionCatalog.current(archive.qid, 'main');
    return { qid: archive.qid, oldAuthor: archive.author, currentAuthor: current.author,
      oldRefs: archive.references, currentRefs: current.references, oldQuestions, oldBindings,
      chosen: (oldQuestions.main.a + 1) % oldQuestions.main.o.length, published: true };
  });
}
async function seedCampaign(page: Page, answered: boolean, published = false): Promise<any> {
  await begin(page);
  if (answered) {
    const actual = await observed(page);
    await page.locator('#options .option').nth((actual.current.a + 1) % actual.current.o.length).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.answered === true);
  }
  const actual = await observed(page), bundle = published ? await publishedArchive(page) : await fixture(page, actual.current.id);
  const raw = await page.evaluate(({ bundle, answered }) => {
    const w = window as any, save = JSON.parse(localStorage.getItem('nefroquest-save-v7')!);
    const q = bundle.oldQuestions.main, chosen = bundle.chosen ?? 0;
    const result = { questionId: q.id, choice: chosen, originalChoice: w.NQAnswers.originalIndex(q, chosen),
      optionId: w.NQAnswers.optionId(q, chosen), correct: chosen === q.a };
    save.questionPresentation = q; save.questionRevisionBinding = bundle.oldBindings.main;
    save.questionAnswer = answered ? result : null; save.currentQuestionId = q.id; save.answered = answered;
    save.characterLastAnswer = answered ? { ...save.characterLastAnswer, ...result } : null;
    save.wrongAnswerSnapshots = answered ? [{ questionPresentation: q, choice: chosen, originalChoice: result.originalChoice,
      optionId: result.optionId, eventId: save.characterLastAnswer.eventId || 'technical-old-answer', questionRevisionBinding: bundle.oldBindings.main }] : [];
    const raw = JSON.stringify(save); localStorage.setItem('nefroquest-save-v7', raw);
    localStorage.setItem('nefroquest-save', raw); return raw;
  }, { bundle, answered });
  const validity = await page.evaluate(raw => {
    const save = JSON.parse(raw);
    return { normal: (0, eval)('_normalCharacterSaveValid')(save), benefits: (0, eval)('_normalBenefitsValid')(save),
      extras: (0, eval)('_readQuestionSaveExtras')(save) };
  }, raw);
  await test.info().attach('campaign-seed-validity', { contentType: 'application/json', body: JSON.stringify(validity) });
  expect(validity.normal).toBe(true);
  if (answered) await watchReadOnlyStorage(page, CAMPAIGN);
  await reloadCampaign(page);
  return { bundle, raw };
}
async function seedAuxiliary(page: Page, profile: 'exam' | 'study' | 'offline', answered: boolean, published = false): Promise<any> {
  const bundle = published ? await publishedArchive(page) : await fixture(page), key = { exam: EXAM, study: STUDY, offline: OFFLINE }[profile];
  const raw = await page.evaluate(({ bundle, profile, answered, key }) => {
    const w = window as any, q = bundle.oldQuestions[profile], chosen = bundle.published ? (q.a + 1) % q.o.length : 0;
    const answer = answered ? { chosen, correct: chosen === q.a, authoredChoice: w.NQAnswers.originalIndex(q, chosen), optionId: w.NQAnswers.optionId(q, chosen) } : null;
    const saved = profile === 'exam' ? { questions: [q], idx: 0, answers: answer ? [{ ...answer, qId: q.id, cat: 'geral', answered: true }] : [],
      questionRevisionBindings: [bundle.oldBindings.exam], startTime: Date.now() - 1000, savedAt: Date.now() }
      : profile === 'study' ? { questions: [q.id], index: 0, correct: 7, wrong: 3, axisStats: {}, savedAt: Date.now(),
        presentationVersion: 1, presentations: [{ id: q.id, question: q, answer, revisionBinding: bundle.oldBindings.study }] }
      : { version: 1, questionIds: [q.id], index: 0, correctCount: 7, question: q, answer, revisionBinding: bundle.oldBindings.offline };
    const raw = JSON.stringify(saved); localStorage.setItem(key, raw); return raw;
  }, { bundle, profile, answered, key });
  if (answered) await watchReadOnlyStorage(page, key);
  await resumeAuxiliary(page, profile);
  return { bundle, raw, key };
}
async function resumeAuxiliary(page: Page, profile: 'exam' | 'study' | 'offline', reload = false) {
  if (profile === 'offline') {
    await page.goto('/offline.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nq-off-btn')).toHaveCount(4); return;
  }
  if (reload) { await page.reload({ waitUntil: 'domcontentloaded' }); await guest(page); await page.evaluate(() => (window as any)._loadTopics()); }
  if (profile === 'exam') {
    await page.evaluate(() => (window as any).startExamMode());
    await page.getByRole('button', { name: 'Retomar prova', exact: true }).click();
    await expect(page.locator('#examQuestaoTitulo')).toBeVisible();
  } else {
    await page.evaluate(() => (window as any).showAxesSelector());
    await page.locator('.study-mode-popup [data-action="startStudyMode"]').click();
    await page.getByRole('button', { name: 'Retomar estudo', exact: true }).click();
    await expect(page.locator('#studyOptions button')).toHaveCount(4);
  }
}
async function capture(page: Page, info: TestInfo, name: string, selector: string) {
  const target = page.locator(selector).first(); await expect(target).toBeVisible();
  await target.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const file = info.outputPath(`${info.project.name}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await info.attach(name, { path: file, contentType: 'image/png' });
}
async function fault(page: Page, key: string, mode: string) {
  await page.evaluate(({ key, mode }) => {
    const set = Storage.prototype.setItem, get = Storage.prototype.getItem;
    let pending = false, used = false;
    Storage.prototype.setItem = function (k, value) {
      if (this === localStorage && k === key && !used) {
        if (mode === 'refuse') throw new DOMException('Technical refusal', 'QuotaExceededError');
        if (mode === 'competing') { used = true; return set.call(this, k, 'technical-competing-bytes'); }
        set.call(this, k, value); pending = true; return;
      }
      return set.call(this, k, value);
    };
    Storage.prototype.getItem = function (k) {
      if (this === localStorage && k === key && pending) { pending = false; used = true; throw new Error('Technical readback failure once'); }
      return get.call(this, k);
    };
  }, { key, mode });
}

test('actual full 741 catalog loads all four current runtime profiles from the published manifest', async ({ page }, info) => {
  const report = await page.evaluate(() => {
    const w = window as any, bank = w.questionBank;
    return { count: bank.length, manifestCount: Object.keys(w.NQQuestionRevisionManifest.current).length,
      release: w.NQQuestionRevisionManifest.release,
      all: bank.every((q: any) => ['main', 'exam', 'study', 'offline'].every(profile => {
        const current = w.questionRevisionCatalog.current(q.id, profile);
        return current && w.questionRevisionCatalog.inspect(w.NQAnswers.present(current.source), { profile, binding: current.binding }).status === 'known';
      })) };
  });
  expect(report).toMatchObject({ count: 741, manifestCount: 741, release: '16.13', all: true });
  await info.attach('actual-741-catalog', { contentType: 'application/json', body: JSON.stringify(report) });
});

test('actual published archive retains ten questions and all forty prior runtime bindings and cards', async ({ page }, info) => {
  const report = await page.evaluate(() => {
    const w = window as any, api = w.NQQuestionRevisions, archive = w.NQQuestionRevisionHistory;
    const rows = archive.flatMap((row: any) => ['main', 'exam', 'study', 'offline'].map(profile => {
      const question = w.NQAnswers.present(row.sources[profile], { random: () => 0 });
      const authorRevision = api.digest(row.author);
      const referenceRevisions = Object.fromEntries(Object.entries(row.references).map(([id, card]) => [id, card === null ? null : api.digest(card)]));
      const binding = { version: 1, qid: row.qid, profile, recordRevision: api.digest({ authorRevision, referenceRevisions }) };
      const checked = w.questionRevisionCatalog.inspect(question, { profile, binding });
      const current = w.questionRevisionCatalog.current(row.qid, profile);
      return { qid: row.qid, profile, status: checked.status, historical: checked.value?.historical,
        release: checked.value?.release, sourceExact: api.digest(checked.value?.source) === api.digest(row.sources[profile]),
        authorExact: api.digest(checked.value?.author) === authorRevision,
        cardsExact: api.digest(checked.value?.references) === api.digest(row.references),
        bindingExact: api.digest(checked.value?.binding) === api.digest(binding),
        currentSeparate: current.binding.recordRevision !== binding.recordRevision,
        legacyStatus: w.questionRevisionCatalog.inspectLegacy(row.qid, { profile }).status,
        policy: checked.value?.policy };
    }));
    return { archiveCount: archive.length, referenceCount: Object.keys((0, eval)('refsDB')).length,
      qids: archive.map((row: any) => row.qid).sort(), rows };
  });
  expect(report.archiveCount).toBe(10); expect(report.referenceCount).toBe(350);
  expect(report.qids).toEqual(['c952567a', '547a3dc2', '051a5d1b', '86949ab7', '7780350a',
    '7c0daeca', '00b4d27e', '04cb2429', 'ca6370dc', '1b8baaac'].sort());
  expect(report.rows).toHaveLength(40);
  for (const row of report.rows) expect(row).toMatchObject({ status: 'known', historical: true, release: '16.09',
    sourceExact: true, authorExact: true, cardsExact: true, bindingExact: true, currentSeparate: true,
    legacyStatus: 'ambiguous', policy: { material: true, pending: 'update-required', answered: 'historical' } });
  await info.attach('actual-10-archive-40-bindings', { contentType: 'application/json', body: JSON.stringify(report) });
});

test('actual campaign archive preserves old answer, explanation, changed card and wrong-answer review without writes', async ({ page }, info) => {
  const seeded = await seedCampaign(page, true, true), before = await bytes(page, CAMPAIGN), state = await observed(page);
  expect(state.current).toEqual(seeded.bundle.oldQuestions.main); expect(state.answered).toBe(true);
  expect(state.characterLastAnswer.correct).toBe(false);
  await expect(page.locator('#campaignQuestionRevisionNotice')).toContainText('16.09');
  await expect(page.locator('#feedback')).toBeVisible(); await expect(page.locator('#feedback')).toContainText(seeded.bundle.oldAuthor.exp);
  await page.locator('#campaignQuestionRevisionNotice summary').click();
  await expect(page.locator('#campaignQuestionRevisionNotice details')).toContainText(seeded.bundle.currentAuthor.exp);
  const oldCard = seeded.bundle.oldRefs.cni_hyperkalemia_duan_2024;
  expect(oldCard).not.toEqual(seeded.bundle.currentRefs.cni_hyperkalemia_duan_2024);
  await page.locator('#refs [data-action="openRefResumo"]').first().click();
  await expect(page.locator('#questionRefSummary-0')).toContainText(oldCard.resumo);
  await capture(page, info, 'actual-campaign-history-card', '#questionRefSummary-0');
  await page.evaluate(() => (window as any).showSessionWrongAnswers());
  const dialog = page.getByRole('dialog', { name: 'Erros da Jornada' });
  await expect(dialog.locator('.nqreview-option.is-chosen .nqreview-option-text')).toHaveText(state.current.o[seeded.bundle.chosen]);
  await expect(dialog.locator('.nqreview-option.is-correct .nqreview-option-text')).toHaveText(state.current.o[state.current.a]);
  await expect(dialog.locator('[data-question-revision="historical"]')).toContainText('16.09');
  await capture(page, info, 'actual-campaign-wrong-history', '.nqreview-card');
  expect(await bytes(page, CAMPAIGN)).toEqual(before); expect(await observed(page)).toEqual(state); await assertZeroStorageWrites(page);
});

test('actual campaign pending archive requires confirmation, preserves original raw and resumes current published content', async ({ page }, info) => {
  const seeded = await seedCampaign(page, false, true), before = await observed(page), storedBefore = JSON.parse(seeded.raw);
  for (const option of await page.locator('#options .option').all()) await expect(option).toBeDisabled();
  await page.locator('[data-action="useCurrentCampaignQuestionRevision"]').click();
  await expect(page.locator('#question')).toHaveText(seeded.bundle.currentAuthor.q);
  const next = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!));
  expect(next.questionRevisionOriginRaw).toBe(seeded.raw); expect(next.questionPresentation.id).toBe(seeded.bundle.qid);
  for (const key of ['classBenefits', 'journeyAnswerOrdinal', 'forjaPending', 'xp', 'gold', 'lives', 'score', 'correctTotal']) expect(next[key]).toEqual(storedBefore[key]);
  expect(next.questionAnswer).toBeNull(); expect(next.answered).toBe(false);
  await reloadCampaign(page); await expect(page.locator('#question')).toHaveText(seeded.bundle.currentAuthor.q);
  expect((await observed(page)).journeyAnswerOrdinal).toBe(before.journeyAnswerOrdinal);
  await capture(page, info, 'actual-campaign-current-confirmed', '#options .option');
});

for (const profile of ['exam', 'study', 'offline'] as const) {
  test(`actual ${profile} archive keeps the old answer and explanation through consultation and reload without writes`, async ({ page }, info) => {
    const seeded = await seedAuxiliary(page, profile, true, true), before = await bytes(page, seeded.key);
    const feedback = profile === 'exam' ? '#examCorrecao' : profile === 'study' ? '#studyFeedback' : '.nq-off-feedback';
    await expect(page.locator(feedback)).toContainText(seeded.bundle.oldAuthor.exp);
    if (profile === 'exam') {
      await expect(page.locator('.nq-exam-veredito')).toContainText('Incorreto');
      await page.locator('[data-question-revision="historical"] summary').click();
      await expect(page.locator('[data-question-revision="historical"] details')).toContainText(seeded.bundle.currentAuthor.exp);
    } else if (profile === 'study') {
      await page.locator('[data-action="viewCurrentStudyRevision"]').click();
      await expect(page.locator('#studyCurrentRevision')).toContainText(seeded.bundle.currentAuthor.exp);
      await expect(page.locator('#studyCorrect')).toHaveText('7'); await expect(page.locator('#studyWrong')).toHaveText('3');
    } else {
      await page.getByRole('button', { name: 'Consultar atualização publicada' }).click();
      await expect(page.locator('#nqOffCurrentRevision')).toContainText(seeded.bundle.currentAuthor.exp);
      await expect(page.locator('#nqOffCorrectCount')).toHaveText('7');
    }
    await capture(page, info, `actual-${profile}-history`, feedback);
    expect(await bytes(page, seeded.key)).toEqual(before); await assertZeroStorageWrites(page);
    await resumeAuxiliary(page, profile, true); expect(await bytes(page, seeded.key)).toEqual(before); await assertZeroStorageWrites(page);
  });
  test(`actual ${profile} pending archive upgrades only on confirmation and retains original raw and progress after reload`, async ({ page }, info) => {
    const seeded = await seedAuxiliary(page, profile, false, true), before = await bytes(page, seeded.key);
    const options = page.locator(profile === 'exam' ? '#examOpts button' : profile === 'study' ? '#studyOptions button' : '.nq-off-btn');
    if (profile === 'exam') await expect(options).toHaveCount(0);
    else for (const option of await options.all()) await expect(option).toBeDisabled();
    const button = profile === 'exam' ? '[data-action="_examUseCurrentRevision"]' : profile === 'study' ? '[data-action="useCurrentStudyRevision"]' : '[onclick="useCurrentOfflineRevision()"]';
    await page.locator(button).click();
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), seeded.key);
    const current = profile === 'exam' ? saved.questions[0] : profile === 'study' ? saved.presentations[0].question : saved.question;
    expect(current.id).toBe(seeded.bundle.qid); expect(current._answerPresentation.sourceQuestion.q).toBe(seeded.bundle.currentAuthor.q);
    expect(profile === 'exam' ? saved.questionRevisionOriginalRaw : saved.revisionOriginRaw).toBe(seeded.raw);
    expect((await bytes(page, seeded.key)).progress).toEqual(before.progress);
    await resumeAuxiliary(page, profile, true);
    await expect(page.locator(profile === 'exam' ? '.nq-exam-enunciado' : profile === 'study' ? '#studyQuestionArea h3' : '.nq-off-question')).toHaveText(seeded.bundle.currentAuthor.q);
    await capture(page, info, `actual-${profile}-current-confirmed`, profile === 'exam' ? '#examOpts button' : profile === 'study' ? '#studyOptions button' : '.nq-off-btn');
  });
}

test('campaign historical answered mapping, archived card and error review stay separate from current content', async ({ page }, info) => {
  const seeded = await seedCampaign(page, true), before = await bytes(page, CAMPAIGN), state = await observed(page);
  expect(before.raw).toBe(seeded.raw); expect(state.current).toEqual(seeded.bundle.oldQuestions.main);
  expect(state.answered).toBe(true); expect(state.characterLastAnswer.correct).toBe(false);
  await expect(page.locator('#campaignQuestionRevisionNotice')).toContainText('technical-earlier');
  await expect(page.locator('#feedback')).toContainText(seeded.bundle.oldAuthor.exp);
  await test.info().attach('campaign-visible-state', { contentType: 'application/json', body: JSON.stringify(await page.evaluate(() => {
    const app = document.getElementById('mainApp'), notice = document.getElementById('campaignQuestionRevisionNotice'), feedback = document.getElementById('feedback');
    return { state: app?.getAttribute('data-lumen-state'), debrief: app?.getAttribute('data-lumen-debrief'),
      noticeDisplay: notice && getComputedStyle(notice).display, feedbackDisplay: feedback && getComputedStyle(feedback).display };
  })) });
  await expect(page.locator('#campaignQuestionRevisionNotice summary')).toBeVisible();
  await expect(page.locator('#feedback')).toBeVisible();
  await page.locator('#campaignQuestionRevisionNotice summary').click();
  await expect(page.locator('#campaignQuestionRevisionNotice details')).toContainText(seeded.bundle.currentAuthor.exp);
  await page.locator('#refs [data-action="openRefResumo"]').click();
  await expect(page.locator('#questionRefSummary-0')).toContainText('Resumo técnico anterior preservado.');
  await capture(page, info, 'campaign-history', '#options .option.correct');
  await page.evaluate(() => (window as any).showSessionWrongAnswers());
  const dialog = page.getByRole('dialog', { name: 'Erros da Jornada' });
  await expect(dialog.locator('.nqreview-option.is-chosen .nqreview-option-text')).toHaveText(seeded.bundle.oldQuestions.main.o[0]);
  await expect(dialog.locator('.nqreview-option.is-correct .nqreview-option-text')).toHaveText(seeded.bundle.oldAuthor.opts[0]);
  await expect(dialog.locator('[data-question-revision="historical"]')).toContainText('technical-earlier');
  await capture(page, info, 'wrong-history', '.nqreview-card');
  expect(await bytes(page, CAMPAIGN)).toEqual(before); expect(await observed(page)).toEqual(state);
  await assertZeroStorageWrites(page);
});

test('campaign pending requires explicit current revision and reload preserves qid, ledger, ordinal, resources and original raw', async ({ page }, info) => {
  const seeded = await seedCampaign(page, false), before = await observed(page), storedBefore = JSON.parse(seeded.raw);
  for (const option of await page.locator('#options .option').all()) await expect(option).toBeDisabled();
  await page.evaluate(() => (window as any).answer(0, document.querySelector('#options .option')));
  expect(await observed(page)).toEqual(before);
  await page.locator('[data-action="useCurrentCampaignQuestionRevision"]').click();
  await expect(page.locator('#question')).toHaveText(seeded.bundle.currentAuthor.q);
  const next = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!));
  expect(next.questionPresentation.id).toBe(before.current.id); expect(next.questionRevisionOriginRaw).toBe(seeded.raw);
  for (const key of ['classBenefits', 'journeyAnswerOrdinal', 'forjaPending', 'xp', 'gold', 'lives', 'score', 'correctTotal']) expect(next[key]).toEqual(storedBefore[key]);
  expect(next.questionAnswer).toBeNull(); expect(next.answered).toBe(false);
  await reloadCampaign(page); await expect(page.locator('#question')).toHaveText(seeded.bundle.currentAuthor.q);
  await capture(page, info, 'campaign-current-confirmed', '#options .option');
});

for (const mode of ['refuse', 'readback', 'competing']) test(`campaign current-revision ${mode} preserves prior runtime and cannot overwrite a competing writer`, async ({ page }) => {
  await seedCampaign(page, false); const before = await bytes(page, CAMPAIGN), prior = await observed(page);
  await fault(page, CAMPAIGN, mode); await page.locator('[data-action="useCurrentCampaignQuestionRevision"]').click();
  expect(await observed(page)).toEqual(prior);
  const after = await bytes(page, CAMPAIGN); expect(after.progress).toEqual(before.progress);
  expect(after.raw).toBe(mode === 'competing' ? 'technical-competing-bytes' : before.raw);
});

for (const profile of ['exam', 'study', 'offline'] as const) {
  test(`${profile} historical answered preserves old assessment, current content stays separate and reload gives no credit`, async ({ page }, info) => {
    const seeded = await seedAuxiliary(page, profile, true), before = await bytes(page, seeded.key);
    const source = seeded.bundle.oldQuestions[profile];
    if (profile === 'exam') {
      await expect(page.locator('.nq-exam-veredito')).toContainText('Incorreto');
      await expect(page.locator('#examCorrecao')).toContainText(source.e);
      await page.locator('[data-question-revision="historical"] summary').click();
      await expect(page.locator('[data-question-revision="historical"] details')).toContainText(seeded.bundle.currentAuthor.exp);
    } else if (profile === 'study') {
      await expect(page.locator('#studyFeedback')).toContainText(source.e);
      await page.locator('[data-action="viewCurrentStudyRevision"]').click();
      await expect(page.locator('#studyCurrentRevision')).toContainText(seeded.bundle.currentAuthor.exp);
      await expect(page.locator('#studyCorrect')).toHaveText('7'); await expect(page.locator('#studyWrong')).toHaveText('3');
    } else {
      await expect(page.locator('.nq-off-feedback')).toContainText(source.e);
      await page.getByRole('button', { name: 'Consultar atualização publicada' }).click();
      await expect(page.locator('#nqOffCurrentRevision')).toContainText(seeded.bundle.currentAuthor.exp);
      await expect(page.locator('#nqOffCorrectCount')).toHaveText('7');
    }
    await capture(page, info, `${profile}-history`, profile === 'exam' ? '#examCorrecao' : profile === 'study' ? '#studyFeedback' : '.nq-off-feedback');
    expect(await bytes(page, seeded.key)).toEqual(before); await assertZeroStorageWrites(page);
    await resumeAuxiliary(page, profile, true); expect(await bytes(page, seeded.key)).toEqual(before);
    await assertZeroStorageWrites(page);
  });
  test(`${profile} pending uses current revision only after explicit confirmation and keeps original raw after reload`, async ({ page }, info) => {
    const seeded = await seedAuxiliary(page, profile, false), before = await bytes(page, seeded.key);
    const options = page.locator(profile === 'exam' ? '#examOpts button' : profile === 'study' ? '#studyOptions button' : '.nq-off-btn');
    if (profile === 'exam') await expect(options).toHaveCount(0);
    else for (const option of await options.all()) await expect(option).toBeDisabled();
    const button = profile === 'exam' ? '[data-action="_examUseCurrentRevision"]' : profile === 'study' ? '[data-action="useCurrentStudyRevision"]' : '[onclick="useCurrentOfflineRevision()"]';
    await page.locator(button).click();
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), seeded.key);
    const current = profile === 'exam' ? saved.questions[0] : profile === 'study' ? saved.presentations[0].question : saved.question;
    expect(current.id).toBe(seeded.bundle.qid); expect(current._answerPresentation.sourceQuestion.q).toBe(seeded.bundle.currentAuthor.q);
    expect(profile === 'exam' ? saved.questionRevisionOriginalRaw : saved.revisionOriginRaw).toBe(seeded.raw);
    expect((await bytes(page, seeded.key)).progress).toEqual(before.progress);
    await resumeAuxiliary(page, profile, true);
    await expect(page.locator(profile === 'exam' ? '.nq-exam-enunciado' : profile === 'study' ? '#studyQuestionArea h3' : '.nq-off-question')).toHaveText(seeded.bundle.currentAuthor.q);
    await capture(page, info, `${profile}-current-confirmed`, profile === 'exam' ? '#examOpts button' : profile === 'study' ? '#studyOptions button' : '.nq-off-btn');
  });
}

for (const mode of ['refuse', 'readback', 'competing']) test(`exam current-revision ${mode} keeps old runtime and raw without analytics credit`, async ({ page }) => {
  const seeded = await seedAuxiliary(page, 'exam', false), before = await bytes(page, EXAM);
  const prior = await page.evaluate(() => JSON.stringify((0, eval)('_examState')));
  await fault(page, EXAM, mode); await page.locator('[data-action="_examUseCurrentRevision"]').click();
  expect(await page.evaluate(() => JSON.stringify((0, eval)('_examState')))).toBe(prior);
  const after = await bytes(page, EXAM); expect(after.progress).toEqual(before.progress);
  expect(after.raw).toBe(mode === 'competing' ? 'technical-competing-bytes' : seeded.raw);
  await expect(page.locator('#examPage')).toContainText('Prova preservada');
});

test('fresh study and offline sessions use the real full bank and current bindings', async ({ page }, info) => {
  await page.evaluate(() => (window as any).startFreeStudyMode());
  await expect(page.locator('#studyOptions button').first()).toBeVisible();
  const study = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-study-state')!));
  expect(study.presentations.every((row: any) => row.revisionBinding.profile === 'study')).toBe(true);
  await expect(page.locator('#studyOptions button')).toHaveCount(study.presentations[0].question.o.length);
  await capture(page, info, 'study-fresh-current', '#studyOptions button');
  await page.goto('/offline.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nq-off-btn').first()).toBeVisible();
  const offline = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-offline-study-state')!));
  expect(offline.revisionBinding.profile).toBe('offline');
  await expect(page.locator('.nq-off-btn')).toHaveCount(offline.question.o.length);
  await capture(page, info, 'offline-fresh-current', '.nq-off-btn');
});


for (const completed of ['expired', 'all answered']) test(`exam ${completed} historical consultation preserves raw and recorded score without writes`, async ({ page }, info) => {
  const bundle = await fixture(page);
  const raw = await page.evaluate(({ bundle, completed }) => {
    const w = window as any, q = bundle.oldQuestions.exam, chosen = q.a;
    const save = { questions: [q], idx: completed === 'all answered' ? 1 : 0,
      answers: [{ qId: q.id, chosen, correct: true, answered: true, cat: 'geral',
        authoredChoice: w.NQAnswers.originalIndex(q, chosen), optionId: w.NQAnswers.optionId(q, chosen) }],
      questionRevisionBindings: [bundle.oldBindings.exam], savedAt: Date.now(),
      startTime: Date.now() - (completed === 'expired' ? 91 * 60 * 1000 : 1000) };
    const raw = JSON.stringify(save); localStorage.setItem('nefroquest-exam-state', raw); return raw;
  }, { bundle, completed });
  const before = await bytes(page, EXAM); await watchReadOnlyStorage(page, EXAM);
  await page.evaluate(() => (window as any).startExamMode());
  if (completed === 'all answered') await page.getByRole('button', { name: 'Retomar prova', exact: true }).click();
  await expect(page.locator('#examResultado')).toBeVisible();
  await expect(page.locator('#examResultado')).toContainText('100%');
  expect((await bytes(page, EXAM)).raw).toBe(raw); expect(await bytes(page, EXAM)).toEqual(before);
  await capture(page, info, `exam-${completed.replace(' ', '-')}-readonly-result`, '#examResultado');
  await page.getByRole('button', { name: 'Voltar ao menu', exact: true }).click();
  expect(await bytes(page, EXAM)).toEqual(before); await assertZeroStorageWrites(page);
});


for (const held of ['expired', 'completed']) test(`study ${held} save stays held without writes until explicit new-session replacement`, async ({ page }, info) => {
  await page.evaluate(() => (window as any).startFreeStudyMode());
  await expect(page.locator('#studyOptions button').first()).toBeVisible();
  const raw = await page.evaluate(held => {
    const save = JSON.parse(localStorage.getItem('nefroquest-study-state')!);
    if (held === 'expired') save.savedAt = Date.now() - 25 * 60 * 60 * 1000;
    else save.index = save.questions.length;
    const raw = JSON.stringify(save); localStorage.setItem('nefroquest-study-state', raw); return raw;
  }, held);
  await watchReadOnlyStorage(page, STUDY);
  await page.reload({ waitUntil: 'domcontentloaded' }); await guest(page); await page.evaluate(() => (window as any)._loadTopics());
  const before = await bytes(page, STUDY);
  expect(await page.evaluate(() => (window as any).resumeSavedStudyMode())).toBe(false);
  await page.evaluate(() => (0, eval)('_studySelectedAxes.clear(); NEFRO_AXES.forEach(axis => _studySelectedAxes.add(axis.id)); startStudyMode();'));
  await expect(page.locator('[data-study-resume-choice]')).toContainText('Sessão salva preservada');
  await expect(page.locator('[data-study-resume-choice] [data-action="resumeSavedStudyMode"]')).toHaveCount(0);
  expect((await bytes(page, STUDY)).raw).toBe(raw); expect(await bytes(page, STUDY)).toEqual(before);
  await assertZeroStorageWrites(page);
  await capture(page, info, `study-${held}-held`, '[data-study-resume-choice]');
  await page.locator('[data-study-resume-choice] [data-action="startStudyMode"][data-arg="true"]').click();
  await expect(page.locator('#studyOptions button').first()).toBeVisible();
  const replaced = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-study-state')!));
  expect(replaced.index).toBe(0); expect(replaced.correct).toBe(0); expect(replaced.wrong).toBe(0);
  expect((await bytes(page, STUDY)).progress).toEqual(before.progress);
});


for (const scenario of ['missing choice', 'invalid choice', 'missing choice with metadata', 'invalid choice with metadata',
  'conflicting authored choice', 'conflicting option identity', 'correct choice in wrong list', 'unknown source'] as const) {
  test(`wrong review preserves known content and holds inconsistent records: ${scenario}`, async ({page}) => {
    const bundle = await fixture(page);
    const record = await page.evaluate(({bundle,scenario}) => {
      const w = window as any, question = w.NQAnswers.present(bundle.sources.main[0], {preserveOrder:true});
      const chosen = (question.a + 1) % question.o.length;
      const entry:any = {...question};
      if (scenario === 'invalid choice' || scenario === 'invalid choice with metadata') entry.chosen = 999;
      else if (scenario !== 'missing choice' && scenario !== 'missing choice with metadata') entry.chosen = chosen;
      if (scenario === 'missing choice with metadata' || scenario === 'invalid choice with metadata')
        entry.authoredChoice = w.NQAnswers.originalIndex(question, chosen);
      if (scenario === 'conflicting authored choice') entry.authoredChoice = question.a;
      if (scenario === 'conflicting option identity') entry.selectedOptionId = 'unverified-option';
      if (scenario === 'correct choice in wrong list') entry.chosen = question.a;
      if (scenario === 'unknown source') entry.q = 'Texto técnico sem identidade publicada';
      (0,eval)('_sessionWrongAnswers').splice(0, (0,eval)('_sessionWrongAnswers').length, entry);
      return {entry, raw:JSON.stringify((0,eval)('_sessionWrongAnswers'))};
    }, {bundle,scenario});
    const before = await observed(page);
    await watchReadOnlyStorage(page,CAMPAIGN);
    await page.evaluate(() => (window as any).showSessionWrongAnswers());
    const dialog = page.getByRole('dialog',{name:'Erros da Jornada'});
    await expect(dialog).toBeVisible();
    if (scenario === 'missing choice' || scenario === 'invalid choice') {
      await expect(dialog.locator('.nqreview-question')).toHaveText(record.entry.q);
      await expect(dialog.locator('.nqreview-option-text')).toHaveText(record.entry.o);
      await expect(dialog.locator('.is-correct')).toHaveAttribute('data-option-index',String(record.entry.a));
      await expect(dialog.locator('.is-chosen')).toHaveCount(0);
      await expect(dialog.locator('.nqreview-unrecorded')).toHaveText('A alternativa escolhida não foi registrada nesta sessão.');
    } else {
      await expect(dialog.locator('.nqreview-unrecorded[role="alert"]')).toContainText('indisponível');
      await expect(dialog.locator('.nqreview-question')).toHaveCount(0);
      await expect(dialog.locator('.is-chosen, .is-correct')).toHaveCount(0);
    }
    expect(await page.evaluate(() => JSON.stringify((0,eval)('_sessionWrongAnswers')))).toBe(record.raw);
    expect(await observed(page)).toEqual(before);
    await assertZeroStorageWrites(page);
  });
}

// Answer credit is conditional on committing its primary session snapshot.
// Reuse the real authored fixture/catalog above; faults affect Storage only.
const answerCommitProgressKeys = [...progressKeys, 'nq_last_study',
  'nefroquest-comp-stats', 'nefroquest-all-answered-qids'];
async function answerCommitSnapshot(page: Page, mode: 'study' | 'offline') {
  return page.evaluate(({ mode, keys, key }) => {
    const runtime = JSON.parse((0, eval)(mode === 'study'
      ? 'JSON.stringify({correct:studyModeCorrect,wrong:studyModeWrong,axis:_studyAxisStats,answer:_studyAnswers[studyModeIndex]||null,question:_studyPresentations[studyModeIndex],revision:_studyRevisions[studyModeIndex]})'
      : 'JSON.stringify({correct:correctCount,answer:offlineAnswer,question:currentPresentation,revision:offlineRevision})'));
    const raw = localStorage.getItem(key)!;
    const checked = (window as any).questionRevisionCatalog.inspect(runtime.question,
      { profile: mode, binding: runtime.revision?.binding });
    return { raw, saved: JSON.parse(raw), runtime,
      known: { status: checked.status, historical: checked.value?.historical },
      progress: Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])) };
  }, { mode, keys: answerCommitProgressKeys, key: mode === 'study' ? STUDY : OFFLINE });
}

async function prepareAnswerCommit(page: Page, mode: 'study' | 'offline') {
  // Capture real preexisting identities while the full bank is still loaded.
  const existingIdentity = await page.evaluate(() => {
    const w = window as any, otherId = String(w.questionBank[1].id);
    const comp = w.nqGetCompIds(String(w.questionBank[0].id))[0] || w.nqGetCompIds(otherId)[0];
    if (!comp) throw new Error('The existing bank must expose a real indexed competency.');
    return { otherId, comp };
  });
  const seeded = await seedAuxiliary(page, mode, false);
  await page.locator(mode === 'study' ? '[data-action="useCurrentStudyRevision"]' : '[onclick="useCurrentOfflineRevision()"]').click();
  await expect(page.locator(mode === 'study' ? '#studyOptions button' : '.nq-off-btn')).toHaveCount(4);
  await page.evaluate(({ bundle, mode, existingIdentity }) => {
    const w = window as any, day = 86400000, today = new Date().setHours(0, 0, 0, 0);
    const { otherId, comp } = existingIdentity;
    const existing: Record<string, unknown> = {
      'nefroquest-stats': { gamesPlayed: 2, bestLevel: 3, bestScore: 420, questionsAnsweredAllTime: 6 },
      'nefroquest-detailed-stats': { version: 1, totalQuestions: 6, totalCorrect: 4, totalWrong: 2,
        byTopic: {}, byCategory: { geral: { correct: 4, wrong: 2, total: 6 } },
        questionHistory: [{ qid: otherId, topic: 'Technical existing progress', correct: true, time: 10, date: new Date(today - day).toISOString() }],
        dailyActivity: {}, timeStats: { totalTime: 60, questionCount: 6 }, mostMissed: {}, syncedMastered: [otherId] },
      'nefroquest-sr-data': { [bundle.qid]: { S: 3, D: 4.9, interval: 3, due: today + 3 * day, last: today - day, reps: 2, lapses: 1 },
        [otherId]: { S: 1.5, D: 6, interval: 2, due: today - day, last: today - 3 * day, reps: 4, lapses: 2 } },
      'nefroquest-mastered': [otherId], 'nefroquest-mastered-ids': [otherId],
      'unlockedArticles': [bundle.ref], 'nq-unlocked-refs': [bundle.ref],
      'nq_last_study': String(today - day), 'nefroquest-comp-stats': { [comp]: { c: 4, t: 6 } },
      'nefroquest-all-answered-qids': [otherId]
    };
    for (const [key, value] of Object.entries(existing)) localStorage.setItem(key,
      key === 'nq_last_study' ? String(value) : JSON.stringify(value, null, 2));
    // Normalize through the real synchronizer before measuring reload invariance.
    if (mode === 'study') w.syncMasteredToDetailedStats();
  }, { bundle: seeded.bundle, mode, existingIdentity });
  return seeded;
}

async function refuseAnswerCommit(page: Page, mode: 'study' | 'offline', failure: 'concurrent' | 'refused') {
  return page.evaluate(({ mode, failure, keys, key }) => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    const originalRaw = get.call(localStorage, key)!;
    const replacement = JSON.parse(originalRaw);
    if (mode === 'study') replacement.savedAt += 1;
    const replacementRaw = JSON.stringify(replacement, null, 2);
    const trace: any = { phase: 'answer', primaryReads: [], primaryAttempts: [], progressWrites: [], externalMutations: [] };
    let replaced = false, explicitSaveResult: boolean;
    const correct = (0, eval)(mode === 'study' ? '_studyPresentations[studyModeIndex].a' : 'currentPresentation.a');
    Storage.prototype.getItem = function(k) {
      const captured = get.call(this, k);
      if (this === localStorage && k === key) {
        trace.primaryReads.push({ phase: trace.phase, raw: captured });
        if (failure === 'concurrent' && trace.phase === 'answer' && !replaced) {
          replaced = true; set.call(localStorage, key, replacementRaw);
          trace.externalMutations.push(replacementRaw);
        }
      }
      return captured;
    };
    Storage.prototype.setItem = function(k, value) {
      if (this === localStorage && k === key) {
        trace.primaryAttempts.push({ phase: trace.phase, value: String(value) });
        if (failure === 'refused') throw new DOMException('Technical primary save refusal', 'QuotaExceededError');
      }
      if (this === localStorage && keys.includes(k)) trace.progressWrites.push({ phase: trace.phase, key: k, value: String(value) });
      return set.call(this, k, value);
    };
    try {
      if (mode === 'study') (window as any).answerStudyQuestion(correct);
      else (0, eval)('answerQuestion')(correct, null);
      // Observe a real saver return in a separate phase, never replace its API.
      trace.phase = 'probe';
      explicitSaveResult = (0, eval)(mode === 'study' ? '_saveStudyState' : 'saveOfflineSession')();
    } finally {
      Storage.prototype.getItem = get; Storage.prototype.setItem = set;
    }
    return { originalRaw, replacementRaw, explicitSaveResult, trace,
      rawAfter: get.call(localStorage, key),
      warning: document.body.textContent?.includes('Não foi possível salvar esta resposta. Recarregue para continuar.'),
      storageMethodsRestored: Storage.prototype.getItem === get && Storage.prototype.setItem === set };
  }, { mode, failure, keys: answerCommitProgressKeys, key: mode === 'study' ? STUDY : OFFLINE });
}

for (const mode of ['study', 'offline'] as const) for (const failure of ['concurrent', 'refused'] as const) {
  test(`${mode} answer commit guard ${failure} preserves credit on failure and records exactly once after reload`, async ({ page }, info) => {
    const seeded = await prepareAnswerCommit(page, mode);
    const before = await answerCommitSnapshot(page, mode);
    const faultResult = await refuseAnswerCommit(page, mode, failure);
    const afterRefusal = await answerCommitSnapshot(page, mode);
    await capture(page, info, `${mode}-answer-commit-${failure}-refused`, mode === 'study' ? '#studyQuestionArea' : '#nqOffOptions');
    await resumeAuxiliary(page, mode, true);
    const afterReload = await answerCommitSnapshot(page, mode);
    await page.evaluate(mode => {
      if (mode === 'study') (window as any).answerStudyQuestion((0, eval)('_studyPresentations[studyModeIndex].a'));
      else (0, eval)('answerQuestion')((0, eval)('currentPresentation.a'), null);
    }, mode);
    const afterSuccess = await answerCommitSnapshot(page, mode);
    await resumeAuxiliary(page, mode, true);
    const afterReplay = await answerCommitSnapshot(page, mode);
    const report = { mode, failure, qid: seeded.bundle.qid, before, faultResult, afterRefusal, afterReload, afterSuccess, afterReplay };
    await info.attach('answer-commit-guard', { contentType: 'application/json', body: JSON.stringify(report, null, 2) });

    expect(before.known).toEqual({ status: 'known', historical: false });
    expect(before.runtime.answer).toBeNull();
    for (const key of answerCommitProgressKeys) expect(before.progress[key]).not.toBeNull();
    expect(JSON.parse(before.progress['nefroquest-sr-data']!)[seeded.bundle.qid].reps).toBe(2);
    expect(JSON.parse(before.progress['nefroquest-detailed-stats']!).totalQuestions).toBeGreaterThan(0);
    expect(faultResult.storageMethodsRestored).toBe(true);
    expect(faultResult.explicitSaveResult).toBe(false);
    if (failure === 'concurrent') {
      expect(faultResult.replacementRaw).not.toBe(faultResult.originalRaw);
      expect(faultResult.trace.externalMutations).toEqual([faultResult.replacementRaw]);
      expect(faultResult.trace.primaryAttempts.filter((r: any) => r.phase === 'answer')).toEqual([]);
    } else expect(faultResult.trace.primaryAttempts.filter((r: any) => r.phase === 'answer')).toHaveLength(1);
    expect(faultResult.rawAfter).toBe(failure === 'concurrent' ? faultResult.replacementRaw : before.raw);
    expect(afterRefusal.progress).toEqual(before.progress);
    expect(faultResult.trace.progressWrites).toEqual([]);
    expect(afterRefusal.runtime.correct).toBe(before.runtime.correct);
    expect(afterRefusal.runtime.answer).toBeNull();
    expect(faultResult.warning).toBe(true);
    expect(afterReload.raw).toBe(faultResult.rawAfter);
    expect(afterReload.runtime.answer).toBeNull();
    expect(afterReload.progress).toEqual(before.progress);
    expect(afterSuccess.runtime.answer.correct).toBe(true);
    expect(afterSuccess.runtime.correct).toBe(before.runtime.correct + 1);
    expect(mode === 'study' ? afterSuccess.saved.correct : afterSuccess.saved.correctCount).toBe(before.runtime.correct + 1);
    expect(mode === 'study' ? afterSuccess.saved.presentations[0].answer.correct : afterSuccess.saved.answer.correct).toBe(true);
    const initialStats = JSON.parse(before.progress['nefroquest-detailed-stats']!);
    const creditedStats = JSON.parse(afterSuccess.progress['nefroquest-detailed-stats']!);
    expect(creditedStats.totalQuestions).toBe(initialStats.totalQuestions + 1);
    expect(creditedStats.totalCorrect).toBe(initialStats.totalCorrect + 1);
    const initialSR = JSON.parse(before.progress['nefroquest-sr-data']!);
    const creditedSR = JSON.parse(afterSuccess.progress['nefroquest-sr-data']!);
    if (mode === 'study') expect(creditedSR[seeded.bundle.qid].reps).toBe(initialSR[seeded.bundle.qid].reps + 1);
    else expect(afterSuccess.progress['nefroquest-sr-data']).toBe(before.progress['nefroquest-sr-data']);
    expect(afterReplay.raw).toBe(afterSuccess.raw);
    expect(afterReplay.progress).toEqual(afterSuccess.progress);
    expect(afterReplay.runtime.correct).toBe(afterSuccess.runtime.correct);
  });
}
