import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ page, context }) => {
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
    && ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
});

async function jogo(page: Page, width = 1440, gold = 5000) {
  await page.setViewportSize({ width, height: 900 });
  await injectGameState(page, { gold, lives: 5, streak: 12, character: 'aquaria' });
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
}

for (const gold of [200, 700, 5000]) test(`forja alinha botões com saldo ${gold}, incluindo conclusão`, async ({ page, isMobile }) => {
  test.skip(isMobile, 'alinhamento entre duas colunas no computador');
  await jogo(page, 1440, gold);
  await page.evaluate(() => (window as any).showForjaModal());
  const aligned = async () => {
    const buttons = await page.locator('.nq-forja-opcao > button').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().toJSON()));
    const layout = await page.locator('.nq-forja-opcoes').evaluate(root => [root, ...root.querySelectorAll('article,article > *')].map(el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return { tag: el.className, y: r.y, height: r.height, display: s.display, rows: s.gridTemplateRows, row: s.gridRow, margin: s.marginBlock };
    }));
    expect(Math.abs(buttons[0].y - buttons[1].y), JSON.stringify(layout)).toBeLessThanOrEqual(1);
    expect(Math.abs(buttons[0].height - buttons[1].height)).toBeLessThanOrEqual(1);
  };
  await aligned();
  await page.evaluate(() => (0, eval)(`_forja.ultimo={item:{n:'Botas da Pressão Controlada',rar:'epic',atk:1,def:6,kno:2,luck:2},slot:'boot',msg:'Equipou Botas da Pressão Controlada.',custo:300,venda:0};_renderForja();`));
  await aligned();
  const border = await page.locator('.nq-forja-banner').evaluate(el => {
    const s = getComputedStyle(el); return [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth];
  });
  expect(border.every(value => parseFloat(value) >= 1)).toBe(true);
});

test('recompensa da forja dá destaque ao equipamento e reflow sem cortes', async ({ page }) => {
  await jogo(page);
  await page.evaluate(() => (window as any).showForjaModal());
  await page.evaluate(() => (0, eval)(`_forja.ultimo={item:{n:'Botas da Pressão Controlada',rar:'epic',atk:1,def:6,kno:2,luck:2},slot:'boot',msg:'Equipou Botas da Pressão Controlada.',custo:300,venda:0};_renderForja();`));
  const card = page.locator('.nq-forja-item-final');
  const art = page.locator('.nq-forja-item-final .nq-forja-arte');
  expect((await art.boundingBox())!.width).toBeGreaterThanOrEqual(160);
  expect((await card.boundingBox())!.width).toBeLessThanOrEqual(850);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await page.locator('#forjaPage').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.getByRole('button', { name: 'Forjar outro item', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Forjar outro item', exact: true })).toBeInViewport();
  }
});

test('fase final mantém as larguras da jornada, inclusive no reflow', async ({ page, isMobile }) => {
  test.skip(isMobile, 'O cenário fixa as próprias viewports de desktop e mobile.');
  await jogo(page, 1440);
  for (const width of [1440, 1280, 1100, 768, 390, 320]) for (const font of [16, 32]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(size => { document.documentElement.style.fontSize = size + 'px'; }, font);
    const phase = async (correct: number) => {
      await page.evaluate(value => { (0, eval)('state.correctTotal=' + value + ';renderHUD();updateBossUI();'); }, correct);
      await page.evaluate(async () => { await document.fonts.ready; await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); });
    };
    const measure = () => page.locator('#mainApp').evaluate(el => {
      const style = getComputedStyle(el), question = el.querySelector('.panel.right')!.getBoundingClientRect();
      return { tracks: style.gridTemplateColumns, gap: innerWidth > 768 ? style.columnGap : null,
        padding: style.paddingInline, width: el.getBoundingClientRect().width,
        leftWidth: innerWidth > 768 ? el.querySelector('.panel.left')!.getBoundingClientRect().width : null,
        questionWidth: question.width, questionX: question.x };
    });
    await phase(15); const normal = await measure();
    await phase(90); await expect(page.locator('body')).toHaveClass(/arqui-nefromante-final/);
    const final = await measure();
    await test.info().attach('colunas-' + width + '-' + font, { contentType: 'application/json', body: JSON.stringify({ width, font, normal, final }) });
    expect(final, width + 'px / fonte ' + font + 'px').toEqual(normal);
  }
});

test('vidas ficam próximas do nível e Sequência no terceiro campo do rodapé', async ({ page, isMobile }) => {
  test.skip(isMobile, 'faixa do herói no computador');
  await jogo(page);
  const lives = (await page.locator('#guardianVitality').boundingBox())!;
  const streak = (await page.locator('.hud .tile').filter({ has: page.locator('#streak') }).boundingBox())!;
  await expect(page.locator('.hud .tile').nth(2)).toContainText('Sequência');
  expect(streak.y).toBeGreaterThan(lives.y);
  const portrait = (await page.locator('.portrait-frame').boundingBox())!;
  expect(lives.y).toBeGreaterThanOrEqual(portrait.y + portrait.height);
  await expect(page.locator('#streak')).toHaveText('12');
  await expect(page.locator('#lives')).not.toBeEmpty();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const reflow = await page.locator('#guardianVitality').evaluate(el => {
    const progress = document.querySelector('.nql-hero-progress')!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { fits: el.scrollWidth <= el.clientWidth + 1, separated: r.bottom <= progress.top + 1 };
  });
  const boxes = await page.locator('#guardianVitality').evaluate(el => ({
    lives: el.getBoundingClientRect().toJSON(), progress: document.querySelector('.nql-hero-progress')!.getBoundingClientRect().toJSON(),
    margin: getComputedStyle(document.querySelector('.nql-hero-progress')!).marginTop,
  }));
  expect(reflow, JSON.stringify(boxes)).toEqual({ fits: true, separated: true });
});

test('cabeçalhos da Forja usam a largura disponível em duas colunas estreitas com texto ampliado', async ({ page }) => {
  await jogo(page, 640);
  await page.evaluate(() => (window as any).showForjaModal());
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  for (const heading of await page.locator('.nq-forja-opcao h3').all()) {
    const space = await heading.evaluate(el => ({width: el.getBoundingClientRect().width, card: el.closest('.nq-forja-opcao')!.getBoundingClientRect().width}));
    expect(space.width).toBeGreaterThan(space.card * .6);
  }
});

for (const width of [320, 1440]) test(`modos entra no painel do Átrio, volta e preserva a jornada em ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.locator('[data-portal-route="guest"]').click();
  const before = await page.evaluate(() => localStorage.getItem('nefroquest-save-v7'));
  const modes = page.locator('[data-atrium-route="modes"]');
  await modes.focus();
  await page.keyboard.press('Enter');
  const panel = page.locator('#atriumModesPanel');
  await expect(panel).toBeVisible();
  await expect(page.locator('#gameModesOverlay')).not.toHaveClass(/show/);
  await expect(panel.locator('[data-mode-route="study"]')).toBeFocused();
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(modes).toBeFocused();
  await modes.click();
  await panel.getByRole('button', { name: 'Voltar às rotas', exact: true }).click();
  await expect(modes).toBeFocused();
  await modes.click();
  if (width === 320) await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).include('#atriumModesPanel').withRules(['color-contrast', 'button-name']).analyze()).violations).toEqual([]);
  await panel.locator('[data-mode-route="study"]').click();
  await expect(panel).toBeHidden();
  await expect(page.locator('.study-mode-popup')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save-v7'))).toBe(before);
});

test('animação do submenu respeita movimento reduzido', async ({ page }) => {
  await page.locator('[data-portal-route="guest"]').click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('[data-atrium-route="modes"]').click();
  expect(await page.locator('#atriumModesPanel').evaluate(el => getComputedStyle(el).animationName)).not.toBe('none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('#atriumModesPanel').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});
