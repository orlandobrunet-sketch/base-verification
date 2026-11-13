import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

// Exercise native Dashboard/Study actions after an actual script download
// failure. Only authored technical data and the transport gate are fixtures.
const authors = Array.from({ length: 6 }, (_, index) => ({
  qid: `dashboard-intent-technical-${index}`, t: 'Fluxo técnico',
  cat: index < 3 ? 'drc' : 'dialise', diff: 'medium',
  q: `Questão técnica ${index}: confira a origem desta sessão.`,
  opts: ['Opção técnica A', 'Opção técnica B', 'Opção técnica C', 'Opção técnica D'],
  ans: index % 4, exp: 'Explicação exclusivamente técnica para verificar a navegação.', refs: [],
}));
const RETRY_ERROR = 'Não foi possível carregar as questões.';
type Intent = 'explore' | 'area';
type Scenario = 'close' | 'reopen' | 'success' | 'closed-failure';
type Observation = {
  pageerrors: string[]; blockedNonGet: string[]; nonGetResponses: string[];
  blockedExternal: string[]; sockets: number;
};
const observations = new WeakMap<Page, Observation>();

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  expect(['localhost', '127.0.0.1', 'nefroquest.com']).toContain(new URL(origin).hostname);
  const observation: Observation = { pageerrors: [], blockedNonGet: [], nonGetResponses: [], blockedExternal: [], sockets: 0 };
  observations.set(page, observation);
  page.on('pageerror', error => observation.pageerrors.push(error.message));
  page.on('response', response => {
    if (response.request().method() !== 'GET') observation.nonGetResponses.push(response.url());
  });
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') {
      observation.blockedNonGet.push(request.method() + ' ' + url.origin + url.pathname);
      return route.abort();
    }
    if (url.origin !== origin) {
      observation.blockedExternal.push(url.origin + url.pathname);
      return route.abort();
    }
    if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort();
    if (url.pathname === '/data/refs.js') return route.fulfill({ contentType: 'application/javascript', body: 'const refsDB = {};' });
    if (url.pathname === '/data/articles.js') return route.fulfill({ contentType: 'application/javascript', body: 'const nefroArticles = [];' });
    return route.continue();
  });
  await context.routeWebSocket('**/*', socket => { observation.sockets++; socket.close(); });
  await page.addInitScript(() => {
    const observation = (window as any).__dashboardIntentObservation = { topicEvents: [] as string[], toasts: [] as string[] };
    const scriptEvent = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLScriptElement && target.src && new URL(target.src).pathname === '/data/topics.js') {
        observation.topicEvents.push(event.type);
      }
    };
    window.addEventListener('load', scriptEvent, true);
    window.addEventListener('error', scriptEvent, true);
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(records => {
        for (const record of records) for (const added of record.addedNodes) {
          if (!(added instanceof Element)) continue;
          const toasts = [...(added.matches('.nq-toast') ? [added] : []), ...added.querySelectorAll('.nq-toast')];
          toasts.forEach(toast => observation.toasts.push(toast.textContent || ''));
        }
      }).observe(document.body, { childList: true, subtree: true });
    }, { once: true });
  });
});

test.afterEach(async ({ page }, info) => {
  await info.attach('dashboard-intent-transport', { contentType: 'application/json',
    body: JSON.stringify({ ...observations.get(page), intentionalTopicsDownloadFailure: true }) });
  if (info.status === info.expectedStatus) {
    expect(observations.get(page)?.pageerrors).toEqual([]);
    expect(observations.get(page)?.nonGetResponses).toEqual([]);
  }
});

async function prepare(page: Page) {
  await routeTechnicalQuestionBank(page, authors);
  let retryEnabled = false, requests = 0, initialFailures = 0, held = 0, settled = 0;
  let release!: () => void, finishRoute!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const routeFinished = new Promise<void>(resolve => { finishRoute = resolve; });
  let retryFails = false;
  await page.route('**/data/topics.js*', async route => {
    requests++;
    if (!retryEnabled) { initialFailures++; await route.abort('failed'); return; }
    held++;
    await gate;
    try {
      if (retryFails) await route.abort('failed');
      else await route.fulfill({ contentType: 'application/javascript', body: 'const topics = ' + JSON.stringify(authors) + ';' });
    } finally { settled++; finishRoute(); }
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  await page.locator('[data-atrium-route="dashboard"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect(page.locator('#nqDashboard .nqd-notice')).toContainText('Alguns dados não carregaram');
  expect(initialFailures).toBeGreaterThan(0);
  // Guest's native warm-up may share the first failed request with Dashboard.
  // Its exact request count is not a prerequisite of this lifecycle contract.
  await page.locator('#nqDashboard [data-dash-tab="skills"]').click();
  const errorsBeforeRetry = await page.evaluate(() => (window as any).__dashboardIntentObservation.topicEvents.filter((event: string) => event === 'error').length);
  return {
    begin(fail: boolean) { retryFails = fail; retryEnabled = true; },
    release,
    async dispose() { release(); if (held) await routeFinished; },
    async settle() {
      await routeFinished;
      if (retryFails) {
        await page.waitForFunction(before => (window as any).__dashboardIntentObservation.topicEvents.filter((event: string) => event === 'error').length > before
          && (0, eval)('_topicsPromise') === null, errorsBeforeRetry);
      } else {
        await page.waitForFunction(count => !!(window as any).questionRevisionCatalog && (window as any).questionBank?.length === count, authors.length);
      }
      // These signals are emitted by the native script handler/catalog. The
      // next browser task observes its await continuations after microtasks drain.
    },
    stats: () => ({ requests, initialFailures, held, settled, retryFails }),
  };
}

async function beginIntent(page: Page, intent: Intent) {
  if (intent === 'explore') {
    await page.locator('#nqDashboard .nqs-atlas-header [data-action="_dashExploreSkills"]').click();
  } else {
    await page.locator('#nqDashboard [data-nqs-card][data-skill-id="drc_nefroprotecao"]').click();
    await page.locator('#nqDashboard [data-nqs-detail]:visible [data-action="_dashTrainCategories"][data-arg="drc"]').click();
  }
}

async function closePanel(page: Page) {
  await page.locator('#nqDashboard button[aria-label="Voltar ao Átrio"]').click();
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
}

async function snapshot(page: Page) {
  return page.evaluate(errorCopy => {
    const welcome = document.getElementById('welcomeScreen')!;
    const panel = document.getElementById('nqDashboard');
    const observation = (window as any).__dashboardIntentObservation;
    return {
      dashboardCount: document.querySelectorAll('#nqDashboard').length,
      dashboardState: panel?.dataset.dashboardState || null,
      selectorCount: document.querySelectorAll('.study-mode-popup').length,
      studyCount: document.querySelectorAll('#studyModePage').length,
      welcomeVisible: !!welcome.getClientRects().length && getComputedStyle(welcome).visibility !== 'hidden',
      welcomeInert: welcome.inert,
      studyRaw: localStorage.getItem('nefroquest-study-state'),
      selectedAxes: [...(window as any)._studySelectedAxes],
      topicEvents: [...observation.topicEvents],
      retryErrorToasts: observation.toasts.filter((text: string) => text === errorCopy),
    };
  }, RETRY_ERROR);
}

const scenarios: { id: Scenario; title: string }[] = [
  { id: 'close', title: 'fechar cancela a abertura após o download terminar' },
  { id: 'reopen', title: 'fechar e reabrir preserva o novo Painel' },
  { id: 'success', title: 'manter o Painel aberto conclui a ação pedida' },
  { id: 'closed-failure', title: 'falha depois de fechar não publica toast tardio' },
];

for (const intent of ['explore', 'area'] as const) for (const scenario of scenarios) {
  test(`${intent === 'explore' ? 'Escolher temas' : 'Estudar área'}: ${scenario.title}`, async ({ page }, info: TestInfo) => {
    const fixture = await prepare(page);
    try {
      const before = await snapshot(page);
      expect(before.studyRaw).toBeNull();
      expect(before.selectedAxes).toEqual([]);
      fixture.begin(scenario.id === 'closed-failure');
      await beginIntent(page, intent);
      await expect.poll(() => fixture.stats().held).toBe(1);
      let replacement = null;
      if (scenario.id !== 'success') await closePanel(page);
      if (scenario.id === 'reopen') {
        await page.locator('[data-atrium-route="dashboard"]').click();
        await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'loading');
        replacement = await page.locator('#nqDashboard').elementHandle();
        expect(replacement).not.toBeNull();
      }
      const beforeSettlement = await snapshot(page);
      fixture.release();
      await fixture.settle();
      const after = await snapshot(page);
      const replacementStillCurrent = replacement ? await replacement.evaluate(element => element.isConnected && element === document.getElementById('nqDashboard')) : null;
      await info.attach('dashboard-native-study-intent', { contentType: 'application/json',
        body: JSON.stringify({ intent, scenario: scenario.id, transport: fixture.stats(), before, beforeSettlement, after, replacementStillCurrent }) });
      expect(fixture.stats().held).toBe(1);
      expect(fixture.stats().settled).toBe(1);
      if (scenario.id === 'success') {
        await expect(page.locator('#nqDashboard')).toHaveCount(0);
        if (intent === 'explore') {
          await expect(page.getByRole('heading', { name: 'Escolha os temas', exact: true })).toBeVisible();
          await expect(page.locator('.study-mode-popup [data-action="showTopicSelector"]')).toBeFocused();
          expect(after.selectorCount).toBe(1);
          expect(after.studyCount).toBe(0);
          expect(after.studyRaw).toBeNull();
        } else {
          await expect(page.locator('#studyOptions button:not(:disabled)')).toHaveCount(4);
          await expect(page.getByRole('button', { name: 'Pausar e voltar', exact: true })).toBeFocused();
          const questions = await page.evaluate(() => (0, eval)('studyModeQuestions.map(q => ({id:q.qid,cat:q.cat}))'));
          expect(questions).toHaveLength(3);
          expect(questions.every((question: any) => question.cat === 'drc' && authors.slice(0, 3).some(author => author.qid === question.id))).toBe(true);
          expect(after.selectedAxes).toEqual(['drc']);
          expect(after.selectorCount).toBe(0);
          expect(after.studyCount).toBe(1);
          expect(after.studyRaw).not.toBeNull();
        }
      } else {
        expect({
          selectorCount: after.selectorCount, studyCount: after.studyCount,
          studyRaw: after.studyRaw, selectedAxes: after.selectedAxes,
          retryErrorToasts: after.retryErrorToasts,
        }).toEqual({ selectorCount: 0, studyCount: 0, studyRaw: null, selectedAxes: before.selectedAxes,
          retryErrorToasts: beforeSettlement.retryErrorToasts });
        if (scenario.id === 'reopen') {
          expect(replacementStillCurrent, 'The abandoned action must not remove the newly opened Dashboard').toBe(true);
          await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
          expect(after.dashboardCount).toBe(1);
        } else {
          expect(after.dashboardCount).toBe(0);
          expect(after.welcomeVisible).toBe(true);
          expect(after.welcomeInert).toBe(false);
        }
      }
    } finally { await fixture.dispose(); }
  });
}
