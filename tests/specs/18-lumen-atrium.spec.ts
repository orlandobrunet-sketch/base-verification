import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const atriumPath = '/jogar/';

async function enterAsGuest(page: import('@playwright/test').Page) {
  await page.goto(atriumPath, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
}

test.describe('Página 2 — Átrio da Jornada Lúmen', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('carrega a página real e preserva os contratos funcionais', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Seu domínio deixa rastros.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Escolha seu próximo movimento' })).toBeVisible();
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-nq-ui', 'lumen');
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#welcomeScreen > .welcome-bg')).toBeHidden();
    await expect(page.locator('#welcomeScreen > .welcome-particles')).toBeHidden();

    await expect(page.locator('.mobile-sound-controls')).toBeHidden();
    await expect(page.locator('#welcomeSoundControls')).toBeVisible();
    const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLLinkElement).href).pathname + new URL((link as HTMLLinkElement).href).search)
    );
    expect(stylesheets).toContain('/styles/lumen/atrium.css?v=13.22');
    await expect(page.locator('script[src="js/atrium.js?v=13.22"]')).toHaveCount(1);

    const actions = await page.locator('#welcomeScreen [data-action]').evaluateAll((elements) =>
      elements.map((element) => ({
        action: (element as HTMLElement).dataset.action || '',
        available: typeof (window as unknown as Record<string, unknown>)[(element as HTMLElement).dataset.action || ''] === 'function',
      }))
    );
    expect(actions.filter(({ available }) => !available)).toEqual([]);
  });

  test('mantém a composição dentro da viewport nos breakpoints de aprovação', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 768, height: 900 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize(viewport);
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(metrics.scrollWidth, `${viewport.width}px criou overflow horizontal`).toBeLessThanOrEqual(metrics.clientWidth + 1);

      const newJourney = page.locator('[data-action="startNewFromWelcome"]');
      await newJourney.scrollIntoViewIfNeeded();
      await expect(newJourney).toBeVisible();
      const primaryBox = await newJourney.boundingBox();
      expect(primaryBox?.width || 0).toBeGreaterThanOrEqual(Math.min(220, viewport.width - 48));

      const library = page.locator('[data-atrium-route="library"]');
      await library.scrollIntoViewIfNeeded();
      await expect(library).toBeVisible();
      const routeBox = await library.boundingBox();
      expect(routeBox?.width || 0).toBeGreaterThanOrEqual(Math.min(288, viewport.width - 48));
    }
  });

  test('oferece feedback de rota sem deslocar a lista', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const routeList = page.locator('.nql-atrium__route-list');
    const initial = await routeList.boundingBox();
    expect(initial).not.toBeNull();

    for (const route of ['modes', 'dashboard', 'ritual', 'ranking', 'library']) {
      const target = page.locator(`[data-atrium-route="${route}"]`);
      await target.hover();
      await expect(target).toHaveClass(/is-current/);
      await expect(page.locator('#atriumRouteStatus')).not.toHaveText('Explore uma rota sem perder o fio da sua jornada.');
      const current = await routeList.boundingBox();
      expect(Math.abs((current?.width || 0) - (initial?.width || 0)), `${route} alterou a largura`).toBeLessThan(1);
      expect(Math.abs((current?.height || 0) - (initial?.height || 0)), `${route} alterou a altura`).toBeLessThan(1);
    }
  });

  test('reflete visualmente uma jornada salva sem assumir a lógica do jogo', async ({ page }) => {
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-journey-state', 'fresh');
    await page.locator('#welcomeSavedInfo').evaluate((element: HTMLElement) => { element.style.display = 'block'; });
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-journey-state', 'saved');
    await page.locator('#welcomeSavedInfo').evaluate((element: HTMLElement) => { element.style.display = 'none'; });
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-journey-state', 'fresh');
  });

  test('oferece navegação por teclado e alvos mínimos', async ({ page }) => {
    const skipLink = page.getByRole('link', { name: 'Ir para sua jornada' });
    await skipLink.focus();
    await skipLink.click();
    await expect(page).toHaveURL(/\/jogar\/#atriumMain$/);
    await expect(page.locator('#atriumMain')).toBeFocused();

    for (const route of ['modes', 'dashboard', 'ritual', 'ranking', 'library']) {
      const target = page.locator(`[data-atrium-route="${route}"]`);
      const box = await target.boundingBox();
      expect(box?.height || 0, `${route} menor que 44px`).toBeGreaterThanOrEqual(44);
      await target.focus();
      await expect(target).toHaveClass(/is-current/);
    }
  });

  test('respeita movimento reduzido e mantém o significado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#welcomeScreen')).toBeVisible();

    const state = await page.locator('.nql-atrium__route').first().evaluate((element) => {
      const style = getComputedStyle(element);
      return { animation: style.animationName, transition: style.transitionDuration };
    });
    expect(state.animation).toBe('none');
    expect(parseFloat(state.transition)).toBeLessThanOrEqual(0.01);
    await expect(page.getByRole('heading', { name: 'Seu domínio deixa rastros.' })).toBeVisible();
  });

  test('não apresenta violações axe sérias ou críticas', async ({ page }) => {
    const results = await new AxeBuilder({ page }).include('#welcomeScreen').analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  });
});
