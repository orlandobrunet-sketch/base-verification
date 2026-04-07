import { test, expect } from '@playwright/test';

test.describe('Landing / Welcome screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('carrega sem erros de console críticos', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForLoadState('domcontentloaded');
    const critical = errors.filter(e =>
      !e.includes('supabase') &&   // falhas de rede auth são esperadas offline
      !e.includes('fetch') &&
      !e.includes('net::')
    );
    expect(critical, `Erros críticos: ${critical.join(' | ')}`).toHaveLength(0);
  });

  test('exibe tela de boas-vindas com botão de início', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    // Deve mostrar welcome screen ou tela de login
    const welcome = page.locator('#welcomeScreen, .landing-screen, .auth-form');
    await expect(welcome.first()).toBeVisible({ timeout: 8_000 });
  });

  test('título NefroQuest está presente na página', async ({ page }) => {
    await expect(page).toHaveTitle(/NefroQuest/i);
  });

  test('manifest.json carrega corretamente', async ({ page }) => {
    const res = await page.request.get('/manifest.json');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.name || json.short_name).toBeTruthy();
  });

  test('version.json está acessível', async ({ page }) => {
    const res = await page.request.get('/version.json');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.version).toBeTruthy();
  });
});
