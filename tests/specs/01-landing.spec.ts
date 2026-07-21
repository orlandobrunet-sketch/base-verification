import { test, expect } from '@playwright/test';

test.describe('Landing comercial', () => {
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

  test('exibe a proposta principal e conduz ao jogo', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#hero-title')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('link', { name: 'Começar grátis' }).first())
      .toHaveAttribute('href', 'https://nefroquest.com/jogar/');
    await expect(page.locator('#welcomeScreen')).toHaveCount(0);
  });

  test('oferece entrada direta para quem já possui conta', async ({ page }) => {
    const login = page.getByRole('link', { name: 'Entrar em uma conta existente' });
    await expect(login).toBeVisible();
    await expect(login).toHaveAttribute('href', 'https://nefroquest.com/jogar/?auth=login');

    await page.setViewportSize({ width: 320, height: 700 });
    const actions = await page.locator('.nav-actions').boundingBox();
    expect(actions).not.toBeNull();
    expect(actions!.x).toBeGreaterThanOrEqual(0);
    expect(actions!.x + actions!.width).toBeLessThanOrEqual(320);
  });

  test('deep link abre o login existente e consome o parâmetro', async ({ page }) => {
    await page.goto('/jogar/?auth=login');
    await expect(page.locator('#authModal')).toHaveClass(/show/, { timeout: 8_000 });
    await expect(page.locator('#tabEntrar')).toHaveClass(/active/);
    await expect(page.locator('#authFormEntrar')).toBeVisible();
    await expect(page).toHaveURL(/\/jogar\/$/);
  });

  test('preserva a intenção de login durante atualização de cache', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('nq-version-test-seeded')) return;
      sessionStorage.setItem('nq-version-test-seeded', '1');
      localStorage.setItem('nq-sw-version', '13.03');
    });
    await page.goto('/jogar/?auth=login');
    await expect(page.locator('#authModal')).toHaveClass(/show/, { timeout: 15_000 });
    await expect(page.locator('#tabEntrar')).toHaveClass(/active/);
    await expect(page).toHaveURL(/\/jogar\/$/);
  });

  test('título NefroQuest está presente na página', async ({ page }) => {
    await expect(page).toHaveTitle(/NefroQuest/i);
  });

  test('encaminha contexto antigo para a entrada do jogo', async ({ page }) => {
    await page.goto('/?app=1');
    await expect(page).toHaveURL(/\/jogar\/\?app=1$/);
    await page.waitForFunction(() => typeof (window as any).escapeHtml === 'function');
  });

  test('Oráculo começa próximo ao menu, sem área morta', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    await page.locator('a[href="#oraculo"]').first().click();

    const nav = await page.locator('#nav').boundingBox();
    const label = await page.locator('#oraculo .section-label').boundingBox();
    expect(nav).not.toBeNull();
    expect(label).not.toBeNull();

    const gap = label!.y - (nav!.y + nav!.height);
    expect(gap).toBeGreaterThanOrEqual(10);
    expect(gap).toBeLessThanOrEqual(24);
  });

  test('card +23 mantém separação entre metadado e título', async ({ page }) => {
    const card = page.locator('.guideline-cover--more');
    await card.scrollIntoViewIfNeeded();
    const meta = await card.locator('.guideline-cover__meta').boundingBox();
    const title = await card.locator('strong').boundingBox();
    expect(meta).not.toBeNull();
    expect(title).not.toBeNull();
    expect(title!.y - (meta!.y + meta!.height)).toBeGreaterThanOrEqual(10);
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
