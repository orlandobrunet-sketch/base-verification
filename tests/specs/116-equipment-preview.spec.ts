import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 2, hasTouch: true });
const PREVIEW = '#nqEquipmentPreview';
const HELMET = '#equipList .slot-diablo[data-slot="helmet"]';
const snapshot = (page: Page) => page.evaluate(() => (0, eval)(
  'JSON.stringify({equipment:state.equipment,gold:state.gold,idx:state.idx,current:state.current,used:state.legendaryAbilityUsed})'
));
async function abrir(page: Page) {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => (0, eval)(`state.equipment.helmet={n:'Elmo do Filtrador Supremo',rar:'legendary',atk:2,def:3,kno:4,luck:5};renderHUD()`));
  if ((page.viewportSize()?.width || 1280) <= 768) {
    await page.evaluate(() => (window as any).openMobileDrawer());
    await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);
  }
  await expect(page.locator(HELMET)).toHaveAttribute('role', 'button');
  await page.locator(HELMET).scrollIntoViewIfNeeded();
  return page.locator(PREVIEW);
}
async function dentroDaTela(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const box = (await page.locator(PREVIEW).boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await page.locator(PREVIEW).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
}
async function slotLivre(page: Page) {
  const slot = (await page.locator(HELMET).boundingBox())!;
  const preview = (await page.locator(PREVIEW).boundingBox())!;
  const overlapX = Math.min(slot.x + slot.width, preview.x + preview.width) - Math.max(slot.x, preview.x);
  const overlapY = Math.min(slot.y + slot.height, preview.y + preview.height) - Math.max(slot.y, preview.y);
  expect(overlapX > 0 && overlapY > 0, 'hover não cobre o equipamento que será clicado').toBe(false);
}

test('foco e hover ampliam arte e atributos reais sem equipar ou consumir habilidade', async ({ page }) => {
  const preview = await abrir(page), before = await snapshot(page);
  await page.locator(HELMET).focus();
  await expect(preview).toBeVisible();
  await expect(preview.locator('h3')).toHaveText('Elmo do Filtrador Supremo');
  await expect(preview.locator('.nqe-preview-rarity')).toHaveText('Lendário');
  expect(await preview.locator('dd').allTextContents()).toEqual(['2', '3', '4', '5']);
  await expect.poll(() => preview.locator('img').evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(384);
  const image = await preview.locator('img').evaluate(el => ({
    source: (el as HTMLImageElement).naturalWidth,
    display: el.getBoundingClientRect().width,
    ratio: devicePixelRatio,
  }));
  expect(image.source).toBeGreaterThanOrEqual(image.display * image.ratio);
  await expect(page.locator('.item-tooltip:visible')).toHaveCount(0);
  await dentroDaTela(page);
  await slotLivre(page);
  await page.keyboard.press('Escape');
  await expect(preview).toBeHidden();
  // Eventos de filhos dentro do mesmo slot não desfazem o descarte por Escape.
  await page.locator(HELMET + ' img').dispatchEvent('pointerover', { pointerType: 'mouse' });
  await expect(preview).toBeHidden();
  await page.locator(HELMET).dispatchEvent('pointerout', { relatedTarget: null });
  await page.locator(HELMET + ' img').dispatchEvent('pointerover', { pointerType: 'mouse' });
  await expect(preview).toBeVisible();
  await preview.hover();
  await expect(preview).toBeVisible();
  expect(await snapshot(page)).toBe(before);
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + '/equipment-' + test.info().project.name + '-2x.png' });
});

test('Enter e Espaço fixam detalhes; Escape e fechar devolvem foco sem avançar a questão', async ({ page }) => {
  const preview = await abrir(page), before = await snapshot(page);
  await page.locator(HELMET).focus();
  for (const key of ['Enter', 'Space']) {
    await page.keyboard.press(key);
    await expect(preview).toHaveAttribute('role', 'dialog');
    const close = preview.getByRole('button', { name: 'Fechar detalhes do equipamento' });
    await expect(close).toBeFocused();
    expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
    await expect(page.locator(HELMET)).toBeFocused();
  }
  await page.locator(HELMET).click();
  await preview.getByRole('button', { name: 'Fechar detalhes do equipamento' }).click();
  await expect(preview).toBeHidden();
  await expect(page.locator(HELMET)).toBeFocused();
  await page.locator(HELMET + ' img').dispatchEvent('pointerover', { pointerType: 'mouse' });
  await expect(preview).toBeHidden();
  expect(await snapshot(page)).toBe(before);
});

test('rerender, stun, troca de tela e drawer fechado não deixam foco num preview oculto', async ({ page }) => {
  const preview = await abrir(page);
  await page.locator(HELMET).focus();
  await page.evaluate(() => (0, eval)('renderHUD()'));
  await expect(page.locator(HELMET)).toBeFocused();
  await page.keyboard.press('Enter');
  await page.evaluate(() => (0, eval)('renderHUD()'));
  await expect(preview).toBeHidden();
  await expect(page.locator(HELMET)).toBeFocused();
  await page.keyboard.press('Enter'); await page.keyboard.press('Escape');
  await page.evaluate(() => (0, eval)('renderHUD()'));
  await expect(page.locator(HELMET)).toBeFocused();
  await page.locator(HELMET + ' img').dispatchEvent('pointerover', { pointerType: 'mouse' });
  await expect(preview).toBeHidden();
  const before = await snapshot(page); await page.keyboard.press('Enter');
  await expect(preview).toBeVisible(); expect(await snapshot(page)).toBe(before);
  await page.evaluate(() => document.body.classList.add('boss-stun-active'));
  await expect(preview).toBeHidden();
  expect(await page.evaluate(() => !document.activeElement?.closest('#nqEquipmentPreview'))).toBe(true);
  await page.locator(HELMET).focus(); await expect(preview).toBeHidden();
  await page.evaluate(() => document.body.classList.remove('boss-stun-active'));
  await page.locator(HELMET).dispatchEvent('click');
  await expect(preview).toBeVisible();
  if ((page.viewportSize()?.width || 1280) <= 768) {
    await page.locator('.drawer-close-btn').dispatchEvent('click');
  } else {
    await page.evaluate(() => (window as any).goToWelcomeFromGame());
  }
  await expect(preview).toBeHidden();
  expect(await page.evaluate(() => !document.activeElement?.closest('#nqEquipmentPreview'))).toBe(true);
});

for (const width of [320, 390]) {
test(`toque e texto a 200% em ${width}px mantêm leitura, enquadro e ações fora do preview`, async ({ page }) => {
  await page.setViewportSize({ width, height: 700 });
  const preview = await abrir(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.locator(HELMET).scrollIntoViewIfNeeded();
  const before = await snapshot(page);
  await page.locator(HELMET).focus();
  await expect(preview).toHaveAttribute('role', 'tooltip');
  await slotLivre(page);
  await page.locator(HELMET).tap();
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('role', 'dialog');
  await expect(preview).toHaveAttribute('data-pinned', 'true');
  await dentroDaTela(page);
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({ path: process.env.NQ_CAPTURE_DIR + `/equipment-${width}-${test.info().project.name}-200.png` });
  expect(await preview.locator('.nqe-preview-desc').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(28);
  // O preview não oferece botão de equipar ou ativar; apenas fechar.
  expect(await preview.locator('button').allTextContents()).toEqual(['×']);
  await preview.locator('.nqe-preview-desc').dispatchEvent('touchstart', {
    touches: [{ identifier: 1, clientX: 200, clientY: 300 }],
  });
  await preview.locator('.nqe-preview-desc').dispatchEvent('touchend', {
    changedTouches: [{ identifier: 1, clientX: 80, clientY: 310 }],
  });
  await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);
  await expect(preview).toBeVisible();
  expect(await snapshot(page)).toBe(before);
  await preview.evaluate(el => { el.scrollTop = el.scrollHeight; });
  const close = preview.getByRole('button', { name: 'Fechar detalhes do equipamento' });
  await expect(close).toBeVisible();
  expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await close.tap();
  await expect(preview).toBeHidden();
  // Slot vazio usa a arte inicial e declara explicitamente os bônus ausentes.
  await page.locator('#equipList .slot-diablo.starter').first().scrollIntoViewIfNeeded();
  await page.locator('#equipList .slot-diablo.starter').first().tap();
  await expect(preview.locator('.nqe-preview-rarity')).toHaveText('Inicial · sem bônus');
  expect(await preview.locator('dd').allTextContents()).toEqual(['0', '0', '0', '0']);
  await dentroDaTela(page);
});
}

test('ampliar o texto com detalhes já abertos conserva enquadro e fechamento por toque', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const preview = await abrir(page), before = await snapshot(page);
  await page.locator(HELMET).tap();
  await expect(preview).toHaveAttribute('role', 'dialog');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await expect.poll(async () => {
    const box = (await preview.boundingBox())!;
    const viewport = page.viewportSize()!;
    return Math.max(-box.x, -box.y, box.x + box.width - viewport.width, box.y + box.height - viewport.height);
  }).toBeLessThanOrEqual(1);
  await dentroDaTela(page);
  await preview.getByRole('button', { name: 'Fechar detalhes do equipamento' }).tap();
  await expect(preview).toBeHidden();
  expect(await snapshot(page)).toBe(before);
});

test('texto e URL de item são tratados como dados; diálogo modal tem prioridade', async ({ page }) => {
  const preview = await abrir(page);
  await page.evaluate(() => {
    const source = document.querySelector('#equipList .slot-diablo[data-slot="helmet"] [data-item-name]')!;
    source.setAttribute('data-item-name', '<img src=x onerror=alert(1)>');
    source.setAttribute('data-item-desc', '<script>alert(2)</script>');
    source.setAttribute('data-item-atk', '<svg>');
    source.setAttribute('data-item-img', 'https://example.invalid/untrusted.png');
  });
  await page.locator(HELMET).click();
  await expect(preview.locator('h3')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(preview.locator('.nqe-preview-desc')).toHaveText('<script>alert(2)</script>');
  await expect(preview.locator('img, script, svg')).toHaveCount(0);
  expect((await preview.locator('dd').allTextContents())[0]).toBe('—');
  await page.evaluate(() => {
    const modal = document.createElement('section');
    modal.id = 'equipmentPriorityTest';
    modal.setAttribute('aria-modal', 'true');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:10px;height:10px';
    document.body.append(modal);
  });
  await expect(preview).toBeHidden();
  await page.locator(HELMET).focus(); await expect(preview).toBeHidden();
  await page.evaluate(() => document.getElementById('equipmentPriorityTest')!.remove());
  await page.locator(HELMET).dispatchEvent('click');
  await expect(preview).toBeVisible();
  // Exclui coexistência com a dica independente dos atributos totais.
  await page.locator('#equipList .stat-badge').first().focus();
  await expect(preview).toBeHidden();
  await expect(page.locator('.stat-tip-floating')).toBeVisible();
});

test('modal legado preexistente aberto por classe ou estilo encerra e bloqueia detalhes', async ({ page }) => {
  const preview = await abrir(page), before = await snapshot(page);
  for (const kind of ['class', 'style']) {
    await page.evaluate(kind => {
      const host = document.createElement('div');
      host.id = 'equipmentExistingModalHost';
      const modal = document.createElement('section');
      modal.id = 'equipmentExistingModal';
      modal.className = kind === 'class' ? 'modal' : 'modalWrap';
      modal.hidden = true;
      modal.style.cssText = 'position:fixed;top:0;left:0;width:10px;height:10px;opacity:1;visibility:visible;pointer-events:none';
      if (kind === 'style') modal.style.display = 'none';
      host.append(modal);
      document.body.append(host);
    }, kind);
    await page.locator(HELMET).dispatchEvent('click');
    await expect(preview).toBeVisible();
    // O mesmo nó já está no DOM, sem aria-modal; muda apenas sua apresentação.
    await page.evaluate(kind => {
      const modal = document.getElementById('equipmentExistingModal')!;
      modal.hidden = false;
      if (kind === 'class') modal.classList.add('show');
      else modal.style.display = 'block';
    }, kind);
    await expect(preview).toBeHidden();
    await page.locator(HELMET).focus();
    await page.keyboard.press('Enter');
    await expect(preview).toBeHidden();
    await page.evaluate(() => document.getElementById('equipmentExistingModalHost')!.remove());
  }
  expect(await snapshot(page)).toBe(before);
});

async function equiparArtesDetalhadas(page: Page) {
  await page.evaluate(() => (0, eval)(`
    state.equipment.armor={n:'Égide Dialítica',rar:'epic',atk:1,def:4,kno:2,luck:0};
    state.equipment.relic={n:'Sigilo KDIGO',rar:'legendary',atk:0,def:1,kno:5,luck:2};
    state.equipment.helmet={n:'Máscara N95',rar:'rare',atk:0,def:3,kno:0,luck:1};
    renderHUD();
  `));
}

test('fonte atual suficiente conserva as miniaturas sem baixar masters no HUD ou preview', async ({ page }) => {
  const detailRequests: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.includes('/assets/items/detail/')) detailRequests.push(request.url());
  });
  const preview = await abrir(page);
  await equiparArtesDetalhadas(page);
  const before = await snapshot(page);
  const slot = page.locator('#equipList .slot-diablo[data-slot="relic"]');
  await slot.scrollIntoViewIfNeeded();
  await slot.tap();
  await expect(preview.locator('img')).toBeVisible();
  await expect.poll(() => preview.locator('img').evaluate(el => (el as HTMLImageElement).currentSrc))
    .toMatch(/\/assets\/items\/sigilo_kdigo\.png$/);
  expect(detailRequests).toEqual([]);
  expect(await snapshot(page)).toBe(before);
});

test.describe('arte em alta densidade', () => {
  test.use({ deviceScaleFactor: 3 });

  test('masters só abrem na inspeção; texto a 200% e N95 conservam arte e estado', async ({ page }) => {
    const detailRequests: string[] = [];
    page.on('request', request => {
      if (new URL(request.url()).pathname.includes('/assets/items/detail/')) detailRequests.push(request.url());
    });
    const preview = await abrir(page);
    await equiparArtesDetalhadas(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const before = await snapshot(page);
    expect(detailRequests).toEqual([]);
    for (const [key, file] of [['armor', 'egide_dialitica'], ['relic', 'sigilo_kdigo'], ['helmet', 'mascara_n95']]) {
      const slot = page.locator(`#equipList .slot-diablo[data-slot="${key}"]`);
      await slot.scrollIntoViewIfNeeded();
      const thumbnail = slot.locator('img');
      await expect(thumbnail).toHaveCSS('object-fit', 'contain');
      await slot.tap();
      const image = preview.locator('img');
      await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).currentSrc))
        .toMatch(new RegExp(`/assets/items/detail/${file}-1024\\.png$`));
      const pixels = await image.evaluate(async el => {
        const selected = new Image();
        selected.src = (el as HTMLImageElement).currentSrc;
        await selected.decode();
        return { source: selected.naturalWidth, display: el.getBoundingClientRect().width, ratio: devicePixelRatio };
      });
      expect(pixels.source).toBe(1024);
      expect(pixels.source).toBeGreaterThanOrEqual(pixels.display * pixels.ratio);
      await expect(image).toHaveCSS('object-fit', 'contain');
      if (key === 'helmet') {
        await expect(thumbnail).toHaveCSS('padding-top', '2px');
        await expect(image).toHaveCSS('padding-top', '4px');
      }
      await dentroDaTela(page);
      expect(await snapshot(page)).toBe(before);
      if (process.env.NQ_CAPTURE_DIR) await page.screenshot({
        path: process.env.NQ_CAPTURE_DIR + `/equipment-${file}-${test.info().project.name}-dpr3-200.png`,
      });
      await preview.getByRole('button', { name: 'Fechar detalhes do equipamento' }).tap();
      await expect(preview).toBeHidden();
    }
    expect(new Set(detailRequests.map(url => new URL(url).pathname)).size).toBe(3);
    expect(await snapshot(page)).toBe(before);
  });

  test('falha do master recupera a fonte atual sem perder a identidade ou alterar o jogo', async ({ page }) => {
    const preview = await abrir(page);
    await equiparArtesDetalhadas(page);
    const before = await snapshot(page);
    let attempted = 0;
    await page.route('**/assets/items/detail/*', route => { attempted++; return route.abort(); });
    const slot = page.locator('#equipList .slot-diablo[data-slot="relic"]');
    await slot.scrollIntoViewIfNeeded();
    await slot.tap();
    await expect(preview.locator('h3')).toHaveText('Sigilo KDIGO');
    const image = preview.locator('img');
    await expect.poll(() => attempted).toBe(1);
    await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).currentSrc))
      .toMatch(/\/assets\/items\/sigilo_kdigo\.png$/);
    await expect(image).not.toHaveAttribute('srcset');
    // naturalWidth do elemento é corrigido pela densidade do candidato de
    // srcset; o decode independente mede os pixels da fonte recuperada.
    expect(await image.evaluate(async el => {
      const recovered = new Image();
      recovered.src = (el as HTMLImageElement).currentSrc;
      await recovered.decode();
      return recovered.naturalWidth;
    })).toBe(384);
    await expect(image).toHaveAttribute('alt', 'Sigilo KDIGO');
    await dentroDaTela(page);
    expect(await snapshot(page)).toBe(before);
  });
});
