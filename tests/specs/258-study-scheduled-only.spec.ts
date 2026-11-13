import {test, expect, type Page} from '@playwright/test';

// Persisted schedules against the actual published bank/catalog. No product
// function, question bank, catalog or scheduler is replaced.
const SR = 'nefroquest-sr-data', STUDY = 'nefroquest-study-state';
const PROGRESS = ['nefroquest-save', 'nefroquest-save-v7', 'nefroquest-stats',
  'nefroquest-detailed-stats', 'nefroquest-mastered', 'nefroquest-mastered-ids',
  'unlockedArticles', 'nq-unlocked-refs', SR];
const evidence = new WeakMap<Page, {errors: string[]; nonGet: string[]}>();
test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'reduce'}});

test.beforeEach(async ({page, context, baseURL}) => {
  const origin = new URL(baseURL || 'http://localhost:5500').origin;
  expect(['localhost', '127.0.0.1', 'nefroquest.com']).toContain(new URL(origin).hostname);
  const report = {errors: [] as string[], nonGet: [] as string[]}; evidence.set(page, report);
  page.on('pageerror', error => report.errors.push(error.message));
  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { report.nonGet.push(request.method() + ' ' + url.origin + url.pathname); return route.abort(); }
    return url.origin === origin && !['font', 'media'].includes(request.resourceType())
      ? route.continue() : route.abort();
  });
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.waitForFunction(() => typeof (window as any)._loadTopics === 'function');
  await page.evaluate(() => (window as any)._loadTopics());
  await page.waitForFunction(() => (window as any).questionBank?.length === 741 && !!(window as any).questionRevisionCatalog);
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
});
test.afterEach(async ({page}, info) => {
  await info.attach('scheduled-study-native-runtime', {contentType: 'application/json',
    body: JSON.stringify({...evidence.get(page), viewport: page.viewportSize(), status: info.status})});
  expect(evidence.get(page)?.errors).toEqual([]);
  expect(evidence.get(page)?.nonGet).toEqual([]);
});

async function openHub(page: Page) {
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="study"]:visible').click();
  await expect(page.locator('.study-mode-popup')).toBeVisible();
}
const reviewCard = (page: Page) => page.locator('.nq-study-choices > section').filter({has: page.getByRole('heading', {name: 'Revisão espaçada', exact: true})});
async function progress(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), PROGRESS);
}
async function seedSchedules(page: Page, kind: 'future' | 'mixed') {
  return page.evaluate(({kind, key}) => {
    const topics = (0, eval)('topics') as any[];
    const drc = topics.filter(q => q.cat === 'drc'), dialysis = topics.find(q => q.cat === 'dialise');
    if (drc.length < 2 || !dialysis) throw Error('Actual published categories are required');
    const today = new Date().setHours(0, 0, 0, 0), card = (due: number) =>
      ({S: 3, D: 5, due, interval: 3, last: today - 3 * 86400000, reps: 2, lapses: 0});
    const cards = kind === 'future' ? {[drc[0].qid]: card(today + 1)} : {
      [drc[0].qid]: card(today), [dialysis.qid]: card(today - 86400000),
      [drc[1].qid]: card(today + 1), 'not-a-published-question': card(today - 86400000),
    };
    const raw = JSON.stringify(cards); localStorage.setItem(key, raw);
    return {raw, due: kind === 'mixed' ? [drc[0].qid, dialysis.qid].sort() : [], selectedDue: drc[0].qid};
  }, {kind, key: SR});
}
async function queue(page: Page) {
  return page.evaluate(() => (0, eval)('studyModeQuestions.map(q => q.qid || q.id).sort()'));
}
async function expectActiveQueue(page: Page, ids: string[]) {
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  expect(await queue(page)).toEqual(ids);
  await expect(page.locator('#studyModePage').getByRole('heading', {name: 'Revisão agendada', exact: true})).toBeVisible();
}

test('a fresh user has no scheduled review and can still enter the twenty-question free-study pool', async ({page}) => {
  const before = await progress(page);
  await openHub(page);
  await expect(reviewCard(page)).toContainText('Nenhuma revisão agendada para agora');
  await expect(reviewCard(page)).not.toContainText('741');
  await expect(reviewCard(page).getByRole('button', {name: 'Revisar agora', exact: true})).toBeDisabled();
  expect(await page.evaluate(() => (0, eval)('getSRDueQuestions(topics).length'))).toBe(741);
  expect(await page.evaluate(() => (0, eval)('getSRScheduledDueQuestions(topics).length'))).toBe(0);
  await page.getByRole('button', {name: 'Iniciar estudo livre', exact: true}).click();
  await expect(page.locator('#studyOptions button')).toHaveCount(4);
  expect(await queue(page)).toHaveLength(20);
  expect(await progress(page)).toEqual(before);
});

test('future-only schedules and an expired session stay preserved across every zero-review entry', async ({page}) => {
  await seedSchedules(page, 'future');
  const expired = await page.evaluate(key => {
    const w = window as any, qid = w.questionBank[0].id;
    const current = w.questionRevisionCatalog.current(qid, 'study');
    const question = w.NQAnswers.present(current.source, {preserveOrder: true});
    const raw = JSON.stringify({questions: [qid], index: 0, correct: 2, wrong: 1, axisStats: {},
      savedAt: Date.now() - 25 * 3600000, presentationVersion: 1,
      presentations: [{id: qid, question, answer: null, revisionBinding: current.binding}]});
    localStorage.setItem(key, raw); return raw;
  }, STUDY);
  const before = await progress(page);
  await openHub(page);
  await expect(reviewCard(page)).toContainText('Nenhuma revisão agendada para agora');
  await expect(reviewCard(page).getByRole('button', {name: 'Revisar agora', exact: true})).toBeDisabled();
  await expect(page.locator('.nq-study-resume')).toContainText('O prazo desta sessão terminou');
  // The selected/all entry points remain public legacy routes. The hub and
  // dashboard routes are exercised by native clicks in the following cases.
  for (const action of ['startSRStudyMode', 'startSRReviewAll', 'startSRStudyAllMode', 'startScheduledSRStudyMode']) {
    await page.evaluate(action => (window as any)[action](), action);
    await expect(page.locator('#studyModePage')).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), STUDY)).toBe(expired);
    expect(await progress(page)).toEqual(before);
  }
  await page.locator('.study-mode-popup [data-action="closeStudySetup"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await page.evaluate(() => document.getElementById('welcomeScreen')!.inert)).toBe(false);
  expect(await page.evaluate(key => localStorage.getItem(key), STUDY)).toBe(expired);
});

test('the native review button starts exactly the two due schedules, excluding unseen, future and orphan cards', async ({page}) => {
  const fixture = await seedSchedules(page, 'mixed'), before = await progress(page);
  await openHub(page);
  await expect(reviewCard(page)).toContainText('2 questões agendadas para revisar agora');
  await reviewCard(page).getByRole('button', {name: 'Revisar agora', exact: true}).click();
  await expectActiveQueue(page, fixture.due);
  expect(await progress(page)).toEqual(before);
  await page.getByRole('button', {name: 'Pausar e voltar', exact: true}).click();
  await expect(page.locator('#studyModePage')).toHaveCount(0);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await page.evaluate(() => document.getElementById('welcomeScreen')!.inert)).toBe(false);
  expect(await progress(page)).toEqual(before);
  await openHub(page);
  await expect(reviewCard(page)).toContainText('2 questões agendadas para revisar agora');
  expect(await page.evaluate(key => localStorage.getItem(key), SR)).toBe(fixture.raw);
});

test('selected-axis review counts and selects only scheduled due questions in that axis', async ({page}) => {
  const fixture = await seedSchedules(page, 'mixed'), before = await progress(page);
  await openHub(page);
  await page.getByRole('button', {name: 'Selecionar Temas', exact: true}).click();
  await page.getByRole('button', {name: 'Nenhum', exact: true}).click();
  await page.locator('#axis-card-drc').click();
  expect(await page.evaluate(() => (0, eval)('getSRDueCount()'))).toBe(1);
  // This legacy entry has no visible selector button; use its real exported
  // function after selecting axes with the native controls, without replacing it.
  await page.evaluate(() => (window as any).startSRStudyMode());
  await expectActiveQueue(page, [fixture.selectedDue]);
  expect(await progress(page)).toEqual(before);
});

test('the native Dashboard review action agrees with the study queue and returns to the Dashboard', async ({page}) => {
  const fixture = await seedSchedules(page, 'mixed'), before = await progress(page);
  await page.locator('[data-atrium-route="dashboard"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  const review = page.locator('#nqdPane-overview [data-action-kind="review"]');
  await expect(review).toContainText('2 revisões agendadas vencidas');
  await review.getByRole('button', {name: 'Revisar agora', exact: true}).click();
  await expectActiveQueue(page, fixture.due);
  expect(await progress(page)).toEqual(before);
  await page.getByRole('button', {name: 'Pausar e voltar', exact: true}).click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  expect(await progress(page)).toEqual(before);
});

test('an ambiguous saved study remains consult-only while zero scheduled reviews do not invent a new session', async ({page}) => {
  const original = await page.evaluate(key => {
    const w = window as any;
    const old = w.NQQuestionRevisionHistory.find((row: any) => row.qid === '5530b59c' && row.release === '17.11');
    if (!old) throw Error('The actual published card-only archive is required');
    const question = w.NQAnswers.present(old.sources.study, {preserveOrder: true});
    const raw = JSON.stringify({questions: [old.qid], index: 0, correct: 2, wrong: 1, axisStats: {},
      savedAt: Date.now(), presentationVersion: 1,
      presentations: [{id: old.qid, question, answer: null}]});
    localStorage.setItem(key, raw); return raw;
  }, STUDY);
  const before = await progress(page);
  await openHub(page);
  await expect(reviewCard(page).getByRole('button', {name: 'Revisar agora', exact: true})).toBeDisabled();
  await page.getByRole('button', {name: 'Retomar estudo', exact: true}).click();
  await expect(page.locator('#studyRevisionHold')).toContainText('Não foi possível identificar uma única revisão');
  await expect(page.locator('#studyModePage')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), STUDY)).toBe(original);
  expect(await progress(page)).toEqual(before);
  await page.locator('.study-mode-popup [data-action="closeStudySetup"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), STUDY)).toBe(original);
});

for (const mixed of [false, true]) test('Dashboard and Study reject malformed schedules' + (mixed ? ' beside real due cards' : ' without inventing a review'), async ({page}) => {
  const fixture = await page.evaluate(({key, mixed}) => {
    const published = (0, eval)('topics') as any[], today = new Date().setHours(0, 0, 0, 0);
    const card = (due: unknown) => ({due, S: 3, D: 5, reps: 2, interval: 3, last: today - 3 * 86400000});
    const invalid = [null, '', '  ', false, [], {valueOf: null, toString: null}, undefined];
    const cards: Record<string, any> = Object.fromEntries(invalid.map((due, index) => [published[index].qid, card(due)]));
    cards[published[7].qid] = [];
    cards[published[8].qid] = card(today + 86400000);
    const due = mixed ? [published[9].qid, published[10].qid].sort() : [];
    if (mixed) { cards[published[9].qid] = card(today); cards[published[10].qid] = card(String(today - 86400000)); }
    cards['not-a-published-question'] = card(today);
    const raw = JSON.stringify(cards); localStorage.setItem(key, raw); return {due, raw};
  }, {key: SR, mixed});
  const before = await progress(page);
  await page.locator('[data-atrium-route="dashboard"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  const review = page.locator('#nqdPane-overview [data-action-kind="review"]');
  if (mixed) {
    await expect(review).toContainText('2 revisões agendadas vencidas');
    await review.getByRole('button', {name: 'Revisar agora', exact: true}).click();
    await expectActiveQueue(page, fixture.due);
    expect(await progress(page)).toEqual(before);
    await page.getByRole('button', {name: 'Pausar e voltar', exact: true}).click();
    await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
    await expect(page.locator('#nqdPane-overview [data-action-kind="review"]')).toContainText('2 revisões agendadas vencidas');
  } else {
    await expect(review).toHaveCount(0);
    await expect(page.locator('#nqdPane-overview [data-overview-section="review"] .nqd-metric-value').first()).toHaveText('0');
    expect(await page.evaluate(() => (0, eval)('getSRScheduledDueQuestions(topics).length'))).toBe(0);
  }
  expect(await progress(page)).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), SR)).toBe(fixture.raw);
});
