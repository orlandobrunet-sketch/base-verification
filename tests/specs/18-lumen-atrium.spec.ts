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

async function refreshVisibleJourney(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pageshow'));
  });
}

async function updateSavedJourney(
  page: import('@playwright/test').Page,
  changes: Record<string, unknown>
) {
  await page.evaluate((next) => {
    const current = JSON.parse(localStorage.getItem('nefroquest-save') || '{}');
    localStorage.setItem('nefroquest-save', JSON.stringify({ ...current, ...next }));
  }, changes);
  await refreshVisibleJourney(page);
}

async function layoutMetrics(page: import('@playwright/test').Page) {
  return page.locator('.nql-atrium__resume-shell').evaluate((shell) => {
    const primary = shell.querySelector('.nql-atrium__primary') as HTMLElement;
    const secondary = shell.querySelector('.nql-atrium__secondary') as HTMLElement;
    const saved = shell.querySelector('#welcomeSavedInfo') as HTMLElement;
    const metric = (element: HTMLElement) => ({
      width: element.offsetWidth,
      height: element.offsetHeight,
      left: element.offsetLeft,
      top: element.offsetTop,
    });
    return {
      shell: metric(shell as HTMLElement),
      saved: metric(saved),
      primary: metric(primary),
      secondary: metric(secondary),
    };
  });
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
    expect(stylesheets).toContain('/styles/lumen/atrium.css?v=14.18');
    await expect(page.locator('script[src="js/atrium.js?v=13.23"]')).toHaveCount(1);
    await expect(page.locator('script[src="js/auth.js?v=13.44"]')).toHaveCount(1);
    await expect(page.locator('script[src="js/game.js?v=14.18"]')).toHaveCount(1);
    const atriumVisual = await page.locator('#welcomeScreen').evaluate((screen) => {
      const screenStyle = getComputedStyle(screen);
      const statsStyle = getComputedStyle(screen.querySelector('.nql-mastery-rail')!);
      const bestLevelStyle = getComputedStyle(screen.querySelector('#wsBestLevel')!);
      return {
        viewportWidth: window.innerWidth,
        background: screenStyle.backgroundImage,
        screenFilter: screenStyle.filter,
        screenBackdrop: screenStyle.backdropFilter,
        statsFilter: statsStyle.filter,
        statsBackdrop: statsStyle.backdropFilter,
        bestLevelFilter: bestLevelStyle.filter,
      };
    });
    expect(atriumVisual.background).toContain('radial-gradient');
    if (atriumVisual.viewportWidth > 880) {
      expect(atriumVisual.background).toContain('linear-gradient(103deg');
      expect(atriumVisual.background).toContain('rgb(8, 13, 24) 51%');
      expect(atriumVisual.background).toContain('rgb(13, 31, 54) 51%');
    } else {
      expect(atriumVisual.background).toContain('linear-gradient(166deg');
      expect(atriumVisual.background).toContain('rgb(8, 13, 24) 44%');
      expect(atriumVisual.background).toContain('rgb(13, 31, 54) 74%');
    }
    expect(atriumVisual.background).not.toContain('42.12%');
    expect([
      atriumVisual.screenFilter,
      atriumVisual.screenBackdrop,
      atriumVisual.statsFilter,
      atriumVisual.statsBackdrop,
      atriumVisual.bestLevelFilter,
    ]).toEqual(['none', 'none', 'none', 'none', 'none']);

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

  test('preserva todo o card salvo nas larguras intermediárias de duas colunas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'geometria responsiva validada uma vez no navegador desktop');
    await enterWithSavedJourney(page);

    for (const width of [881, 1024, 1200]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.locator('.wsaved-bottom').evaluate((bottom) => {
        const container = bottom.getBoundingClientRect();
        const children = Array.from(bottom.children).map((child) => {
          const rect = child.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        });
        return {
          clientWidth: bottom.clientWidth,
          scrollWidth: bottom.scrollWidth,
          columns: getComputedStyle(bottom).gridTemplateColumns.split(' ').length,
          clippedHorizontally: children.some(({ left, right }) => left < container.left - 1 || right > container.right + 1),
          clippedVertically: children.some(({ top, bottom: childBottom }) => top < container.top - 1 || childBottom > container.bottom + 1),
        };
      });

      expect(geometry.columns, `${width}px não ativou a composição intermediária`).toBe(2);
      expect(geometry.scrollWidth, `${width}px criou overflow interno`).toBeLessThanOrEqual(geometry.clientWidth + 1);
      expect(geometry.clippedHorizontally, `${width}px cortou progresso ou nível`).toBe(false);
      expect(geometry.clippedVertically, `${width}px cortou conteúdo na altura`).toBe(false);
    }
  });

  test('troca a aresta rígida por profundidade contínua quando as colunas empilham', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const background = await page.locator('#welcomeScreen').evaluate((screen) =>
      getComputedStyle(screen).backgroundImage
    );

    expect(background).toContain('linear-gradient(166deg');
    expect(background).toContain('rgb(8, 13, 24) 44%');
    expect(background).toContain('rgb(13, 31, 54) 74%');
    expect(background).not.toContain('42.12%');
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
    await enterWithSavedJourney(page, { difficulty: 'hard', correctTotal: 7 });
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-journey-state', 'saved');

    await expect(page.locator('#wsSavedChar')).toHaveText('Dr. Nephros');
    await expect(page.locator('#wsSavedLevel')).toHaveText('05');
    await expect(page.locator('#wsSavedLives')).toHaveText('3');
    await expect(page.locator('#wsSavedLivesLabel')).toHaveText('vidas');
    await expect(page.locator('#wsSavedScore')).toHaveText('535');
    await expect(page.locator('#wsSavedTime')).toContainText('Última atualização há 2 dias');
    await expect(page.locator('#wsSavedDifficulty')).toHaveText('Difícil');
    await expect(page.locator('#wsSavedMilestone')).toHaveText('7 de 10 acertos para o próximo marco');
    await expect(page.locator('#wsSavedNextLevel')).toHaveText('Nível 6');
    await expect(page.locator('#wsSavedXpText')).toHaveText('250 / 349 XP');
    await expect(page.locator('#wsSavedProgress')).toHaveAttribute('aria-valuenow', '72');
    await expect(page.locator('#wsSavedProgress')).toHaveAttribute('aria-valuetext', '72% do caminho até o nível 6');
    await expect(page.locator('#wsSavedAvatar')).toBeVisible();
    await expect.poll(() => page.locator('#wsSavedAvatar').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    const resumeButton = page.getByRole('button', { name: /Retomar jornada/ });
    await expect(resumeButton).toBeVisible();
    await expect(resumeButton).toContainText('Continuar sua jornada salva');
    await expect(resumeButton).not.toContainText(/ponto exato/i);
    await expect(page.locator('#welcomeSavedInfo')).not.toContainText(/Último avanço/i);

    const rewardState = await page.locator('.nql-atrium__resume-shell').evaluate((element) => {
      const style = getComputedStyle(element);
      const pulse = getComputedStyle(element.querySelector('.wsaved-flow-pulse')!);
      const primary = getComputedStyle(document.querySelector('.nql-atrium__primary')!);
      return {
        background: style.backgroundImage,
        borderRadius: style.borderRadius,
        shadow: style.boxShadow,
        iterationCount: pulse.animationIterationCount,
        primaryShadow: primary.boxShadow,
        progress: style.getPropertyValue('--nql-saved-progress').trim(),
      };
    });
    expect(rewardState.background).toContain('gradient');
    expect(parseFloat(rewardState.borderRadius)).toBeGreaterThan(0);
    expect(rewardState.shadow).not.toBe('none');
    expect(rewardState.iterationCount).not.toBe('infinite');
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
      const flow = document.querySelector('.wsaved-flow')!.getBoundingClientRect();
      const paths = Array.from(document.querySelectorAll('.wsaved-flow path'))
        .map((path) => path.getAttribute('d'));
      return {
        ledeLines: ledeRects.length,
        ledeTextRight: Math.max(...ledeRects.map((rect) => rect.right)),
        routesLeft: routes.left,
        shellWidth: shell.width,
        shellHeight: shell.height,
        shellRight: shell.right,
        flowHeight: flow.height,
        pathVariants: new Set(paths).size,
        viewportGap: window.innerHeight - shell.bottom,
      };
    });
    expect(desktopRhythm.ledeLines).toBe(1);
    expect(desktopRhythm.ledeTextRight).toBeLessThanOrEqual(desktopRhythm.routesLeft - 16);
    expect(desktopRhythm.shellWidth).toBeGreaterThanOrEqual(680);
    expect(desktopRhythm.shellWidth).toBeLessThanOrEqual(705);
    expect(desktopRhythm.shellHeight).toBeGreaterThanOrEqual(165);
    expect(desktopRhythm.shellHeight).toBeLessThanOrEqual(245);
    expect(desktopRhythm.shellWidth / desktopRhythm.shellHeight).toBeGreaterThanOrEqual(2.8);
    expect(desktopRhythm.shellRight).toBeLessThanOrEqual(desktopRhythm.routesLeft - 48);
    expect(desktopRhythm.flowHeight).toBeLessThanOrEqual(30);
    expect(desktopRhythm.pathVariants).toBe(1);
    expect(desktopRhythm.viewportGap).toBeGreaterThanOrEqual(48);

    const infiniteAnimations = await page.locator('.nql-atrium__resume-shell *').evaluateAll((elements) =>
      elements.flatMap((element) => {
        const style = getComputedStyle(element);
        return style.animationIterationCount.split(',').some((count) => count.trim() === 'infinite')
          ? [element.className]
          : [];
      })
    );
    expect(infiniteAnimations).toEqual([]);

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(mobileMetrics.scrollWidth).toBeLessThanOrEqual(mobileMetrics.clientWidth + 1);
    const primaryBox = await page.getByRole('button', { name: /Retomar jornada/ }).boundingBox();
    expect(primaryBox?.width || 0).toBeGreaterThanOrEqual(320);
  });

  test('anima um avanço real uma única vez e nunca mantém movimento infinito', async ({ page }) => {
    await enterWithSavedJourney(page, { xp: 200, correctTotal: 4 });
    const shell = page.locator('.nql-atrium__resume-shell');
    const pulse = shell.locator('.wsaved-flow-pulse');

    await expect(shell).not.toHaveClass(/is-rewarding/, { timeout: 2500 });
    await refreshVisibleJourney(page);
    await page.waitForTimeout(100);
    await expect(shell).not.toHaveClass(/is-rewarding/);

    await updateSavedJourney(page, { xp: 300 });
    await expect(shell).toHaveClass(/is-rewarding/);
    await expect(shell).toHaveCSS('--nql-saved-progress', '86');
    await expect(page.locator('#wsSavedProgress')).toHaveAttribute('aria-valuenow', '86');

    const reward = await pulse.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        name: style.animationName,
        duration: parseFloat(style.animationDuration),
        iterations: style.animationIterationCount,
        offset: parseFloat(style.strokeDashoffset),
      };
    });
    expect(reward.name).toBe('nql-atrium-flow-reward');
    expect(reward.duration).toBeGreaterThan(0);
    expect(reward.duration).toBeLessThanOrEqual(1.5);
    expect(reward.iterations).toBe('1');
    expect(reward.offset).toBeCloseTo(14, 0);

    await expect(shell).not.toHaveClass(/is-rewarding/, { timeout: 2500 });
    await refreshVisibleJourney(page);
    await page.waitForTimeout(100);
    await expect(shell).not.toHaveClass(/is-rewarding/);
    await expect(pulse).toHaveCSS('animation-name', 'none');
  });

  test('mantém a geometria de layout durante hover, foco e acionamento', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'hover fino é validado no desktop');
    await page.setViewportSize({ width: 1440, height: 900 });
    await enterWithSavedJourney(page);
    await expect(page.locator('.nql-atrium__resume-shell')).not.toHaveClass(/is-rewarding/, { timeout: 2500 });
    await page.evaluate(async () => { await document.fonts.ready; });

    await page.evaluate(() => {
      const observed: number[] = [];
      (window as typeof window & { __nqLayoutShifts?: number[] }).__nqLayoutShifts = observed;
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) observed.push((entry as PerformanceEntry & { value: number }).value);
      }).observe({ type: 'layout-shift', buffered: false });
    });

    const primary = page.locator('#welcomeContinueBtn');
    const baseline = await layoutMetrics(page);
    await primary.hover();
    expect(await layoutMetrics(page)).toEqual(baseline);
    await expect(primary).not.toHaveCSS('transform', 'none');

    await primary.focus();
    expect(await layoutMetrics(page)).toEqual(baseline);
    await expect(primary).toBeFocused();

    const box = await primary.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move((box?.x || 0) + (box?.width || 0) / 2, (box?.y || 0) + (box?.height || 0) / 2);
    await page.mouse.down();
    expect(await layoutMetrics(page)).toEqual(baseline);
    const activeScale = await primary.evaluate((element) => {
      const transform = getComputedStyle(element).transform;
      return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
    });
    expect(activeScale).toBeLessThan(1);
    await page.mouse.up();

    const shiftTotal = await page.evaluate(() =>
      ((window as typeof window & { __nqLayoutShifts?: number[] }).__nqLayoutShifts || [])
        .reduce((sum, value) => sum + value, 0)
    );
    expect(shiftTotal).toBe(0);
  });

  test('bloqueia dupla ativação, anuncia carregamento e entrega o foco ao jogo', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'fluxo funcional independente do dispositivo');
    await enterWithSavedJourney(page);

    const primary = page.locator('#welcomeContinueBtn');
    await primary.focus();
    await primary.press('Enter');
    const duplicateWasRejected = await page.evaluate(() => {
      const game = window as typeof window & { continueGame?: () => Promise<boolean> | boolean };
      return game.continueGame?.();
    });
    expect(duplicateWasRejected).toBe(false);
    await expect(primary).toBeDisabled();
    await expect(primary).toHaveAttribute('aria-busy', 'true');
    await expect(primary).toHaveClass(/is-busy/);
    await expect(primary).toContainText('Carregando jornada…');
    await expect(primary).toContainText('Preparando questões e progresso');

    await page.waitForTimeout(100);

    await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#mainApp')).toBeFocused();
    await expect(page.locator('#journal p', { hasText: 'Jornada restaurada!' })).toHaveCount(1);
    await expect(primary).not.toHaveAttribute('aria-busy', 'true');
    await expect(primary).toBeEnabled();
  });

  test('oferece diálogo de dificuldade completo por teclado e restaura o foco', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'contrato de teclado validado no desktop');
    const launcher = page.locator('[data-action="startNewFromWelcome"]');
    await launcher.focus();
    await launcher.press('Space');

    const dialog = page.getByRole('dialog', { name: 'ESCOLHA SEU DESTINO' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'diffSelectorTitle');
    await expect(dialog).toHaveAttribute('aria-describedby', 'diffSelectorDesc');
    const group = dialog.getByRole('radiogroup', { name: /dificuldade/i });
    await expect(group).toBeVisible();
    const radios = group.getByRole('radio');
    await expect(radios).toHaveCount(4);

    const normal = radios.filter({ hasText: 'Médio' });
    const hard = radios.filter({ hasText: 'Difícil' });
    const easy = radios.filter({ hasText: 'Fácil' });
    const hardcore = radios.filter({ hasText: 'Hardcore' });
    await expect(normal).toHaveAttribute('aria-checked', 'true');
    await expect(normal).toHaveAttribute('tabindex', '0');
    await expect(normal).toBeFocused();

    await normal.press('ArrowRight');
    await expect(hard).toHaveAttribute('aria-checked', 'true');
    await expect(hard).toBeFocused();
    await expect(normal).toHaveAttribute('aria-checked', 'false');
    await hard.press('Home');
    await expect(easy).toHaveAttribute('aria-checked', 'true');
    await expect(easy).toBeFocused();
    await easy.press('End');
    await expect(hardcore).toHaveAttribute('aria-checked', 'true');
    await expect(hardcore).toBeFocused();

    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press('Tab');
      expect(await page.locator('#diffSelectorOverlay').evaluate((overlay) =>
        overlay.contains(document.activeElement)
      )).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(launcher).toBeFocused();

    await launcher.press('Enter');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(dialog).toBeHidden();
    await expect(launcher).toBeFocused();
  });

  test('mantém alvos de toque e não deixa hover preso no Pixel 7', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'contrato de toque validado no projeto Pixel 7');
    await enterWithSavedJourney(page);
    const primary = page.locator('#welcomeContinueBtn');
    const secondary = page.locator('[data-action="startNewFromWelcome"]');
    for (const target of [primary, secondary]) {
      const box = await target.boundingBox();
      expect(box?.height || 0).toBeGreaterThanOrEqual(44);
      expect(box?.width || 0).toBeGreaterThanOrEqual(44);
    }

    await secondary.tap();
    await expect(page.getByRole('dialog', { name: 'ESCOLHA SEU DESTINO' })).toBeVisible();
    expect(await secondary.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false);
    await expect(secondary).toHaveCSS('transform', 'none');

    const radios = page.getByRole('radiogroup', { name: /dificuldade/i }).getByRole('radio');
    for (let index = 0; index < await radios.count(); index += 1) {
      const box = await radios.nth(index).boundingBox();
      expect(box?.height || 0).toBeGreaterThanOrEqual(44);
      expect(box?.width || 0).toBeGreaterThanOrEqual(44);
    }
    await radios.filter({ hasText: 'Difícil' }).tap();
    await expect(radios.filter({ hasText: 'Difícil' })).toHaveAttribute('aria-checked', 'true');
  });

  test('assina a jornada salva com a paleta do personagem', async ({ page }, testInfo) => {
    const signatures = new Set<string>();
    const expectedTitles: Record<string, string> = {
      nephros: 'Guardião dos Néfrons',
      aquaria: 'Mestra das Águas',
      glomerulus: 'Cientista Renal',
    };
    for (const character of ['nephros', 'aquaria', 'glomerulus']) {
      await enterWithSavedJourney(page, { character });
      const shell = page.locator('.nql-atrium__resume-shell');
      await expect(shell).toHaveAttribute('data-character', character);
      const theme = await shell.evaluate((element) => {
        const style = getComputedStyle(element);
        const primaryStop = getComputedStyle(element.querySelector('.wsaved-flow-stop--primary')!);
        const secondaryStop = getComputedStyle(element.querySelector('.wsaved-flow-stop--secondary')!);
        const avatar = element.querySelector('.wsaved-avatar-frame')!.getBoundingClientRect();
        const progress = getComputedStyle(element.querySelector('.wsaved-flow-value')!);
        const primaryAction = getComputedStyle(element.querySelector('.nql-atrium__primary')!);
        return {
          primary: style.getPropertyValue('--nql-journey-primary').trim(),
          secondary: style.getPropertyValue('--nql-journey-secondary').trim(),
          primaryStop: primaryStop.stopColor,
          secondaryStop: secondaryStop.stopColor,
          avatarWidth: avatar.width,
          title: element.querySelector('#wsSavedCharacterTitle')?.textContent?.trim(),
          shellBackground: style.backgroundImage,
          shellShadow: style.boxShadow,
          progressStroke: progress.strokeWidth,
          primaryActionBackground: primaryAction.backgroundImage,
          primaryActionBorder: primaryAction.borderTopColor,
        };
      });
      expect(theme.primaryStop).not.toBe(theme.secondaryStop);
      expect(theme.title).toBe(expectedTitles[character]);
      expect(theme.shellBackground).toContain('radial-gradient');
      expect(theme.shellShadow).not.toBe('none');
      expect(parseFloat(theme.progressStroke)).toBeGreaterThanOrEqual(3);
      expect(theme.primaryActionBackground).toContain('linear-gradient');
      expect(theme.primaryActionBorder).toBe(theme.primaryStop);
      const minimumAvatarWidth = testInfo.project.name === 'mobile' ? 64 : 72;
      expect(theme.avatarWidth).toBeGreaterThanOrEqual(minimumAvatarWidth);
      signatures.add(`${theme.primary}|${theme.secondary}`);
    }
    expect(signatures.size).toBe(3);

    await page.evaluate(() => localStorage.removeItem('nefroquest-save'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      (window as typeof window & { playAsGuest: () => void }).playAsGuest();
    });
    await expect(page.locator('.nql-atrium__resume-shell')).not.toHaveAttribute('data-character', /.+/);
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
    const shell = page.locator('.nql-atrium__resume-shell');
    await shell.evaluate((element) => element.classList.add('is-rewarding'));
    const primary = page.locator('#welcomeContinueBtn');
    await primary.focus();
    await primary.hover();

    const state = await shell.evaluate((element) => {
      const selectors = [
        ':scope',
        '#welcomeSavedInfo',
        '.wsaved-avatar-frame',
        '.wsaved-flow-pulse',
        '.nql-atrium__primary',
        '.nql-atrium__primary svg',
        '.nql-atrium__secondary',
      ];
      return selectors.map((selector) => {
        const target = selector === ':scope' ? element : element.querySelector(selector)!;
        const style = getComputedStyle(target);
        return {
          selector,
          animation: style.animationName,
          transition: style.transitionDuration,
          transform: style.transform,
        };
      });
    });
    for (const item of state) {
      expect(item.animation, `${item.selector} ainda anima`).toBe('none');
      expect(item.transform, `${item.selector} ainda se desloca`).toBe('none');
      expect(
        item.transition.split(',').every((duration) => parseFloat(duration) <= 0.01),
        `${item.selector} ainda tem transição longa`
      ).toBe(true);
    }
    await expect(page.locator('.wsaved-flow-pulse')).toHaveCSS('opacity', '0');
    await expect(page.getByRole('heading', { name: 'Seu domínio deixa rastros.' })).toBeVisible();
  });

  test('não apresenta violações axe sérias ou críticas', async ({ page }) => {
    const results = await new AxeBuilder({ page }).include('#welcomeScreen').analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  });
});
