import { test, expect, type Page } from '@playwright/test';

const userA = { id: '00000000-0000-4000-8000-000000000001', email: 'a@example.test', user_metadata: {} };
const userB = { id: '00000000-0000-4000-8000-000000000002', email: 'b@example.test', user_metadata: {} };
const key = (id: string) => 'nefroquest-account:' + id;
const token = 'local-test-token';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost'
    ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'load' });
  await page.evaluate(({ user, token }) => {
    const win = window as any;
    win.authUser = user;
    win.accountCalls = [];
    win.accountSession = () => ({ data: { session: { user: win.authUser, access_token: token } }, error: null });
    win.accountDelete = async () => ({ data: null, error: { message: 'falha simulada' } });
    (0, eval)(`_supaClient = {
      auth: { getSession: async () => window.accountSession(),
        signOut: async () => { window.accountCalls.push('logout'); return {error:null}; } },
      from: () => ({
        upsert: async row => window.accountProfileSave ? window.accountProfileSave(row) : {error:null},
        delete: () => ({eq: async () => ({error:{message:'DELETE recusado'}})})
      }),
      functions: { invoke: async (name, options) => {
        window.accountCalls.push({name,options}); return window.accountDelete();
      } }
    }`);
  }, { user: userA, token });
});

const account = (page: Page) => page.getByRole('dialog', { name: 'Minha Conta' });

async function openAccount(page: Page) {
  await page.evaluate(() => (window as any).openAccountModal());
  await expect(account(page)).toBeVisible();
}

async function openDelete(page: Page) {
  await openAccount(page);
  await account(page).getByRole('button', { name: /Excluir minha conta/i }).click();
  return page.getByRole('dialog', { name: 'Excluir Conta', exact: true });
}

test('ownerless data is ignored and reopening a different account never exposes saved preferences', async ({ page }) => {
  await page.evaluate(({ key, id }) => {
    localStorage.setItem('nefroquest-account', JSON.stringify({ name: 'Sem dono', phone: '999', city: 'Outra cidade' }));
    localStorage.setItem('nq-identity', 'combat');
    localStorage.setItem(key, JSON.stringify({ phone: '123', city: 'Recife' }));
    localStorage.setItem('nq-identity:' + id, 'study');
  }, { key: key(userA.id), id: userA.id });
  await openAccount(page);
  await expect(account(page).getByLabel(/Telefone/)).toHaveValue('123');
  await expect(account(page).getByLabel('Modo preferido')).toHaveValue('study');

  await page.evaluate(user => { (window as any).authUser = user; }, userB);
  await expect(account(page)).toBeHidden();
  await openAccount(page);
  await expect(account(page).getByLabel('Email')).toHaveValue(userB.email);
  await expect(account(page).getByLabel(/Nome completo/)).toHaveValue('');
  await expect(account(page).getByLabel(/Telefone/)).toHaveValue('');
  await expect(account(page).getByLabel('Cidade')).toHaveValue('');
  await expect(account(page).getByLabel('Modo preferido')).toHaveValue('');

  await page.evaluate(user => { (window as any).authUser = user; }, userA);
  await openAccount(page);
  await expect(account(page).getByLabel(/Telefone/)).toHaveValue('123');
  await expect(account(page).getByLabel('Cidade')).toHaveValue('Recife');
});

test('deletion fails visibly, blocks duplicate sends and keeps the current session and preferences', async ({ page }) => {
  await page.evaluate(key => {
    localStorage.setItem(key, JSON.stringify({ phone: '123' }));
    const win = window as any;
    win.accountDelete = () => new Promise(resolve => { win.finishAccountDelete = resolve; });
  }, key(userA.id));
  const confirm = await openDelete(page);
  const submit = confirm.getByRole('button', { name: /Sim, excluir/ });
  await submit.click();
  await expect(submit).toBeDisabled();
  await page.evaluate(() => (window as any).executeDeleteAccount());
  await page.keyboard.press('Escape');
  await expect(confirm).toBeVisible();
  await page.evaluate(() => (window as any).finishAccountDelete({ data: null, error: { message: 'falha simulada' } }));
  await expect(confirm.getByRole('status')).toContainText('Não foi possível confirmar');
  await expect(submit).toBeEnabled();
  expect(await page.evaluate(key => ({
    owner: (window as any).authUser?.id,
    phone: JSON.parse(localStorage.getItem(key) || '{}').phone,
    calls: (window as any).accountCalls
  }), key(userA.id))).toEqual({
    owner: userA.id, phone: '123',
    calls: [{ name: 'delete-account', options: {
      body: { userId: userA.id }, headers: { Authorization: 'Bearer ' + token }
    } }]
  });
});

test('confirmed deletion removes only the matching local preferences and ends that session', async ({ page }) => {
  await page.evaluate(({ a, b, id }) => {
    localStorage.setItem(a, '{}');
    localStorage.setItem(b, JSON.stringify({ city: 'Recife' }));
    localStorage.setItem('nq-identity:' + id, 'study');
    (window as any).accountDelete = async () => ({ data: { deleted: true, userId: id }, error: null });
  }, { a: key(userA.id), b: key(userB.id), id: userA.id });
  const confirm = await openDelete(page);
  await confirm.getByRole('button', { name: /Sim, excluir/ }).click();
  await expect(confirm).toHaveCount(0);
  await expect(page.getByText('Conta excluída.', { exact: true })).toBeVisible();
  expect(await page.evaluate(({ a, b, id }) => ({
    a: localStorage.getItem(a), b: JSON.parse(localStorage.getItem(b) || '{}').city,
    mode: localStorage.getItem('nq-identity:' + id),
    owner: (window as any).authUser,
    loggedOut: (window as any).accountCalls.includes('logout')
  }), { a: key(userA.id), b: key(userB.id), id: userA.id })).toEqual({
    a: null, b: 'Recife', mode: null, owner: null, loggedOut: true
  });
});

test('a late confirmation for the old account cannot sign out the new account', async ({ page }) => {
  await page.evaluate(({ a, b }) => {
    localStorage.setItem(a, '{}');
    localStorage.setItem(b, JSON.stringify({ phone: '456' }));
    const win = window as any;
    win.accountDelete = () => new Promise(resolve => { win.finishAccountDelete = resolve; });
  }, { a: key(userA.id), b: key(userB.id) });
  const confirm = await openDelete(page);
  await confirm.getByRole('button', { name: /Sim, excluir/ }).click();
  await expect.poll(() => page.evaluate(() => typeof (window as any).finishAccountDelete)).toBe('function');
  await page.evaluate(({ user, id }) => {
    const win = window as any;
    win.authUser = user;
    win.finishAccountDelete({ data: { deleted: true, userId: id }, error: null });
  }, { user: userB, id: userA.id });
  await expect(confirm).toHaveCount(0);
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), key(userA.id))).toBeNull();
  await openAccount(page);
  await expect(account(page).getByLabel('Email')).toHaveValue(userB.email);
  await expect(account(page).getByLabel(/Telefone/)).toHaveValue('456');
  expect(await page.evaluate(() => (window as any).accountCalls.includes('logout'))).toBe(false);
});

test('a change in the SDK session is respected even before the account callback arrives', async ({ page }) => {
  await page.evaluate(({ oldId, newUser, key }) => {
    localStorage.setItem(key, '{}');
    const win = window as any;
    win.accountDelete = async () => {
      win.accountSession = () => ({ data: { session: { user: newUser, access_token: 'new-session-token' } }, error: null });
      return { data: { deleted: true, userId: oldId }, error: null };
    };
  }, { oldId: userA.id, newUser: userB, key: key(userA.id) });
  const confirm = await openDelete(page);
  await confirm.getByRole('button', { name: /Sim, excluir/ }).click();
  await expect(confirm).toHaveCount(0);
  await expect(page.getByText(/Conta excluída no servidor/)).toBeVisible();
  expect(await page.evaluate(() => ({
    sdkOwner: (window as any).accountSession().data.session.user.id,
    loggedOut: (window as any).accountCalls.includes('logout')
  }))).toEqual({ sdkOwner: userB.id, loggedOut: false });
});

async function mockMetadataSave(page: Page) {
  const writes: { token?: string; metadata: unknown }[] = [];
  await page.route('**/auth/v1/user', async route => {
    const headers = {
      'Access-Control-Allow-Origin': new URL(page.url()).origin,
      'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    writes.push({ token: route.request().headers().authorization, metadata: route.request().postDataJSON() });
    return route.fulfill({ status: 200, json: {}, headers });
  });
  return writes;
}

test('a pending save blocks another save by the same owner and keeps the confirmed nickname through stale session metadata', async ({ page }) => {
  const oldUser = { ...userA, user_metadata: { nickname: 'Antes' } };
  const writes = await mockMetadataSave(page);
  await page.evaluate(user => {
    const win = window as any;
    win.authUser = user;
    win.accountProfileSave = () => new Promise(resolve => { win.finishProfileSave = resolve; });
  }, oldUser);
  await openAccount(page);
  await account(page).getByLabel(/Apelido/).fill('Depois');
  await account(page).getByLabel(/Telefone/).fill('12345678');
  await account(page).getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => typeof (window as any).finishProfileSave)).toBe('function');
  await account(page).getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.evaluate(() => (window as any).openAccountModal());
  await expect(account(page)).toBeHidden();
  await page.evaluate(() => (window as any).finishProfileSave({ error: null }));
  await expect.poll(() => page.evaluate(key =>
    JSON.parse(localStorage.getItem(key) || '{}').nicknameConfirmation?.value, key(userA.id))).toBe('Depois');
  expect(writes).toEqual([{ token: 'Bearer ' + token, metadata: { data: {
    full_name: '', specialty: '', nickname: 'Depois'
  } } }]);
  await page.evaluate(user => { (window as any).authUser = user; }, oldUser);
  await openAccount(page);
  await expect(account(page).getByLabel(/Apelido/)).toHaveValue('Depois');
});

test('saving a nickname preserves unknown cloud profile fields and can clear a known phone', async ({ page }) => {
  await mockMetadataSave(page);
  await page.evaluate(() => {
    const win = window as any;
    win.accountProfileSave = async (row: object) => { win.accountCalls.push(row); return { error: null }; };
  });
  await openAccount(page);
  await account(page).getByLabel(/Apelido/).fill('Apelido de teste');
  await account(page).getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(account(page)).toBeHidden();
  expect(await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return { hasPhone: Object.hasOwn(saved, 'phone'), hasCity: Object.hasOwn(saved, 'city'), profileWrites: (window as any).accountCalls };
  }, key(userA.id))).toEqual({ hasPhone: false, hasCity: false, profileWrites: [] });
  await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...saved, phone: '12345678' }));
  }, key(userA.id));
  await openAccount(page);
  await expect(account(page).getByLabel(/Telefone/)).toHaveValue('12345678');
  await account(page).getByLabel(/Telefone/).clear();
  await account(page).getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(account(page)).toBeHidden();
  expect(await page.evaluate(() => (window as any).accountCalls)).toEqual([{ id: userA.id, phone: '' }]);
});
