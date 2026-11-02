import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block' });

async function abrirJogo(page: Page, gold = 5000) {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold });
  await page.waitForLoadState('load');
}

async function forjar(page: Page) {
  const botao = page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first();
  await botao.focus();
  await botao.press('Enter');
  await page.getByRole('button', { name: 'Forjar item aleatório' }).click();
  const resultado = page.locator('#forjaResultado');
  await expect(resultado.getByRole('heading', { name: 'Forja concluída' })).toBeVisible();
  return resultado;
}

test('a forja martela antes de mostrar o item, só uma vez', async ({ page }) => {
  await abrirJogo(page);
  const resultado = await forjar(page);
  await expect(resultado).toHaveClass(/nq-forja-recem/);
  expect(await resultado.locator('.nq-forja-arte').evaluate(e => getComputedStyle(e).animationName)).toBe('nq-forja-golpe');
  await page.getByRole('button', { name: 'Forjar outro item' }).click();
  await expect(page.locator('#forjaResultado')).not.toHaveClass(/nq-forja-recem/);
});

test('com movimento reduzido a forja mostra o item sem martelada', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await abrirJogo(page);
  const resultado = await forjar(page);
  expect(await resultado.locator('.nq-forja-arte').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
});

test('na vitória, Compartilhar vem logo depois de Continuar e com o mesmo peso', async ({ page }) => {
  await abrirJogo(page, 800);
  await page.evaluate(() => (0, eval)('state.score=25000;state.level=15;state.correctTotal=100;state.gameCompleted=true;showGameCompletionModal();'));
  const card = page.getByRole('dialog', { name: 'Jornada concluída', exact: true });
  await expect(card).toBeVisible();
  const caixa = async (nome: string) => (await card.getByRole('button', { name: nome, exact: true }).boundingBox())!;
  const continuar = await caixa('Continuar jogando');
  const compartilhar = await caixa('Compartilhar');
  const voltar = await caixa('Voltar à tela inicial');
  expect(compartilhar.y).toBeGreaterThan(continuar.y);
  expect(compartilhar.y).toBeLessThan(voltar.y);
  expect(Math.abs(compartilhar.width - continuar.width)).toBeLessThanOrEqual(1);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
  });
  await card.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  await expect(card.locator('.nqvictory-share')).toHaveText('Copiado');
});
