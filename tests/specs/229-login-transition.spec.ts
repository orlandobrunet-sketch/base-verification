import { test, expect, type Page } from '@playwright/test';

const OWNER = '00000000-0000-4000-8000-000000002290';
const session = { user: { id: OWNER, email: 'transition@example.test', user_metadata: { nickname: 'Teste' }, app_metadata: {} } };

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

async function controlledAuth(page: Page, stored = false, holdPaywall = false, missingSDK = false) {
  let releasePaywall = () => {};
  const paywallReady = new Promise<void>(resolve => { releasePaywall = resolve; });
  await page.route('**/*', async route => {
    const request = route.request();
    if (new URL(request.url()).pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (holdPaywall && new URL(request.url()).pathname === '/js/paywall.js') await paywallReady;
    if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort();
    return ['localhost', '127.0.0.1'].includes(new URL(request.url()).hostname)
      ? route.continue() : route.abort();
  });
  await page.addInitScript(({ stored, missingSDK }) => {
    const win = window as any;
    if (stored) localStorage.setItem('sb-wviutasgroltjuyxpevc-auth-token', JSON.stringify({ access_token: 'fixture', refresh_token: 'fixture' }));
    if (missingSDK) return;
    let callback: any;
    let resolveSession: any;
    let rejectSession: any;
    const pending = new Promise((resolve, reject) => { resolveSession = resolve; rejectSession = reject; });
    win.__authFixture = {
      settle: (value: any) => resolveSession({ data: { session: value }, error: null }),
      reject: () => rejectSession(new Error('Conexão indisponível')),
      emit: (event: string, value: any) => callback(event, value),
    };
    win.supabase = { createClient: () => ({
      auth: {
        getSession: () => pending,
        onAuthStateChange: (cb: any) => { callback = cb; return { data: { subscription: { unsubscribe() {} } } }; },
        signInWithPassword: async () => ({ data: { session: win.__loginSession, user: win.__loginSession?.user }, error: null }),
      },
      from() {
        const chain: any = { select: () => chain, eq: () => chain,
          single: () => win.__holdCloudRead
            ? new Promise(resolve => { win.__resolveCloudRead = () => resolve({ data: { game_progress: null, game_progress_version: 0, is_premium: false }, error: null }); })
            : Promise.resolve({ data: { game_progress: null, game_progress_version: 0, is_premium: false }, error: null }),
          maybeSingle: async () => ({ data: null, error: null }) };
        return chain;
      },
    }) };
    win.__portalFrames = [];
    const sample = () => {
      const portal = document.getElementById('landingScreen');
      if (portal && getComputedStyle(portal).visibility !== 'hidden' && portal.getClientRects().length) win.__portalFrames.push(performance.now());
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, { stored, missingSDK });
  return releasePaywall;
}

async function waitAuth(page: Page) {
  await page.waitForFunction(() => typeof (window as any).updateWelcomeUserBadge === 'function');
}

for (const route of ['/jogar/', '/jogar/?code=callback-fixture']) {
  test(`a sessão pendente não exibe o Portal antes do Átrio: ${route}`, async ({ page }) => {
    await controlledAuth(page, route === '/jogar/');
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await waitAuth(page);
    await expect(page.locator('#authStartup')).toBeVisible();
    await expect(page.locator('#landingScreen')).toBeHidden();
    await expect(page.locator('#welcomeScreen')).toBeHidden();
    await page.evaluate(value => (window as any).__authFixture.settle(value), session);
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    await expect(page.locator('#authStartup')).toBeHidden();
    expect(await page.evaluate(() => (window as any).__portalFrames.length)).toBe(0);
  });
}

test('erro ao conferir sessão devolve um Portal utilizável', async ({ page }) => {
  await controlledAuth(page, true);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await waitAuth(page);
  await page.evaluate(() => (window as any).__authFixture.reject());
  await expect(page.locator('#landingScreen')).toBeVisible();
  await expect(page.locator('#authStartup')).toBeHidden();
  await page.locator('.nql-portal [data-action="landingLoginEmail"]').click();
  await expect(page.locator('#authModal')).toHaveClass(/show/);
});

test('sessão ausente devolve o Portal sem deixar a tela de espera aberta', async ({ page }) => {
  await controlledAuth(page, true);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await waitAuth(page);
  await page.evaluate(() => (window as any).__authFixture.settle(null));
  await expect(page.locator('#landingScreen')).toBeVisible();
  await expect(page.locator('#authStartup')).toBeHidden();
});

test('SDK indisponível libera o Portal e informa o erro ao tentar entrar', async ({ page }) => {
  await controlledAuth(page, true, false, true);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#landingScreen')).toBeVisible();
  await expect(page.locator('#authStartup')).toBeHidden();
  await page.locator('.nql-portal [data-action="landingLoginEmail"]').click();
  await page.locator('#authEmail').fill('transition@example.test');
  await page.locator('#authPassword').fill('fixture-password');
  await page.locator('#authLoginBtn').click();
  await expect(page.locator('#authMsg')).toContainText('temporariamente indisponível');
});

test('uma conferência sem resposta tem saída utilizável', async ({ page }) => {
  await page.clock.install();
  await controlledAuth(page, true);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await waitAuth(page);
  await page.clock.fastForward(12000);
  await expect(page.locator('#authStartup')).toBeHidden();
  await expect(page.locator('#landingScreen')).toBeVisible();
  await page.locator('.nql-portal [data-action="landingLoginEmail"]').click();
  await expect(page.locator('#authModal')).toHaveClass(/show/);
});

test('login por email revela o Átrio junto com o fechamento do formulário', async ({ page }) => {
  await controlledAuth(page);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await waitAuth(page);
  await page.evaluate(() => (window as any).__authFixture.settle(null));
  await page.locator('.nql-portal [data-action="landingLoginEmail"]').click();
  await page.locator('#authEmail').fill('transition@example.test');
  await page.locator('#authPassword').fill('fixture-password');
  await page.evaluate(value => { (window as any).__loginSession = value; (window as any).__portalFrames = []; }, session);
  await page.locator('#authLoginBtn').click();
  await expect(page.locator('#authModal')).not.toHaveClass(/show/);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.locator('#landingScreen')).toBeHidden();
  await expect(page.locator('#atriumMain')).toBeFocused();
});

test('callback antes do módulo de pagamentos não interrompe a entrada', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const release = await controlledAuth(page, true, true);
  try {
    await page.goto('/jogar/', { waitUntil: 'commit' });
    await waitAuth(page);
    await page.evaluate(value => { (window as any).__authFixture.emit('SIGNED_IN', value); }, session);
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    expect(errors.filter(message => message.includes('_resumePendingPayment'))).toEqual([]);
  } finally { release(); }
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#welcomeScreen')).toBeVisible();
});

test('sair em outra aba bloqueia uma restauração enquanto o SDK ainda responde', async ({ page, context }) => {
  await controlledAuth(page);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await waitAuth(page);
  await page.evaluate(value => (window as any).__authFixture.emit('SIGNED_IN', value), session);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  const other = await context.newPage();
  await other.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
    ? route.continue() : route.abort());
  await other.goto('/offline.html', { waitUntil: 'domcontentloaded' });
  const marker = { schemaVersion: 7, save: null, saveOwner: OWNER, resetReason: 'logout', timestamp: Date.now() };
  await other.evaluate(marker => localStorage.setItem('nefroquest-save-v7', JSON.stringify(marker)), marker);
  await expect(page.locator('#landingScreen')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).authUser)).toBeNull();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null'))).toMatchObject(marker);
  // A late SDK notification still belongs to the old accepted session.
  await page.evaluate(value => (window as any).__authFixture.emit('SIGNED_IN', value), session);
  await expect.poll(() => page.evaluate(() => (window as any).authUser)).toBeNull();
  // A new explicit login remains authorized after retiring the old binding.
  await page.locator('.nql-portal [data-action="landingLoginEmail"]').click();
  await page.locator('#authEmail').fill('transition@example.test');
  await page.locator('#authPassword').fill('fixture-password');
  await page.evaluate(value => { (window as any).__loginSession = value; (window as any).__holdCloudRead = true; }, session);
  await page.locator('#authLoginBtn').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).authUser?.id)).toBe(OWNER);
  await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', {
    key: 'nefroquest-save-v7', newValue: localStorage.getItem('nefroquest-save-v7'), storageArea: localStorage,
  })));
  await expect.poll(() => page.evaluate(() => (window as any).authUser?.id)).toBe(OWNER);
  await page.evaluate(() => { (window as any).__holdCloudRead = false; (window as any).__resolveCloudRead?.(); });
  await other.close();
});
