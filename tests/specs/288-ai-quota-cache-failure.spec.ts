import { test, expect, type Page, type Route } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const ownerA = '00000000-0000-4000-8000-0000000000a1';
const ownerB = '00000000-0000-4000-8000-0000000000b2';
const today = '2032-04-02T12:00:00Z';
const tomorrow = '2032-04-03T12:00:00Z';
const reply = 'Resposta técnica preservada após a consulta.';
const draft = 'Dúvida técnica sobre este exercício.';
type Audit = { errors: string[]; unexpectedNonGET: string[]; sockets: number };
const audits = new WeakMap<Page, Audit>();
const apis = [
  { name: 'Oráculo', endpoint: 'ai-mentor', base: 'nq-mentor-quota', read: '_getMentorQuota()', can: '_canAskMentor()', limit: 5 },
  { name: 'Diagnóstico', endpoint: 'ai-diagnosis', base: 'nq-diag-quota', read: '_getDiagQuota()', can: '_canRunDiagnosis()', limit: 3 },
] as const;
type Api = typeof apis[number];

test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const audit = { errors: [] as string[], unexpectedNonGET: [] as string[], sockets: 0 };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (request.method() === 'GET' && url.origin === origin) return route.continue();
    if (request.method() !== 'GET') audit.unexpectedNonGET.push(request.method() + ' ' + url.pathname);
    return route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, [{
    qid: 'quota-cache-technical', q: 'Questão técnica de disponibilidade do cache',
    opts: ['Opção A', 'Opção B', 'Opção C', 'Opção D'], ans: 0,
    exp: 'Explicação técnica do exercício.', cat: 'geral', diff: 'medium',
  }]);
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    const fault = { blocked: true, attempts: [] as { key: string; value: string }[] };
    (window as any).quotaCacheFault = fault;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && /^nq-(mentor|diag)-quota:/.test(String(key)) && fault.blocked) {
        fault.attempts.push({ key: String(key), value: String(value) });
        throw new DOMException('Quota cache write deliberately refused', 'QuotaExceededError');
      }
      return original.call(this, key, value);
    };
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0, narrativeShown: 5 }, { authUser: { id: ownerA, app_metadata: {} } });
  await page.clock.setFixedTime(new Date(today));
});

test.afterEach(async ({ page }, info) => {
  const audit = audits.get(page);
  await info.attach('ai-quota-cache-audit', { contentType: 'application/json', body: JSON.stringify(audit) });
  if (info.status === info.expectedStatus) expect(audit).toEqual({ errors: [], unexpectedNonGET: [], sockets: 0 });
});

const quota = (page: Page, api: Api) => page.evaluate(expression => (0, eval)(expression), api.read);
const canAsk = (page: Page, api: Api) => page.evaluate(expression => (0, eval)(expression), api.can);
const identity = (page: Page, id: string) => page.evaluate(id => { (window as any).authUser = { id, app_metadata: {} }; }, id);
const writeAttempts = (page: Page, api: Api) => page.evaluate(base =>
  (window as any).quotaCacheFault.attempts.filter((row: any) => row.key.startsWith(base + ':')), api.base);

async function beginUI(page: Page, api: Api) {
  if (api.endpoint === 'ai-mentor') {
    const correct = await page.evaluate(() => (0, eval)('state.current.a'));
    await page.locator('#options .option').nth(correct).click();
    await page.locator('[data-action="openOraculoFromJourney"]:visible').first().click();
    await page.locator('#mentorInput').fill(draft);
    await page.locator('#mentorInput').press('Enter');
  } else {
    await page.evaluate(() => (window as any).startFreeStudyMode());
    await page.locator('#studyOptions button').first().click();
    await page.locator('[data-action="nextStudyQuestion"]').click();
  }
}

async function expectUIResult(page: Page, api: Api, status: number) {
  if (api.endpoint === 'ai-mentor') {
    await expect(page.locator('#mentorChat')).toContainText(status === 429 ? 'Limite diário atingido' : reply);
    await expect(page.locator('.mentor-thinking')).toHaveCount(0);
    await expect(page.locator('#mentorInput')).toBeEnabled();
    await expect(page.locator('#mentorInput')).toHaveValue(status === 429 ? draft : '');
    await expect(page.locator('#mentorQuotaBar')).toContainText(status === 429 ? '0/5' : '4/5');
    if (status === 200) expect(await page.evaluate(() => (0, eval)('_mentorHistory'))).toEqual([
      { role: 'user', content: draft }, { role: 'assistant', content: reply },
    ]);
  } else {
    const card = page.locator('#aiDiagnosisCard');
    await expect(card).toHaveAttribute('data-estado', status === 429 ? 'recusado' : 'pronto');
    await expect(card).toHaveAttribute('aria-busy', 'false');
    await expect(card).toContainText(status === 429 ? 'Limite diário' : reply);
    await expect(card.locator('.ai-diagnosis-quota')).toContainText(status === 429 ? '0/3' : '2/3');
    await expect(card).not.toContainText('Nenhum diagnóstico do seu limite diário foi descontado');
  }
}

for (const api of apis) {
  for (const status of [200, 429]) test(`${api.name}: resposta ${status} sobrevive à falha do cache e conserva dono e dia`, async ({ page }) => {
    let calls = 0;
    await page.route(`**/functions/v1/${api.endpoint}`, route => {
      calls++;
      expect(route.request().method()).toBe('POST');
      return route.fulfill({ status, json: status === 429 ? { error: 'quota_exceeded' } : { reply, diagnosis: reply } });
    });
    await beginUI(page, api);
    await expectUIResult(page, api, status);
    const count = status === 429 ? api.limit : 1;
    expect((await quota(page, api)).count).toBe(count);
    expect((await writeAttempts(page, api)).length, 'The real quota-cache write must have been refused').toBeGreaterThan(0);
    expect(calls).toBe(1);
    await identity(page, ownerB);
    expect((await quota(page, api)).count).toBe(0);
    expect(await canAsk(page, api)).toBe(true);
    await identity(page, ownerA);
    expect((await quota(page, api)).count).toBe(count);
    expect(await canAsk(page, api)).toBe(status === 200);
    await page.clock.setFixedTime(new Date(tomorrow));
    expect((await quota(page, api)).count).toBe(0);
    expect(await canAsk(page, api)).toBe(true);
    expect(calls).toBe(1);
  });

  test(`${api.name}: uma resposta antiga não grava cota na conta seguinte com cache indisponível`, async ({ page }) => {
    let pending: Route | undefined;
    await page.route(`**/functions/v1/${api.endpoint}`, route => { pending = route; });
    await beginUI(page, api);
    await expect.poll(() => !!pending).toBe(true);
    await identity(page, ownerB);
    const response = page.waitForResponse(res => res.url().includes(`/functions/v1/${api.endpoint}`));
    await pending!.fulfill({ json: { reply, diagnosis: reply } });
    await (await response).finished();
    expect((await quota(page, api)).count).toBe(0);
    expect(await canAsk(page, api)).toBe(true);
    await identity(page, ownerA);
    expect((await quota(page, api)).count).toBe(0);
    expect(await writeAttempts(page, api)).toEqual([]);
    const surface = api.endpoint === 'ai-mentor' ? '#mentorChat' : '#aiDiagnosisCard';
    await expect(page.locator(surface).filter({ hasText: reply })).toHaveCount(0);
  });
}
