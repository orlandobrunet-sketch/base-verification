import { test, expect } from '@playwright/test';
import { enterGame, injectGameState, waitForGame } from '../helpers/game';

test.describe('Câmara de Conduta — tela de perguntas Lúmen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jogar/');
    await injectGameState(page);
    await waitForGame(page);
  });

  test('retorna ao início ao clicar na marca do cabeçalho', async ({ page }) => {
    const brand = page.getByRole('button', { name: 'Voltar ao início do NefroQuest' });

    await expect(brand).toBeVisible();
    await expect(brand).toHaveAttribute('data-action', 'goToWelcomeFromGame');
    await brand.click();

    await expect(page.locator('#mainApp')).toBeHidden();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
  });

  test('permite retornar ao início pela marca usando teclado', async ({ page }) => {
    const brand = page.getByRole('button', { name: 'Voltar ao início do NefroQuest' });

    await brand.focus();
    await expect(brand).toBeFocused();
    await expect(brand).not.toHaveCSS('outline-style', 'none');
    await brand.press('Enter');

    await expect(page.locator('#mainApp')).toBeHidden();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
  });

  test('preserva os contratos da jornada e integra os seis equipamentos ao personagem', async ({ page }, testInfo) => {
    const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLLinkElement).href).pathname + new URL((link as HTMLLinkElement).href).search)
    );
    expect(stylesheets.some(s => s.startsWith('/styles/lumen/game.css')),
      'game.css precisa estar linkado; a versão é responsabilidade do bump-release --check').toBe(true);

    const app = page.locator('#mainApp');
    await expect(app).toHaveAttribute('data-nq-ui', 'lumen');
    await expect(app).toHaveAttribute('data-lumen-state', 'reasoning');

    await expect(page.locator('.nql-loadout-shell .hero')).toHaveCount(1);
    await expect(page.locator('.nql-loadout-shell #equipList')).toHaveCount(1);
    await expect(page.locator('.nql-loadout-shell')).toHaveAttribute('data-character', 'glomerulus');

    const slots = page.locator('.nql-loadout-shell .slot-diablo');
    await expect(slots).toHaveCount(6);
    expect(await slots.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-slot')).sort())).toEqual(
      ['armor', 'boot', 'glove', 'helmet', 'relic', 'weapon']
    );
    await expect(slots.first()).toHaveAttribute('tabindex', '0');
    await expect(slots.first()).toHaveAttribute('role', 'group');

    if (testInfo.project.name === 'mobile') {
      await page.locator('#mobileHeroBtn').click();
      await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);
      await expect.poll(async () => (await page.locator('.panel.left').boundingBox())?.x ?? -1)
        .toBeGreaterThanOrEqual(0);
    }
    await page.evaluate(() => document.fonts.ready);

    const loadoutLayout = await page.evaluate(() => {
      const rect = (selector: string) => {
        const box = document.querySelector(selector)!.getBoundingClientRect();
        return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
      };
      const portrait = rect('.nql-loadout-shell .portrait-frame');
      const heading = rect('.nql-loadout-shell .nql-hero-heading');
      const slot = (name: string) => rect('.nql-loadout-shell .slot-diablo[data-slot="' + name + '"]');
      const overlapArea = (a: typeof portrait, b: typeof portrait) =>
        Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
        Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return {
        headingBeforePortrait: heading.bottom <= portrait.top + 1,
        portraitHasArea: portrait.width > 0 && portrait.height > 0,
        pairs: [['glove', 'helmet'], ['armor', 'weapon'], ['boot', 'relic']].map(([leftName, rightName]) => {
          const left = slot(leftName);
          const right = slot(rightName);
          return {
            names: leftName + ' / ' + rightName,
            left, right,
            leftOverlap: overlapArea(portrait, left),
            rightOverlap: overlapArea(portrait, right),
            leftOfPortrait: left.right <= portrait.left + 1,
            rightOfPortrait: right.left >= portrait.right - 1,
          };
        }),
      };
    });
    expect(loadoutLayout.headingBeforePortrait).toBe(true);
    expect(loadoutLayout.portraitHasArea).toBe(true);
    for (const pair of loadoutLayout.pairs) {
      expect(pair.leftOverlap, pair.names).toBe(0);
      expect(pair.rightOverlap, pair.names).toBe(0);
      expect(pair.leftOfPortrait, pair.names).toBe(true);
      expect(pair.rightOfPortrait, pair.names).toBe(true);
      expect(Math.abs(pair.left.top - pair.right.top), pair.names + ': mesma altura').toBeLessThanOrEqual(1);
      expect(Math.abs(pair.left.width - pair.right.width), pair.names + ': mesma largura').toBeLessThanOrEqual(1);
      expect(Math.abs(pair.left.height - pair.right.height), pair.names + ': mesma altura de moldura').toBeLessThanOrEqual(1);
      expect(pair.left.width, pair.names + ': alvo de toque').toBeGreaterThanOrEqual(44);
      expect(pair.left.height, pair.names + ': alvo de toque').toBeGreaterThanOrEqual(44);
    }
    for (let row = 1; row < loadoutLayout.pairs.length; row++) {
      expect(loadoutLayout.pairs[row].left.top).toBeGreaterThan(loadoutLayout.pairs[row - 1].left.bottom);
      expect(loadoutLayout.pairs[row].right.top).toBeGreaterThan(loadoutLayout.pairs[row - 1].right.bottom);
    }

    await expect(page.locator('#question')).not.toBeEmpty();
    await expect(page.locator('#options .option')).toHaveCount(4);
    await expect(page.locator('#feedback')).toBeAttached();
    await expect(page.locator('#refs')).toBeAttached();
    await expect(page.locator('#actionDock')).toBeAttached();
  });

  test('mantém a decisão clínica como foco e não cria overflow', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'mobile') {
      await page.setViewportSize({ width: 390, height: 844 });
    } else {
      await page.setViewportSize({ width: 1536, height: 900 });
    }

    const metrics = await page.evaluate(() => {
      const question = document.querySelector('#question') as HTMLElement;
      const option = document.querySelector('#options .option') as HTMLElement;
      const right = document.querySelector('.panel.right') as HTMLElement;
      const left = document.querySelector('.panel.left') as HTMLElement;
      const loadout = document.querySelector('.nql-loadout-shell') as HTMLElement;
      const dock = document.querySelector('#actionDock') as HTMLElement;
      const questionBox = document.querySelector('.qbox') as HTMLElement;
      const rightBox = right.getBoundingClientRect();
      const leftBox = left.getBoundingClientRect();
      const loadoutBox = loadout.getBoundingClientRect();
      const questionBoxStyle = getComputedStyle(questionBox);
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        questionSize: parseFloat(getComputedStyle(question).fontSize),
        questionWidth: question.getBoundingClientRect().width,
        questionAvailableWidth:
          questionBox.clientWidth -
          parseFloat(questionBoxStyle.paddingLeft) -
          parseFloat(questionBoxStyle.paddingRight),
        questionMaxWidth: getComputedStyle(question).maxWidth,
        optionSize: parseFloat(getComputedStyle(option.querySelector('.opt-body') as HTMLElement).fontSize),
        rightWidth: rightBox.width,
        leftWidth: leftBox.width,
        leftToQuestion: rightBox.left - loadoutBox.right,
        questionToDock: dock.getBoundingClientRect().left - rightBox.right,
      };
    });

    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.questionSize).toBeGreaterThanOrEqual(testInfo.project.name === 'mobile' ? 16 : 18);
    expect(metrics.questionMaxWidth).toBe('none');
    expect(Math.abs(metrics.questionWidth - metrics.questionAvailableWidth)).toBeLessThanOrEqual(1);
    expect(metrics.optionSize).toBeGreaterThanOrEqual(15);
    if (testInfo.project.name !== 'mobile') {
      expect(metrics.rightWidth).toBeGreaterThan(metrics.leftWidth);
      expect(metrics.leftToQuestion, 'respiro entre personagem e pergunta').toBeGreaterThanOrEqual(16);
      expect(metrics.questionToDock, 'respiro entre pergunta e ações').toBeGreaterThanOrEqual(16);
      expect(Math.abs(metrics.leftToQuestion - metrics.questionToDock), 'intervalos regulares entre as três colunas')
        .toBeLessThanOrEqual(2);
    }

    if (testInfo.project.name === 'mobile') {
      const mobileLayout = await page.evaluate(() => ({
        questionTop: document.querySelector('.qbox')!.getBoundingClientRect().top,
        drawerPosition: getComputedStyle(document.querySelector('.panel.left')!).position,
      }));
      expect(mobileLayout.questionTop).toBeLessThan(100);
      expect(mobileLayout.drawerPosition).toBe('fixed');

      await page.locator('.mobile-bottom-dock [data-action="openMobileDrawer"]').click();
      await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);
      await expect(page.locator('.panel.left .drawer-close-btn')).toBeVisible();
      expect(await page.locator('.panel.left').evaluate((panel) => !!panel.closest('#mainApp[data-nq-ui="lumen"]'))).toBe(true);
      await page.waitForTimeout(450);
      const drawerMetrics = await page.locator('.panel.left').evaluate((panel) => {
        const loadout = panel.querySelector('.nql-loadout-shell')!.getBoundingClientRect();
        const drawer = panel.getBoundingClientRect();
        return {
          loadoutLeft: loadout.left,
          loadoutRight: loadout.right,
          drawerLeft: drawer.left,
          drawerRight: drawer.right,
        };
      });
      expect(drawerMetrics.drawerLeft).toBeGreaterThanOrEqual(-1);
      expect(drawerMetrics.drawerRight).toBeLessThanOrEqual(391);
      expect(drawerMetrics.loadoutLeft).toBeGreaterThanOrEqual(drawerMetrics.drawerLeft);
      expect(drawerMetrics.loadoutRight).toBeLessThanOrEqual(drawerMetrics.drawerRight);
    }
  });

  test('mantém o tooltip de atributos global, visível e estável por hover e foco', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'hover fino é validado no desktop');
    await page.setViewportSize({ width: 1536, height: 900 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      const portrait = document.querySelector('#heroImg') as HTMLImageElement | null;
      if (portrait && !portrait.complete) await portrait.decode();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });

    const badge = page.locator('.equip-total-attributes .stat-badge').last();
    await expect(badge).toBeVisible();
    const expectedText = (await badge.locator('.stat-tip').textContent() || '').replace(/\s+/g, '');

    const stableGeometry = async () => page.evaluate(() => {
      const measure = (selector: string) => {
        const rect = document.querySelector(selector)!.getBoundingClientRect();
        return {
          x: Number(rect.x.toFixed(2)),
          y: Number(rect.y.toFixed(2)),
          width: Number(rect.width.toFixed(2)),
          height: Number(rect.height.toFixed(2)),
        };
      };
      return {
        loadout: measure('.nql-loadout-shell'),
        question: measure('.qbox'),
        options: measure('#options'),
        dock: measure('#actionDock'),
      };
    });

    await page.evaluate(() => {
      const values: number[] = [];
      (window as typeof window & { __nqStatTipLayoutShifts?: number[] }).__nqStatTipLayoutShifts = values;
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          values.push((entry as PerformanceEntry & { value: number }).value);
        }
      }).observe({ type: 'layout-shift', buffered: false });
    });

    const baseline = await stableGeometry();
    const floating = page.locator('body > .stat-tip-floating');

    const expectFloatingTooltip = async () => {
      await expect(floating).toBeVisible();
      const tooltipText = (await floating.textContent() || '').replace(/\s+/g, '');
      expect(tooltipText).toContain(expectedText);

      const geometry = await floating.evaluate((element) => {
        const tooltip = element as HTMLElement;
        const rect = tooltip.getBoundingClientRect();
        const badgeRect = document.querySelector('.equip-total-attributes .stat-badge:last-child')!
          .getBoundingClientRect();
        const layerValue = (selector: string) => {
          const value = getComputedStyle(document.querySelector(selector)!).zIndex;
          return value === 'auto' ? 0 : Number(value) || 0;
        };
        return {
          parentIsBody: tooltip.parentElement === document.body,
          position: getComputedStyle(tooltip).position,
          pointerEvents: getComputedStyle(tooltip).pointerEvents,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          badgeTop: badgeRect.top,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          zIndex: Number(getComputedStyle(tooltip).zIndex) || 0,
          decisionZIndex: Math.max(layerValue('#mainApp'), layerValue('.qbox'), layerValue('#options .option')),
        };
      });

      expect(geometry.parentIsBody).toBe(true);
      expect(geometry.position).toBe('fixed');
      expect(geometry.pointerEvents).toBe('none');
      expect(geometry.top).toBeGreaterThanOrEqual(8);
      expect(geometry.left).toBeGreaterThanOrEqual(8);
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth - 8);
      expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight - 8);
      expect(geometry.top).toBeLessThan(geometry.badgeTop);
      expect(geometry.zIndex).toBeGreaterThan(geometry.decisionZIndex);
      expect(await stableGeometry()).toEqual(baseline);
    };

    await badge.hover();
    await expectFloatingTooltip();
    await page.mouse.move(2, 2);
    await expect(floating).toBeHidden();
    expect(await stableGeometry()).toEqual(baseline);

    await badge.focus();
    await expect(badge).toBeFocused();
    await expectFloatingTooltip();
    await page.keyboard.press('Escape');
    await expect(floating).toBeHidden();

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await badge.focus();
    await expectFloatingTooltip();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(floating).toBeHidden();
    expect(await stableGeometry()).toEqual(baseline);

    await badge.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
    await expectFloatingTooltip();
    await page.locator('.qbox').dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
    await expect(floating).toBeHidden();
    expect(await stableGeometry()).toEqual(baseline);

    const shiftTotal = await page.evaluate(() =>
      ((window as typeof window & { __nqStatTipLayoutShifts?: number[] }).__nqStatTipLayoutShifts || [])
        .reduce((sum, value) => sum + value, 0)
    );
    expect(shiftTotal).toBe(0);

    await badge.dispatchEvent('pointerdown', { pointerType: 'mouse', isPrimary: true });
    await expectFloatingTooltip();
    await badge.evaluate((element) => element.remove());
    await expect(floating).toBeHidden();
  });

  test('protege o raciocínio antes da resposta e revela a evidência depois da decisão', async ({ page }) => {
    const cards = page.locator('#refs .ref-cards');
    await expect(cards).toBeAttached();
    await expect(cards).toHaveAttribute('inert', '');
    await expect(cards).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.nql-feedback-kicker')).toBeHidden();
    await expect(page.locator('#feedback')).toBeHidden();

    const before = await cards.evaluate((element) => ({
      maxHeight: getComputedStyle(element).maxHeight,
      opacity: getComputedStyle(element).opacity,
    }));
    expect(before.maxHeight).toBe('0px');
    expect(before.opacity).toBe('0');

    const placeholder = await page.locator('#refs').evaluate((element) =>
      getComputedStyle(element, '::after').content
    );
    expect(placeholder).toContain('Evidência disponível');

    const correctIndex = await page.evaluate(() => (window as any).state.current.a as number);
    await page.locator('#options .option').nth(correctIndex).click();

    await expect(page.locator('#mainApp')).toHaveAttribute('data-lumen-state', 'mastery');
    await expect.poll(async () => parseFloat(await cards.evaluate((element) => getComputedStyle(element).opacity))).toBeGreaterThan(.9);
    await expect(cards).not.toHaveAttribute('inert', '');
    await expect(cards).not.toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.nql-feedback-kicker')).toBeVisible();
    await expect(page.locator('#feedback')).toBeVisible();
  });

  test('converte resposta em estado semântico sem alterar o fluxo funcional', async ({ page }) => {
    const correctIndex = await page.evaluate(() => (window as any).state.current.a as number);
    await page.locator('#options .option').nth(correctIndex).click();

    await expect(page.locator('#mainApp')).toHaveAttribute('data-lumen-state', 'mastery');
    await expect(page.locator('#options .option.correct')).toHaveCount(1);
    await expect(page.locator('#feedback')).toHaveClass(/good/);
    await expect(page.locator('#nextBtn')).not.toHaveClass(/hidden/);
  });

  test('permite pausar e retomar a animação por teclado e conserva a preferência', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const openCard = async () => {
      if (testInfo.project.name === 'mobile') {
        await page.locator('#mobileHeroBtn').click();
        await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);
      }
    };
    await openCard();
    const toggle = page.locator('#guardianMotionToggle');
    const motionStates = () => page.locator('.nql-loadout-branch, .nql-loadout-pulse').evaluateAll(elements =>
      elements.flatMap(element => element.getAnimations().map(animation => animation.playState))
    );
    await expect(toggle).toHaveAccessibleName('Pausar animação do personagem');
    await expect.poll(motionStates).toEqual(['running', 'running']);

    await toggle.focus();
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAccessibleName('Retomar animação do personagem');
    await expect.poll(motionStates).toEqual(['paused', 'paused']);
    const pausedProgress = await page.locator('.nql-loadout-pulse').evaluate(async element => {
      const animation = element.getAnimations()[0];
      const before = animation.currentTime;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      return { before, after: animation.currentTime };
    });
    expect(pausedProgress.after, 'o ponto de luz permanece parado').toBe(pausedProgress.before);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await enterGame(page);
    await openCard();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAccessibleName('Retomar animação do personagem');
    await expect.poll(motionStates).toEqual(['paused', 'paused']);

    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAccessibleName('Pausar animação do personagem');
    await expect.poll(motionStates).toEqual(['running', 'running']);
    await expect(page.locator('#question')).not.toBeEmpty();
  });

  test('respeita movimento reduzido e mantém o arco estático e o personagem', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    if (testInfo.project.name === 'mobile') {
      await page.locator('#mobileHeroBtn').click();
      await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);
    }
    await expect(page.locator('.nql-loadout-cortex')).toBeVisible();
    await expect(page.locator('#heroImg')).toBeVisible();
    await expect(page.locator('.nql-loadout-shell .slot-diablo')).toHaveCount(6);
    for (const selector of ['.nql-loadout-branch', '.nql-loadout-pulse']) {
      await expect(page.locator(selector)).toBeHidden();
      await expect.poll(() => page.locator(selector).evaluate(element =>
        element.getAnimations().filter(animation => animation.playState === 'running').length
      )).toBe(0);
    }
    await expect(page.locator('#guardianMotionToggle')).toBeHidden();
  });

  test('aplica uma assinatura cromática própria a cada personagem', async ({ page }) => {
    const signatures = new Map<string, string>();
    for (const character of ['nephros', 'aquaria', 'glomerulus']) {
      await page.evaluate((nextCharacter) => {
        (window as any).state.character = nextCharacter;
        (window as any).renderHUD();
      }, character);
      const shell = page.locator('.nql-loadout-shell');
      await expect(shell).toHaveAttribute('data-character', character);
      const signature = await shell.evaluate((element) => {
        const style = getComputedStyle(element);
        return [
          style.getPropertyValue('--nql-hero-primary').trim(),
          style.getPropertyValue('--nql-hero-secondary').trim(),
        ].join('|');
      });
      signatures.set(character, signature);
    }

    expect(new Set(signatures.values()).size).toBe(3);
  });

  test('mantém cada personagem olhando para o campo da pergunta', async ({ page }) => {
    const mirroredPortraits = [
      { character: 'nephros', level: 6, source: 'clerigo_renal/nivel_06' },
      { character: 'aquaria', level: 5, source: 'maga_metabolica/nivel_05' },
    ];

    for (const portrait of mirroredPortraits) {
      await page.evaluate(({ character, level }) => {
        (window as any).state.character = character;
        (window as any).state.level = level;
        (window as any).renderHUD();
      }, portrait);
      await expect(page.locator('#heroImg')).toHaveAttribute('src', new RegExp(portrait.source));
      await expect(page.locator('#heroImg')).toHaveCSS('transform', 'matrix(-1, 0, 0, 1, 0, 0)');
    }

    await page.evaluate(() => {
      (window as any).state.character = 'glomerulus';
      (window as any).state.level = 1;
      (window as any).renderHUD();
    });
    await expect(page.locator('#heroImg')).toHaveCSS('transform', 'none');
  });
});
