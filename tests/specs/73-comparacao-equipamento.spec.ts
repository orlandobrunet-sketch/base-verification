import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * Comparação de equipamento fora da Forja (baú de equipamento, minigame).
 *
 * Mesmo defeito que o proprietário apontou na Forja: os dois cartões tinham o
 * mesmo peso e os botões diziam "SUBSTITUIR" / "MANTER ATUAL", sem nomes. E a
 * sobreposição não era diálogo: sem papel, sem foco inicial, e o Tab escapava
 * para a jornada por trás.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const ATUAL = { n: 'Orbe da Cistatina', rar: 'epic', atk: 2, def: 2, kno: 6, luck: 2 };
const NOVO = { n: 'Amuleto do Rim Imortal', rar: 'legendary', atk: 4, def: 4, kno: 9, luck: 5 };

async function abrir(page: Page, largura = 1280) {
  await page.setViewportSize({ width: largura, height: largura < 500 ? 700 : 800 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 100 });
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
  await page.evaluate(({ atual, novo }) => {
    (0, eval)(`state.equipment.relic = ${JSON.stringify(atual)}`);
    (0, eval)(`equipOrSell('relic', ${JSON.stringify(novo)}, () => {})`);
  }, { atual: ATUAL, novo: NOVO });
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('o recém-obtido é evidente e os botões dizem os nomes', async ({ page }) => {
  await abrir(page);
  const dialogo = page.getByRole('dialog', { name: 'Você obteve Amuleto do Rim Imortal' });
  await expect(dialogo).toHaveAttribute('aria-modal', 'true');
  await expect(dialogo.locator('#ecpResumo')).toContainText('Ele é melhor nos quatro atributos.');
  const cartoes = dialogo.locator('.nq-forja-item');
  await expect(cartoes.first()).toHaveClass(/nq-forja-item-novo/);
  await expect(cartoes.first().locator('.nq-forja-selo')).toHaveText('Novo');
  await expect(page.getByRole('button', { name: 'Equipar Amuleto do Rim Imortal Orbe da Cistatina vira 150 de ouro' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Manter Orbe da Cistatina Amuleto do Rim Imortal vira 300 de ouro' })).toBeVisible();
});

test('o foco fica no diálogo e a decisão não some com Escape', async ({ page }) => {
  await abrir(page);
  for (const tecla of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
    await page.keyboard.press(tecla);
    expect(await page.getByRole('dialog').evaluate(el => el.contains(document.activeElement)), `foco escapou com ${tecla}`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('manter vende o novo, e o foco volta a quem estava antes', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: /^Manter Orbe da Cistatina/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => (0, eval)('state.gold'))).toBe(400);
  expect(await page.evaluate(() => (0, eval)('state.equipment.relic.n'))).toBe('Orbe da Cistatina');
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});

test('equipar troca o item e vende o atual', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: /^Equipar Amuleto/ }).click();
  expect(await page.evaluate(() => (0, eval)('state.gold'))).toBe(250);
  expect(await page.evaluate(() => (0, eval)('state.equipment.relic.n'))).toBe('Amuleto do Rim Imortal');
});

for (const largura of [320, 390]) {
  test(`cabe em ${largura}px com texto a 200% e mantém contraste`, async ({ page }) => {
    await abrir(page, largura);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const cortados = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button, [role="dialog"] p, [role="dialog"] h2, [role="dialog"] .nq-forja-item')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1); })
      .map(el => (el.textContent || '').trim().slice(0, 40)));
    expect(cortados, 'elementos cortados na lateral').toEqual([]);
    for (const botao of await page.getByRole('dialog').getByRole('button').all()) {
      expect((await botao.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || (a.effect as any)?.getTiming?.().iterations === Infinity));
    const falhas = await page.evaluate(medirContraste, '#equipCompareOverlay [role="dialog"]');
    expect(falhas, JSON.stringify(falhas, null, 1)).toEqual([]);
  });
}
