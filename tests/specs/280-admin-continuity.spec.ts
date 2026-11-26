import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const ownerA = '00000000-0000-4000-8000-0000000000a1';
const ownerB = '00000000-0000-4000-8000-0000000000b2';
const audits = new WeakMap<Page, { errors: string[]; unexpected: string[]; sockets: number }>();
test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const audit = { errors: [] as string[], unexpected: [] as string[], sockets: 0 };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (req.method() !== 'GET') audit.unexpected.push(req.method() + ' ' + url.pathname);
    return req.method() === 'GET' && url.origin === origin ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, [{ qid: 'admin-continuity-technical', q: 'Exercício técnico de navegação', opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'Explicação técnica.', cat: 'geral', diff: 'medium' }]);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 }, { authUser: { id: ownerA, email: 'admin-a@example.invalid', app_metadata: { is_admin: true } } });
});
test.afterEach(async ({ page }, info) => {
  await info.attach('admin-continuity-audit', { contentType: 'application/json', body: JSON.stringify(audits.get(page)) });
  if (info.status === info.expectedStatus) expect(audits.get(page)).toEqual({ errors: [], unexpected: [], sockets: 0 });
});

// This is the external SDK query boundary, as in spec84. Production loaders,
// identity checks, dialogs, selectors and rendering are never replaced.
async function controlledDatabase(page: Page, options: { hold?: string; emptyLeaderboard?: boolean; heldFirstOnly?: boolean; failFirst?: string } = {}) {
  await page.evaluate(options => {
    const w = window as any;
    w.__adminReads = [];
    w.__adminReadAborts = 0;
    const records: Record<string, unknown[]> = {
      leaderboard: options.emptyLeaderboard ? [] : [{ player_name: 'Registro técnico da conta A', score: 25, level: 1 }],
      question_ratings: [{ question_id: 'admin-continuity-technical', question_text: 'Registro técnico de avaliação', rating_quality: 4, rating_learning: 5, player_email: 'rating@example.invalid', created_at: '2026-11-14T12:00:00Z' }],
      question_difficulty_votes: [],
      access_whitelist: [{ email: 'acesso-a@example.invalid', added_at: '2026-11-14T12:00:00Z' }],
    };
    w.__adminClient = { from: (table: string) => {
      const chain = {
        select() { return this; }, order() { return this; }, limit() { return this; },
        abortSignal(signal: AbortSignal) {
          signal.addEventListener('abort', () => w.__adminReadAborts++, { once: true });
          return this;
        },
        then(resolve: any, reject: any) {
          w.__adminReads.push(table);
          const count = w.__adminReads.filter((read: string) => read === table).length;
          if (table === options.failFirst && count === 1) {
            return Promise.resolve({ data: null, error: new Error('Falha simulada na consulta') }).then(resolve, reject);
          }
          const response = { data: records[table] || [], error: null };
          if (options.heldFirstOnly && count > 1) {
            if (table === 'leaderboard') response.data = [{ player_name: 'Registro técnico atualizado', score: 30, level: 2 }];
            if (table === 'access_whitelist') response.data = [{ email: 'acesso-atualizado@example.invalid', added_at: '2026-11-14T13:00:00Z' }];
          }
          const result = table === options.hold && (!options.heldFirstOnly || count === 1)
            ? new Promise(done => { w.__releaseAdminRead = () => done(response); })
            : Promise.resolve(response);
          return result.then(resolve, reject);
        }
      };
      return chain;
    } };
    (0, eval)('_supaClient = window.__adminClient');
  }, options);
}

test('Analytics com ranking vazio termina as consultas independentes de avaliações e votos', async ({ page }) => {
  await controlledDatabase(page, { emptyLeaderboard: true });
  await page.evaluate(() => (window as any).openAnalyticsPanel());
  await expect(page.getByRole('dialog', { name: /Analytics/ })).toBeVisible();
  await expect(page.locator('#anTotalPlayers')).toHaveText('0');
  await expect(page.locator('#anTop5')).toHaveText('Sem dados ainda.');
  await expect(page.locator('#anRatingsList')).toContainText('Registro técnico de avaliação');
  await expect(page.locator('#anDifficultyList')).not.toContainText(/Carregando/);
  expect(await page.evaluate(() => (window as any).__adminReads)).toEqual(['leaderboard', 'question_ratings', 'question_difficulty_votes']);
});

for (const [table, open, root, title, privateText] of [
  ['leaderboard', 'openAnalyticsPanel', '#analyticsModal', 'Analytics', 'Registro técnico da conta A'],
  ['access_whitelist', 'openAdminPanel', '#adminModal', 'Lista de Acesso', 'acesso-a@example.invalid'],
] as const) test(`${title}: resposta iniciada na conta A não fica visível na conta B sem permissão`, async ({ page }, info) => {
  await controlledDatabase(page, { hold: table });
  await page.evaluate(open => (window as any)[open](), open);
  await expect(page.locator(root)).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).__adminReads.length)).toBe(1);
  await page.evaluate(ownerB => {
    (window as any).authUser = { id: ownerB, app_metadata: {} };
    (window as any)._stopLocalJourney();
  }, ownerB);
  await expect(page.locator(root)).toHaveCount(0);
  await page.evaluate(async () => {
    (window as any).__releaseAdminRead();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  await info.attach('retired-admin-view', { contentType: 'application/json', body: JSON.stringify(await page.evaluate(root => {
    const modal = document.querySelector(root) as HTMLElement | null;
    return { owner: (window as any).authUser?.id, admin: (0, eval)('isAdminUser()'),
      visible: !!modal?.getClientRects().length && getComputedStyle(modal).display !== 'none',
      text: modal?.textContent, reads: (window as any).__adminReads };
  }, root)) });
  await expect(page.locator(root)).toBeHidden();
  await expect(page.getByText(privateText, { exact: true })).not.toBeVisible();
  expect(await page.evaluate(() => (0, eval)('isAdminUser()'))).toBe(false);
});

for (const [open, root, status] of [
  ['openAnalyticsPanel', '#analyticsModal', '#anRatingsList'],
  ['openAdminPanel', '#adminModal', '#wlList'],
] as const) test(`${open}: SDK indisponível encerra a carga com erro legível`, async ({ page }) => {
  await page.evaluate(() => (0, eval)('_supaClient = null'));
  await page.evaluate(open => (window as any)[open](), open);
  await expect(page.locator(root)).toBeVisible();
  await expect(page.locator(status)).toContainText(/Erro|Não foi possível|indisponível/);
  await expect(page.locator(status)).not.toContainText(/Carregando/);
  if (root === '#analyticsModal') await expect(page.locator('#anDifficultyList')).not.toContainText(/Carregando/);
});

for (const stall of [false, true]) test(`Lista de Acesso permite tentar novamente após ${stall ? 'prazo excedido' : 'falha'} com foco e rascunho preservados`, async ({ page }) => {
  const table = 'access_whitelist';
  await controlledDatabase(page, stall
    ? { hold: table, heldFirstOnly: true } : { failFirst: table, heldFirstOnly: true });
  const now = Date.UTC(2030, 0, 1);
  await page.clock.install({ time: now - 1000 });
  await page.clock.pauseAt(now);
  await page.evaluate(() => (window as any).openAdminPanel());
  const panel = page.getByRole('dialog', { name: /Lista de Acesso/ });
  const list = panel.locator('#wlList');
  const retry = panel.getByRole('button', { name: 'Tentar novamente', exact: true });
  const input = panel.locator('#wlEmailInput');
  const draft = 'rascunho@example.invalid';
  await input.fill(draft);
  await expect.poll(() => page.evaluate(() => (window as any).__adminReads)).toEqual([table]);
  if (stall) {
    await page.clock.fastForward(9999);
    await expect(list).toContainText('Carregando');
    await expect(retry).toBeHidden();
    await page.clock.fastForward(1);
  }
  await expect(list).toContainText(stall ? 'A lista demorou para carregar.' : 'Não foi possível carregar a lista agora.');
  expect(await page.evaluate(() => (window as any).__adminReadAborts)).toBe(stall ? 1 : 0);
  await expect(retry).toBeVisible();
  await retry.focus();
  await page.keyboard.press('Enter');
  await expect(list).toContainText('acesso-atualizado@example.invalid');
  await expect(retry).toBeHidden();
  await expect(list).toBeFocused();
  await expect(input).toHaveValue(draft);
  if (stall) {
    // A fronteira simulada registra o cancelamento, mas resolve tarde.
    await page.evaluate(() => (window as any).__releaseAdminRead());
    await page.clock.runFor(1);
    await expect(list).not.toContainText('acesso-a@example.invalid');
    await expect(list).toContainText('acesso-atualizado@example.invalid');
  }
  expect(await page.evaluate(() => (window as any).__adminReads)).toEqual([table, table]);
});

for (const [table, open, refresh, close, root, currentText, oldText] of [
  ['leaderboard', 'openAnalyticsPanel', 'loadAnalyticsData', 'closeAnalyticsPanel', '#analyticsModal', 'Registro técnico atualizado', 'Registro técnico da conta A'],
  ['access_whitelist', 'openAdminPanel', 'adminLoadWhitelist', 'closeAdminPanel', '#adminModal', 'acesso-atualizado@example.invalid', 'acesso-a@example.invalid'],
] as const) for (const reopen of [false, true]) test(`${open}: resposta antiga não substitui a nova após ${reopen ? 'fechar e reabrir' : 'atualizar'}`, async ({ page }) => {
  await controlledDatabase(page, { hold: table, heldFirstOnly: true });
  await page.evaluate(open => (window as any)[open](), open);
  await expect.poll(() => page.evaluate(() => (window as any).__adminReads.length)).toBe(1);
  if (reopen) {
    await page.evaluate(close => (window as any)[close](), close);
    await expect(page.locator(root)).toBeHidden();
    await page.evaluate(open => (window as any)[open](), open);
  } else await page.evaluate(refresh => (window as any)[refresh](), refresh);
  await expect(page.getByText(currentText, { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    (window as any).__releaseAdminRead();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  await expect(page.getByText(currentText, { exact: true })).toBeVisible();
  await expect(page.getByText(oldText, { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator(root)).toBeHidden();
  await page.evaluate(open => (window as any)[open](), open);
  await expect(page.locator(root)).toBeVisible();
  await expect(page.getByText(currentText, { exact: true })).toBeVisible();
});

test('sucesso de adicionar acesso da conta aposentada não limpa nem anuncia no novo dono', async ({ page }) => {
  await controlledDatabase(page);
  await page.evaluate(() => (window as any).openAdminPanel());
  await expect(page.locator('#wlList')).toContainText('acesso-a@example.invalid');
  await page.locator('#wlEmailInput').fill('novo-acesso@example.invalid');
  await page.evaluate(() => {
    const w = window as any;
    w.__adminMutationCalls = 0;
    w.__adminMutationClient = { from: () => ({ upsert: () => {
      w.__adminMutationCalls++;
      return new Promise(resolve => { w.__releaseAdminMutation = () => resolve({ error: null }); });
    } }) };
    (0, eval)('_supaClient = window.__adminMutationClient');
    w.__adminMutation = w.adminAddWhitelist();
  });
  await expect.poll(() => page.evaluate(() => (window as any).__adminMutationCalls)).toBe(1);
  await page.evaluate(ownerB => {
    (window as any).authUser = { id: ownerB, app_metadata: { is_admin: true } };
    (window as any)._stopLocalJourney();
  }, ownerB);
  await controlledDatabase(page);
  await page.evaluate(() => (window as any).openAdminPanel());
  await page.locator('#wlEmailInput').fill('rascunho-b@example.invalid');
  await page.evaluate(async () => { (window as any).__releaseAdminMutation(); await (window as any).__adminMutation; });
  await expect(page.locator('#wlEmailInput')).toHaveValue('rascunho-b@example.invalid');
  await expect(page.locator('.nq-toast').filter({ hasText: 'adicionado com sucesso' })).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__adminMutationCalls)).toBe(1);
});

test('cancelar a confirmação nativa de remoção mantém o acesso e não chama o banco', async ({ page }) => {
  await controlledDatabase(page);
  await page.evaluate(() => (window as any).openAdminPanel());
  await expect(page.locator('#wlList')).toContainText('acesso-a@example.invalid');
  await page.evaluate(() => {
    const w = window as any;
    w.__adminDeleteCalls = 0;
    w.__adminDeleteClient = { from: () => ({ delete: () => ({ eq: () => {
      w.__adminDeleteCalls++;
      return Promise.resolve({ error: null });
    } }) }) };
    (0, eval)('_supaClient = window.__adminDeleteClient');
  });
  const confirmation = page.waitForEvent('dialog');
  const click = page.locator('#wlList').getByRole('button', { name: 'Remover', exact: true }).click();
  const dialog = await confirmation;
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toBe('Remover acesso de acesso-a@example.invalid?');
  await dialog.dismiss();
  await click;
  expect(await page.evaluate(() => (window as any).__adminDeleteCalls)).toBe(0);
  await expect(page.locator('#wlList')).toContainText('acesso-a@example.invalid');
});

test('adicionar acesso pendente não limpa rascunho ao fechar e reabrir o mesmo painel e dono', async ({ page }) => {
  await controlledDatabase(page);
  await page.evaluate(() => (window as any).openAdminPanel());
  await expect(page.locator('#wlList')).toContainText('acesso-a@example.invalid');
  await page.locator('#wlEmailInput').fill('primeiro-acesso@example.invalid');
  await page.evaluate(() => {
    const w = window as any;
    w.__adminHeldClient = { from: () => ({ upsert: () => new Promise(resolve => {
      w.__releaseAdminHeld = () => resolve({ error: null });
    }) }) };
    (0, eval)('_supaClient = window.__adminHeldClient');
    w.__adminHeld = w.adminAddWhitelist();
  });
  await page.evaluate(() => (window as any).closeAdminPanel());
  await expect(page.locator('#adminModal')).toBeHidden();
  await controlledDatabase(page);
  await page.evaluate(() => (window as any).openAdminPanel());
  await page.locator('#wlEmailInput').fill('rascunho-da-nova-abertura@example.invalid');
  await page.evaluate(async () => { (window as any).__releaseAdminHeld(); await (window as any).__adminHeld; });
  await expect(page.locator('#wlEmailInput')).toHaveValue('rascunho-da-nova-abertura@example.invalid');
  await expect(page.locator('.nq-toast').filter({ hasText: 'adicionado com sucesso' })).toHaveCount(0);
});

test('retirada da permissão no mesmo dono fecha os dados já visíveis sem aposentar a jornada', async ({ page }) => {
  await controlledDatabase(page);
  await page.evaluate(() => (window as any).openAnalyticsPanel());
  await expect(page.getByText('Registro técnico da conta A', { exact: true })).toBeVisible();
  const identity = await page.evaluate(() => {
    const w = window as any;
    const before = (0, eval)('_progressEpoch');
    // This is the identity/UI branch reached by TOKEN_REFRESHED for the same id.
    // The remote Auth transport is outside this controlled proof.
    w.authUser = { ...w.authUser, app_metadata: {} };
    w.updateWelcomeUserBadge();
    return { before, after: (0, eval)('_progressEpoch'), owner: w.authUser?.id, admin: (0, eval)('isAdminUser()') };
  });
  expect(identity).toEqual({ before: identity.before, after: identity.before, owner: ownerA, admin: false });
  await expect(page.locator('#analyticsModal')).toHaveCount(0);
  await expect(page.getByText('Registro técnico da conta A', { exact: true })).toHaveCount(0);
});

for (const editWhilePending of [false, true]) test(`resposta de adicionar acesso ${editWhilePending ? 'preserva o segundo e-mail digitado' : 'limpa o mesmo e-mail enviado'} na mesma abertura`, async ({ page }) => {
  await controlledDatabase(page);
  await page.evaluate(() => (window as any).openAdminPanel());
  await expect(page.locator('#wlList')).toContainText('acesso-a@example.invalid');
  await page.locator('#wlEmailInput').fill('primeiro-acesso@example.invalid');
  await page.evaluate(() => {
    const w = window as any;
    w.__liveDraftWrites = [];
    w.__liveDraftClient = { from: () => ({
      upsert: (payload: unknown) => {
        w.__liveDraftWrites.push(structuredClone(payload));
        return new Promise(resolve => { w.__releaseLiveDraft = () => resolve({ error: null }); });
      },
      select: () => ({ order: async () => ({ data: [], error: null }) }),
    }) };
    (0, eval)('_supaClient = window.__liveDraftClient');
  });
  await page.locator('#adminModal [data-action="adminAddWhitelist"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).__liveDraftWrites.length)).toBe(1);
  if (editWhilePending) await page.locator('#wlEmailInput').fill('proximo-acesso@example.invalid');
  await page.evaluate(async () => { (window as any).__releaseLiveDraft(); await new Promise(resolve => setTimeout(resolve, 0)); });
  await expect(page.locator('#wlEmailInput')).toHaveValue(editWhilePending ? 'proximo-acesso@example.invalid' : '');
  expect(await page.evaluate(() => (window as any).__liveDraftWrites)).toEqual([{ email: 'primeiro-acesso@example.invalid', added_at: expect.any(String) }]);
});
