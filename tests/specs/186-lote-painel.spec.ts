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

test('o jogo chama o painel de Painel, sem "Dashboard" à vista', async ({ page }) => {
  await abrirJogo(page, 1280, 800);
  await expect(page.locator('.dock-btn.dashboard-btn .dock-label')).toHaveText('Painel');
  await page.locator('.dock-btn.dashboard-btn').click();
  const painel = page.locator('#nqDashboard[data-dashboard-state="ready"]');
  await expect(painel).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('navigation', { name: 'Áreas do Painel' })).toBeVisible();
  await expect(painel).not.toContainText('Dashboard');
});

test('o capítulo diz quantos acertos faltam para o próximo, não as cartas restantes', async ({ page }) => {
  await abrirJogo(page, 1280, 800, { correctTotal: 10, narrativeShown: 5 });
  await page.evaluate(() => {
    const g = (0, eval);
    g('showNarrativePopup')(g('narrativeStages').find((s: { at: number }) => s.at === 10));
  });
  const capitulo = page.locator('.nqnarr-card[data-nq-chapter]');
  await expect(capitulo).toBeVisible();
  await expect(capitulo).not.toContainText('Cartas restantes');
  await expect(capitulo.locator('.nqnarr-metric').filter({ hasText: 'Acertos até o próximo capítulo' }).locator('strong')).toHaveText('5');
});

test('a conta separa o essencial do opcional', async ({ page }) => {
  await abrirJogo(page, 1280, 800);
  await page.evaluate(() => (window as any).openAccountModal());
  const conta = page.getByRole('dialog', { name: 'Minha Conta' });
  await expect(conta).toBeVisible();
  const grupo = conta.locator('.nqaccount-group');
  await expect(grupo).toContainText('Opcional');
  const y = async (sel: string) => (await conta.locator(sel).boundingBox())!.y;
  expect(await y('#acctIdentity')).toBeLessThan(await y('.nqaccount-group'));
  expect(await y('#acctPhone')).toBeGreaterThan(await y('.nqaccount-group'));
});

test('o título do Julgamento recebe foco sem desenhar retângulo', async ({ page }) => {
  await abrirJogo(page, 1280, 800);
  await page.evaluate(() => {
    const h = document.createElement('h1');
    h.id = 'mgQuestao'; h.tabIndex = -1; h.textContent = 'Afirmação 1 de 10';
    document.body.appendChild(h); h.focus();
  });
  expect(await page.locator('#mgQuestao').evaluate(el => getComputedStyle(el).outlineStyle)).toBe('none');
});

test('o topo da questão e o popup contam o mesmo capítulo', async ({ page }) => {
  await abrirJogo(page, 1280, 800, { correctTotal: 10, narrativeShown: 10, level: 5 });
  await expect(page.locator('#questionChapter')).toHaveText('Capítulo II — As Criptas da Creatinina');
  await expect(page.locator('#storyTitle')).toHaveText('Capítulo II — As Criptas da Creatinina');
});

test('antes do primeiro capítulo, o topo mostra o prólogo', async ({ page }) => {
  await abrirJogo(page, 1280, 800, { correctTotal: 3, level: 2 });
  await expect(page.locator('#questionChapter')).toHaveText(/^Prólogo/);
});
