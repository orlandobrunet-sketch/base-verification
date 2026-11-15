import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const audits = new WeakMap<Page, { errors: string[]; writes: string[]; sockets: number }>();

async function pauseClock(page: Page) {
  const start = Date.UTC(2026, 10, 15, 15);
  await page.clock.install({ time: start - 1000 });
  await page.clock.pauseAt(start);
}

test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const audit = { errors: [] as string[], writes: [] as string[], sockets: 0 };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (request.method() !== 'GET') audit.writes.push(request.method() + ' ' + url.pathname);
    return request.method() === 'GET' && url.origin === origin ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, [{
    qid: 'report-deadline-technical', q: 'Exercício técnico de continuidade', opts: ['A', 'B', 'C', 'D'],
    ans: 0, exp: 'Explicação técnica.', cat: 'geral', diff: 'medium'
  }]);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 }, { authUser: { id: 'report-deadline-owner', app_metadata: {} } });
  const wrong = await page.evaluate(() => (0, eval)('(state.current.a+1)%state.current.o.length'));
  await page.locator(`#options .option[data-idx="${wrong}"]`).click();
  await page.locator('.nql-review-report').click();
  await expect(page.locator('#flagComment')).toBeFocused();
  await page.getByRole('radio', { name: 'Outra', exact: true }).check();
  await page.locator('#flagComment').fill('Rascunho técnico que deve ser conservado');
});

test.afterEach(async ({ page }, info) => {
  await info.attach('report-deadline-audit', { contentType: 'application/json', body: JSON.stringify(audits.get(page)) });
  if (info.status === info.expectedStatus) expect(audits.get(page)).toEqual({ errors: [], writes: [], sockets: 0 });
});

async function holdBoundary(page: Page, stage: 'session' | 'fetch' | 'body') {
  await page.evaluate(stage => {
    const w = window as any;
    w.__reportCalls = [];
    w.__reportReleased = false;
    const pending = new Promise(resolve => { w.__releaseReport = () => { w.__reportReleased = true; resolve(stage === 'session' ? { data: { session: { access_token: 'technical-token' } } } : stage === 'body' ? { success: true } : new Response(JSON.stringify({ success: true }), { status: 200 })); }; });
    w.__deadlineClient = { auth: { getSession: () => stage === 'session' && !w.__reportReleased ? pending : Promise.resolve({ data: { session: { access_token: 'technical-token' } } }) } };
    (0, eval)('_supaClient = window.__deadlineClient');
    const originalFetch = window.fetch;
    window.fetch = (input, init) => {
      if (!String(input).includes('/functions/v1/send-flag')) return originalFetch(input, init);
      w.__reportCalls.push({ body: JSON.parse(String(init?.body)), signal: init?.signal });
      if (w.__reportCalls.length > 1 || w.__reportReleased) return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      if (stage === 'fetch') return pending as any;
      if (stage === 'body') return Promise.resolve({ ok: true, status: 200, json: () => pending } as any);
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    };
  }, stage);
}

for (const stage of ['session', 'fetch', 'body'] as const) test(`reporte recupera espera em ${stage}, conserva rascunho e só tenta de novo por clique`, async ({ page }) => {
  await holdBoundary(page, stage);
  await pauseClock(page);
  await page.locator('#flagSendBtn').click();
  await expect(page.locator('#flagSendBtn')).toBeDisabled();
  if (stage !== 'session') await expect.poll(() => page.evaluate(() => (window as any).__reportCalls.length)).toBe(1);
  await page.clock.runFor(30001);
  await expect(page.locator('#flagStatus')).toContainText('Não foi possível confirmar o envio');
  await expect(page.locator('#flagSendBtn')).toBeEnabled();
  await expect(page.locator('#flagComment')).toHaveValue('Rascunho técnico que deve ser conservado');
  await expect(page.getByRole('radio', { name: 'Outra', exact: true })).toBeChecked();
  expect(await page.evaluate(() => (window as any).__reportCalls.length)).toBe(stage === 'session' ? 0 : 1);
  if (stage !== 'session') expect(await page.evaluate(() => (window as any).__reportCalls[0].signal.aborted)).toBe(true);
  // Deliberately ignores abort at the controlled boundary: a late success must stay inert.
  await page.evaluate(() => (window as any).__releaseReport());
  await page.clock.runFor(1);
  await expect(page.locator('#flagStatus')).toContainText('Não foi possível confirmar o envio');
  expect(await page.evaluate(() => (window as any).__reportCalls.length)).toBe(stage === 'session' ? 0 : 1);
  await page.locator('#flagSendBtn').click();
  await expect(page.locator('#flagStatus')).toContainText('Erro enviado');
  expect(await page.evaluate(() => (window as any).__reportCalls.length)).toBe(stage === 'session' ? 1 : 2);
});

test('prazo antigo não altera o formulário reaberto', async ({ page }) => {
  await holdBoundary(page, 'session');
  await pauseClock(page);
  await page.locator('#flagSendBtn').click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.locator('.nql-review-report').click();
  await page.locator('#flagComment').fill('Novo formulário independente');
  await page.clock.runFor(30001);
  await page.evaluate(() => (window as any).__releaseReport());
  await page.clock.runFor(1);
  await expect(page.locator('#flagStatus')).toBeEmpty();
  await expect(page.locator('#flagComment')).toHaveValue('Novo formulário independente');
  await expect(page.locator('#flagSendBtn')).toBeEnabled();
  expect(await page.evaluate(() => (window as any).__reportCalls)).toEqual([]);
});

test('sessão, envio e corpo compartilham o mesmo orçamento de 30 segundos', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    w.__reportFetchCount = 0;
    w.__reportReadingBody = false;
    w.__deadlineClient = { auth: { getSession: () => new Promise(resolve => {
      w.__releaseSession = () => resolve({ data: { session: { access_token: 'technical-token' } } });
    }) } };
    (0, eval)('_supaClient = window.__deadlineClient');
    const originalFetch = window.fetch;
    window.fetch = (input, init) => {
      if (!String(input).includes('/functions/v1/send-flag')) return originalFetch(input, init);
      w.__reportFetchCount++;
      return new Promise(resolve => { w.__releaseFetch = () => resolve({ ok: true, status: 200, json: () => {
        w.__reportReadingBody = true;
        return new Promise(() => {});
      } } as any); });
    };
  });
  await pauseClock(page);
  await page.locator('#flagSendBtn').click();
  await page.clock.runFor(20000);
  await page.evaluate(() => (window as any).__releaseSession());
  await expect.poll(() => page.evaluate(() => (window as any).__reportFetchCount)).toBe(1);
  await page.clock.runFor(5000);
  await page.evaluate(() => (window as any).__releaseFetch());
  await expect.poll(() => page.evaluate(() => (window as any).__reportReadingBody)).toBe(true);
  await page.clock.runFor(4999);
  await expect(page.locator('#flagSendBtn')).toBeDisabled();
  await page.clock.runFor(1);
  await expect(page.locator('#flagStatus')).toContainText('Não foi possível confirmar o envio');
  await expect(page.locator('#flagSendBtn')).toBeEnabled();
  await expect(page.locator('#flagComment')).toHaveValue('Rascunho técnico que deve ser conservado');
});
