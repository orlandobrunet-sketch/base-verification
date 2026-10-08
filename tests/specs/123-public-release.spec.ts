import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

test('atualizar 15.93 para apresentação 2.0 conserva save, relíquias e memória', async ({ page }) => {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { schemaVersion: 6, level: 5, gold: 487, score: 3920, correctTotal: 46 });
  await page.evaluate(() => {
    (0, eval)('_doSaveGame()');
    localStorage.setItem('nq-sw-version', '15.93');
    localStorage.removeItem('nq-public-version');
    localStorage.setItem('nefroquest-achievements', '["centenario"]');
    localStorage.setItem('nefroquest-sr-data', '{"8e763ea6":{"stability":9,"difficulty":4}}');
    localStorage.setItem('nq-bib-favorites', '["cni_nephrotoxicity_naesens"]');
  });
  const keys = ['nefroquest-save-v7', 'nefroquest-achievements', 'nefroquest-sr-data', 'nq-bib-favorites'];
  const before = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), keys);
  const cacheClears: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/clear-cache.html') cacheClears.push(request.url()); });
  await page.route('**/version.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: '15.94', displayVersion: '2.0' }) }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('nq-sw-version'))).toBe('15.94');
  expect(await page.evaluate(() => localStorage.getItem('nq-public-version'))).toBe('2.0');
  await expect(page.locator('.version-label-dynamic').first()).toHaveText('v2.0');
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), keys)).toEqual(before);
  expect(cacheClears).toEqual([]);
  await expect(page).toHaveURL(/\/jogar\/$/);
});

test('resposta antiga da CDN preserva a versão técnica e a apresentação pública', async ({ page }) => {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('nq-sw-version', '15.94');
    localStorage.setItem('nq-public-version', '2.0');
  });
  await page.route('**/version.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: '15.93' }) }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.version-label-dynamic').first()).toHaveText('v2.0');
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeVersionLabel')).toHaveText('v2.0');
  expect(await page.evaluate(() => localStorage.getItem('nq-sw-version'))).toBe('15.94');
});

test('Google usa asset oficial legível e preserva a ação de acesso', async ({ page }) => {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  const button = page.getByRole('button', { name: /Continuar com Google/ }).first();
  await expect(button).toHaveAttribute('data-action', 'landingLoginGoogle');
  const icon = button.locator('.nql-google-icon img');
  await expect(icon).toHaveAttribute('src', 'assets/images/google-g.png');
  await expect.poll(() => icon.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  const geometry = await icon.evaluate((image: HTMLImageElement) => ({ loaded: image.complete && image.naturalWidth > 0, fit: getComputedStyle(image).objectFit, background: getComputedStyle(image.parentElement!).backgroundColor }));
  expect(geometry).toEqual({ loaded: true, fit: 'contain', background: 'rgb(255, 255, 255)' });
});

test('Escape da gaveta fecha o painel mesmo com uma dica de atributo sob o ponteiro', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => { await (window as any).startBossPreview(); });
  await expect(page.locator('#question')).not.toBeEmpty();
  const hero = page.locator('#mobileBottomDock .mdock-btn.personagem');
  await hero.click();
  const drawer = page.locator('#mainApp .panel.left.mobile-open');
  const close = drawer.getByRole('button', { name: 'Fechar painel do herói' });
  await expect(close).toBeFocused();
  const badge = drawer.locator('.equip-total-attributes .stat-badge').first();
  // O scroll automático do hover pode chegar depois da abertura e fechar a
  // dica. Termine o scroll e confirme o alvo antes de mover o ponteiro real.
  await badge.scrollIntoViewIfNeeded();
  await expect.poll(() => badge.evaluate(async element => {
    const panel = element.closest<HTMLElement>('.panel.left')!;
    let previous = '', stable = 0;
    for (let frame = 0; frame < 4; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const box = element.getBoundingClientRect();
      const geometry = JSON.stringify([panel.scrollTop, box.x, box.y, box.width, box.height]);
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      stable = hit && element.contains(hit) && geometry === previous ? stable + 1 : 0;
      previous = geometry;
      if (stable >= 2) return true;
    }
    return false;
  })).toBe(true);
  // Hover não muda o foco: reproduz a dica transitória vista no trace v7.
  await badge.hover();
  await expect(page.locator('body > .stat-tip-floating')).toBeVisible();
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('body > .stat-tip-floating')).toBeHidden();
  await expect(page.locator('#mobileOverlay')).not.toHaveClass(/active/);
  await expect(hero).toBeFocused();
});

test('Novidades apresenta 2.0, conserva histórico e retorna o foco após fechar', async ({ page }) => {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  const launcher = page.locator('.nql-portal [data-action="showChangelog"]').first();
  await launcher.click();
  const dialog = page.locator('.changelog-popup');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('NefroQuest 2.0');
  await expect(dialog).toContainText('v11.87');
  await expect(dialog).toContainText('v11.86');
  const reading = dialog.getByRole('region', { name: 'Histórico de novidades' });
  await reading.focus();
  await page.keyboard.press('End');
  const close = dialog.getByRole('button', { name: 'Fechar', exact: true });
  await close.click();
  await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused();
  await launcher.click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test('dificuldade usa quatro acentos, estado marcado e concordância do motor', async ({ page }) => {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.locator('[data-action="startNewFromWelcome"]').click();
  const radio = page.locator('#diffSelectorOverlay .difficulty-card');
  const colors: string[] = [];
  const focusColors: string[] = [];
  for (const key of ['easy', 'normal', 'hard', 'hardcore']) {
    const option = page.locator(`#diffSelectorOverlay .difficulty-card[data-diff-key="${key}"]`);
    await option.click();
    await expect(option).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => option.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    const selected = await option.evaluate(element => getComputedStyle(element).backgroundColor);
    colors.push(selected);
    await page.keyboard.press('Tab');
    await option.focus();
    // O nó anima a seleção; o contorno muda imediatamente. Compare o estado final.
    await expect.poll(() => option.evaluate(element => {
      const style = getComputedStyle(element);
      const node = element.querySelector('.nql-difficulty__node > span')!;
      return style.outlineColor === getComputedStyle(node).backgroundColor;
    })).toBe(true);
    const focus = await option.evaluate(element => {
      const style = getComputedStyle(element);
      return { visible: element.matches(':focus-visible'), color: style.outlineColor,
        width: style.outlineWidth, node: getComputedStyle(element.querySelector('.nql-difficulty__node > span')!).backgroundColor };
    });
    expect(focus.visible).toBe(true);
    expect(focus.width).toBe('2px');
    expect(focus.color).toBe(focus.node);
    focusColors.push(focus.color);
    await expect(page.locator(`.nql-difficulty__impact-panel[data-diff-key="${key}"] .nql-difficulty__adaptation strong`)).toHaveText(key === 'hardcore' ? 'Desativado' : 'Ativo');
    const unselected = await page.locator(`#diffSelectorOverlay .difficulty-card[data-diff-key="${key === 'easy' ? 'normal' : 'easy'}"]`).getAttribute('aria-checked');
    expect(unselected).toBe('false');
  }
  expect(new Set(colors).size).toBe(4);
  expect(new Set(focusColors).size).toBe(4);
  await page.keyboard.press('Escape');
  await expect(page.locator('#diffSelectorOverlay')).toHaveCount(0);
});

for (const width of [320, 390]) test(`motor e estado das quatro dificuldades cabem em ${width}px a 200%`, async ({ page }) => {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/jogar/', { waitUntil: 'load' });
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-portal-route="guest"]').click();
  await page.locator('[data-action="startNewFromWelcome"]').click();
  for (const key of ['easy', 'normal', 'hard', 'hardcore']) {
    await page.locator(`.difficulty-card[data-diff-key="${key}"]`).click();
    const card = page.locator(`.nql-difficulty__impact-panel[data-diff-key="${key}"] .nql-difficulty__adaptation`);
    const status = card.locator('strong');
    await status.scrollIntoViewIfNeeded();
    await expect(status).toHaveText(key === 'hardcore' ? 'Desativado' : 'Ativo');
    const metrics = await card.evaluate(element => {
      const outer = element.getBoundingClientRect();
      const outside: string[] = [];
      for (const child of Array.from(element.children)) {
        const range = document.createRange(); range.selectNodeContents(child);
        if (Array.from(range.getClientRects()).some(box => box.width && (box.left < outer.left || box.right > outer.right))) outside.push(child.textContent || '');
      }
      return { outside, color: getComputedStyle(element.querySelector('strong')!).color };
    });
    expect(metrics.outside).toEqual([]);
    if (key === 'hardcore') expect(metrics.color).toBe('rgb(235, 87, 103)');
  }
});

test('resposta pendente de uma aba não rebaixa release observado pela outra', async ({ page }) => {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('nq-sw-version', '15.93');
    localStorage.setItem('nq-public-version', '15.93');
  });
  let releaseOlder!: () => void;
  const olderResponse = new Promise<void>(resolve => { releaseOlder = resolve; });
  let requestsHeld = 0;
  await page.route('**/version.json', async route => {
    requestsHeld++;
    await olderResponse;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: '15.94', displayVersion: '2.0' }) });
  });
  const newerPage = await page.context().newPage();
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => requestsHeld).toBeGreaterThan(0);
    await newerPage.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
    await newerPage.route('**/version.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: '15.95', displayVersion: '2.1' }) }));
    await newerPage.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => newerPage.evaluate(() => localStorage.getItem('nq-sw-version'))).toBe('15.95');
    await expect(newerPage.locator('.version-label-dynamic').first()).toHaveText('v2.1');
    releaseOlder();
    await expect(page.locator('.version-label-dynamic').first()).toHaveText('v2.1');
    expect(await page.evaluate(() => ({ technical: localStorage.getItem('nq-sw-version'), public: localStorage.getItem('nq-public-version') }))).toEqual({ technical: '15.95', public: '2.1' });
    await page.locator('[data-portal-route="guest"]').click();
    await expect(page.locator('#welcomeVersionLabel')).toHaveText('v2.1');
  } finally {
    releaseOlder();
    await newerPage.close();
  }
});

test('mesmo release técnico sem metadata não perde a numeração pública', async ({ page }) => {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('nq-sw-version', '15.94');
    localStorage.setItem('nq-public-version', '2.0');
  });
  await page.route('**/version.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: '15.94' }) }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.version-label-dynamic').first()).toHaveText('v2.0');
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeVersionLabel')).toHaveText('v2.0');
  expect(await page.evaluate(() => localStorage.getItem('nq-public-version'))).toBe('2.0');
});

test('resposta técnica inválida não altera os marcadores válidos', async ({ page }) => {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('nq-sw-version', '15.94');
    localStorage.setItem('nq-public-version', '2.0');
  });
  let responses = 0;
  await page.route('**/version.json', route => {
    responses++;
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 'broken', displayVersion: '2.1' }) });
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(() => responses).toBeGreaterThan(0);
  // A response finished is stronger than a timeout while a held fetch has not run yet.
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => ({ technical: localStorage.getItem('nq-sw-version'), public: localStorage.getItem('nq-public-version') }))).toEqual({ technical: '15.94', public: '2.0' });
});
