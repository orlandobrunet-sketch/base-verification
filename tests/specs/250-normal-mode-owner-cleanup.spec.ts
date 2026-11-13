import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

// Identity/transport is a local fixture, not an OAuth or real-account test.
// Auth callbacks, logout, mode entry, answer, pause and resume stay native.
const USER_A = { id: '00000000-0000-4000-8000-000000000250', email: 'a@normal-owner.test', app_metadata: {}, user_metadata: { nickname: 'Conta técnica A' } };
const USER_B = { id: '00000000-0000-4000-8000-000000000251', email: 'b@normal-owner.test', app_metadata: {}, user_metadata: { nickname: 'Conta técnica B' } };
const KEYS = { study: 'nefroquest-study-state', exam: 'nefroquest-exam-state' } as const;
type Mode = keyof typeof KEYS;
const authors = Array.from({ length: 10 }, (_, index) => ({
  qid: `normal-owner-technical-${index}`, t: 'Isolamento técnico', cat: 'geral', diff: 'medium',
  q: `Questão técnica ${index}: confira a conservação da sessão entre identidades locais.`,
  opts: ['Alternativa técnica A', 'Alternativa técnica B', 'Alternativa técnica C', 'Alternativa técnica D'],
  ans: index % 4, exp: 'Explicação exclusivamente técnica para validar navegação e armazenamento.', refs: [],
}));
const diagnostics = new WeakMap<Page, { errors: string[]; blocked: string[]; sockets: number }>();

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  expect(['localhost', '127.0.0.1']).toContain(new URL(origin).hostname);
  const observed = { errors: [] as string[], blocked: [] as string[], sockets: 0 };
  diagnostics.set(page, observed);
  page.on('pageerror', error => observed.errors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (request.method() !== 'GET' || url.origin !== origin || ['image', 'media', 'font'].includes(request.resourceType())) {
      observed.blocked.push(request.method() + ' ' + url.origin + url.pathname);
      return route.abort();
    }
    if (url.pathname === '/data/refs.js') return route.fulfill({ contentType: 'application/javascript', body: 'const refsDB = {};' });
    if (url.pathname === '/data/articles.js') return route.fulfill({ contentType: 'application/javascript', body: 'const nefroArticles = [];' });
    return route.continue();
  });
  await context.routeWebSocket('**/*', socket => { observed.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, authors);
  await page.addInitScript(user => {
    const fixture: any = (window as any).__normalOwnerSdk = {
      user, callback: null, signOutCalls: 0, events: [], reads: [],
    };
    const client = {
      auth: {
        onAuthStateChange(callback: any) { fixture.callback = callback; return { data: { subscription: { unsubscribe() {} } } }; },
        getSession: async () => ({ data: { session: fixture.user ? { user: fixture.user, access_token: 'technical-local-session' } : null }, error: null }),
        signOut: async () => {
          fixture.signOutCalls++;
          fixture.user = null;
          fixture.events.push('SIGNED_OUT');
          await fixture.callback('SIGNED_OUT', null);
          return { error: null };
        },
      },
      // No remote profile/cloud is supplied. The real loaders take their normal
      // unavailable-backend path; no application persistence API is replaced.
      from(table: string) {
        let columns = ''; const filters: Record<string, unknown> = {};
        const finish = async () => {
          fixture.reads.push({ table, columns, filters: { ...filters } });
          return { data: null, error: { message: 'Technical fixture has no remote backend' } };
        };
        const query: any = {
          select(value: string) { columns = value; return query; },
          eq(key: string, value: unknown) { filters[key] = value; return query; },
          single: finish, maybeSingle: finish,
          then: (resolve: any, reject: any) => finish().then(resolve, reject),
        };
        return query;
      },
    };
    (window as any).supabase = { createClient: () => client };
  }, USER_A);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await readyOwner(page, USER_A.id);
});

test.afterEach(async ({ page }, info) => {
  if (page.isClosed()) return;
  const runtime = await page.evaluate(keys => {
    const fixture = (window as any).__normalOwnerSdk;
    return {
      owner: (window as any).authUser?.id ?? null,
      domain: (window as any).NQPilot?.captureBinding(),
      physical: Object.fromEntries(Object.values(keys).map(key => [key, localStorage.getItem(key)])),
      sdk: { user: fixture.user, signOutCalls: fixture.signOutCalls, events: fixture.events, reads: fixture.reads },
    };
  }, KEYS);
  await info.attach('normal-mode-owner-boundary', { contentType: 'application/json',
    body: JSON.stringify({ runtime, transport: diagnostics.get(page), realAccountsOrBackend: false }, null, 2) });
  if (info.status === info.expectedStatus) expect(diagnostics.get(page)?.errors).toEqual([]);
});

async function readyOwner(page: Page, owner: string) {
  await page.waitForFunction(owner => (window as any).authUser?.id === owner && typeof (window as any).__normalOwnerSdk?.callback === 'function', owner);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.locator('#landingScreen')).toBeHidden();
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
  await page.evaluate(async () => { await (window as any)._loadTopics(); await (window as any)._loadProgressFromCloud(); });
}

async function physicalRows(page: Page) {
  return page.evaluate(keys => Object.fromEntries(Object.values(keys).map(key => [key, localStorage.getItem(key)])), KEYS);
}

async function openMode(page: Page, mode: Mode) {
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator(`[data-mode-route="${mode}"]:visible`).click();
  if (mode === 'study') await expect(page.locator('.study-mode-popup h1')).toHaveText('Estudo e Revisão');
  else await expect(page.locator('#examTitulo')).toBeVisible();
}

async function startAnswerAndPause(page: Page, mode: Mode) {
  await openMode(page, mode);
  if (mode === 'study') {
    await page.getByRole('button', { name: 'Iniciar estudo livre', exact: true }).click();
    await page.locator('#studyOptions button').first().click();
    await expect(page.locator('#studyFeedback')).toBeFocused();
    await expect(page.locator('#studyOptions button:disabled')).toHaveCount(4);
    await page.getByRole('button', { name: 'Pausar e voltar', exact: true }).click();
    await expect(page.locator('#studyModePage')).toHaveCount(0);
  } else {
    await page.getByLabel('Quantidade de questões', { exact: true }).fill('2');
    await page.getByLabel('Tempo total em minutos', { exact: true }).fill('3');
    await page.getByRole('button', { name: 'Começar prova', exact: true }).click();
    await page.locator('#examOpts button').first().click();
    await expect(page.locator('#examCorrecao')).toContainText('Resposta registrada');
    await page.getByRole('button', { name: 'Sair e continuar depois', exact: true }).click();
    await expect(page.locator('#examPage')).toHaveCount(0);
  }
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  const rows = await physicalRows(page), raw = rows[KEYS[mode]];
  expect(raw).not.toBeNull();
  const saved = JSON.parse(raw!);
  if (mode === 'study') {
    expect(saved.index).toBe(1);
    expect(saved.presentations.filter((entry: any) => entry.answer)).toHaveLength(1);
    expect([...saved.questions].sort()).toEqual(authors.map(author => author.qid).sort());
  } else {
    expect(saved.idx).toBe(0);
    expect(saved.answers.filter((answer: any) => answer?.answered)).toHaveLength(1);
    expect(saved.questions.every((question: any) => authors.some(author => author.qid === question.id))).toBe(true);
  }
  expect(await page.evaluate(() => (window as any).NQPilot.captureBinding().domain)).toBe('normal');
  return { rows, raw: raw!, saved };
}

const resumeButton = (page: Page, mode: Mode) => page.getByRole('button', {
  name: mode === 'study' ? 'Retomar estudo' : 'Retomar prova', exact: true,
});

async function resumedState(page: Page, mode: Mode) {
  if (mode === 'study') return page.evaluate(() => (0, eval)(`({
    index: studyModeIndex, questions: studyModeQuestions.map(q => q.qid),
    answers: _studyAnswers, correct: studyModeCorrect, wrong: studyModeWrong
  })`));
  return page.evaluate(() => (0, eval)(`({
    index: _examState.idx, questions: _examState.questions.map(q => q.id), answers: _examState.answers
  })`));
}

for (const mode of ['study', 'exam'] as const) {
  test(`${mode}: pausa e reload da mesma conta preservam a retomada nativa`, async ({ page }, info) => {
    const before = await startAnswerAndPause(page, mode);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await readyOwner(page, USER_A.id);
    expect(await physicalRows(page)).toEqual(before.rows);
    await openMode(page, mode);
    await expect(resumeButton(page, mode)).toBeVisible();
    await resumeButton(page, mode).click();
    if (mode === 'study') await expect(page.locator('#studyProgress')).toHaveText('2');
    else await expect(page.locator('#examCorrecao')).toContainText('Resposta registrada');
    const restored = await resumedState(page, mode);
    expect(restored.questions).toEqual(mode === 'study' ? before.saved.questions : before.saved.questions.map((question: any) => question.id));
    expect(restored.index).toBe(mode === 'study' ? before.saved.index : before.saved.idx);
    expect(restored.answers).toEqual(mode === 'study' ? before.saved.presentations.map((entry: any) => entry.answer) : before.saved.answers);
    expect(restored.answers.filter((answer: any) => mode === 'study' ? !!answer : answer?.answered)).toHaveLength(1);
    expect(await physicalRows(page)).toEqual(before.rows);
    await info.attach('same-owner-native-resume', { contentType: 'application/json', body: JSON.stringify({ mode, before, restored }) });
  });

  test(`${mode}: logout nativo remove a tentativa de A e B não recebe sua retomada`, async ({ page }, info) => {
    const before = await startAnswerAndPause(page, mode);
    await page.locator('#welcomeProfileBtn').click();
    await page.locator('#welcomeProfilePopup.open').getByRole('button', { name: 'Sair', exact: true }).click();
    await expect(page.locator('#landingScreen')).toBeVisible();
    expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
    expect(await page.evaluate(() => (window as any).__normalOwnerSdk.signOutCalls)).toBe(1);
    const afterLogout = await physicalRows(page);

    // Emit B through the SDK boundary captured by the real Auth controller.
    // No auth/logout/application handler or saved state is replaced here.
    await page.evaluate(user => {
      const fixture = (window as any).__normalOwnerSdk;
      fixture.user = user;
      fixture.events.push('SIGNED_IN');
      return fixture.callback('SIGNED_IN', { user });
    }, USER_B);
    await readyOwner(page, USER_B.id);
    const afterLogin = await physicalRows(page);
    await openMode(page, mode);
    const offeredResume = await resumeButton(page, mode).count() > 0;
    let inherited: Awaited<ReturnType<typeof resumedState>> | null = null;
    if (offeredResume) {
      await resumeButton(page, mode).click();
      if (mode === 'study') await expect(page.locator('#studyProgress')).toHaveText('2');
      else await expect(page.locator('#examCorrecao')).toContainText('Resposta registrada');
      inherited = await resumedState(page, mode);
    }
    await info.attach('native-logout-owner-transition', { contentType: 'application/json',
      body: JSON.stringify({ mode, before, afterLogout, afterLogin, offeredResume, inherited }) });
    expect({
      afterLogout: afterLogout[KEYS[mode]],
      afterLogin: afterLogin[KEYS[mode]],
      offeredResume,
      inheritedAnswers: inherited?.answers.filter((answer: any) => mode === 'study' ? !!answer : answer?.answered) || [],
    }, 'Native logout must remove A\'s snapshot before B can resume its questions or answers').toEqual({
      afterLogout: null, afterLogin: null, offeredResume: false, inheritedAnswers: [],
    });
  });
}
