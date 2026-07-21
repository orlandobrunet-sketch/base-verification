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
