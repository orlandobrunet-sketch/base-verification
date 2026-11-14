import { test, expect, type Page, type Route } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
const ownerA = '00000000-0000-4000-8000-0000000000a1';
const ownerB = '00000000-0000-4000-8000-0000000000b2';
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin, observed: string[] = [];
  errors.set(page, observed);
  page.on('pageerror', error => observed.push(error.message));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    return request.method() === 'GET' && url.origin === origin ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).setMentorQuestion === 'function');
  await account(page, ownerA);
});
test.afterEach(async ({ page }, info) => {
  await info.attach('quota-runtime', { contentType: 'application/json', body: JSON.stringify({ errors: errors.get(page) }) });
  if (info.status === info.expectedStatus) expect(errors.get(page)).toEqual([]);
});
async function account(page: Page, id: string) {
  // Only the external identity boundary is controlled; binding and quota code are real.
  await page.evaluate(id => { (window as any).authUser = { id, app_metadata: {} }; }, id);
}
const apis = [
  { name: 'Oráculo', endpoint: 'ai-mentor', base: 'nq-mentor-quota', read: '_getMentorQuota()', can: '_canAskMentor()', limit: 5 },
  { name: 'Diagnóstico', endpoint: 'ai-diagnosis', base: 'nq-diag-quota', read: '_getDiagQuota()', can: '_canRunDiagnosis()', limit: 3 },
] as const;
type Api = typeof apis[number];
const quota = (page: Page, api: Api) => page.evaluate(expression => (0, eval)(expression), api.read);
const canAsk = (page: Page, api: Api) => page.evaluate(expression => (0, eval)(expression), api.can);
async function begin(page: Page, api: Api, label: string) {
  if (api.endpoint === 'ai-mentor') {
    await page.evaluate(label => {
      const w = window as any;
      w.setMentorQuestion({ qid: label, q: 'Questão técnica ' + label, opts: ['A', 'B'], ans: 0, exp: 'Explicação técnica.' });
      w.openMentorModal();
    }, label);
    await page.locator('#mentorInput').fill('Dúvida técnica ' + label);
    await page.locator('#mentorInput').press('Enter');
  } else {
    await page.evaluate(() => { (window as any).__quotaDiagnosis = (0, eval)('_pedirDiagnostico(1,1,50)'); });
  }
}
async function settled(page: Page, api: Api, status: number) {
  if (api.endpoint === 'ai-mentor') {
    await expect(page.locator('#mentorChat')).toContainText(status === 429 ? 'Limite diário atingido' : 'Resposta técnica recebida');
  } else {
    expect((await page.evaluate(() => (window as any).__quotaDiagnosis)).estado).toBe(status === 429 ? 'recusado' : 'pronto');
  }
}
for (const api of apis) {
  test(`${api.name}: recusa de A não bloqueia B; o cache próprio de A permanece ao retornar`, async ({ page }) => {
    let calls = 0;
    await page.route(`**/functions/v1/${api.endpoint}`, route => {
      calls++;
      return calls === 1 ? route.fulfill({ status: 429, json: { error: 'quota_exceeded' } })
        : route.fulfill({ json: { reply: 'Resposta técnica recebida', diagnosis: 'Resposta técnica recebida' } });
    });
    await begin(page, api, 'conta-A');
    await settled(page, api, 429);
    expect((await quota(page, api)).count).toBe(api.limit);
    await account(page, ownerB);
    expect((await quota(page, api)).count).toBe(0);
    expect(await canAsk(page, api)).toBe(true);
    await begin(page, api, 'conta-B');
    await settled(page, api, 200);
    expect(calls).toBe(2);
    expect((await quota(page, api)).count).toBe(1);
    await account(page, ownerA);
    expect((await quota(page, api)).count).toBe(api.limit);
    expect(await canAsk(page, api)).toBe(false);
    await account(page, ownerB);
    expect((await quota(page, api)).count).toBe(1);
  });
  test(`${api.name}: registro legado sem titular não é atribuído à conta atual`, async ({ page }) => {
    const stored = await page.evaluate(({ base, limit }) => {
      const value = JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: limit });
      localStorage.setItem(base, value); return value;
    }, api);
    expect((await quota(page, api)).count).toBe(0);
    expect(await canAsk(page, api)).toBe(true);
    expect(await page.evaluate(key => localStorage.getItem(key), api.base)).toBe(stored);
  });
  test(`${api.name}: resposta tardia de A não impõe a cota em B`, async ({ page }) => {
    let pending: Route | undefined;
    await page.route(`**/functions/v1/${api.endpoint}`, route => { pending = route; });
    await begin(page, api, 'resposta-antiga-A');
    await expect.poll(() => !!pending).toBe(true);
    await account(page, ownerB);
    const response = page.waitForResponse(res => res.url().includes(`/functions/v1/${api.endpoint}`));
    await pending!.fulfill({ status: 429, json: { error: 'quota_exceeded' } });
    await (await response).finished();
    if (api.endpoint === 'ai-diagnosis') expect((await page.evaluate(() => (window as any).__quotaDiagnosis)).estado).toBe('cancelado');
    else await expect(page.locator('#mentorInput')).toBeEnabled();
    expect((await quota(page, api)).count).toBe(0);
    expect(await canAsk(page, api)).toBe(true);
    await account(page, ownerA);
    expect((await quota(page, api)).count).toBe(0);
  });
}
