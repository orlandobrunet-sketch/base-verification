import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block' });

const owner = { id: 'pagante-1', email: 'pagante@example.com' };

// Simula o perfil devolvido pelo Supabase para _loadPremiumFromDB.
async function carregarPremium(page: Page, resposta: { data: unknown; error: unknown }, whitelist: { data: unknown; error: unknown } = { data: null, error: null }) {
  return page.evaluate(([r, w]) => {
    const g = (0, eval);
    g('authUser = {id:"pagante-1", email:"pagante@example.com"}');
    (window as any).__perfil = r; (window as any).__lista = w;
    g(`_supaClient = { from: tabela => ({ select: () => ({ eq: () => ({
      single: async () => window.__perfil,
      maybeSingle: async () => window.__lista,
    }) }) }) }`);
    return g('_loadPremiumFromDB()').then(() => g('isPremium()'));
  }, [resposta, whitelist] as const);
}

async function abrir(page: Page, authenticated = false) {
  await page.route('**/*', r => ['localhost', '127.0.0.1'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, {}, authenticated ? { authUser: owner } : {});
}

test('o mensal vencido deixa de ser premium', async ({ page }) => {
  await abrir(page);
  const ontem = new Date(Date.now() - 86_400_000).toISOString();
  expect(await carregarPremium(page, { data: { is_premium: true, premium_expires_at: ontem }, error: null })).toBe(false);
});

test('o mensal em dia e o vitalício continuam premium', async ({ page }) => {
  await abrir(page);
  const amanha = new Date(Date.now() + 86_400_000).toISOString();
  expect(await carregarPremium(page, { data: { is_premium: true, premium_expires_at: amanha }, error: null })).toBe(true);
  expect(await carregarPremium(page, { data: { is_premium: true, premium_expires_at: null }, error: null })).toBe(true);
});

test('falha de rede não revoga o premium verificado na sessão', async ({ page }) => {
  await abrir(page);
  expect(await carregarPremium(page, { data: { is_premium: true, premium_expires_at: null }, error: null })).toBe(true);
  expect(await carregarPremium(page, { data: null, error: { message: 'Failed to fetch' } })).toBe(true);
});

test('perto do limite, aguarda confirmação Premium sem abrir cobrança', async ({ page }) => {
  await abrir(page, true);
  await page.evaluate(() => {
    const g = (0, eval);
    const profile = new Promise(resolve => { (window as any).__confirmOwnPremium = () =>
      resolve({ data: { is_premium: true, premium_expires_at: null }, error: null }); });
    (window as any).__testPremiumClient = { from: () => ({ select: () => ({ eq: () => ({ single: () => profile }) }) }) };
    g(`_guestMode=false;
      _supaClient=window.__testPremiumClient;
      localStorage.setItem(STATS_KEY, JSON.stringify({...getGameStats(),questionsAnsweredAllTime:50}));
      _invalidateStatsCache(); _loadPremiumFromDB();`);
  });
  const idx = await page.evaluate(() => (0, eval)('state.current.a'));
  await page.locator('#options .option').nth(idx).click();
  await expect(page.locator('#nextBtn')).toHaveText('Verificar meu acesso');
  await expect(page.locator('#pricingModal')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(false);
  await page.evaluate(() => (window as any).__confirmOwnPremium());
  await expect(page.locator('#nextBtn')).toHaveText('Próxima pergunta');
  expect(await page.evaluate(() => (window as any).isPremium())).toBe(true);
});

async function controlarPerfil(page: Page) {
  await page.evaluate(() => {
    const g = (0, eval);
    const reads: ((result: unknown) => void)[] = [];
    const w = window as any;
    w.__premiumReads = reads;
    w.__premiumClient = { from: () => ({ select: () => ({ eq: () => ({
      single: () => new Promise(resolve => reads.push(resolve)),
      maybeSingle: async () => ({ data: null, error: null }),
    }) }) }) };
    g(`_guestMode=false;
      _supaClient=window.__premiumClient;
      localStorage.setItem(STATS_KEY, JSON.stringify({...getGameStats(),questionsAnsweredAllTime:50}));
      _invalidateStatsCache();`);
  });
}

test('Seu Plano aguarda o perfil e permite tentar de novo sem exibir promoção a um assinante', async ({ page }) => {
  await abrir(page, true);
  await controlarPerfil(page);
  await page.evaluate(() => (window as any).openPlanModal());
  const plan = page.getByRole('dialog', { name: 'Seu Plano' });
  await expect(plan).toContainText('Verificando seu acesso');
  await expect(plan.getByRole('button', { name: /Fazer Upgrade/ })).toHaveCount(0);
  await page.evaluate(() => (window as any).__premiumReads[0]({ data: null, error: { message: 'offline' } }));
  const retry = plan.getByRole('button', { name: 'Verificar novamente' });
  await expect(retry).toBeVisible();
  await expect(plan.getByRole('button', { name: /Fazer Upgrade/ })).toHaveCount(0);
  await retry.click();
  await expect(plan).toContainText('Verificando seu acesso');
  await page.evaluate(() => (window as any).__premiumReads[1]({
    data: { is_premium: true, premium_expires_at: null }, error: null,
  }));
  await expect(plan).toContainText('Acesso completo a todas as questões.');
  await expect(plan.getByRole('button', { name: 'Fechar' })).toBeFocused();
  await expect(retry).toHaveCount(0);
});

test('a resposta de outra conta não reabre Seu Plano nem exibe acesso anterior', async ({ page }) => {
  await abrir(page, true);
  await controlarPerfil(page);
  await page.evaluate(() => (window as any).openPlanModal());
  const plan = page.getByRole('dialog', { name: 'Seu Plano' });
  await expect(plan).toContainText('Verificando seu acesso');
  await page.evaluate(() => {
    const w = window as any;
    w.authUser = { id: 'outro', email: 'outro@example.com' };
    w.openPlanModal();
    w.__premiumReads[0]({ data: { is_premium: true, premium_expires_at: null }, error: null });
  });
  await expect(plan).toContainText('Verificando seu acesso');
  await expect(plan).not.toContainText('Acesso completo');
  await page.evaluate(() => (window as any).__premiumReads[1]({
    data: { is_premium: false, premium_expires_at: null }, error: null,
  }));
  await expect(plan).toContainText('Plano Gratuito');
  await expect(plan.getByRole('button', { name: /Fazer Upgrade/ })).toBeVisible();
});

test('o personagem espera confirmação antes de iniciar e conserva a escolha após falha', async ({ page }) => {
  await abrir(page, true);
  await controlarPerfil(page);
  await page.evaluate(() => { const w = window as any; w._pendingDiff = 'normal'; return w._confirmDiff(false); });
  const choice = page.locator('#charSelectModal');
  await expect(choice).toBeVisible();
  await choice.locator('[data-char="aquaria"]').click();
  const start = choice.getByRole('button', { name: 'Iniciar Jornada' });
  await start.click();
  await expect(choice.getByRole('button', { name: 'Verificando acesso…' })).toBeDisabled();
  await expect(page.locator('#pricingModal')).toHaveCount(0);
  await page.evaluate(() => (window as any).__premiumReads[0]({ data: null, error: { message: 'offline' } }));
  await expect(start).toBeEnabled();
  await expect(choice).toHaveAttribute('data-preview-character', 'aquaria');
  await expect(page.locator('#pricingModal')).toHaveCount(0);

  await start.click();
  await expect(choice.getByRole('button', { name: 'Verificando acesso…' })).toBeDisabled();
  await page.evaluate(() => (window as any).__premiumReads[1]({
    data: { is_premium: true, premium_expires_at: null }, error: null,
  }));
  await expect(choice).toBeHidden();
  await expect.poll(() => page.evaluate(() => (0, eval)('state.character'))).toBe('aquaria');
  await expect(page.locator('#pricingModal')).toHaveCount(0);
});
