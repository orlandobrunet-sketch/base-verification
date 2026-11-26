import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

const ownerA = '650effbc-f929-4553-9da7-13f89b35ad2d';
const ownerB = '8bb4d91b-4255-4687-b54f-f04ed5a1c3aa';
const returnUrl = '/jogar/?payment=approved&payment_id=123&plan=lifetime&preference_id=pref-123';
type StalledStage = 'session' | 'request' | 'body';

async function fixture(page: Page, {
  owner = ownerA as string | null,
  existingPremium = false,
  syncConfirmedEntitlement = true,
  checkout = false,
  simulateCheckout = false,
  stalledStage = null as StalledStage | null,
  lookup = async (_attempt: number) => ({ status: 'pending' } as Record<string, unknown>),
} = {}) {
  const requests: { authorization: string, body: unknown }[] = [];
  await page.addInitScript(({ owner, existingPremium, checkout, stalledStage }) => {
    const events = new Set<(event: string, session: any) => void>();
    const sessionFor = (id: string | null) => id ? {
      access_token: 'test-' + id,
      user: { id, email: 'fixture@example.test', app_metadata: {}, user_metadata: { nickname: 'Fixture' } },
    } : null;
    let session = sessionFor(owner);
    const profiles = new Map<string, { is_premium: boolean; premium_expires_at: string | null }>();
    if (existingPremium && owner) profiles.set(owner, { is_premium: true, premium_expires_at: null });
    (window as any).setPaymentFixtureProfile = (id: string, plan: string) => profiles.set(id, {
      is_premium: true,
      premium_expires_at: plan === 'monthly' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
    });
    const stalled = { started: false, requested: false, aborted: false, release: () => {} };
    function hold<T>(value: T) {
      stalled.started = true;
      return new Promise<T>(resolve => { stalled.release = () => resolve(value); });
    }
    const client = {
      auth: {
        getSession: async () => {
          const result = { data: { session }, error: null };
          // Let the game's initial auth lookup settle before withholding only
          // the first lookup made by the payment return.
          if (stalledStage === 'session' && !stalled.started && document.getElementById('paymentReturnOverlay')) {
            return hold(result);
          }
          return result;
        },
        onAuthStateChange: (listener: (event: string, session: any) => void) => {
          events.add(listener);
          queueMicrotask(() => listener('INITIAL_SESSION', session));
          return { data: { subscription: { unsubscribe: () => events.delete(listener) } } };
        },
      },
      from: (table: string) => {
        const profile = profiles.get(session?.user.id ?? '') ?? { is_premium: false, premium_expires_at: null };
        const result = { data: table === 'profiles' ? profile : null, error: null };
        const query = {
          select: () => query, eq: () => query, order: () => query, limit: () => query,
          single: async () => result, maybeSingle: async () => result,
          then: (resolve: (value: any) => void) => Promise.resolve(result).then(resolve),
        };
        return query;
      },
    };
    (window as any).supabase = { createClient: () => client };
    if (stalledStage) (window as any).stalledPaymentReturn = stalled;
    if (stalledStage === 'request' || stalledStage === 'body') {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, options) => {
        if (stalled.requested || new URL(String(input), location.href).pathname !== '/functions/v1/mp-payment-status') {
          return originalFetch(input, options);
        }
        stalled.requested = true;
        // Model a dependency that reports cancellation yet resolves later.
        options?.signal?.addEventListener('abort', () => { stalled.aborted = true; }, { once: true });
        const late = { status: 'confirmed', plan: 'lifetime' };
        const response = new Response(JSON.stringify(late));
        if (stalledStage === 'request') return hold(response);
        response.json = () => hold(late);
        return new Promise(resolve => setTimeout(() => resolve(response), 6000));
      };
    }
    (window as any).setPaymentFixtureOwner = (id: string | null) => {
      session = sessionFor(id);
      for (const listener of events) listener(id ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    };
    if (checkout) sessionStorage.setItem('nq-payment-checkout', JSON.stringify({
      owner, plan: 'monthly', startedAt: Date.now(), preferenceId: 'pref-123',
    }));
  }, { owner, existingPremium, checkout, stalledStage });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (['localhost', '127.0.0.1'].includes(url.hostname)) return route.continue();
    if (simulateCheckout && url.pathname === '/functions/v1/create-mp-preference') {
      expect(route.request().postDataJSON()).toEqual({ plan: 'monthly' });
      return route.fulfill({ json: {
        checkout_url: new URL(returnUrl, page.url()).href, preference_id: 'pref-123',
      } });
    }
    if (url.pathname === '/functions/v1/mp-payment-status') {
      requests.push({
        authorization: route.request().headers().authorization,
        body: route.request().postDataJSON(),
      });
      const auth = requests.at(-1)?.authorization;
      const result = await lookup(requests.length);
      try {
        if (syncConfirmedEntitlement && result.status === 'confirmed' && auth?.startsWith('Bearer test-')) {
          await page.evaluate(([id, plan]) => (window as any).setPaymentFixtureProfile(id, plan), [auth.slice(12), result.plan]);
        }
        return await route.fulfill({ status: result.status === 'unavailable' ? 503 : 200, json: result });
      } catch {
        // A troca de conta pode abortar a requisição antes da resposta de teste.
        return;
      }
    }
    return route.abort();
  });
  return requests;
}

const conversions = (page: Page) => page.evaluate(() =>
  ((window as any).dataLayer ?? []).filter((entry: any) => entry[0] === 'event' && entry[1] === 'premium_converted')
    .map((entry: any) => entry[2].plan));
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Retorno do pagamento' });
async function freezeClock(page: Page) {
  const now = Date.UTC(2030, 0, 1);
  await page.clock.install({ time: now - 1000 });
  await page.clock.pauseAt(now);
}

test('um link que só diz aprovado não confirma compra nem altera acesso', async ({ page }) => {
  const requests = await fixture(page, { owner: null });
  await page.goto('/jogar/?payment=approved&plan=lifetime&preservar=sim#origem');
  await expect(dialog(page)).toContainText('Pagamento não confirmado');
  await expect(dialog(page)).not.toContainText('foi ativado');
  await expect(dialog(page).getByRole('button', { name: 'Fechar retorno do pagamento' })).toBeFocused();
  await expect(page).toHaveURL(/\/jogar\/\?preservar=sim#origem$/);
  expect(requests).toEqual([]);
  expect(await conversions(page)).toEqual([]);
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0);
});

test('Premium anterior não confirma outro identificador de pagamento', async ({ page }) => {
  const requests = await fixture(page, { existingPremium: true });
  await page.goto(returnUrl);
  await expect(dialog(page)).toContainText('Pagamento ainda não confirmado');
  expect(requests[0]).toEqual({ authorization: 'Bearer test-' + ownerA, body: { payment_id: '123' } });
  expect(await conversions(page)).toEqual([]);
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(true);
});

test('espera o registro e usa o plano do servidor, com conversão única mesmo ao reabrir o link', async ({ page }) => {
  const requests = await fixture(page, {
    simulateCheckout: true,
    lookup: async attempt => attempt === 1 ? { status: 'pending' }
      : { status: 'confirmed', plan: 'monthly', processed_at: new Date().toISOString() },
  });
  await page.goto('/jogar/');
  await page.evaluate(() => (window as any).showPricingModal());
  await page.getByRole('button', { name: /^(Comprar 32 dias|Buy 32 days)$/ }).click();
  await expect(dialog(page)).toContainText('Pagamento ainda não confirmado');
  const originalCheckout = await page.evaluate(() => sessionStorage.getItem('nq-payment-checkout'));
  expect(JSON.parse(originalCheckout!)).toMatchObject({ owner: ownerA, plan: 'monthly', preferenceId: 'pref-123' });
  expect(await conversions(page)).toEqual([]);
  await expect(dialog(page)).toContainText('A compra do plano Mensal foi confirmada.');
  expect(requests).toHaveLength(2);
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(true);
  expect(await conversions(page)).toEqual(['monthly']);
  await page.reload();
  await expect(dialog(page)).toHaveCount(0);
  // Uma aba duplicada pode reter a intenção de checkout original.
  await page.evaluate(checkout => sessionStorage.setItem('nq-payment-checkout', checkout!), originalCheckout);
  await page.goto(returnUrl);
  await expect(dialog(page)).toContainText('A compra do plano Mensal foi confirmada.');
  expect(await conversions(page)).toEqual([]);
});

test('recarregar durante a espera retoma a consulta, e comprovante antigo não gera nova conversão', async ({ page }) => {
  let releasePending!: (value: Record<string, unknown>) => void;
  const firstLookup = new Promise<Record<string, unknown>>(resolve => { releasePending = resolve; });
  const requests = await fixture(page, {
    checkout: true,
    lookup: async attempt => attempt === 1 ? firstLookup
      : { status: 'confirmed', plan: 'monthly', processed_at: '2000-01-01T00:00:00Z' },
  });
  await page.goto(returnUrl);
  await expect.poll(() => requests.length).toBe(1);
  releasePending({ status: 'pending' });
  await expect(dialog(page)).toContainText('Pagamento ainda não confirmado');
  await page.reload();
  await expect(dialog(page)).toContainText('Pagamento confirmado');
  expect(requests.map(r => r.body)).toEqual([{ payment_id: '123' }, { payment_id: '123' }]);
  expect(await conversions(page)).toEqual([]);
});

test('consulta indisponível permite tentar novamente sem declarar sucesso', async ({ page }) => {
  await fixture(page, {
    lookup: async attempt => [
      { status: 'unavailable' },
      { status: 'recorded', plan: 'lifetime', processed_at: '2000-01-01T00:00:00Z' },
      { status: 'reversed' },
    ][attempt - 1],
  });
  await page.goto(returnUrl);
  await expect(dialog(page)).toContainText('Verificação indisponível');
  await dialog(page).getByRole('button', { name: 'Verificar novamente' }).click();
  await expect(dialog(page)).toContainText('Pagamento localizado');
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
  await dialog(page).getByRole('button', { name: 'Verificar novamente' }).click();
  await expect(dialog(page)).toContainText('Pagamento revertido');
  expect(await conversions(page)).toEqual([]);
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
});

for (const stalledStage of ['session', 'request', 'body'] as const) {
  test(`prazo total libera a consulta com ${stalledStage} pendente e ignora resposta atrasada`, async ({ page }) => {
    let finishRetry!: (result: Record<string, unknown>) => void;
    const retryResponse = new Promise<Record<string, unknown>>(resolve => { finishRetry = resolve; });
    const requests = await fixture(page, { stalledStage, lookup: () => retryResponse });
    await freezeClock(page);
    await page.goto(returnUrl);
    const payment = dialog(page);
    const retry = payment.getByRole('button', { name: 'Verificar novamente' });
    const elapsed = stalledStage === 'body' ? 6000 : 0;
    if (elapsed) {
      await expect.poll(() => page.evaluate(() => (window as any).stalledPaymentReturn.requested)).toBe(true);
      await page.clock.fastForward(elapsed);
    }
    await expect.poll(() => page.evaluate(() => (window as any).stalledPaymentReturn.started)).toBe(true);
    await page.clock.fastForward(9999 - elapsed);
    await expect(payment).toContainText('Verificando pagamento');
    await expect(retry).toBeHidden();
    await page.clock.fastForward(1);
    await expect(retry).toBeVisible({ timeout: 1500 });
    await expect(payment).toContainText('Verificação indisponível');
    expect(requests).toEqual([]);
    if (stalledStage !== 'session') {
      expect(await page.evaluate(() => (window as any).stalledPaymentReturn.aborted)).toBe(true);
    }
    await retry.click();
    await expect.poll(() => requests.length).toBe(1);
    await page.evaluate(() => (window as any).stalledPaymentReturn.release());
    await page.clock.fastForward(50);
    await expect(payment).toContainText('Verificando pagamento');
    expect(requests).toEqual([{ authorization: 'Bearer test-' + ownerA, body: { payment_id: '123' } }]);
    expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
    expect(await conversions(page)).toEqual([]);
    finishRetry({ status: 'recorded', plan: 'monthly' });
    await expect(payment).toContainText('Pagamento localizado');
  });
}

test('retorno com comprovante espera a autenticação antes de consultar', async ({ page }) => {
  const requests = await fixture(page, {
    owner: null,
    lookup: async () => ({ status: 'confirmed', plan: 'monthly', processed_at: new Date().toISOString() }),
  });
  await page.goto(returnUrl);
  await expect(dialog(page).getByRole('button', { name: 'Entrar para verificar' })).toBeVisible();
  expect(requests).toEqual([]);
  await page.evaluate(id => (window as any).setPaymentFixtureOwner(id), ownerA);
  await expect(dialog(page)).toContainText('Pagamento confirmado');
  expect(requests).toEqual([{ authorization: 'Bearer test-' + ownerA, body: { payment_id: '123' } }]);
  expect(await conversions(page)).toEqual([]);
});

test('resposta atrasada da conta anterior não concede acesso depois da troca', async ({ page }) => {
  let release!: (result: Record<string, unknown>) => void;
  const result = new Promise<Record<string, unknown>>(resolve => { release = resolve; });
  const requests = await fixture(page, { checkout: true, lookup: () => result });
  await page.goto(returnUrl);
  await expect.poll(() => requests.length).toBe(1);
  await page.evaluate(id => (window as any).setPaymentFixtureOwner(id), ownerB);
  await expect(dialog(page)).toContainText('Sessão alterada');
  release({ status: 'confirmed', plan: 'monthly', processed_at: new Date().toISOString() });
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
  await expect(dialog(page)).not.toContainText('Pagamento confirmado');
  expect(await conversions(page)).toEqual([]);
});

test('troca de conta aposenta a consulta ainda na autenticação', async ({ page }) => {
  const requests = await fixture(page, { stalledStage: 'session', lookup: async () => ({ status: 'reversed' }) });
  await page.goto(returnUrl);
  await expect.poll(() => page.evaluate(() => (window as any).stalledPaymentReturn.started)).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).authUser?.id)).toBe(ownerA);
  await page.evaluate(id => (window as any).setPaymentFixtureOwner(id), ownerB);
  const payment = dialog(page);
  await expect(payment).toContainText('Sessão alterada', { timeout: 1500 });
  await page.evaluate(() => (window as any).stalledPaymentReturn.release());
  expect(requests).toEqual([]);
  await payment.getByRole('button', { name: 'Verificar novamente' }).click();
  await expect(payment).toContainText('Pagamento revertido');
  expect(requests).toEqual([{ authorization: 'Bearer test-' + ownerB, body: { payment_id: '123' } }]);
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
  expect(await conversions(page)).toEqual([]);
});

for (const interruptedAt of ['response', 'deadline', 'scheduled retry'] as const) {
  test(`logout em outra aba recupera o retorno sem aviso do SDK (${interruptedAt})`, async ({ page, context }) => {
    let finishLookup!: (result: Record<string, unknown>) => void;
    const lateResponse = new Promise<Record<string, unknown>>(resolve => { finishLookup = resolve; });
    const requests = await fixture(page, {
      stalledStage: interruptedAt === 'deadline' ? 'session' : null,
      lookup: async () => interruptedAt === 'response' ? lateResponse : { status: 'pending' },
    });
    await freezeClock(page);
    await page.goto(returnUrl);
    const payment = dialog(page);
    if (interruptedAt === 'deadline') {
      await expect.poll(() => page.evaluate(() => (window as any).stalledPaymentReturn.started)).toBe(true);
    } else {
      await expect.poll(() => requests.length).toBe(1);
    }
    await expect(payment).toContainText(interruptedAt === 'scheduled retry'
      ? 'Pagamento ainda não confirmado' : 'Verificando pagamento');
    // Deliver the startup INITIAL_SESSION task before expiring the session.
    await page.clock.fastForward(1);

    // The real browser storage event retires the session in this tab. The
    // SDK fixture keeps the old session and does not emit SIGNED_OUT.
    const otherTab = await context.newPage();
    await otherTab.goto('/version.json');
    await otherTab.evaluate(owner => localStorage.setItem('nefroquest-save-v7', JSON.stringify({
      save: null, resetReason: 'logout', saveOwner: owner,
    })), ownerA);
    await expect.poll(() => page.evaluate(() => (window as any).authUser)).toBeNull();
    await otherTab.close();

    if (interruptedAt === 'response') {
      finishLookup({ status: 'confirmed', plan: 'monthly', processed_at: new Date().toISOString() });
    } else {
      await page.clock.fastForward(interruptedAt === 'deadline' ? 9999 : 1499);
    }
    await expect(payment).toContainText('Sessão alterada', { timeout: 1500 });
    await expect(payment.getByRole('button', { name: 'Entrar para verificar' })).toBeVisible();
    expect(requests).toHaveLength(interruptedAt === 'deadline' ? 0 : 1);
    expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
    expect(await conversions(page)).toEqual([]);
  });
}

test('checkout encerrado mostra orientação sem consultar nem declarar aprovação', async ({ page }) => {
  const requests = await fixture(page);
  await page.goto('/jogar/?payment=failed&payment_id=123');
  await expect(dialog(page)).toContainText('O checkout foi encerrado.');
  expect(requests).toEqual([]);
  expect(await conversions(page)).toEqual([]);
});

test('comprovante confirmado não substitui perfil vigente indisponível', async ({ page }) => {
  await fixture(page, { syncConfirmedEntitlement: false,
    lookup: async () => ({ status: 'confirmed', plan: 'monthly' }),
  });
  await page.goto(returnUrl);
  await expect(dialog(page)).toContainText('Pagamento confirmado');
  await expect(dialog(page)).toContainText('Estamos sincronizando seu acesso');
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
});
