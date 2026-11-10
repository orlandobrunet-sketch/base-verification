import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const ownerA = '650effbc-f929-4553-9da7-13f89b35ad2d';
const ownerB = '8bb4d91b-4255-4687-b54f-f04ed5a1c3aa';
const returnUrl = '/jogar/?payment=approved&payment_id=123&plan=lifetime&preference_id=pref-123';

async function fixture(page: Page, {
  owner = ownerA as string | null,
  existingPremium = false,
  checkout = false,
  simulateCheckout = false,
  lookup = async (_attempt: number) => ({ status: 'pending' } as Record<string, unknown>),
} = {}) {
  const requests: { authorization: string, body: unknown }[] = [];
  await page.addInitScript(({ owner, existingPremium, checkout }) => {
    const events = new Set<(event: string, session: any) => void>();
    const sessionFor = (id: string | null) => id ? {
      access_token: 'test-' + id,
      user: { id, email: 'fixture@example.test', app_metadata: {}, user_metadata: { nickname: 'Fixture' } },
    } : null;
    let session = sessionFor(owner);
    const profile = { is_premium: existingPremium, premium_expires_at: null };
    const client = {
      auth: {
        getSession: async () => ({ data: { session }, error: null }),
        onAuthStateChange: (listener: (event: string, session: any) => void) => {
          events.add(listener);
          queueMicrotask(() => listener('INITIAL_SESSION', session));
          return { data: { subscription: { unsubscribe: () => events.delete(listener) } } };
        },
      },
      from: (table: string) => {
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
    (window as any).setPaymentFixtureOwner = (id: string | null) => {
      session = sessionFor(id);
      for (const listener of events) listener(id ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    };
    if (checkout) sessionStorage.setItem('nq-payment-checkout', JSON.stringify({
      owner, plan: 'monthly', startedAt: Date.now(), preferenceId: 'pref-123',
    }));
  }, { owner, existingPremium, checkout });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
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
      const result = await lookup(requests.length);
      try {
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
  const requests = await fixture(page, {
    checkout: true,
    lookup: async attempt => attempt === 1 ? { status: 'pending' }
      : { status: 'confirmed', plan: 'monthly', processed_at: '2000-01-01T00:00:00Z' },
  });
  await page.goto(returnUrl);
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

test('checkout encerrado mostra orientação sem consultar nem declarar aprovação', async ({ page }) => {
  const requests = await fixture(page);
  await page.goto('/jogar/?payment=failed&payment_id=123');
  await expect(dialog(page)).toContainText('O checkout foi encerrado.');
  expect(requests).toEqual([]);
  expect(await conversions(page)).toEqual([]);
});
