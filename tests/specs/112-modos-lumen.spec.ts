import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'chromium', 'Cada cenário fixa sua própria viewport.');
});

async function abrir(page: Page, largura = 390, grande = false) {
  await page.setViewportSize({ width: largura, height: 844 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  if (grande) await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
  const origem = page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first();
  await origem.focus();
  await page.evaluate(() => (window as any).openGameModesPopup());
  const dialogo = page.getByRole('dialog', { name: 'Modos de jogo', exact: true });
  await expect(dialogo).toBeVisible();
  return { dialogo, origem };
}

for (const largura of [320, 390, 1280]) {
  test('Modos de jogo mantém leitura e toque em ' + largura + ' px', async ({ page }) => {
    const { dialogo } = await abrir(page, largura, true);
    await expect(dialogo).toHaveAttribute('aria-modal', 'true');
    await expect(dialogo.getByRole('button', { name: /Modo de Estudo/ })).toBeFocused();
    const falhas = await page.evaluate(medirContraste, '.nqmodes-dialog');
    expect(falhas, JSON.stringify(falhas)).toEqual([]);
    const geometria = await dialogo.evaluate(el => {
      const erros: string[] = [];
      for (const b of el.querySelectorAll('button')) {
        const r = b.getBoundingClientRect();
        if (r.width < 44 || r.height < 44) erros.push('alvo: ' + b.textContent);
      }
      const textos = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = textos.nextNode(); n; n = textos.nextNode()) {
        if (!(n.textContent || '').trim()) continue;
        const g = document.createRange(); g.selectNodeContents(n);
        if ([...g.getClientRects()].some(r => r.width && (r.left < -1 || r.right > innerWidth + 1))) erros.push('texto: ' + n.textContent);
      }
      if (el.scrollWidth > el.clientWidth + 1) erros.push('rolagem horizontal');
      return erros;
    });
    expect(geometria).toEqual([]);
  });
}

test('Tab, Escape e reabertura preservam o foco e o estado da jornada', async ({ page }) => {
  const { dialogo, origem } = await abrir(page);
  const estado = await page.evaluate(() => {
    const s = (window as any).state;
    return JSON.stringify({ score: s.score, lives: s.lives, difficulty: s.difficulty, gold: s.gold, idx: s.idx, correctTotal: s.correctTotal });
  });
  for (let rodada = 0; rodada < 3; rodada++) {
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab');
      expect(await dialogo.evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialogo).not.toBeVisible();
    await expect(origem).toBeFocused();
    expect(await page.evaluate(() => {
      const s = (window as any).state;
      return JSON.stringify({ score: s.score, lives: s.lives, difficulty: s.difficulty, gold: s.gold, idx: s.idx, correctTotal: s.correctTotal });
    })).toBe(estado);
    if (rodada < 2) {
      await page.evaluate(() => (window as any).openGameModesPopup());
      await expect(dialogo).toBeVisible();
      await expect(dialogo.getByRole('button', { name: /Modo de Estudo/ })).toBeFocused();
    }
  }
});

test('fechar pelo botão e tocar o fundo preservam o contrato', async ({ page }) => {
  const { dialogo, origem } = await abrir(page);
  await page.locator('#gameModesOverlay').click({ position: { x: 2, y: 2 } });
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole('button', { name: 'Fechar modos de jogo', exact: true }).click();
  await expect(dialogo).not.toBeVisible();
  await expect(origem).toBeFocused();
});

test('escolher Estudo entrega o foco ao seletor existente', async ({ page }) => {
  const { dialogo } = await abrir(page);
  await dialogo.getByRole('button', { name: /Modo de Estudo/ }).click();
  await expect(dialogo).not.toBeVisible();
  const estudo = page.locator('.study-mode-popup');
  await expect(estudo).toBeVisible();
  expect(await estudo.evaluate(el => el.contains(document.activeElement))).toBe(true);
});
