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

// Sem defesa sorteada: o erro sempre tira vida.
const responder = (page: Page, certo: boolean) => page.evaluate(acerta => (0, eval)(`Math.random = () => .99;
  const indice = ${acerta} ? state.current.a : (state.current.a + 1) % state.current.o.length;
  answer(indice, document.querySelectorAll('#options .option')[indice]);`.replace('${acerta}', String(acerta))), certo);

const definirSequencia = (page: Page, n: number) => page.evaluate(v => (0, eval)(`state.streak = ${v}; renderHUD();`.replace('${v}', String(v))), n);

test('o capítulo atual aparece no topo da questão', async ({ page }) => {
  await abrir(page, NOTEBOOK);
  const titulo = await page.locator('#storyTitle').textContent();
  await expect(page.locator('#questionChapter')).toHaveText(titulo!);
  await expect(page.locator('#questionChapter')).toBeVisible();
});

test('no celular o título longo do capítulo não invade o cronômetro', async ({ page }) => {
  await abrir(page, { width: 320, height: 568 });
  const capitulo = (await page.locator('#questionChapter').boundingBox())!;
  const cronometro = (await page.locator('#timerWidget').boundingBox())!;
  expect(capitulo.x + capitulo.width).toBeLessThanOrEqual(cronometro.x + 1);
});

test('a sequência sobe de nível aos 3, 5 e 10 acertos e some ao errar', async ({ page }) => {
  await abrir(page, NOTEBOOK);
  const nivel = () => page.evaluate(() => document.body.dataset.nqStreak ?? null);
  const multiplicador = page.locator('#msbMult');

  await definirSequencia(page, 2);
  expect(await nivel()).toBeNull();
  await expect(multiplicador).toBeEmpty();

  await definirSequencia(page, 3);
  expect(await nivel()).toBe('1');
  await expect(multiplicador).toHaveText('x1,25');
  await expect(page.locator('#msbStreak')).toHaveClass(/msb-subiu/);

  await definirSequencia(page, 5);
  expect(await nivel()).toBe('2');
  await expect(multiplicador).toHaveText('x1,5');

  await definirSequencia(page, 10);
  expect(await nivel()).toBe('3');
  await expect(multiplicador).toHaveText('x2');

  await responder(page, false);
  await expect(page.locator('#msbStreak')).toHaveText('0');
  expect(await nivel()).toBeNull();
  await expect(multiplicador).toBeEmpty();
});

test('errar treme as alternativas e parte um coração', async ({ page }) => {
  await abrir(page, NOTEBOOK);
  await responder(page, false);
  await expect(page.locator('#options')).toHaveClass(/nql-erro/);
  await expect(page.locator('.msb-lives')).toHaveClass(/msb-perdeu/);
  expect(await page.locator('#options').evaluate(el => getComputedStyle(el).animationName)).toBe('nql-erro-treme');
});

test.describe('movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('o erro não treme a tela', async ({ page }) => {
    await abrir(page, NOTEBOOK);
    await responder(page, false);
    await expect(page.locator('#options')).toHaveClass(/nql-erro/);
    expect(await page.locator('#options').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  });
});

test('no celular o ganho aparece na faixa, sem cobrir a explicação', async ({ page }) => {
  await abrir(page, CELULAR);
  await responder(page, true);
  const ganho = page.locator('#msbGain');
  await expect(ganho).toBeVisible();
  await expect(ganho).toContainText(/^\+\d+ XP · \+\d+ ouro$/);
  await expect(page.locator('.floating-text')).toHaveCount(0);
  await expect(ganho).toBeHidden({ timeout: 3_000 });
});

test('a faixa cobre o texto que rola por baixo', async ({ page }) => {
  await abrir(page, NOTEBOOK);
  const fundo = await page.locator('#mobileStatusBar').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(fundo).toMatch(/^rgb\(/);
});

for (const largura of [320, 390]) {
  test(`a ${largura} px a sequência alta não encosta no botão de som`, async ({ page }) => {
    await abrir(page, { width: largura, height: 700 });
    await definirSequencia(page, 15);
    const acertos = (await page.locator('#msbCorrect').boundingBox())!;
    const som = (await page.getByRole('button', { name: 'Preferências de áudio' }).boundingBox())!;
    expect(acertos.x + acertos.width).toBeLessThanOrEqual(som.x);
  });
}

test('no computador o ganho continua saindo do herói', async ({ page }) => {
  await abrir(page, NOTEBOOK);
  await responder(page, true);
  await expect(page.locator('.floating-text').first()).toContainText('XP');
  await expect(page.locator('#msbGain')).toBeHidden();
});

test('o confronto final não herda o brilho da sequência', async ({ page }) => {
  await page.setViewportSize(NOTEBOOK);
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectBossState(page);
  await definirSequencia(page, 6);
  expect(await page.evaluate(() => document.body.dataset.nqStreak ?? null)).toBeNull();
});

test('a página inicial separa questões de desafios', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const prova = page.locator('.proof-item').first();
  await expect(prova).toContainText('Questões comentadas');
  await expect(prova).toContainText('350 desafios rápidos');
  await expect(prova.locator('[data-count]')).toHaveAttribute('data-count', '741');
});
