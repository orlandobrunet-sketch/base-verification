import { test, expect, type Page } from '@playwright/test';
import { injectGameState, injectBossState } from '../helpers/game';

test.use({ serviceWorkers: 'block' });

const CELULAR = { width: 390, height: 844 };
const NOTEBOOK = { width: 1280, height: 720 };

async function abrir(page: Page, viewport: { width: number; height: number }, overrides: Record<string, unknown> = {}) {
  await page.setViewportSize(viewport);
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 130, character: 'nephros', ...overrides });
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
}

const alternativaCerta = (page: Page) => page.evaluate(() => (0, eval)('state.current.a') as number);
const noQuadro = (page: Page, seletor: string) => page.locator(seletor).evaluate(el => {
  const r = el.getBoundingClientRect();
  return r.top >= 0 && r.bottom <= innerHeight;
});

async function perder(page: Page) {
  await page.evaluate(() => (0, eval)(`state.lives = 1;
    const errada = (state.current.a + 1) % state.current.o.length;
    answer(errada, document.querySelectorAll('#options .option')[errada]);`));
  await expect(page.locator('#defeatScreen')).toBeVisible();
}

test('celular: Próxima fica à mão e a faixa acompanha a rolagem', async ({ page }) => {
  await abrir(page, CELULAR);
  const faixa = page.locator('#mobileStatusBar');
  await expect(faixa).toBeVisible();
  await expect(page.locator('#msbCorrect')).toHaveText('15/100');
  await expect(page.locator('#msbLivesIcons')).toBeVisible();

  await page.locator('#options .option').nth(await alternativaCerta(page)).click();
  await expect(page.locator('#nextBtn')).toBeVisible();
  await expect.poll(() => noQuadro(page, '#nextBtn')).toBe(true);
  // A barra inferior continua ali para o Oráculo, sem cobrir o botão.
  const proxima = (await page.locator('#nextBtn').boundingBox())!;
  const barra = (await page.locator('#mobileBottomDock').boundingBox())!;
  expect(proxima.y + proxima.height).toBeLessThanOrEqual(barra.y);

  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => faixa.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(0);

  await page.locator('#nextBtn').click();
  await expect(page.locator('#nextBtn')).toBeHidden();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('notebook: explicação à vista, Próxima no painel e atalhos de teclado', async ({ page }) => {
  await abrir(page, NOTEBOOK);
  await expect(page.locator('#mobileStatusBar')).toBeVisible();
  await expect(page.locator('#msbGold')).toBeVisible();

  await page.keyboard.press(String(await alternativaCerta(page) + 1));
  await expect(page.locator('#nextBtn')).toBeVisible();
  await expect.poll(() => noQuadro(page, '#feedback .nql-answer-result')).toBe(true);
  await expect.poll(() => noQuadro(page, '#dockNextBtn')).toBe(true);
  await expect.poll(() => noQuadro(page, '#mobileStatusBar')).toBe(true);

  await page.waitForTimeout(750); // o guarda do Enter segura o repique do reflexo
  await page.keyboard.press('Enter');
  await expect(page.locator('#nextBtn')).toBeHidden();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('progresso mostra a meta de 100 acertos e o próximo selo', async ({ page }) => {
  await abrir(page, NOTEBOOK);
  await expect(page.locator('#questionCounterTxt')).toHaveText('15/100 acertos · selo aos 20');
});

test('derrota de convidado mostra o resumo antes do ranking', async ({ page }) => {
  await abrir(page, NOTEBOOK);
  await perder(page);
  const tela = page.getByRole('dialog', { name: 'As vidas acabaram' });
  await expect(tela).toContainText('15 de 100 acertos');
  await expect(tela).toContainText('Faltaram 5 para o selo Vórtice do Néfron');
  await expect(tela.getByRole('button', { name: 'Tentar de novo' })).toBeFocused();
  await expect(page.locator('#nameModal')).not.toHaveClass(/show/);

  await tela.getByRole('button', { name: 'Registrar no ranking' }).click();
  await expect(page.locator('#nameModal')).toHaveClass(/show/);
  await expect(page.locator('#playerName')).toBeFocused();
  await page.locator('#nameModal [data-action="closeNameModal"]').click();
  await expect(tela).toBeVisible();

  await tela.getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(page.locator('#defeatScreen')).toHaveCount(0);
  await expect(page.locator('#diffSelectorOverlay')).toBeVisible();
});

test('quem perde a pergunta bônus chega à tela final sem contar outra partida', async ({ page }) => {
  await abrir(page, NOTEBOOK, { gold: 2000 });
  await perder(page);
  const partidas = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-stats') || '{}').gamesPlayed);
  await page.getByRole('button', { name: 'Usar pergunta bônus (1500 ouro)' }).click();
  await expect(page.locator('#defeatScreen')).toHaveCount(0);
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion') && !(0, eval)('state.answered'));
  // A compra custa ouro e dá uma vida; acertos e pontos da jornada continuam.
  expect(await page.evaluate(() => (0, eval)('[state.gold, state.lives, state.correctTotal, !!state.current]'))).toEqual([500, 1, 15, true]);
  await perder(page);
  await expect(page.getByRole('button', { name: /pergunta bônus/ })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-stats') || '{}').gamesPlayed)).toBe(partidas);
});

test.describe('preços', () => {
  test.use({ locale: 'en-US' });
  test('navegador em inglês vê reais, e o mensal não promete renovação', async ({ page }) => {
    await abrir(page, NOTEBOOK);
    await page.evaluate(() => (window as any).showPricingModal());
    const precos = page.locator('.pricing-wrap');
    await expect(precos).toContainText('R$14,90');
    await expect(precos).toContainText('R$199,00');
    await expect(precos).not.toContainText('US$');
    await expect(precos).toContainText('32 days of access');
    await expect(precos).not.toContainText(/cancel anytime/i);
  });
});

test.describe('preços em português', () => {
  test.use({ locale: 'pt-BR' });
  test('mensal diz o que é', async ({ page }) => {
    await abrir(page, NOTEBOOK);
    await page.evaluate(() => (window as any).showPricingModal());
    const precos = page.locator('.pricing-wrap');
    await expect(precos).toContainText('32 dias de acesso · sem renovação automática');
    await expect(precos.getByRole('button', { name: 'Comprar 32 dias' })).toBeVisible();
    await expect(precos).not.toContainText(/cancele|assinar/i);
  });
});

test('portal explica as duas franquias gratuitas', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-portal-route="guest"]')).toContainText('Com conta grátis, são 50');
});

for (const viewport of [{ width: 1366, height: 768 }, NOTEBOOK]) {
  test(`chefe em ${viewport.width}×${viewport.height}: alternativas de pergunta curta ficam na tela`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await injectBossState(page);
    await page.locator('#question').evaluate(el => { el.textContent = 'Pergunta curta?'; });
    await expect.poll(() => page.locator('#options .option').last().evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(viewport.height);
  });
}

for (const viewport of [NOTEBOOK, CELULAR]) {
  test(`classes em ${viewport.width}px: cada card diz como escolher`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.getElementById('charSelectModal')!.classList.add('show'));
    await expect(page.locator('.nqc-choose')).toHaveCount(3);
    if (viewport === NOTEBOOK) for (const botao of await page.locator('.nqc-choose').all()) {
      await expect.poll(() => botao.evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(viewport.height);
    }
    expect(await page.evaluate(() => document.getElementById('charSelectModal')!.scrollWidth <= innerWidth)).toBe(true);
  });
}
