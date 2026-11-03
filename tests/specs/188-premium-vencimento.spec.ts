import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block' });

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
    return g('_loadPremiumFromDB()').then(() => { g('_invalidatePremiumCache()'); return g('isPremium()'); });
  }, [resposta, whitelist] as const);
}

async function abrir(page: Page) {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, {});
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

test('falha de rede não apaga o premium já guardado', async ({ page }) => {
  await abrir(page);
  expect(await carregarPremium(page, { data: { is_premium: true, premium_expires_at: null }, error: null })).toBe(true);
  expect(await carregarPremium(page, { data: null, error: { message: 'Failed to fetch' } })).toBe(true);
});
