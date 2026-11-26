import {test, expect, type Page} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';

test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'reduce'}});
type Surface = 'oracle' | 'diagnosis';
type Phase = 'token' | 'headers' | 'json' | 'pipeline' | 'success' | 'error';
const owner = '00000000-0000-4000-8000-000000000a17';
const draft = 'Dúvida técnica que deve continuar disponível.';
const reply = 'Resposta técnica da nova tentativa.';
const lateReply = 'Resposta antiga que não pode reaparecer.';
const audit = new WeakMap<Page, {errors: string[]; nonGET: string[]; sockets: number}>();

test.beforeEach(async ({page, context, baseURL}) => {
  const origin = new URL(baseURL!).origin;
  const record = {errors: [] as string[], nonGET: [] as string[], sockets: 0};
  audit.set(page, record);
  page.on('pageerror', error => record.errors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (request.method() === 'GET' && url.origin === origin) return route.continue();
    if (request.method() !== 'GET') record.nonGET.push(request.method() + ' ' + url.pathname);
    return route.abort();
  });
  await context.routeWebSocket('**/*', socket => { record.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, Array.from({length: 4}, (_, i) => ({
    qid: 'ai-recovery-technical-' + i, q: 'Exercício técnico de recuperação ' + i,
    opts: ['Opção A', 'Opção B', 'Opção C', 'Opção D'], ans: 0,
    exp: 'Fixture técnica sem conteúdo médico.', cat: 'geral', diff: 'medium',
  })));
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await injectGameState(page, {gold: 0}, {authUser: {id: owner, app_metadata: {}}});
});

test.afterEach(async ({page}, info) => {
  await info.attach('ai-request-recovery-audit', {contentType: 'application/json',
    body: JSON.stringify(audit.get(page))});
  expect(audit.get(page)).toEqual({errors: [], nonGET: [], sockets: 0});
});

async function prepare(page: Page, surface: Surface) {
  if (surface === 'oracle') {
    const wrong = await page.evaluate(() => (0, eval)('(state.current.a + 1) % state.current.o.length'));
    await page.locator(`#options .option[data-idx="${wrong}"]`).click();
    await page.locator('[data-action="openOraculoFromJourney"]:visible').first().click();
    await expect(page.locator('#mentorInput')).toBeEnabled();
  } else {
    await page.evaluate(async () => {
      await (window as any).startFreeStudyMode();
      (0, eval)('studyModeQuestions = studyModeQuestions.slice(0, 1); showStudyModePage();');
    });
    await page.locator('#studyOptions button').first().click();
    await expect(page.getByRole('button', {name: 'Ver Resultados', exact: true})).toBeVisible();
  }
}

async function freeze(page: Page) {
  await page.clock.install({time: new Date('2032-04-02T12:00:00Z')});
  await page.clock.pauseAt(new Date('2032-04-02T12:00:01Z'));
}

async function boundary(page: Page, surface: Surface, phase: Phase, status = 200) {
  await page.evaluate(({surface, phase, status, reply, lateReply}) => {
    const w = window as any, suffix = surface === 'oracle' ? '/ai-mentor' : '/ai-diagnosis';
    const nativeFetch = window.fetch;
    const holds: Record<string, () => void> = {};
    const state = {mode: phase, status, entered: '', tokenCalls: 0, fetchCalls: 0, aborts: 0,
      requests: [] as any[]};
    const payload = (text: string) => surface === 'oracle' ? {reply: text} : {diagnosis: text};
    function response(text: string, holdJSON: boolean, code = 200) {
      const body = code === 200 ? payload(text) : {error: code === 429 ? 'quota_exceeded' : 'unavailable'};
      if (!holdJSON) return new Response(JSON.stringify(body), {status: code,
        headers: {'Content-Type': 'application/json'}});
      // Native Response.json() waits for a real stream that deliberately ignores abort.
      const stream = new ReadableStream<Uint8Array>({start(controller) {
        state.entered = 'json';
        controller.enqueue(new TextEncoder().encode('{'));
        holds.json = () => { controller.enqueue(new TextEncoder().encode(JSON.stringify(body).slice(1))); controller.close(); };
      }});
      return new Response(stream, {headers: {'Content-Type': 'application/json'}});
    }
    w.getAuthToken = () => {
      state.tokenCalls++;
      if (state.mode === 'token' || state.mode === 'pipeline') {
        state.entered = 'token';
        return new Promise(resolve => { holds.token = () => resolve('synthetic-token'); });
      }
      return Promise.resolve('synthetic-token');
    };
    window.fetch = (async (input: any, init: any) => {
      if (!String(input).endsWith(suffix)) return nativeFetch(input, init);
      state.fetchCalls++;
      state.requests.push(JSON.parse(init.body));
      init.signal.addEventListener('abort', () => { state.aborts++; }, {once: true});
      const mode = state.mode;
      if (mode === 'headers' || mode === 'pipeline') {
        state.entered = 'headers';
        return new Promise<Response>(resolve => {
          holds.headers = () => resolve(response(lateReply, mode === 'pipeline'));
        });
      }
      return response(mode === 'json' ? lateReply : reply, mode === 'json', state.status);
    }) as typeof fetch;
    w.__aiRecovery = {state, release: (stage: string) => { const release = holds[stage]; delete holds[stage]; release?.(); },
      mode: (mode: string, code = 200) => { state.mode = mode; state.status = code; }};
  }, {surface, phase, status, reply, lateReply});
}

async function send(page: Page, surface: Surface) {
  if (surface === 'oracle') {
    await page.locator('#mentorInput').fill(draft);
    await page.locator('#mentorInput').press('Enter');
  } else await page.getByRole('button', {name: 'Ver Resultados', exact: true}).click();
}
const entered = (page: Page, phase: string) => expect.poll(() => page.evaluate(() =>
  (window as any).__aiRecovery.state.entered)).toBe(phase);
const release = (page: Page, phase: string) => page.evaluate(phase => (window as any).__aiRecovery.release(phase), phase);
const calls = (page: Page) => page.evaluate(() => ({...(window as any).__aiRecovery.state}));
const quota = (page: Page, surface: Surface) => page.evaluate(surface =>
  (0, eval)(surface === 'oracle' ? '_getMentorQuota().count' : '_getDiagQuota().count'), surface);
async function busy(page: Page, surface: Surface) {
  if (surface === 'oracle') {
    await expect(page.locator('#mentorInput')).toBeDisabled();
    await expect(page.locator('.mentor-thinking')).toHaveCount(1);
  } else await expect(page.locator('#aiDiagnosisCard')).toHaveAttribute('aria-busy', 'true');
}
async function failed(page: Page, surface: Surface) {
  if (surface === 'oracle') {
    await expect(page.locator('#mentorInput')).toBeEnabled({timeout: 1500});
    await expect(page.locator('.mentor-send-btn')).toBeEnabled();
    await expect(page.locator('#mentorInput')).toHaveValue(draft);
    await expect(page.locator('.mentor-thinking')).toHaveCount(0);
    await expect(page.locator('#mentorChat')).toContainText(/demorou|tempo/i);
  } else {
    await expect(page.locator('#aiDiagnosisCard')).toHaveAttribute('data-estado', 'falha', {timeout: 1500});
    await expect(page.locator('#aiDiagnosisCard')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('[data-action="tentarDiagnosticoNovamente"]')).toBeVisible();
    await expect(page.locator('#aiDiagnosisCard')).not.toContainText(/nenhum diagnóstico.*descontado/i);
  }
}
async function ready(page: Page, surface: Surface) {
  if (surface === 'oracle') {
    await expect(page.locator('#mentorChat')).toContainText(reply);
    await expect(page.locator('#mentorInput')).toBeEnabled();
  } else await expect(page.locator('#aiDiagnosisCard')).toHaveAttribute('data-estado', 'pronto');
}

for (const surface of ['oracle', 'diagnosis'] as const) {
  for (const phase of ['token', 'headers', 'json'] as const) {
    test(`${surface}: ${phase} pending recovers once at the local deadline and manual retry rejects old delivery`, async ({page}) => {
      await prepare(page, surface); await freeze(page); await boundary(page, surface, phase);
      await send(page, surface); await entered(page, phase); await busy(page, surface);
      await page.clock.runFor(29000); await busy(page, surface);
      await page.clock.runFor(1000); await failed(page, surface);
      expect(await quota(page, surface)).toBe(0);
      expect((await calls(page)).fetchCalls).toBe(phase === 'token' ? 0 : 1);
      await release(page, phase);
      await page.evaluate(() => Promise.resolve());
      await expect(page.locator(surface === 'oracle' ? '#mentorChat' : '#aiDiagnosisCard')).not.toContainText(lateReply);
      expect(await quota(page, surface)).toBe(0);
      expect((await calls(page)).fetchCalls).toBe(phase === 'token' ? 0 : 1);
      await page.evaluate(() => (window as any).__aiRecovery.mode('success'));
      if (surface === 'oracle') await page.locator('#mentorInput').press('Enter');
      else {
        await page.locator('[data-action="tentarDiagnosticoNovamente"]').click();
        await page.evaluate(() => (window as any).tentarDiagnosticoNovamente());
      }
      await ready(page, surface);
      expect(await quota(page, surface)).toBe(1);
      expect((await calls(page)).fetchCalls).toBe(phase === 'token' ? 1 : 2);
    });
  }

  test(`${surface}: one deadline includes token, headers and JSON instead of restarting at each stage`, async ({page}) => {
    await prepare(page, surface); await freeze(page); await boundary(page, surface, 'pipeline');
    await send(page, surface); await entered(page, 'token');
    await page.clock.runFor(10000); await release(page, 'token'); await entered(page, 'headers');
    await page.clock.runFor(10000); await release(page, 'headers'); await entered(page, 'json');
    await page.clock.runFor(9999); await busy(page, surface);
    await page.clock.runFor(1); await failed(page, surface);
    await release(page, 'json'); await page.evaluate(() => Promise.resolve());
    expect(await quota(page, surface)).toBe(0);
    expect((await calls(page)).fetchCalls).toBe(1);
    await expect(page.locator(surface === 'oracle' ? '#mentorChat' : '#aiDiagnosisCard')).not.toContainText(lateReply);
  });

  for (const status of [500, 429]) test(`${surface}: HTTP ${status} settles without automatic retry or a refund promise`, async ({page}) => {
    await prepare(page, surface); await freeze(page); await boundary(page, surface, 'error', status);
    await send(page, surface);
    if (surface === 'oracle') {
      await expect(page.locator('#mentorInput')).toBeEnabled();
      await expect(page.locator('#mentorInput')).toHaveValue(draft);
      await expect(page.locator('#mentorChat')).toContainText(status === 429 ? 'Limite diário' : 'Oráculo indisponível');
    } else {
      await expect(page.locator('#aiDiagnosisCard')).toHaveAttribute('data-estado', status === 429 ? 'recusado' : 'falha');
      await expect(page.locator('#aiDiagnosisCard')).toHaveAttribute('aria-busy', 'false');
      await expect(page.locator('#aiDiagnosisCard')).not.toContainText(/nenhum diagnóstico.*descontado/i);
    }
    await page.clock.runFor(60000);
    expect((await calls(page)).fetchCalls).toBe(1);
    expect(await quota(page, surface)).toBe(status === 429 ? (surface === 'oracle' ? 5 : 3) : 0);
  });
}

test('oracle: close and reopen preserves conversation and draft until the original deadline', async ({page}) => {
  await prepare(page, 'oracle'); await freeze(page); await boundary(page, 'oracle', 'success');
  await send(page, 'oracle'); await ready(page, 'oracle');
  await page.evaluate(() => (window as any).__aiRecovery.mode('headers'));
  await send(page, 'oracle'); await entered(page, 'headers');
  const history = [{role: 'user', content: draft}, {role: 'assistant', content: reply}];
  await page.locator('#oraclePage [data-action="closeMentorModal"]').click();
  await expect(page.locator('#oraclePage')).toBeHidden();
  expect((await calls(page)).aborts).toBe(0);
  await page.locator('[data-action="openOraculoFromJourney"]:visible').first().click();
  await busy(page, 'oracle');
  await page.clock.runFor(30000); await failed(page, 'oracle');
  expect(await page.evaluate(() => (0, eval)('_mentorHistory'))).toEqual(history);
  expect(await quota(page, 'oracle')).toBe(1);
  await page.evaluate(() => (window as any).__aiRecovery.mode('success'));
  await page.locator('#mentorInput').press('Enter'); await ready(page, 'oracle');
  await release(page, 'headers'); await page.evaluate(() => Promise.resolve());
  await expect(page.locator('#mentorChat')).not.toContainText(lateReply);
  expect(await quota(page, 'oracle')).toBe(2);
  expect((await calls(page)).requests[2].history).toEqual(history);
});

test('oracle: changing the question settles a token promise that ignores abort without a late call', async ({page}) => {
  await prepare(page, 'oracle'); await freeze(page); await boundary(page, 'oracle', 'token');
  await send(page, 'oracle'); await entered(page, 'token');
  const owned = await page.evaluateHandle(() => ({input: document.getElementById('mentorInput') as HTMLInputElement,
    controller: (0, eval)('_mentorRequestController')}));
  await page.locator('#oraclePage [data-action="closeMentorModal"]').click();
  await page.locator('#nextBtn').click();
  await expect(page.locator('#oraclePage')).toHaveCount(0);
  expect(await owned.evaluate(ref => ref.controller.signal.aborted)).toBe(true);
  await expect.poll(() => owned.evaluate(ref => ref.input.disabled), {timeout: 1500}).toBe(false);
  await release(page, 'token'); await page.evaluate(() => Promise.resolve());
  expect((await calls(page)).fetchCalls).toBe(0);
  expect(await quota(page, 'oracle')).toBe(0);
  await owned.dispose();
});

for (const leave of ['exit', 'context'] as const) test(`diagnosis: ${leave} retires an uncooperative token operation before a different context can receive it`, async ({page}) => {
  await prepare(page, 'diagnosis'); await freeze(page); await boundary(page, 'diagnosis', 'token');
  await send(page, 'diagnosis'); await entered(page, 'token');
  const owned = await page.evaluateHandle(() => {
    const entry = (0, eval)('[..._diagPorSessao.values()].find(row => row.promessa)');
    const ref = {controller: (0, eval)('[..._studyDiagnosisControllers][0]'), settled: false, value: null as any};
    entry.promessa.then((value: any) => {ref.settled = true; ref.value = value;});
    return ref;
  });
  if (leave === 'exit') await page.locator('#studyModePage .nq-study-results [data-action="exitStudyMode"]').click();
  else await page.evaluate(() => (window as any).NQPilot.release());
  await expect(page.locator('#studyModePage')).toHaveCount(0);
  expect(await owned.evaluate(ref => ref.controller.signal.aborted)).toBe(true);
  await expect.poll(() => owned.evaluate(ref => ref.settled), {timeout: 1500}).toBe(true);
  expect(await owned.evaluate(ref => ref.value)).toEqual({estado: 'cancelado'});
  expect(await page.evaluate(() => (0, eval)('[..._diagPorSessao.values()].filter(row => row.promessa).length'))).toBe(0);
  await release(page, 'token'); await page.evaluate(() => Promise.resolve());
  expect((await calls(page)).fetchCalls).toBe(0);
  expect(await quota(page, 'diagnosis')).toBe(0);
  await expect(page.locator('#aiDiagnosisCard')).toHaveCount(0);
  await owned.dispose();
});

test('diagnosis: an expired session is recoverable through login and does not consume local quota', async ({page}) => {
  await prepare(page, 'diagnosis'); await freeze(page); await boundary(page, 'diagnosis', 'error', 401);
  await send(page, 'diagnosis');
  await expect(page.locator('#aiDiagnosisCard')).toHaveAttribute('data-estado', 'sessao');
  await expect(page.locator('#aiDiagnosisCard')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('[data-action="showLoginFromDiagnosis"]')).toBeVisible();
  expect(await quota(page, 'diagnosis')).toBe(0);
  expect((await calls(page)).fetchCalls).toBe(1);
});

for (const {surface, phase} of [
  {surface: 'oracle', phase: 'token'}, {surface: 'diagnosis', phase: 'json'},
] as const) test(`${surface}: Premium timeout restores controls without daily quota or upgrade copy`, async ({page}) => {
  await injectGameState(page, {gold: 0}, {authUser: {id: owner}});
  // Stub only the authenticated profile read, not the Premium predicate.
  await page.evaluate(async () => {
    const g = (0, eval);
    const original = g('_supaClient');
    const fixture = (window as any).__restorePremiumTestClient = {
      ...original, from: () => ({select: () => ({eq: () => ({
        single: async () => ({data:{is_premium:true, premium_expires_at:null},error:null})
      })})}),
    };
    g('_supaClient = window.__restorePremiumTestClient');
    try { await g('_loadPremiumFromDB()'); }
    finally {
      (window as any).__restorePremiumTestClient = original;
      g('_supaClient = window.__restorePremiumTestClient');
      delete (window as any).__restorePremiumTestClient;
    }
  });
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(true);
  await prepare(page, surface); await freeze(page); await boundary(page, surface, phase);
  await send(page, surface); await entered(page, phase);
  await page.clock.runFor(30000); await failed(page, surface);
  await expect(page.locator(surface === 'oracle' ? '#mentorPanel' : '#aiDiagnosisCard'))
    .not.toContainText(/limite diário|restantes hoje|upgrade|cota/i);
  expect(await quota(page, surface)).toBe(0);
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(true);
});
