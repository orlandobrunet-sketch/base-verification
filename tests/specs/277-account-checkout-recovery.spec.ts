import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const ownerA = '00000000-0000-4000-8000-000000000001';
const ownerB = '00000000-0000-4000-8000-000000000002';
const pricing = (page: Page) => page.getByRole('dialog', { name: /Planos e preços|Plans and pricing/ });
const preparation = (page: Page) => page.getByRole('dialog', { name: 'Preparando pagamento', exact: true });
const account = (page: Page) => page.getByRole('dialog', { name: 'Minha Conta', exact: true });
const audits = new WeakMap<Page, { errors: string[], nonGET: string[], sockets: number }>();
test.afterEach(async ({ page }) => {
  const audit = audits.get(page);
  if (!audit) return;
  await test.info().attach('service-boundary-audit', { body: JSON.stringify(audit), contentType: 'application/json' });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
});

async function fixture(page: Page) {
  const audit = { errors: [] as string[], nonGET: [] as string[], sockets: 0 };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await page.context().routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  const base = new URL(test.info().project.use.baseURL as string).origin;
  await page.route('**/*', route => {
    const q = route.request(), url = new URL(q.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (q.method() !== 'GET') { audit.nonGET.push(q.method() + ' ' + q.url()); return route.abort(); }
    if (url.origin === base || (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) && ['font', 'stylesheet'].includes(q.resourceType()))) return route.continue();
    return route.abort();
  });
  await page.addInitScript(({ ownerA }) => {
    const win = window as any, listeners = new Set<(event: string, session: any) => void>();
    const sessionFor = (id: string) => ({ access_token: 'fixture-' + id, user: { id, email: 'fixture@example.test', user_metadata: { nickname: 'Guardião de teste' }, app_metadata: {} } });
    let session = sessionFor(ownerA);
    const fx = win.checkoutFixture = { requests: [] as any[], accountSaves: [] as any[], deferSession: false } as any;
    fx.setOwner = (id: string) => { session = sessionFor(id); for (const listener of listeners) listener('SIGNED_IN', session); };
    const client = {
      auth: {
        getSession: () => fx.deferSession ? new Promise(resolve => { fx.finishSession = resolve; }) : Promise.resolve({ data: { session }, error: null }),
        onAuthStateChange: (listener: (event: string, session: any) => void) => {
          listeners.add(listener); queueMicrotask(() => listener('INITIAL_SESSION', session));
          return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
        },
      },
      from: (table: string) => {
        const result = { data: table === 'profiles' ? { is_premium: false } : null, error: null };
        const query: any = { select: () => query, eq: () => query, order: () => query, limit: () => query,
          single: async () => result, maybeSingle: async () => result, then: (resolve: any) => Promise.resolve(result).then(resolve),
          upsert: (row: unknown) => { fx.accountSaves.push(row); return new Promise(resolve => { fx.finishAccountSave = resolve; }); } };
        return query;
      },
    };
    win.supabase = { createClient: () => client };
    const fetchOriginal = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, options?: RequestInit) => {
      if (new URL(String(input), location.href).pathname !== '/functions/v1/create-mp-preference') return fetchOriginal(input, options);
      // Controlled service boundary deliberately ignores abort completion: the
      // product must reject a stale resolution even if a dependency resolves late.
      const request: any = { body: JSON.parse(String(options?.body)), aborted: !!options?.signal?.aborted };
      options?.signal?.addEventListener('abort', () => { request.aborted = true; });
      fx.requests.push(request);
      return new Promise(resolve => { request.finish = (status: number, body: object) => resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })); });
    };
  }, { ownerA });
  await page.goto('/jogar/', { waitUntil: 'load' });
  await page.waitForFunction(id => (window as any).authUser?.id === id, ownerA);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  return audit;
}

async function begin(page: Page, plan = 'monthly') {
  await page.evaluate(() => (window as any).showPricingModal());
  await pricing(page).locator(`[data-action="pricingChoose"][data-arg="${plan}"]`).click();
  await expect.poll(() => page.evaluate(() => (window as any).checkoutFixture.requests.length)).toBeGreaterThan(0);
}
async function finish(page: Page, index: number, status: number, body: object) {
  await page.evaluate(({ index, status, body }) => (window as any).checkoutFixture.requests[index].finish(status, body), { index, status, body });
}
async function freezeClock(page: Page) {
  const now = Date.UTC(2030, 0, 1);
  await page.clock.install({ time: now - 1000 });
  await page.clock.pauseAt(now);
}
async function clean(page: Page, audit: unknown) {
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
}

test('preparation is a keyboard dialog and leaving discards a late checkout response', async ({ page }) => {
  const audit = await fixture(page); await begin(page);
  await expect(preparation(page)).toBeVisible({ timeout: 1500 });
  expect(await preparation(page).evaluate(el => el.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    expect(await preparation(page).evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await preparation(page).getByRole('button', { name: 'Voltar aos planos', exact: true }).click();
  await expect(pricing(page)).toBeVisible();
  await expect(preparation(page)).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).checkoutFixture.requests[0].aborted)).toBe(true);
  await finish(page, 0, 200, { checkout_url: new URL('/404.html?checkout-fixture=stale', page.url()).href, preference_id: 'old-fixture' });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  expect(page.url()).not.toContain('checkout-fixture');
  await expect(pricing(page)).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('nq-payment-checkout'))).toBeNull();
  await clean(page, audit);
});

test('error persists, keeps the selected plan and retries once explicitly', async ({ page }) => {
  const audit = await fixture(page); await begin(page, 'lifetime');
  await finish(page, 0, 503, { error: 'Indisponível na fixture' });
  const retry = page.getByRole('button', { name: 'Tentar novamente', exact: true });
  await expect(retry).toBeVisible({ timeout: 1500 });
  await page.clock.install(); await page.clock.fastForward(6000);
  await expect(retry).toBeVisible();
  await retry.click();
  await expect.poll(() => page.evaluate(() => (window as any).checkoutFixture.requests.length)).toBe(2);
  expect(await page.evaluate(() => (window as any).checkoutFixture.requests.map((r: any) => r.body))).toEqual([{ plan: 'lifetime' }, { plan: 'lifetime' }]);
  await page.keyboard.press('Escape'); await expect(pricing(page)).toBeVisible();
  await clean(page, audit);
});

test('30-second limit releases a stalled session lookup without creating a checkout', async ({ page }) => {
  const audit = await fixture(page); await freezeClock(page);
  await page.evaluate(() => { (window as any).checkoutFixture.deferSession = true; (window as any).showPricingModal(); });
  await pricing(page).locator('[data-arg="monthly"]').click();
  await page.waitForFunction(() => typeof (window as any).checkoutFixture.finishSession === 'function');
  await page.clock.fastForward(29999);
  await expect(page.locator('#paymentLoadingOverlay')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente', exact: true })).toHaveCount(0);
  await page.clock.fastForward(2);
  await expect(page.getByRole('button', { name: 'Tentar novamente', exact: true })).toBeVisible({ timeout: 1500 });
  await page.evaluate(id => { const fx = (window as any).checkoutFixture; fx.deferSession = false; fx.finishSession({ data: { session: { user: { id }, access_token: 'late-session' } }, error: null }); }, ownerA);
  await page.clock.fastForward(50);
  expect(await page.evaluate(() => (window as any).checkoutFixture.requests.length)).toBe(0);
  await page.keyboard.press('Escape'); await expect(pricing(page)).toBeVisible();
  await clean(page, audit);
});

test('timeout aborts a request and its late success cannot remove the retry attempt', async ({ page }) => {
  const audit = await fixture(page); await freezeClock(page); await begin(page);
  await page.clock.fastForward(30001);
  const retry = page.getByRole('button', { name: 'Tentar novamente', exact: true });
  await expect(retry).toBeVisible({ timeout: 1500 });
  expect(await page.evaluate(() => (window as any).checkoutFixture.requests[0].aborted)).toBe(true);
  await retry.click();
  await expect.poll(() => page.evaluate(() => (window as any).checkoutFixture.requests.length)).toBe(2);
  await finish(page, 0, 200, { checkout_url: new URL('/404.html?checkout-fixture=timeout', page.url()).href, preference_id: 'old-fixture' });
  await page.clock.fastForward(100);
  await expect(preparation(page)).toBeVisible(); expect(page.url()).not.toContain('checkout-fixture');
  await page.keyboard.press('Escape'); await expect(pricing(page)).toBeVisible();
  await clean(page, audit);
});

test('duplicate preparation is blocked and an old owner response cannot replace a new attempt', async ({ page }) => {
  const audit = await fixture(page); await begin(page);
  await page.evaluate(() => { (window as any)._initPayment('monthly'); (window as any)._initPayment('lifetime'); });
  expect(await page.evaluate(() => (window as any).checkoutFixture.requests.length)).toBe(1);
  await page.evaluate(id => (window as any).checkoutFixture.setOwner(id), ownerB);
  await page.waitForFunction(id => (window as any).authUser?.id === id, ownerB);
  // The new account starts its own explicitly selected plan.
  await begin(page, 'lifetime');
  await expect.poll(() => page.evaluate(() => (window as any).checkoutFixture.requests.length)).toBe(2);
  await finish(page, 0, 200, { checkout_url: new URL('/404.html?checkout-fixture=old-owner', page.url()).href, preference_id: 'old-fixture' });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await expect(preparation(page)).toBeVisible(); expect(page.url()).not.toContain('checkout-fixture');
  await page.keyboard.press('Escape'); await expect(pricing(page)).toBeVisible();
  await clean(page, audit);
});

test('pending account save keeps keyboard focus on its status, and failure is readable at 200%', async ({ page }) => {
  const audit = await fixture(page); await page.addStyleTag({ content: 'html{font-size:32px!important}' });
  await page.evaluate(() => (window as any).openAccountModal());
  await account(page).locator('#acctCity').fill('Recife');
  await account(page).getByRole('button', { name: 'Salvar', exact: true }).click();
  const status = account(page).getByRole('status');
  await expect(status).toBeFocused({ timeout: 1500 });
  await expect(account(page).getByRole('button', { name: 'Salvar', exact: true })).toBeDisabled();
  await page.waitForFunction(() => typeof (window as any).checkoutFixture.finishAccountSave === 'function');
  await page.evaluate(() => (window as any).checkoutFixture.finishAccountSave({ error: { message: 'Falha controlada' } }));
  await expect(status).toContainText('Dados guardados'); await expect(status).toBeFocused();
  const visible = await status.evaluate(el => {
    const r = el.getBoundingClientRect(), sc = el.closest('.nqnarr-reading')!.getBoundingClientRect();
    return r.top >= sc.top - 1 && r.bottom <= sc.bottom + 1 && r.left >= 0 && r.right <= innerWidth;
  });
  expect(visible, 'The complete current save status must fit in its visible reading area').toBe(true);
  await page.keyboard.press('Tab'); expect(await account(page).evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape'); await expect(account(page)).toBeHidden();
  await clean(page, audit);
});

test('a save failure does not steal focus after choosing another field or another account', async ({ page }) => {
  const audit = await fixture(page); await page.evaluate(() => (window as any).openAccountModal());
  await account(page).locator('#acctCity').fill('Recife'); await account(page).getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.waitForFunction(() => typeof (window as any).checkoutFixture.finishAccountSave === 'function');
  await account(page).locator('#acctPhone').focus();
  await page.evaluate(() => (window as any).checkoutFixture.finishAccountSave({ error: { message: 'Falha controlada' } }));
  await expect(account(page).getByRole('status')).toContainText('Dados guardados');
  await expect(account(page).locator('#acctPhone')).toBeFocused();
  await account(page).getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.waitForFunction(() => (window as any).checkoutFixture.accountSaves.length === 2);
  await page.evaluate(id => (window as any).checkoutFixture.setOwner(id), ownerB);
  await page.evaluate(() => (window as any).openPlanModal());
  const plan = page.getByRole('dialog', { name: 'Seu Plano' }); await expect(plan).toBeVisible();
  const before = await page.evaluate(() => document.activeElement?.outerHTML);
  await page.evaluate(() => (window as any).checkoutFixture.finishAccountSave({ error: { message: 'Falha antiga' } }));
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  expect(await page.evaluate(() => document.activeElement?.outerHTML)).toBe(before);
  await expect(account(page)).toHaveCount(0);
  await clean(page, audit);
});
