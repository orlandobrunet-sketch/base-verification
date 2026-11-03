import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block' });

async function abrirJogo(page: Page, largura: number, altura: number, estado: Record<string, unknown> = {}) {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.setViewportSize({ width: largura, height: altura });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, estado);
  await expect(page.locator('#question')).not.toBeEmpty({ timeout: 20_000 });
}

test('vidas e sequência ficam logo abaixo do retrato, à vista em 720p', async ({ page }) => {
  await abrirJogo(page, 1280, 720, { lives: 4, streak: 5 });
  const vidas = (await page.locator('#lives').boundingBox())!;
  const sequencia = (await page.locator('#streak').boundingBox())!;
  const retrato = (await page.locator('#mainApp .portrait-frame').boundingBox())!;
  const nivel = (await page.locator('#guardianLevelLabel').boundingBox())!;
  for (const caixa of [vidas, sequencia]) {
    expect(caixa.y).toBeGreaterThanOrEqual(retrato.y + retrato.height);
    expect(caixa.y + caixa.height).toBeLessThanOrEqual(nivel.y);
    expect(caixa.y + caixa.height).toBeLessThanOrEqual(720);
  }
  expect(vidas.height).toBeLessThan(32);
  expect(vidas.x + vidas.width).toBeLessThan(sequencia.x);
  await expect(page.locator('.hud .tile:visible')).toHaveCount(6);
  await expect(page.locator('#level')).toBeAttached();
});

test('com letra a 200% as vidas não invadem o nível do herói', async ({ page }) => {
  await abrirJogo(page, 1280, 720, { lives: 5, streak: 12 });
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
  const vidas = (await page.locator('#lives').boundingBox())!;
  const sequencia = (await page.locator('#streak').boundingBox())!;
  const nivel = (await page.locator('#guardianLevelLabel').boundingBox())!;
  expect(vidas.y + vidas.height).toBeLessThanOrEqual(nivel.y + 1);
  expect(vidas.x + vidas.width).toBeLessThanOrEqual(sequencia.x + 1);
});

test('cronômetro desligado é só um ícone, e os números voltam ao ligar', async ({ page }) => {
  await abrirJogo(page, 1280, 720);
  const widget = page.locator('#timerWidget');
  await expect(widget).toHaveClass(/is-zerado/);
  await expect(page.locator('#timerDisplay')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Cronômetro por questão' })).toBeVisible();
  await page.locator('#timerPlayPause').click();
  await expect(widget).not.toHaveClass(/is-zerado/);
  await expect(page.locator('#timerDisplay')).toBeVisible();
  await expect(page.locator('#timerDisplay')).not.toHaveText('00:00', { timeout: 3_000 });
  await page.locator('#timerPlayPause').click();
  await expect(page.locator('#timerDisplay')).toBeVisible();
});

test('o aviso do Oráculo segue o diálogo do jogo e fecha pelo botão', async ({ page }) => {
  await abrirJogo(page, 1280, 720);
  await page.evaluate(() => (0, eval)('openOraculoFromJourney()'));
  const aviso = page.locator('#oracleAnswerFirstPopup .nq-aviso-oraculo');
  await expect(aviso).toBeVisible();
  await expect(aviso.getByRole('heading', { name: 'O Oráculo aguarda' })).toBeVisible();
  await aviso.getByRole('button', { name: 'Vou responder' }).click();
  await expect(page.locator('#oracleAnswerFirstPopup')).toHaveCount(0);
});

test('o portal mostra os três heróis e nenhum rótulo técnico', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/jogar/', { waitUntil: 'load' });
  const herois = page.locator('.nql-portal__heroes img');
  await expect(herois).toHaveCount(3);
  for (let i = 0; i < 3; i++) await expect.poll(() => herois.nth(i).evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('#landingScreen')).not.toContainText(/fluxo clínico|Rota de entrada|ATLAS NQ|NQ \/ ACESSO/i);
  const ultimo = (await page.locator('.nql-portal__heroes li').last().boundingBox())!;
  expect(ultimo.y + ultimo.height).toBeLessThanOrEqual(768);
});

test('atalhos dos temas não quebram texto no celular', async ({ page }) => {
  await abrirJogo(page, 390, 844);
  await page.waitForFunction(() => { try { return typeof (0, eval)('showAxesSelector') === 'function'; } catch { return false; } });
  await page.evaluate(() => (0, eval)('showAxesSelector()'));
  const atalhos = page.locator('.nqs-temas-atalhos .btn');
  await expect(atalhos).toHaveCount(5);
  const alturas = await atalhos.evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
  expect(Math.max(...alturas)).toBeLessThan(60);
  await expect(page.getByRole('button', { name: 'Eletrólitos e ácido-base' })).toBeVisible();
});

test('Biblioteca da home para com as estatísticas logo abaixo do menu', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'load' });
  const link = page.locator('.nav-links a', { hasText: 'Biblioteca' });
  await link.click();
  const estatisticas = page.locator('.proof-ledger');
  await expect.poll(async () => (await estatisticas.boundingBox())!.y).toBeLessThan(140);
  const menu = (await page.locator('.nav-links').boundingBox())!;
  expect((await estatisticas.boundingBox())!.y).toBeGreaterThanOrEqual(menu.y + menu.height);
  await expect(page.locator('#guideline-archive-title')).toBeInViewport();
  await expect(link).toHaveAttribute('aria-current', 'true');
  await page.mouse.wheel(0, 500);
  await expect(link).toHaveAttribute('aria-current', 'true');
});
