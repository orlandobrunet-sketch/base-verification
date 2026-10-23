import { test, expect } from '@playwright/test';

test.describe('Landing: evidências, ícones e transição do método', () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    await context.route('**/*', route => route.request().method() === 'GET'
      && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await context.routeWebSocket('**/*', socket => socket.close());
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
  });

  test('apresenta a experiência primeiro e mantém contexto e fontes acessíveis', async ({ page }) => {
    const evidence = page.locator('#evidencias-aprendizagem');
    const summary = evidence.locator(':scope > summary');
    await summary.focus();
    await summary.press('Enter');
    await expect(evidence.locator(':scope > p').first()).toHaveClass('learning-evidence-lead');
    await expect(evidence.locator('.learning-evidence-lead')).toContainText('XP, conquistas e etapas');
    await expect(evidence.locator('.learning-evidence-lead')).not.toContainText(/validação|baixa qualidade/);
    await expect(evidence.locator('.learning-evidence-columns h3')).toHaveText(['Método de estudo', 'Elementos de jogo']);
    await expect(evidence.locator('blockquote')).toHaveText([
      '“A prática de recuperação produziu a melhor aprendizagem”',
      '“A gamificação parece promissora para melhorar resultados de aprendizagem”',
      '“As pontuações no teste de conhecimento foram maiores”',
      '“melhorou a tomada de decisão na triagem em uma simulação virtual validada”',
    ]);
    await expect(evidence.locator('.learning-evidence-columns')).toContainText('mapas conceituais');
    await expect(evidence.locator('.learning-evidence-columns')).toContainText('teste imediato');
    await expect(evidence.locator('.learning-evidence-method-note')).toBeVisible();
    await expect(evidence.locator('.learning-evidence-method-note')).toContainText('sem constituir validação específica do NefroQuest');
    const note = evidence.locator('.learning-evidence-limits');
    await expect(note).not.toHaveAttribute('open');
    await note.locator('summary').focus();
    await note.locator('summary').press('Space');
    await expect(note.locator('ol')).toBeVisible();
    await expect(note.locator('a')).toHaveCount(7);
    await expect(note).toContainText('em sua maioria de baixa qualidade');
    await expect(note).toContainText('sem medir retenção');
    await expect(note).toContainText('sem demonstrar resultados em pacientes reais');
    await expect(note.locator('blockquote')).toHaveCount(0);
    await summary.focus();
    await summary.press('Space');
    await expect(evidence).not.toHaveAttribute('open');
    await expect(summary).toBeFocused();
  });

  test('usa quatro ícones vetoriais da mesma família, sem alterar os títulos', async ({ page }) => {
    const cards = page.locator('.game-experience-card');
    await expect(cards.locator('h3')).toHaveText(['XP e evolução', 'Capítulos da aventura', 'Equipamentos e escolhas', 'Conquistas e marcos']);
    await expect(cards.locator('.game-experience-art > svg')).toHaveCount(4);
    await expect(cards.locator('.game-experience-art img, .game-experience-xp')).toHaveCount(0);
    const styles = await cards.locator('.game-experience-art').evaluateAll(elements => elements.map(el => {
      const svg = el.querySelector('svg')!;
      const s = getComputedStyle(svg);
      return { hidden: el.getAttribute('aria-hidden'), focusable: svg.getAttribute('focusable'),
        viewBox: svg.getAttribute('viewBox'), width: svg.clientWidth, height: svg.clientHeight,
        stroke: s.stroke, strokeWidth: s.strokeWidth, fill: s.fill, cap: s.strokeLinecap, join: s.strokeLinejoin };
    }));
    expect(styles).toHaveLength(4);
    for (const item of styles) {
      expect(item).toEqual({ ...styles[0], hidden: 'true', focusable: 'false', viewBox: '0 0 24 24',
        width: 56, height: 56, strokeWidth: '1.8px', fill: 'none', cap: 'round', join: 'round' });
      expect(item.stroke).not.toBe('none');
    }
  });

  test('faz uma transição contínua com respiro para o título e preserva o carrossel', async ({ page }) => {
    // Medir a superfície após a apresentação, e não o translateY da entrada.
    await page.locator('.guideline-flow').scrollIntoViewIfNeeded();
    await expect(page.locator('.guideline-flow')).toHaveCSS('transform', 'none');
    const geometry = await page.evaluate(() => {
      const a = document.querySelector('.guideline-archive')!;
      const f = document.querySelector('.guideline-flow')!;
      const m = document.querySelector('#metodo')!;
      const h = m.querySelector('h2')!;
      return { gap: a.getBoundingClientRect().bottom - f.getBoundingClientRect().bottom,
        borders: parseFloat(getComputedStyle(a).borderBottomWidth) + parseFloat(getComputedStyle(f).borderBottomWidth),
        titleGap: h.getBoundingClientRect().top - m.getBoundingClientRect().top,
        padding: parseFloat(getComputedStyle(m).paddingTop) };
    });
    expect(geometry.gap).toBeGreaterThanOrEqual(0);
    expect(geometry.gap).toBeLessThanOrEqual(1);
    expect(geometry.borders).toBe(1);
    expect(geometry.padding).toBeGreaterThanOrEqual(40);
    expect(geometry.padding).toBeLessThanOrEqual(56);
    expect(geometry.titleGap).toBeGreaterThanOrEqual(40);
    const control = page.locator('[data-guideline-cover]').first();
    await control.focus();
    await expect(control).toBeFocused();
    await control.press('ArrowRight');
    await expect(page.locator('[data-guideline-cover]').nth(1)).toBeFocused();
    await expect(page.locator('[data-guideline-active]')).not.toHaveText('');
    await page.setViewportSize({ width: 320, height: 700 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.locator('#metodo').scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    expect(overflow).toBe(false);
    const title = await page.locator('#method-title').boundingBox();
    expect(title!.x).toBeGreaterThanOrEqual(0);
    expect(title!.x + title!.width).toBeLessThanOrEqual(321);
  });
});
