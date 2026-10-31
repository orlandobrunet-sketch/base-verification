import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block' });

const ARTE = 'assets/classes-cinema/clerigo_renal/nivel_08.webp';

async function abrir(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { character: 'nephros' });
  await page.waitForLoadState('load');
}

const evoluir = (page: Page, nivel: number, arte = ARTE) => page.evaluate(([n, a]) =>
  (0, eval)(`showEvolutionPopup(${n}, 'Mestre das Glomerulopatias', ${JSON.stringify(a)})`), [nivel, arte]);

const artigo = (raridade: string) => ({ titulo: 'Estudo fictício', ano: 2026, autores: 'Autoria fictícia', jornal: 'Revista fictícia',
  resumo: 'Resumo.', conclusao: 'Conclusão.', curiosidade: 'Curiosidade.', impacto: 'Impacto.', raridade });
const abrirPergaminho = (page: Page, raridade: string) => page.evaluate(a =>
  (0, eval)(`showChestModal(${JSON.stringify(a)}, 2, 50)`), artigo(raridade));

test('evolução ocupa a tela e compara com a arte anterior', async ({ page }) => {
  await abrir(page, { width: 1280, height: 720 });
  await evoluir(page, 8);
  const tela = page.locator('.evolution-popup');
  const caixa = (await tela.boundingBox())!;
  expect([caixa.x, caixa.y, caixa.width, caixa.height]).toEqual([0, 0, 1280, 720]);

  const antes = page.locator('.nqevo-antes img');
  await expect(antes).toHaveAttribute('src', /nivel_07\.webp/);
  await expect(page.locator('.nqevo-art img')).toHaveAttribute('src', /nivel_08\.webp/);
  await expect.poll(() => antes.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.nqevo-antes figcaption')).toHaveText('Antes');

  await expect.poll(async () => (await page.locator('.nqevo-art').boundingBox())!.height).toBeGreaterThan(300);
  const continuar = (await page.getByRole('button', { name: 'Continuar' }).boundingBox())!;
  expect(continuar.y + continuar.height).toBeLessThanOrEqual(720);
});

test('depois do nível 10 a arte não muda, então não há "antes"', async ({ page }) => {
  await abrir(page, { width: 1280, height: 720 });
  await evoluir(page, 11, 'assets/classes-cinema/clerigo_renal/nivel_10.webp');
  await expect(page.locator('.nqevo-art img')).toBeVisible();
  await expect(page.locator('.nqevo-antes')).toHaveCount(0);
});

for (const largura of [320, 390]) {
  test(`evolução cabe no celular a ${largura} px`, async ({ page }) => {
    await abrir(page, { width: largura, height: 700 });
    await evoluir(page, 8);
    await expect(page.locator('.nqevo-antes img')).toBeVisible();
    await expect.poll(async () => (await page.locator('.nqevo-art').boundingBox())!.height).toBeGreaterThan(150);
    // Antes e depois lado a lado, com a arte nova inteira antes do botão.
    const antes = (await page.locator('.nqevo-antes').boundingBox())!;
    const arte = (await page.locator('.nqevo-art').boundingBox())!;
    const continuar = (await page.getByRole('button', { name: 'Continuar' }).boundingBox())!;
    expect(arte.x).toBeGreaterThanOrEqual(antes.x + antes.width);
    expect(arte.width).toBeGreaterThan(antes.width);
    expect(arte.y + arte.height).toBeLessThanOrEqual(continuar.y);
    expect(continuar.y + continuar.height).toBeLessThanOrEqual(700);
    const leitura = page.locator('.nqevo-reading');
    expect(await leitura.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  });
}

test('o pergaminho revela o selo, a raridade e só então o texto', async ({ page }) => {
  await abrir(page, { width: 1280, height: 720 });
  await abrirPergaminho(page, 'lendário');
  const atraso = (seletor: string) => page.locator(seletor).evaluate(el => parseFloat(getComputedStyle(el).animationDelay));
  const raridade = await atraso('#chestModal .nqscroll-rarity');
  const titulo = await atraso('#chestModal .nqscroll-identity');
  const texto = await atraso('#chestModal .nqscroll-sections');
  expect(raridade).toBeGreaterThan(0);
  expect(titulo).toBeGreaterThan(raridade);
  expect(texto).toBeGreaterThan(titulo);
  await expect(page.locator('#chestRarity')).toHaveText('Lendário');
  expect(await page.locator('#chestRarity').evaluate(el => getComputedStyle(el).boxShadow)).not.toBe('none');
  await expect(page.locator('#chestModal .nqscroll-sections')).toHaveCSS('opacity', '1', { timeout: 4_000 });
});

test('a raridade comum não ganha brilho', async ({ page }) => {
  await abrir(page, { width: 1280, height: 720 });
  await abrirPergaminho(page, 'comum');
  expect(await page.locator('#chestRarity').evaluate(el => getComputedStyle(el).boxShadow)).toBe('none');
});

test.describe('movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('pergaminho e evolução aparecem de uma vez', async ({ page }) => {
    await abrir(page, { width: 1280, height: 720 });
    await abrirPergaminho(page, 'lendário');
    expect(await page.locator('#chestModal .nqscroll-sections').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    await page.evaluate(() => (0, eval)('closeChestModal()'));
    await evoluir(page, 8);
    expect(await page.locator('.nqevo-art').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  });
});

for (const largura of [320, 390, 1280]) {
  test(`Pedra do Julgamento a ${largura} px: cenário, contagem forte e dois botões grandes`, async ({ page }) => {
    await abrir(page, { width: largura, height: 800 });
    await page.evaluate(() => (window as any).showRapidQuizMinigame(true));
    const verdadeiro = page.locator('#mgTrue');
    const falso = page.locator('#mgFalse');
    await expect(verdadeiro).toBeVisible();
    const v = (await verdadeiro.boundingBox())!;
    const f = (await falso.boundingBox())!;
    expect(v.y).toBe(f.y);
    expect(v.height).toBeGreaterThanOrEqual(90);
    expect(f.x).toBeGreaterThanOrEqual(v.x + v.width);
    expect(await page.locator('#mgRelogio').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(32);
    const cabecalho = (await page.locator('.nq-exam-cabecalho').boundingBox())!;
    const cartao = (await page.locator('.nq-exam-questao').boundingBox())!;
    expect(Math.abs(cabecalho.width - cartao.width)).toBeLessThanOrEqual(1);
    expect(await page.locator('#rapidQuizPage').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('bg-hall.jpg');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('a tecla V responde e a escolha aparece no botão grande', async ({ page }) => {
  await abrir(page, { width: 1280, height: 800 });
  await page.evaluate(() => (window as any).showRapidQuizMinigame(true));
  await expect(page.locator('#mgTrue')).toBeVisible();
  await page.keyboard.press('v');
  await expect(page.locator('#mgFeedback')).toBeVisible();
  await expect(page.locator('#mgTrue')).toBeDisabled();
  await expect(page.locator('#mgProxima')).toBeFocused();
});
