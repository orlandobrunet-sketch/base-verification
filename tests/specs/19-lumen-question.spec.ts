import { test, expect } from '@playwright/test';
import { injectGameState, waitForGame } from '../helpers/game';

test.describe('Câmara de Conduta — tela de perguntas Lúmen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jogar/');
    await injectGameState(page);
    await waitForGame(page);
  });

  test('preserva os contratos da jornada e integra os seis equipamentos ao personagem', async ({ page }, testInfo) => {
    const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLLinkElement).href).pathname + new URL((link as HTMLLinkElement).href).search)
    );
    expect(stylesheets).toContain('/styles/lumen/game.css?v=14.02');

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

    const circuit = await page.locator('.nql-loadout-branch').evaluate((element) => ({
      animationName: getComputedStyle(element).animationName,
      pathLength: (element as SVGPathElement).getTotalLength(),
    }));
    expect(circuit.animationName).toBe('nql-equipment-circuit');
    expect(circuit.pathLength).toBeGreaterThan(600);

    if (testInfo.project.name !== 'mobile') {
      const loadoutLayout = await page.evaluate(() => {
        const rect = (selector: string) => {
          const box = document.querySelector(selector)!.getBoundingClientRect();
          return { top: box.top, right: box.right, bottom: box.bottom, left: box.left };
        };
        const portrait = rect('.nql-loadout-shell .portrait-frame');
        const info = rect('.nql-loadout-shell .hero-info');
        const slots = [...document.querySelectorAll('.nql-loadout-shell .slot-diablo')].map((slot) => ({
          name: slot.getAttribute('data-slot'),
          ...rect(`.nql-loadout-shell .slot-diablo[data-slot="${slot.getAttribute('data-slot')}"]`),
        }));
        const overlapArea = (a: typeof portrait, b: typeof portrait) =>
          Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
          Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        return {
          infoBeforePortrait: info.bottom <= portrait.top + 1,
          overlaps: slots.map((slot) => ({ name: slot.name, area: overlapArea(portrait, slot) })),
        };
      });
      expect(loadoutLayout.infoBeforePortrait).toBe(true);
      expect(loadoutLayout.overlaps).toEqual([
        { name: 'helmet', area: 0 },
        { name: 'glove', area: 0 },
        { name: 'armor', area: 0 },
        { name: 'weapon', area: 0 },
        { name: 'relic', area: 0 },
        { name: 'boot', area: 0 },
      ]);
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
      const rightBox = right.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        questionSize: parseFloat(getComputedStyle(question).fontSize),
        optionSize: parseFloat(getComputedStyle(option.querySelector('.opt-body') as HTMLElement).fontSize),
        rightWidth: rightBox.width,
        leftWidth: left.getBoundingClientRect().width,
        leftToQuestion: rightBox.left - loadout.getBoundingClientRect().right,
        dividerToQuestion: rightBox.left - left.getBoundingClientRect().right,
        questionToDock: dock.getBoundingClientRect().left - rightBox.right,
      };
    });

    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.questionSize).toBeGreaterThanOrEqual(testInfo.project.name === 'mobile' ? 16 : 18);
    expect(metrics.optionSize).toBeGreaterThanOrEqual(15);
    if (testInfo.project.name !== 'mobile') {
      expect(metrics.rightWidth).toBeGreaterThan(metrics.leftWidth);
      expect(metrics.leftToQuestion).toBeGreaterThanOrEqual(metrics.questionToDock + 4);
      expect(metrics.leftToQuestion).toBeLessThanOrEqual(metrics.questionToDock + 10);
      expect(metrics.dividerToQuestion).toBeGreaterThanOrEqual(12);
      expect(metrics.dividerToQuestion).toBeLessThanOrEqual(17);
      expect(Math.abs(metrics.dividerToQuestion - metrics.questionToDock)).toBeLessThanOrEqual(1);
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

  test('preserva significado quando o usuário reduz movimento', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const motion = await page.locator('.nql-loadout-shell').evaluate((shell) =>
      ['.nql-loadout-branch', '.nql-loadout-pulse'].map((selector) => {
        const style = getComputedStyle(shell.querySelector(selector)!);
        return {
          selector,
          animationName: style.animationName,
          stroke: style.stroke,
        };
      })
    );
    for (const item of motion) {
      expect(item.animationName).toBe('none');
      expect(item.stroke).not.toBe('none');
    }
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
});
