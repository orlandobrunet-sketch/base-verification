import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function abrir(page: Page) {
  await page.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    return host === 'localhost' || host === '127.0.0.1' ? route.continue() : route.abort();
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).startBossPreview === 'function');
  await page.evaluate(async () => { await (window as any).startBossPreview(); });
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect(page.locator('#question')).not.toBeEmpty();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  await expect.poll(() => page.locator('#arquiBossImgEl').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
}

function textOverflow(selector = '#mainApp .panel.right') {
  const outside: string[] = [];
  const root = document.querySelector(selector)!;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || !(node.textContent || '').trim() || !el.getClientRects().length) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    if (el.closest('[hidden], .hidden, [inert], script, style')) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const box of range.getClientRects()) {
      if (box.width && (box.left < -1 || box.right > innerWidth + 1)) {
        outside.push((node.textContent || '').trim().slice(0, 45)); break;
      }
    }
  }
  return outside;
}

test('HP e golpes têm valores acessíveis reais e acompanham a resposta certa', async ({ page }) => {
  await abrir(page);
  const hp = page.getByRole('progressbar', { name: 'Vida do Arqui-Nefromante' });
  await expect(hp).toHaveAttribute('aria-valuenow', '100');
  await expect(hp).toHaveAttribute('aria-valuetext', 'HP 100%, 0 de 10 golpes concluídos');
  await expect(page.locator('#arquiStarsDesktop')).toHaveAttribute('aria-label', '0 de 10 golpes concluídos');
  const correct = await page.evaluate(() => (window as any).state.current.a);
  await page.locator(`#options .option[data-idx="${correct}"]`).click();
  await expect(hp).toHaveAttribute('aria-valuenow', '90');
  await expect(page.locator('#arquiStarsDesktop .filled')).toHaveCount(1);
  await expect(page.locator('#options .option.correct')).toBeVisible();
  expect(await page.evaluate(() => (window as any).isProgressSandbox())).toBe(true);
});

for (const scale of [1, 2]) test(`drawer moderno e áudio acessíveis, sem alterar a demonstração, a ${scale * 100}%`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await abrir(page);
  await page.addStyleTag({ content: `html { font-size: ${16 * scale}px !important; }` });
  const before = await page.evaluate(() => JSON.stringify({
    gold: (window as any).state.gold, score: (window as any).state.score,
    correct: (window as any).state.correctTotal, equipment: (window as any).state.equipment,
  }));
  const audio = page.locator('#soundControlsBar .nq-audio-button');
  await audio.click();
  await expect(page.locator('#soundControlsBarAudioPanel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#soundControlsBarAudioPanel')).toBeHidden();
  await expect(audio).toBeFocused();
  const hero = page.locator('#mobileBottomDock .mdock-btn.personagem');
  await hero.click();
  const drawer = page.locator('#mainApp .panel.left.mobile-open');
  await expect(drawer).toBeVisible();
  await expect.poll(() => drawer.evaluate(el => getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  expect(await page.evaluate(textOverflow, '#mainApp .panel.left')).toEqual([]);
  expect(await drawer.locator('.tile').evaluateAll(cards => cards.flatMap(card => {
    const outer = card.getBoundingClientRect();
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    const clipped: string[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!(node.textContent || '').trim()) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      if ([...range.getClientRects()].some(box => box.width && (box.left < outer.left || box.right > outer.right))) clipped.push((node.textContent || '').trim());
    }
    return clipped;
  })), 'texto fora do cartão do HUD').toEqual([]);
  expect(await drawer.locator('.hero').evaluate(el => getComputedStyle(el).display)).toBe('contents');
  expect(await drawer.locator('.nql-loadout-shell').evaluate(el => getComputedStyle(el).display)).toBe('grid');
  await expect(drawer.locator('.hud .tile:visible')).toHaveCount(6);
  const close = drawer.getByRole('button', { name: 'Fechar painel do herói' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(drawer.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await close.evaluate(el => {
    const box = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  }), 'overlay cobre o botão de fechar').toBe(true);
  expect(await drawer.locator('#equipList .slot-diablo').first().evaluate(el => {
    const box = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  }), 'overlay cobre equipamento').toBe(true);
  if (scale === 2) {
    expect(await drawer.evaluate(el => {
      el.scrollTop = el.scrollHeight;
      return el.scrollTop;
    }), 'painel ampliado não permite rolar').toBeGreaterThan(0);
    await expect(drawer.locator('.hud')).toBeInViewport();
  }
  await close.click();
  await expect(page.locator('#mobileOverlay')).not.toHaveClass(/active/);
  await expect(hero).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await hero.click();
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobileOverlay')).not.toHaveClass(/active/);
  await expect(hero).toBeFocused();
  await expect(page.locator('#question')).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify({
    gold: (window as any).state.gold, score: (window as any).state.score,
    correct: (window as any).state.correctTotal, equipment: (window as any).state.equipment,
  }))).toBe(before);
});

for (const scale of [1, 2]) test(`Escape em Fechar continua fechando a gaveta com hover de equipamento, texto ${scale * 100}%`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await abrir(page);
  await page.addStyleTag({ content: `html { font-size: ${16 * scale}px !important; }` });
  const before = await page.evaluate(() => JSON.stringify({
    gold: (window as any).state.gold, score: (window as any).state.score,
    correct: (window as any).state.correctTotal, equipment: (window as any).state.equipment,
  }));
  const hero = page.locator('#mobileBottomDock .mdock-btn.personagem');
  await hero.click();
  const drawer = page.locator('#mainApp .panel.left.mobile-open');
  await expect.poll(() => drawer.evaluate(el => getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  const close = drawer.getByRole('button', { name: 'Fechar painel do herói' });
  await expect(close).toBeFocused();
  await drawer.locator('#equipList .slot-diablo').first().hover();
  const preview = page.locator('#nqEquipmentPreview');
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('role', 'tooltip');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(preview).toBeHidden();
  await expect(page.locator('#mobileOverlay')).not.toHaveClass(/active/);
  await expect(hero).toBeFocused();
  expect(await page.evaluate(() => JSON.stringify({
    gold: (window as any).state.gold, score: (window as any).state.score,
    correct: (window as any).state.correctTotal, equipment: (window as any).state.equipment,
  }))).toBe(before);
});

test('metadados longos existentes cabem em 320px com texto a 200%', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await abrir(page);
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
  // Reproduz a referência que revelou o corte, usando os dados e renderizador
  // já existentes; nenhum conteúdo clínico ou estado de combate é editado.
  await page.evaluate(() => (window as any).renderRefs(['meropenem_anvisa']));
  await expect(page.locator('.ref-tipo')).toHaveText('Bula profissional aprovada pela ANVISA');
  expect(await page.evaluate(textOverflow)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
});

for (const width of [320, 390, 1100]) {
  for (const scale of [1, 2]) {
    test(`confronto e aviso cabem em ${width}px, texto a ${scale * 100}%`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 800 });
      await abrir(page);
      await page.addStyleTag({ content: `html { font-size: ${16 * scale}px !important; }` });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      expect(await page.evaluate(textOverflow)).toEqual([]);
      const notice = (await page.locator('#progressSandboxBanner').boundingBox())!;
      const header = (await page.locator('#mainApp .game-title').boundingBox())!;
      expect(notice.y + notice.height, 'aviso sobre o cabeçalho').toBeLessThanOrEqual(header.y + 1);
      const exit = (await page.getByRole('button', { name: 'Sair da demonstração' }).boundingBox())!;
      expect(exit.height).toBeGreaterThanOrEqual(44);
      expect(exit.x).toBeGreaterThanOrEqual(0);
      expect(exit.x + exit.width).toBeLessThanOrEqual(width + 1);
      const option = (await page.locator('#options .option').first().boundingBox())!;
      expect(option.height).toBeGreaterThanOrEqual(44);
      if (width > 768) {
        const colors = await page.locator('#actionDock .dock-btn').evaluateAll(buttons => buttons.map(btn => getComputedStyle(btn).color));
        expect(new Set(colors).size, 'instrumentos sem identidade de cor').toBeGreaterThanOrEqual(4);
        for (const slot of await page.locator('#equipList .slot-diablo').all()) {
          const box = (await slot.boundingBox())!;
          expect(box.height, 'slot alto em relação aos demais').toBeLessThanOrEqual(59);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      } else {
        const buttons = page.locator('#mobileBottomDock .mdock-btn');
        const colors = await buttons.evaluateAll(items => items.map(btn => getComputedStyle(btn).color));
        expect(new Set(colors).size, 'instrumentos mobile sem identidade de cor').toBeGreaterThanOrEqual(4);
        for (const button of await buttons.all()) {
          const box = (await button.boundingBox())!;
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(await button.locator('.mdock-label').evaluate(el => {
            const parent = el.parentElement!.getBoundingClientRect();
            const range = document.createRange(); range.selectNodeContents(el);
            return [...range.getClientRects()].every(box => box.left >= parent.left && box.right <= parent.right);
          }), 'rótulo do dock mobile cortado').toBe(true);
        }
        const menu = page.locator('#mobileMenuBtn');
        await menu.click();
        const popup = page.locator('#mobileProfilePopup');
        await expect(popup).toBeVisible();
        const menuBox = (await popup.boundingBox())!;
        const dockBox = (await page.locator('#mobileBottomDock').boundingBox())!;
        expect(menuBox.y).toBeGreaterThanOrEqual(0);
        expect(menuBox.y + menuBox.height, 'menu coberto pelo dock').toBeLessThanOrEqual(dockBox.y + 1);
        expect(await page.evaluate(textOverflow, '#mobileProfilePopup')).toEqual([]);
        await page.keyboard.press('Escape');
        await expect(popup).toBeHidden();
        await expect(menu).toBeFocused();
      }
      await info.attach('confronto-lumen', { body: await page.screenshot({ fullPage: true, animations: 'disabled' }), contentType: 'image/png' });
    });
  }
}
