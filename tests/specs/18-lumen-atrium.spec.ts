import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const atriumPath = '/jogar/';

async function enterAsGuest(page: import('@playwright/test').Page) {
  await page.goto(atriumPath, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
}

async function enterWithSavedJourney(
  page: import('@playwright/test').Page,
  overrides: Record<string, unknown> = {}
) {
  await page.evaluate((save) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
  }, {
    schemaVersion: 6,
    character: 'nephros',
    level: 5,
    xp: 250,
    xpToNext: 9999,
    score: 535,
    lives: 3,
    maxLives: 4,
    timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
    ...overrides,
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    (window as typeof window & { playAsGuest: () => void }).playAsGuest();
  });
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.locator('#welcomeSavedInfo')).toBeVisible();
}

test.describe('Página 2 — Átrio da Jornada Lúmen', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('carrega a página real e preserva os contratos funcionais', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Seu domínio deixa rastros.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Escolha seu próximo movimento' })).toBeVisible();
    for (const selector of ['#atriumTitle', '#atriumRoutesTitle']) {
      const lines = await page.locator(selector).evaluate((heading) =>
        Array.from(heading.children).map((line) => ({
          top: line.getBoundingClientRect().top,
          rects: line.getClientRects().length,
          whiteSpace: getComputedStyle(line).whiteSpace,
        }))
      );
      expect(lines).toHaveLength(2);
      expect(lines.map((line) => line.rects)).toEqual([1, 1]);
      expect(lines[1].top).toBeGreaterThan(lines[0].top);
      expect(lines.every((line) => line.whiteSpace === 'nowrap')).toBe(true);
    }
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-nq-ui', 'lumen');
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#welcomeScreen > .welcome-bg')).toBeHidden();
    await expect(page.locator('#welcomeScreen > .welcome-particles')).toBeHidden();

    await expect(page.locator('.mobile-sound-controls')).toBeHidden();
    await expect(page.locator('#welcomeSoundControls')).toBeVisible();
    const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLLinkElement).href).pathname + new URL((link as HTMLLinkElement).href).search)
    );
    expect(stylesheets).toContain('/styles/lumen/atrium.css?v=13.43');
    await expect(page.locator('script[src="js/atrium.js?v=13.23"]')).toHaveCount(1);
    await expect(page.locator('script[src="js/auth.js?v=13.43"]')).toHaveCount(1);
    await expect(page.locator('script[src="js/game.js?v=13.43"]')).toHaveCount(1);

    const railLayout = await page.locator('.nql-atrium').evaluate((atrium) => {
      const atriumRect = atrium.getBoundingClientRect();
      const journeyRect = atrium.querySelector('.nql-atrium__journey')!.getBoundingClientRect();
      const railStyle = getComputedStyle(atrium, '::before');
      return {
        visible: railStyle.display !== 'none',
        spacing: journeyRect.left - atriumRect.left - (railStyle.display === 'none' ? 0 : parseFloat(railStyle.left)),
      };
    });
    expect(railLayout.spacing).toBeGreaterThanOrEqual(railLayout.visible ? 24 : 12);

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

  test('transforma uma jornada salva em convite real para retomar e evoluir', async ({ page }) => {
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-journey-state', 'fresh');
    await enterWithSavedJourney(page);
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-journey-state', 'saved');

    await expect(page.locator('#wsSavedChar')).toHaveText('Dr. Nephros');
    await expect(page.locator('#wsSavedLevel')).toHaveText('05');
    await expect(page.locator('#wsSavedLives')).toHaveText('3');
    await expect(page.locator('#wsSavedLivesLabel')).toHaveText('vidas');
    await expect(page.locator('#wsSavedScore')).toHaveText('535');
    await expect(page.locator('#wsSavedTime')).toContainText('Último avanço há 2 dias');
    await expect(page.locator('#wsSavedNextLevel')).toHaveText('Nível 6');
    await expect(page.locator('#wsSavedXpText')).toHaveText('250 / 349 XP');
    await expect(page.locator('#wsSavedProgress')).toHaveAttribute('aria-valuenow', '72');
    await expect(page.locator('#wsSavedProgress')).toHaveAttribute('aria-valuetext', '72% do caminho até o nível 6');
    await expect(page.locator('#wsSavedAvatar')).toBeVisible();
    await expect.poll(() => page.locator('#wsSavedAvatar').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: /Retomar jornada/ })).toBeVisible();

    const rewardState = await page.locator('.nql-atrium__resume-shell').evaluate((element) => {
      const style = getComputedStyle(element);
      const pulse = getComputedStyle(element.querySelector('.wsaved-flow-pulse')!);
      const primary = getComputedStyle(document.querySelector('.nql-atrium__primary')!);
      return {
        background: style.backgroundImage,
        borderRadius: style.borderRadius,
        shadow: style.boxShadow,
        currentAnimation: pulse.animationName,
        primaryShadow: primary.boxShadow,
        progress: style.getPropertyValue('--nql-saved-progress').trim(),
      };
    });
    expect(rewardState.background).toContain('gradient');
    expect(parseFloat(rewardState.borderRadius)).toBeGreaterThan(0);
    expect(rewardState.shadow).not.toBe('none');
    expect(rewardState.currentAnimation).toBe('nql-atrium-flow-travel');
    expect(rewardState.primaryShadow).not.toBe('none');
    expect(rewardState.progress).toBe('72');

    await page.setViewportSize({ width: 1536, height: 768 });
    const desktopRhythm = await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, 0);
      const ledeElement = document.querySelector('.nql-atrium__lede') as HTMLElement;
      const shellElement = document.querySelector('.nql-atrium__resume-shell') as HTMLElement;
      const routesElement = document.querySelector('.nql-atrium__routes') as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(ledeElement);
      const ledeRects = Array.from(range.getClientRects());
      const shell = shellElement.getBoundingClientRect();
      const routes = routesElement.getBoundingClientRect();
      return {
        ledeLines: ledeRects.length,
        ledeTextRight: Math.max(...ledeRects.map((rect) => rect.right)),
        routesLeft: routes.left,
        shellHeight: shell.height,
        viewportGap: window.innerHeight - shell.bottom,
      };
    });
    expect(desktopRhythm.ledeLines).toBe(1);
    expect(desktopRhythm.ledeTextRight).toBeLessThanOrEqual(desktopRhythm.routesLeft - 16);
    expect(desktopRhythm.shellHeight).toBeLessThan(330);
    expect(desktopRhythm.viewportGap).toBeGreaterThanOrEqual(48);

    const continuousPulse = await page.locator('.wsaved-flow-pulse').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        iterationCount: style.animationIterationCount,
        playState: style.animationPlayState,
        timing: style.animationTimingFunction,
      };
    });
    expect(continuousPulse.iterationCount).toBe('infinite');
    expect(continuousPulse.playState).toBe('running');
    expect(continuousPulse.timing).toBe('linear');

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(mobileMetrics.scrollWidth).toBeLessThanOrEqual(mobileMetrics.clientWidth + 1);
    const primaryBox = await page.getByRole('button', { name: /Retomar jornada/ }).boundingBox();
    expect(primaryBox?.width || 0).toBeGreaterThanOrEqual(320);
  });

  test('mantém o controle de volume aberto ao atravessar até o slider', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const container = page.locator('#welcomeSoundControls .volume-slider-container').first();
    const slider = container.locator('.volume-slider');
    await container.hover();
    await expect(slider).toHaveCSS('opacity', '1');

    const containerBox = await container.boundingBox();
    expect(containerBox).not.toBeNull();
    await page.mouse.move((containerBox?.x || 0) + (containerBox?.width || 0) - 8, (containerBox?.y || 0) + (containerBox?.height || 0) + 4);
    await expect(slider).toHaveCSS('opacity', '1');
    await expect(slider).toHaveCSS('pointer-events', 'auto');

    await slider.focus();
    const before = Number(await slider.inputValue());
    await page.keyboard.press('ArrowRight');
    expect(Number(await slider.inputValue())).toBeGreaterThan(before);
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
    await enterWithSavedJourney(page);

    const state = await page.locator('.wsaved-flow-pulse').evaluate((element) => {
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
