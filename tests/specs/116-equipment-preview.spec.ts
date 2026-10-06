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
  const box = (await page.locator(PREVIEW).boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await page.locator(PREVIEW).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
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

test('toque e texto a 200% em 320px mantêm leitura, enquadro e ações fora do preview', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const preview = await abrir(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.locator(HELMET).scrollIntoViewIfNeeded();
  const before = await snapshot(page);
  await page.locator(HELMET).tap();
  await expect(preview).toBeVisible();
  await dentroDaTela(page);
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
  await preview.getByRole('button', { name: 'Fechar detalhes do equipamento' }).click();
  await expect(preview).toBeHidden();
  // Slot vazio usa a arte inicial e declara explicitamente os bônus ausentes.
  await page.locator('#equipList .slot-diablo.starter').first().scrollIntoViewIfNeeded();
  await page.locator('#equipList .slot-diablo.starter').first().tap();
  await expect(preview.locator('.nqe-preview-rarity')).toHaveText('Inicial · sem bônus');
  expect(await preview.locator('dd').allTextContents()).toEqual(['0', '0', '0', '0']);
  await dentroDaTela(page);
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
  await page.locator('#equipList .stat-badge').first().dispatchEvent('mouseover');
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
