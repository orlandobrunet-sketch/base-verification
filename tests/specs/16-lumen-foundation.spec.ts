import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const FOUNDATION_URL = '/design-system/lumen-foundation/';

test.describe('Fundação 0 — Kit Lúmen Vivo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FOUNDATION_URL);
  });

  test('carrega como laboratório isolado do CSS e JS legados', async ({ page }) => {
    await expect(page).toHaveTitle(/Fundação 0/);
    await expect(page.locator('body')).toHaveAttribute('data-nq-ui', 'lumen');
    await expect(page.locator('#foundationTitle')).toBeVisible();

    const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
      links.map((link) => (link as HTMLLinkElement).getAttribute('href') || '')
    );
    expect(stylesheets).toContain('/styles/lumen/tokens.css?v=13.13');
    expect(stylesheets).toContain('/styles/lumen/components.css?v=13.13');
    expect(stylesheets).toContain('/styles/lumen/motion.css?v=13.13');
    expect(stylesheets).not.toContain('/style.css');
    expect(stylesheets).not.toContain('/landing/styles.css');
  });

  test('não cria overflow horizontal nos breakpoints de aprovação', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 768, height: 900 },
      { width: 390, height: 844 },
      { width: 320, height: 700 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      expect(dimensions.scrollWidth, `${viewport.width}px gerou overflow`).toBeLessThanOrEqual(dimensions.clientWidth);
    }
  });

  test('mantém todos os alvos visíveis com pelo menos 44 por 44 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const controls = page.locator('button:visible, a[href]:visible, input:visible, select:visible');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      const box = await control.boundingBox();
      expect(box, `controle ${index} sem geometria`).not.toBeNull();
      expect(box!.height, `controle ${index} abaixo de 44px`).toBeGreaterThanOrEqual(44);
      expect(box!.width, `controle ${index} abaixo de 44px`).toBeGreaterThanOrEqual(44);
    }
  });

  test('expõe os quatro estados sem depender do ponteiro', async ({ page }) => {
    const mastery = page.getByRole('button', { name: 'Maestria' });
    await mastery.click();
    await expect(page.locator('body')).toHaveAttribute('data-lumen-state', 'mastery');
    await expect(mastery).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#calibratorState')).toHaveText('Conhecimento consolidado');

    await mastery.press('End');
    await expect(page.locator('body')).toHaveAttribute('data-lumen-state', 'corruption');
    await expect(page.getByRole('button', { name: 'Risco' })).toBeFocused();
  });

  test('mantém o calibrador estável ao trocar de estado', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const heights: number[] = [];
      for (const state of ['Inexplorado', 'Raciocínio', 'Maestria', 'Risco']) {
        await page.getByRole('button', { name: state }).click();
        heights.push(await page.locator('.nql-calibrator').evaluate((element) => element.getBoundingClientRect().height));
      }
      expect(Math.max(...heights) - Math.min(...heights), `${viewport.width}px alterou a altura do calibrador`).toBeLessThan(1);
    }
  });

  test('opera abas com setas, Home e End', async ({ page }) => {
    const decision = page.getByRole('tab', { name: 'Decisão' });
    const learning = page.getByRole('tab', { name: 'Aprendizado' });
    const evidence = page.getByRole('tab', { name: 'Evidência' });

    await decision.focus();
    await decision.press('ArrowRight');
    await expect(learning).toBeFocused();
    await expect(learning).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panelLearning')).toBeVisible();

    await learning.press('End');
    await expect(evidence).toBeFocused();
    await evidence.press('Home');
    await expect(decision).toBeFocused();
  });

  test('associa erro ao campo e move o foco para a correção', async ({ page }) => {
    await page.getByRole('button', { name: 'Salvar prioridade' }).click();
    const input = page.locator('#priorityTopic');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#priorityTopicError')).toBeVisible();

    await input.fill('Doença renal crônica');
    await page.getByRole('button', { name: 'Salvar prioridade' }).click();
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#foundationFormStatus')).toContainText('Prioridade salva');
  });

  test('mantém seleção, rótulo visual e conteúdo longo coerentes', async ({ page }) => {
    const first = page.locator('.nql-branch').nth(0);
    const second = page.locator('.nql-branch').nth(1);
    await second.click();

    await expect(second).toHaveAttribute('aria-pressed', 'true');
    await expect(second.locator('.nql-branch__state')).toHaveText('Selecionada');
    await expect(first).toHaveAttribute('aria-pressed', 'false');
    await expect(first.locator('.nql-branch__state')).toHaveText('Disponível');

    await page.setViewportSize({ width: 320, height: 700 });
    await second.locator('span').nth(1).evaluate((element) => {
      element.textContent = 'Pseudohipoparatireoidismopseudopseudohipoparatireoidismo';
    });
    await page.locator('#priorityTopic').fill('x'.repeat(300));
    await page.getByRole('button', { name: 'Salvar prioridade' }).click();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });

  test('anima a corrente somente quando a superfície está visível', async ({ page }) => {
    const calibrator = page.locator('.nql-calibrator');
    const offscreenPanel = page.locator('.nql-panel.nql-hilar');
    await expect(calibrator).toHaveClass(/is-port-live/);
    await expect(offscreenPanel).not.toHaveClass(/is-port-live/);

    const offscreenAnimation = await offscreenPanel.locator('.nql-hilar-port__pulse').evaluate((element) =>
      getComputedStyle(element).animationName
    );
    expect(offscreenAnimation).toBe('none');
  });

  test('diálogo contém o foco, fecha com Escape e devolve o foco', async ({ page }) => {
    const opener = page.getByRole('button', { name: 'Testar diálogo' });
    await opener.click();

    const dialog = page.getByRole('dialog', { name: 'Confirmar trilho de estudo' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('#foundationDialogTitle')).toBeFocused();

    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press('Tab');
      const focusInside = await page.evaluate(() => {
        const modal = document.getElementById('foundationDialog');
        return Boolean(modal?.contains(document.activeElement));
      });
      expect(focusInside).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
  });

  test('loading mantém nome da ação e comunica ocupação', async ({ page }) => {
    const loading = page.getByRole('button', { name: 'Calibrar sessão' });
    await loading.click();
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading).toContainText('Calibrar sessão');
    await expect(loading).toHaveAttribute('aria-busy', 'false', { timeout: 2_000 });
  });

  test('respeita movimento reduzido sem perder estado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(page.locator('body')).toHaveAttribute('data-motion', 'paused');
    await expect(page.locator('#motionToggle')).toHaveAttribute('aria-pressed', 'true');

    const animation = await page.locator('.nql-conduit').evaluate((element) =>
      getComputedStyle(element, '::before').animationName
    );
    expect(animation).toBe('none');
    await expect(page.locator('#calibratorTitle')).toBeVisible();
  });

  test('permanece legível em cores forçadas', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.reload();
    await expect(page.locator('#foundationTitle')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Testar diálogo' })).toBeVisible();
  });

  test('mantém contraste não textual do campo acima de 3 para 1', async ({ page }) => {
    const contrast = await page.locator('#priorityTopic').evaluate((element) => {
      const parse = (value: string) => {
        const color = value.trim();
        if (color.startsWith('#')) {
          const hex = color.slice(1);
          return [
            Number.parseInt(hex.slice(0, 2), 16),
            Number.parseInt(hex.slice(2, 4), 16),
            Number.parseInt(hex.slice(4, 6), 16),
            1
          ];
        }
        return (color.match(/[\d.]+/g) || []).map(Number);
      };
      const [red, green, blue, alpha = 1] = parse(getComputedStyle(element).borderTopColor);
      const [baseRed, baseGreen, baseBlue] = parse(getComputedStyle(document.body).getPropertyValue('--nql-abyss'));
      const composite = [
        red * alpha + baseRed * (1 - alpha),
        green * alpha + baseGreen * (1 - alpha),
        blue * alpha + baseBlue * (1 - alpha)
      ];
      const luminance = (rgb: number[]) => {
        const channels = rgb.map((channel) => {
          const value = channel / 255;
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        });
        return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
      };
      const lighter = Math.max(luminance(composite), luminance([baseRed, baseGreen, baseBlue]));
      const darker = Math.min(luminance(composite), luminance([baseRed, baseGreen, baseBlue]));
      return (lighter + .05) / (darker + .05);
    });
    expect(contrast).toBeGreaterThanOrEqual(3);
  });

  test('não apresenta violações axe sérias ou críticas', async ({ page }) => {
    const initial = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
      .analyze();
    const initialBlocking = initial.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical');
    expect(initialBlocking, JSON.stringify(initialBlocking, null, 2)).toEqual([]);

    await page.getByRole('button', { name: 'Testar diálogo' }).click();
    const withDialog = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
      .analyze();
    const dialogBlocking = withDialog.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical');
    expect(dialogBlocking, JSON.stringify(dialogBlocking, null, 2)).toEqual([]);
  });
});
