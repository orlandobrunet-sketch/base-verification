import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function entrar(page: Page, modo: 'exam' | 'study') {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => (window as any).openGameModesPopup());
  await page.locator(`[data-mode-route="${modo}"]`).click();
  await page.getByRole('button', { name: modo === 'exam' ? 'Começar prova' : 'Iniciar estudo livre', exact: true }).click();
  await expect(page.locator(modo === 'exam' ? '#examOpts button' : '#studyOptions button')).toHaveCount(4);
}

for (const foco of ['titulo', 'body'] as const) {
  test(`simulado preserva atalhos modificados com foco no ${foco}`, async ({ page }) => {
    await entrar(page, 'exam');
    if (foco === 'body') await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    else await page.locator('#examQuestaoTitulo').focus();
    for (const atalho of ['Control+a', 'Alt+a', 'Meta+a']) {
      await page.keyboard.press(atalho);
      expect(await page.evaluate(() => (0, eval)('_examState.answers.filter(Boolean).length')), atalho).toBe(0);
      expect(await page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
    }
    await page.keyboard.press('a');
    expect(await page.evaluate(() => (0, eval)('_examState.answers.filter(Boolean).length'))).toBe(1);
    await expect(page.locator('#examCorrecao')).toBeFocused();
    expect(await page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
  });
}

for (const entrada of ['clique', 'teclado'] as const) {
  test(`estudo transfere foco à correção após resposta por ${entrada}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await entrar(page, 'study');
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const correta = await page.evaluate(() => (0, eval)('_studyPresentations[studyModeIndex].a'));
    const indice = entrada === 'clique' ? correta : (correta + 1) % 4;
    const alternativa = page.locator('#studyOptions button').nth(indice);
    if (entrada === 'clique') await alternativa.click();
    else { await alternativa.focus(); await page.keyboard.press(String(indice + 1)); }
    const feedback = page.locator('#studyFeedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toBeFocused();
    await expect(feedback).toBeInViewport();
    expect(await page.evaluate(() => (0, eval)('studyModeCorrect + studyModeWrong'))).toBe(1);
    await expect(page.locator('#studyOptions button:disabled')).toHaveCount(4);
    await page.keyboard.press('Tab');
    expect(await feedback.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.locator('[data-action="nextStudyQuestion"]').click();
    await expect(page.locator('#studyQuestionArea')).toBeFocused();
    await expect(page.locator('#studyProgress')).toHaveText('2');
    await page.getByRole('button', { name: 'Pausar e voltar', exact: true }).click();
    await expect(page.locator('#mainApp')).toBeVisible();
    expect(await page.locator('#mainApp').evaluate((el: HTMLElement) => el.inert)).toBe(false);
    expect(await page.evaluate(() => (0, eval)('state.answered'))).toBe(false);
  });
}

test('legendas e valores do HUD cabem em suas colunas com fonte normal e ampliada', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 1100, 844, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const font of [16, 32]) {
      await page.evaluate(async size => {
        document.documentElement.style.fontSize = size + 'px';
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      }, font);
      if (width <= 768 && !await page.locator('.panel.left.mobile-open').count()) {
        await page.locator('[data-action="openMobileDrawer"]:visible').first().click();
      }
      const hud = page.locator('#mainApp .hud');
      await hud.scrollIntoViewIfNeeded();
      await expect(hud).toBeInViewport();
      const cortes = await hud.evaluate(el => {
        const fora: string[] = [];
        for (const tile of el.querySelectorAll('.tile')) {
          if (!tile.querySelector('#level, #score, #best, #gold')) continue;
          const limite = tile.getBoundingClientRect();
          const walker = document.createTreeWalker(tile, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent?.trim()) continue;
            const range = document.createRange(); range.selectNodeContents(node);
            if ([...range.getClientRects()].some(r => r.width && (r.left < limite.left - 1 || r.right > limite.right + 1))) fora.push(node.textContent.trim());
          }
        }
        return fora;
      });
      expect(cortes, `${width}px / fonte ${font}px: texto invade a coluna vizinha`).toEqual([]);
    }
  }
});
