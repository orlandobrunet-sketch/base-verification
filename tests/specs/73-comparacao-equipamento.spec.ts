import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/** Comparação de equipamento: leitura, decisão, foco e venda fora da Forja. */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const ATUAL = { n: 'Orbe da Cistatina', rar: 'epic', atk: 2, def: 2, kno: 6, luck: 2 };
const NOVO = { n: 'Amuleto do Rim Imortal', rar: 'legendary', atk: 4, def: 4, kno: 9, luck: 5 };

async function abrir(page: Page, largura = 1280, novo = NOVO) {
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
  }, { atual: ATUAL, novo });
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('compara os atributos em linhas e identifica as consequências das escolhas', async ({ page }) => {
  await abrir(page);
  const dialogo = page.getByRole('dialog', { name: 'Escolha sua relíquia' });
  await expect(dialogo).toHaveAttribute('aria-modal', 'true');
  await expect(dialogo.locator('.nqec-verdict')).toContainText('Ele é melhor nos quatro atributos.');
  await expect(dialogo.locator('.nqec-new')).toContainText('Amuleto do Rim Imortal');
  await expect(dialogo.locator('.nqec-new')).toContainText('Lendário');
  await expect(dialogo.locator('.nqec-comparison tbody tr')).toHaveCount(4);
  await expect(dialogo.locator('.nqec-comparison tbody tr').first()).toContainText('+2');
  await expect(page.getByRole('button', { name: 'Equipar novo: Amuleto do Rim Imortal; vender Orbe da Cistatina por 150 de ouro' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Manter atual: Orbe da Cistatina; vender Amuleto do Rim Imortal por 300 de ouro' })).toBeVisible();
});

test('a comparação mantém perdas e empates explícitos', async ({ page }) => {
  await abrir(page, 1280, { ...NOVO, atk: 1, def: 2 });
  const linhas = page.locator('.nqec-comparison tbody tr');
  await expect(linhas.nth(0).locator('td').last()).toHaveText('-1');
  await expect(linhas.nth(1).locator('td').last()).toHaveText('0');
  await expect(page.locator('.nqec-verdict')).toContainText('melhor em 2 e pior em 1');
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
  await page.getByRole('button', { name: /^Manter atual: Orbe da Cistatina/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => (0, eval)('state.gold'))).toBe(400);
  expect(await page.evaluate(() => (0, eval)('state.equipment.relic.n'))).toBe('Orbe da Cistatina');
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});

test('equipar troca o item e vende o atual', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: /^Equipar novo: Amuleto/ }).click();
  expect(await page.evaluate(() => (0, eval)('state.gold'))).toBe(250);
  expect(await page.evaluate(() => (0, eval)('state.equipment.relic.n'))).toBe('Amuleto do Rim Imortal');
});

for (const largura of [320, 390]) {
  test(`cabe em ${largura}px com texto a 200% e mantém contraste`, async ({ page }) => {
    await abrir(page, largura);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const cortados = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button, [role="dialog"] p, [role="dialog"] h2, [role="dialog"] .nqec-item')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1); })
      .map(el => (el.textContent || '').trim().slice(0, 40)));
    expect(cortados, 'elementos cortados na lateral').toEqual([]);
    for (const botao of await page.getByRole('dialog').getByRole('button').all()) {
      const caixa = (await botao.boundingBox())!;
      expect(caixa.height).toBeGreaterThanOrEqual(44);
      expect(caixa.y).toBeGreaterThanOrEqual(0);
      expect(caixa.y + caixa.height, 'escolha sempre visível').toBeLessThanOrEqual(700);
    }
    const leitura = page.getByRole('region', { name: 'Comparação dos equipamentos' });
    await leitura.focus();
    await page.keyboard.press('End');
    await expect.poll(() => leitura.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || (a.effect as any)?.getTiming?.().iterations === Infinity));
    const falhas = await page.evaluate(medirContraste, '#equipCompareOverlay [role="dialog"]');
    expect(falhas, JSON.stringify(falhas, null, 1)).toEqual([]);
  });
}
