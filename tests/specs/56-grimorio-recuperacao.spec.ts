import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
async function preparar(page: Page) {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  // O carregamento ocioso não interfere no cenário de tentativa explícita.
  await page.addInitScript(() => { window.requestIdleCallback = () => 1; });
}
async function entrar(page: Page) {
  await page.goto('/jogar/');
  await page.locator('[data-portal-route="guest"]').click();
}

for (const arquivo of ['refs', 'articles']) {
  test(`${arquivo}: falha não vira acervo vazio; nova tentativa recupera só o arquivo ausente`, async ({ page }) => {
    await preparar(page);
    const pedidos = { refs: 0, articles: 0 };
    for (const nome of ['refs', 'articles'] as const) {
      await page.route(`**/data/${nome}.js`, route => {
        pedidos[nome]++;
        return nome === arquivo && pedidos[nome] === 1 ? route.abort() : route.continue();
      });
    }
    await entrar(page);
    await page.evaluate(() => { localStorage.setItem('unlockedArticles', '[0]'); void (window as any).openDashboard(); });
    const central = page.locator('#nqDashboard');
    await expect(central).toHaveAttribute('data-dashboard-state', 'error');
    await expect(central).not.toContainText('Seu Grimório começa vazio');
    await central.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
    await expect(central).toHaveAttribute('data-dashboard-state', 'ready');
    await central.locator('[data-dash-tab="library"]').click();
    await expect(page.locator('#nqdPane-library .nqd-library-summary')).toBeVisible();
    expect(pedidos[arquivo as keyof typeof pedidos]).toBe(2);
    expect(pedidos[arquivo === 'refs' ? 'articles' : 'refs']).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem('unlockedArticles'))).toBe('[0]');
    await page.evaluate(() => (window as any).carregarDadosGrimorio());
    expect(pedidos.refs + pedidos.articles).toBe(3);
  });
}

test('chamadas concorrentes esperam os dois arquivos sem duplicar scripts', async ({ page }) => {
  await preparar(page);
  let liberar!: () => void;
  const aguardar = new Promise<void>(resolve => { liberar = resolve; });
  let refs = 0, artigos = 0;
  await page.route('**/data/refs.js', route => { refs++; return route.continue(); });
  await page.route('**/data/articles.js', async route => { artigos++; await aguardar; await route.continue(); });
  await entrar(page);
  await page.evaluate(() => {
    const g = window as any;
    g.cargasConcluidas = 0;
    for (let i = 0; i < 3; i++) g.carregarDadosGrimorio().then(() => g.cargasConcluidas++);
    void g.openDashboard();
  });
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'loading');
  await expect.poll(() => artigos).toBe(1);
  expect(await page.evaluate(() => (window as any).cargasConcluidas)).toBe(0);
  liberar();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await expect.poll(() => page.evaluate(() => (window as any).cargasConcluidas)).toBe(3);
  expect(refs).toBe(1);
  expect(artigos).toBe(1);
});

test('fechar durante o carregamento não reabre a Central quando a resposta chega', async ({ page }) => {
  await preparar(page);
  let liberar!: () => void;
  const aguardar = new Promise<void>(resolve => { liberar = resolve; });
  await page.route('**/data/articles.js', async route => { await aguardar; await route.continue(); });
  await entrar(page);
  await page.evaluate(() => { void (window as any).openDashboard(); });
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'loading');
  await page.locator('#nqDashboard [data-action="closeDashboard"]').first().click();
  liberar();
  await page.evaluate(() => (window as any).carregarDadosGrimorio());
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
});

test('falha da carga ociosa não gera rejeição sem tratamento nem impede recuperação', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  let tentativas = 0;
  await page.route('**/data/refs.js', route => ++tentativas === 1 ? route.abort() : route.continue());
  await page.addInitScript(() => {
    (window as any).rejeicoes = [];
    window.addEventListener('unhandledrejection', e => (window as any).rejeicoes.push(String(e.reason)));
  });
  await entrar(page);
  await expect.poll(() => tentativas).toBe(1);
  await expect.poll(() => page.locator('script[src="data/refs.js"]').count()).toBe(0);
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  expect(await page.evaluate(() => (window as any).rejeicoes)).toEqual([]);
  expect(tentativas).toBe(2);
});

/**
 * O estado de erro é a única tela que o usuário vê quando a rede falha —
 * então ela precisa dizer o que fazer, e não só que algo deu errado.
 *
 * Dois defeitos medidos quando ele ganhou o botão de recuperação:
 *
 * 1. O título usava <h1>. O estilo destes blocos alcança h2/h3, então o h1
 *    escapava para o padrão do navegador: 32px, três linhas em 390px, muito
 *    maior que qualquer outro título da Central (22,4px).
 *
 * 2. Os dois botões eram idênticos — mesmo fundo, mesma cor, mesmo peso — e o
 *    marcado como primário era o de SAIR, não o de recuperar. Duas ações com
 *    o mesmo peso não são hierarquia: são uma escolha sem recomendação.
 */
test.describe('o estado de erro orienta a saída', () => {
  test('o título usa o tamanho do sistema, não o do navegador', async ({ page }) => {
    await preparar(page);
    await page.route('**/data/refs.js', route => route.abort());
    await entrar(page);
    await page.evaluate(() => void (window as any).openDashboard());
    const central = page.locator('#nqDashboard');
    await expect(central).toHaveAttribute('data-dashboard-state', 'error');

    await expect(central.locator('.nqd-error h1'), 'h1 escapa do estilo destes blocos').toHaveCount(0);
    const px = await central.locator('.nqd-error h2').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    expect(px, `título a ${px}px, fora da escala da Central`).toBeLessThan(26);
  });

  test('a recuperação é a ação recomendada, e a saída não compete com ela', async ({ page }) => {
    await preparar(page);
    await page.route('**/data/refs.js', route => route.abort());
    await entrar(page);
    await page.evaluate(() => void (window as any).openDashboard());
    const central = page.locator('#nqDashboard');
    await expect(central).toHaveAttribute('data-dashboard-state', 'error');

    const estilo = (nome: string) => central.getByRole('button', { name: nome }).first().evaluate(el => {
      const cs = getComputedStyle(el);
      return { fundo: cs.backgroundColor, peso: cs.fontWeight };
    });
    const recuperar = await estilo('Tentar novamente');
    const sair = await estilo('Voltar ao jogo');

    // Preenchido contra transparente: a diferença precisa existir, em qualquer
    // paleta que o projeto venha a adotar.
    const opaco = (c: string) => !/rgba\([^)]*,\s*0\s*\)/.test(c) && c !== 'transparent';
    expect(opaco(recuperar.fundo), 'a ação recomendada precisa ser preenchida').toBe(true);
    expect(recuperar.fundo === sair.fundo, 'os dois botões pesam igual; não há recomendação').toBe(false);
    await expect(
      central.locator('[data-nqd-primary="true"]'),
      'o destaque precisa estar na recuperação, não na saída',
    ).toHaveAttribute('data-action', '_dashRetryLoad');
  });
});
