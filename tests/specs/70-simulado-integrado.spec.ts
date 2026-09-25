import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
import { auditarVisual } from '../helpers/auditoria-visual';

/**
 * O Simulado saiu da camada fixa sobre o jogo e virou página.
 *
 * Defeitos medidos antes:
 * - a jornada seguia viva atrás da prova: apertar "2" respondia a questão da
 *   campanha escondida;
 * - retomar e encerrar usavam `confirm()` nativo;
 * - se o tempo acabava com a pessoa fora, a prova sumia sem explicação;
 * - a correção de cada alternativa era só cor;
 * - uma falha ao baixar as questões ficava guardada e nenhuma nova tentativa
 *   funcionava.
 */

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function entrar(page: Page, largura = 1280) {
  await page.setViewportSize({ width: largura, height: largura < 500 ? 700 : 800 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => { localStorage.removeItem('nefroquest-exam-state'); return document.fonts.ready; });
}

/** Caminho do usuário: Modos de jogo → Simulado. */
async function abrirSimulado(page: Page) {
  await page.evaluate(() => (window as any).openGameModesPopup());
  await page.locator('[data-action-seq="closeGameModesPopup,startExamMode"]').click();
  await expect(page.locator('#examPage')).toBeVisible();
}

async function comecar(page: Page) {
  await abrirSimulado(page);
  await page.getByRole('button', { name: 'Começar prova' }).click();
  await expect(page.getByRole('heading', { name: 'Questão 1 de 60' })).toBeVisible();
}

const gabarito = (page: Page) => page.evaluate(() => (0, eval)('_examState.questions[_examState.idx].a') as number);

test('é página, sem diálogo nativo, e a jornada fica fora de alcance', async ({ page }) => {
  let nativos = 0;
  page.on('dialog', async d => { nativos++; await d.dismiss(); });
  await entrar(page);
  await abrirSimulado(page);
  const pagina = page.locator('#examPage');
  await expect(pagina).toHaveAttribute('role', 'main');
  expect(await pagina.evaluate(el => getComputedStyle(el).position)).not.toBe('fixed');
  await expect(page.getByRole('heading', { name: 'Prova simulada' })).toBeFocused();
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.locator('#mainApp').evaluate((el: HTMLElement) => el.inert)).toBe(true);

  // O relógio só começa quando a pessoa pede.
  expect(await page.evaluate(() => (0, eval)('_examState'))).toBeNull();
  await page.getByRole('button', { name: 'Começar prova' }).click();
  await page.getByRole('button', { name: 'Encerrar prova' }).click();
  await page.getByRole('button', { name: 'Encerrar e descartar' }).click();
  expect(nativos, 'usou confirm() nativo').toBe(0);
});

test('o teclado da prova não responde a questão escondida da jornada', async ({ page }) => {
  await entrar(page);
  await comecar(page);
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press('2');
  expect(await page.evaluate(() => (0, eval)('state.answered')), 'a jornada escondida foi respondida').toBe(false);
  // O "2" respondeu a prova (alternativa B), não a jornada.
  expect(await page.evaluate(() => (0, eval)('_examState.answers[0].chosen'))).toBe(1);
});

test('a correção diz em texto qual era a certa e qual foi a sua', async ({ page }) => {
  await entrar(page);
  await comecar(page);
  const certa = await gabarito(page);
  const errada = (certa + 1) % 4;
  const letras = ['A', 'B', 'C', 'D'];
  await page.locator('#examOpts button').nth(errada).click();
  await expect(page.locator('#examCorrecao')).toBeFocused();
  await expect(page.locator('.nq-exam-veredito')).toHaveText(`Incorreto. A resposta certa é a ${letras[certa]}.`);
  await expect(page.locator('#examOpts li').nth(errada).locator('.nq-exam-marca')).toHaveText('Sua resposta');
  await expect(page.locator('#examOpts li').nth(certa).locator('.nq-exam-marca')).toHaveText('Resposta correta');
  // Corrigida, a alternativa deixa de ser botão: não há o que acionar.
  await expect(page.locator('#examOpts button')).toHaveCount(0);

  await page.getByRole('button', { name: 'Próxima questão' }).click();
  await expect(page.getByRole('heading', { name: 'Questão 2 de 60' })).toBeFocused();
  await page.locator('#examOpts button').nth(await gabarito(page)).click();
  await expect(page.locator('.nq-exam-veredito')).toHaveText('Correto.');
  await expect(page.locator('.nq-exam-opcao-certa .nq-exam-marca')).toHaveText('Sua resposta — correta');
});

test('encerrar pede confirmação na página; cancelar volta à prova', async ({ page }) => {
  await entrar(page);
  await comecar(page);
  await page.getByRole('button', { name: 'Encerrar prova' }).click();
  await expect(page.getByText('As respostas desta prova serão descartadas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar a prova' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Encerrar prova' })).toBeFocused();
  await expect(page.locator('#examPage')).toBeVisible();

  await page.getByRole('button', { name: 'Encerrar prova' }).click();
  await page.getByRole('button', { name: 'Encerrar e descartar' }).click();
  await expect(page.locator('#examPage')).toHaveCount(0);
  await expect(page.locator('#mainApp')).toBeVisible();
  expect(await page.locator('#mainApp').evaluate((el: HTMLElement) => el.inert)).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-exam-state'))).toBeNull();
});

test('sair e continuar depois: a retomada é uma escolha na página', async ({ page }) => {
  await entrar(page);
  await comecar(page);
  await page.locator('#examOpts button').first().click();
  await page.getByRole('button', { name: 'Próxima questão' }).click();
  await page.getByRole('button', { name: 'Sair e continuar depois' }).click();
  await expect(page.locator('#examPage')).toHaveCount(0);

  await abrirSimulado(page);
  await expect(page.getByRole('heading', { name: 'Prova em andamento' })).toBeFocused();
  await expect(page.locator('#examPage')).toContainText('Você respondeu 1 de 60 questões');
  await page.getByRole('button', { name: 'Retomar prova' }).click();
  await expect(page.getByRole('heading', { name: 'Questão 2 de 60' })).toBeVisible();

  await page.getByRole('button', { name: 'Sair e continuar depois' }).click();
  await abrirSimulado(page);
  await page.getByRole('button', { name: 'Descartar e começar outra' }).click();
  await expect(page.getByRole('button', { name: 'Começar prova' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-exam-state'))).toBeNull();
});

test('tempo esgotado fora do app mostra o resultado, em vez de sumir', async ({ page }) => {
  await entrar(page);
  await comecar(page);
  await page.locator('#examOpts button').nth(await gabarito(page)).click();
  await page.getByRole('button', { name: 'Sair e continuar depois' }).click();
  // Simula a volta 91 minutos depois do início.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('nefroquest-exam-state')!);
    s.startTime = Date.now() - 91 * 60 * 1000;
    localStorage.setItem('nefroquest-exam-state', JSON.stringify(s));
  });
  await abrirSimulado(page);
  await expect(page.getByRole('heading', { name: 'Resultado da Prova' })).toBeFocused();
  await expect(page.locator('.nq-exam-aviso')).toHaveText('O tempo de 90 minutos terminou. 59 questões ficaram sem resposta.');
  await expect(page.locator('.nq-study-result-metrics')).toContainText('1 de 60');
  await expect(page.locator('.nq-study-result-metrics')).toContainText('100%');
});

test('falha ao baixar as questões avisa e a nova tentativa funciona', async ({ page }) => {
  await page.route('**/data/topics.js*', r => r.abort());
  await page.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith('/data/topics.js')) return r.fallback();
    return u.hostname === 'localhost' ? r.continue() : r.abort();
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => (window as any).startExamMode());
  await page.getByRole('button', { name: 'Começar prova' }).click();
  await expect(page.getByRole('alert')).toHaveText('Não foi possível carregar as questões. Verifique a conexão e tente de novo.');

  await page.unroute('**/data/topics.js*');
  await page.getByRole('button', { name: 'Começar prova' }).click();
  await expect(page.getByRole('heading', { name: 'Questão 1 de 60' })).toBeVisible({ timeout: 15_000 });
});

for (const largura of [320, 390]) {
  test(`cabe em ${largura}px com texto a 200%, contraste e alvos de toque`, async ({ page }) => {
    await entrar(page, largura);
    await comecar(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const certa = await gabarito(page);
    await page.locator('#examOpts button').nth((certa + 1) % 4).click();
    const cortados = await page.evaluate(() => [...document.querySelectorAll('#examPage button, #examPage p, #examPage h1')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1); })
      .map(el => (el.textContent || '').trim().slice(0, 40)));
    expect(cortados, 'elementos cortados na lateral').toEqual([]);
    for (const botao of await page.locator('#examPage button').all()) {
      const caixa = await botao.boundingBox();
      if (caixa) expect(caixa.height, `alvo de toque: ${await botao.textContent()}`).toBeGreaterThanOrEqual(44);
    }
    // auditarVisual aprova a geometria. O contraste dele fica inconclusivo aqui: o
    // fundo fixo do app (.bg-layer) está atrás da superfície opaca e conta como
    // "outra camada". O contraste é medido abaixo, com medirContraste.
    const auditoria = await page.evaluate(auditarVisual, '#examPage');
    expect(auditoria.medidos.geometria).toBeGreaterThan(0);
    expect(auditoria.falhas, JSON.stringify(auditoria.falhas, null, 1)).toEqual([]);
    for (const sel of ['#examTimer', '.nq-exam-titulo', '.nq-exam-enunciado', '.nq-exam-marca', '.nq-exam-veredito', '.nq-exam-correcao p', '.nq-exam-nota', '.nq-exam-opcao-neutra', '.nq-exam-opcao-certa', '.nq-exam-opcao-errada']) {
      expect(await page.evaluate(medirContraste, `#examPage ${sel}`), sel).toEqual([]);
    }
  });
}
