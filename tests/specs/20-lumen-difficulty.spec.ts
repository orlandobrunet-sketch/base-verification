import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const appPath = '/jogar/';

async function enterAsGuest(page: import('@playwright/test').Page) {
  await page.goto(appPath, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
}

async function openDifficulty(page: import('@playwright/test').Page) {
  const launcher = page.locator('[data-action="startNewFromWelcome"]');
  await launcher.click();
  const dialog = page.getByRole('dialog', { name: 'Calibre o ritmo da jornada.' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function enterDirectlyAtAtrium(page: import('@playwright/test').Page) {
  await page.goto(appPath, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    (window as typeof window & { playAsGuest: () => void }).playAsGuest();
  });
  await expect(page.locator('#welcomeScreen')).toBeVisible();
}

test.describe('Página 3A — Calibração da Jornada Lúmen', () => {
  test.beforeEach(async ({ page }) => {
    await enterAsGuest(page);
  });

  test('transforma a dificuldade em um único conduíte com dados mecânicos reais', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('nefroquest-recommended-difficulty', 'hard');
    });

    const dialog = await openDifficulty(page);
    const overlay = page.locator('#diffSelectorOverlay');
    const group = dialog.getByRole('radiogroup', { name: 'Dificuldade da jornada' });
    const hard = group.locator('[data-diff-key="hard"]');

    await expect(overlay).toHaveAttribute('data-nq-ui', 'lumen');
    await expect(overlay).toHaveAttribute('data-selected-difficulty', 'hard');
    await expect(group.getByRole('radio')).toHaveCount(4);
    await expect(hard).toHaveAttribute('aria-checked', 'true');
    await expect(group.locator('[data-recommended="true"]')).toHaveCount(1);
    await expect(hard.locator('.difficulty-chip')).toHaveText('Indicado pelo Ritual');

    const hardImpact = dialog.locator('.nql-difficulty__impact-panel[data-diff-key="hard"]');
    await expect(hardImpact).toHaveAttribute('aria-hidden', 'false');
    await expect(hardImpact).toContainText('03 vidas');
    await expect(hardImpact).toContainText('0%');
    await expect(hardImpact).toContainText('25%');
    await expect(hardImpact).toContainText('75%');
    await expect(hardImpact).toContainText('Ativa');
    await expect(dialog.locator('#diffConfirmBtn')).toHaveAttribute('aria-label', 'Continuar com dificuldade Difícil');

    const geometryBefore = await dialog.locator('.nql-difficulty__body, .difficulty-grid, .nql-difficulty__impact, .nql-difficulty__footer')
      .evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }));

    await group.locator('[data-diff-key="hardcore"]').click();
    await expect(overlay).toHaveAttribute('data-selected-difficulty', 'hardcore');
    await expect(dialog.locator('.nql-difficulty__impact-panel[data-diff-key="hardcore"]')).toHaveAttribute('aria-hidden', 'false');
    await expect(dialog.locator('#diffConfirmBtn')).toHaveAttribute('aria-label', 'Continuar com dificuldade Hardcore');
    await page.waitForTimeout(260);

    const geometryAfter = await dialog.locator('.nql-difficulty__body, .difficulty-grid, .nql-difficulty__impact, .nql-difficulty__footer')
      .evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }));
    expect(geometryAfter).toEqual(geometryBefore);

    const infiniteAnimations = await overlay.locator('*').evaluateAll((elements) => elements.filter((element) =>
      getComputedStyle(element).animationIterationCount.split(',').some((value) => value.trim() === 'infinite')
    ).map((element) => element.className));
    expect(infiniteAnimations).toEqual([]);
  });

  test('mantém recomendação, seleção e confirmação como estados distintos', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('nefroquest-recommended-difficulty', 'easy');
    });

    const dialog = await openDifficulty(page);
    const group = dialog.getByRole('radiogroup', { name: 'Dificuldade da jornada' });
    const easy = group.locator('[data-diff-key="easy"]');
    const normal = group.locator('[data-diff-key="normal"]');

    await expect(easy).toHaveAttribute('aria-checked', 'true');
    await expect(easy).toHaveAttribute('data-recommended', 'true');
    await normal.click();
    await expect(normal).toHaveAttribute('aria-checked', 'true');
    await expect(easy).toHaveAttribute('aria-checked', 'false');
    await expect(easy).toHaveAttribute('data-recommended', 'true');
    await expect(easy.locator('.difficulty-chip')).toHaveText('Indicado pelo Ritual');
    await expect(dialog.locator('#diffConfirmBtn')).toContainText('Médio');
  });

  test('avisa sobre a jornada ativa, isola o fundo e cancelar preserva o save', async ({ page }) => {
    const savedJourney = JSON.stringify({
      schemaVersion: 6,
      character: 'nephros',
      level: 4,
      score: 1682,
      difficulty: 'normal',
      gameStarted: true,
      timestamp: Date.now(),
    });
    await page.evaluate((save) => localStorage.setItem('nefroquest-save', save), savedJourney);

    const launcher = page.locator('[data-action="startNewFromWelcome"]');
    const dialog = await openDifficulty(page);
    await expect(dialog).toHaveAttribute('aria-describedby', 'diffSelectorDesc diffSelectorWarning');
    await expect(dialog.locator('#diffSelectorWarning')).toContainText('o progresso atual será substituído');
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('aria-hidden', 'true');
    expect(await page.locator('#welcomeScreen').evaluate((element) => (element as HTMLElement).inert)).toBe(true);

    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    await expect(launcher).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(savedJourney);
    expect(await page.locator('#welcomeScreen').evaluate((element) => (element as HTMLElement).inert)).toBe(false);
    await expect(page.locator('#welcomeScreen')).toHaveAttribute('aria-hidden', 'false');
  });

  test('elimina o corte em desktop, mobile estreito e reflow de viewport curta', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'matriz responsiva executada uma vez no Chromium');
    test.setTimeout(180_000);
    const viewports = [
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
      { width: 640, height: 450 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await enterDirectlyAtAtrium(page);
      await page.evaluate(() => {
        localStorage.setItem('nefroquest-save', JSON.stringify({
          schemaVersion: 6,
          character: 'nephros',
          level: 2,
          score: 120,
          gameStarted: true,
          difficulty: 'normal',
          timestamp: Date.now(),
        }));
      });
      const dialog = await openDifficulty(page);
      const modalBox = await dialog.boundingBox();
      const titleBox = await dialog.locator('#diffSelectorTitle').boundingBox();
      const easyBox = await dialog.locator('.difficulty-card[data-diff-key="easy"]').boundingBox();
      const footerBox = await dialog.locator('.nql-difficulty__footer').boundingBox();
      const cancelBox = await dialog.getByRole('button', { name: 'Cancelar' }).boundingBox();
      const confirmBox = await dialog.locator('#diffConfirmBtn').boundingBox();

      expect(modalBox?.y || 0).toBeGreaterThanOrEqual(0);
      expect(titleBox?.y || 0).toBeGreaterThanOrEqual(0);
      expect(easyBox?.y || 0).toBeGreaterThanOrEqual(0);
      expect((footerBox?.y || 0) + (footerBox?.height || 0)).toBeLessThanOrEqual(viewport.height + 1);
      expect(cancelBox?.height || 0).toBeGreaterThanOrEqual(44);
      expect(confirmBox?.height || 0).toBeGreaterThanOrEqual(44);
      expect(await page.locator('#diffSelectorOverlay').evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }
  });

  test('respeita movimento reduzido e não mantém animações distrativas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const dialog = await openDifficulty(page);
    const motion = await dialog.evaluate((element) => {
      const modal = getComputedStyle(element);
      const conduit = getComputedStyle(element.querySelector('.difficulty-grid')!, '::after');
      const descendants = [element, ...Array.from(element.querySelectorAll('*'))];
      return {
        modalAnimation: modal.animationName,
        conduitTransition: conduit.transitionDuration,
        infinite: descendants.some((node) => getComputedStyle(node).animationIterationCount
          .split(',').some((value) => value.trim() === 'infinite')),
      };
    });

    expect(motion.modalAnimation).toBe('none');
    expect(Number.parseFloat(motion.conduitTransition)).toBeLessThanOrEqual(0.00001);
    expect(motion.infinite).toBe(false);
  });

  test('não introduz violações sérias de acessibilidade com o diálogo aberto', async ({ page }) => {
    await openDifficulty(page);
    const results = await new AxeBuilder({ page }).include('#diffSelectorOverlay').analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    expect(serious).toEqual([]);
  });
});
