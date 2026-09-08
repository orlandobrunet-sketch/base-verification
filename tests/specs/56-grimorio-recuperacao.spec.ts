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
