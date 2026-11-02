import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const SAVE = { schemaVersion: 2, level: 7, xp: 150, xpToNext: 400, score: 4300, lives: 3, streak: 2, gold: 240, bonusUses: 0,
  correctTotal: 34, gameOver: false, gameStarted: true, difficulty: 'normal', character: 'glomerulus',
  idx: 0, queueIds: [], recentIds: [], chestsOpened: 2, timestamp: Date.now() };

const RANKING = [
  { player_name: 'Tales', score: 23146, level: 8, character_name: 'Dr. Glomerulus' },
  { player_name: 'Paula', score: 9999, level: 5, character_name: 'Dr. Nephros' },
  { player_name: 'Marina', score: 9027, level: 12, character_name: 'Dra. Aquaria' },
  { player_name: 'Rafa', score: 2100, level: 3 },
];

async function abrir(page: Page, viewport: { width: number; height: number }, tab = 'overview') {
  await page.setViewportSize(viewport);
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost' && /leaderboard/i.test(url.pathname)) return route.fulfill({ status: 200, json: RANKING });
    return url.hostname === 'localhost' ? route.continue() : route.abort();
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(save => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({ schemaVersion: 1, totalQuestions: 20, totalCorrect: 14, totalWrong: 6,
      byTopic: {}, byCategory: { drc: { total: 20, correct: 14 } }, questionHistory: [], dailyActivity: {}, timeStats: { totalTime: 0, questionCount: 0 }, mostMissed: {}, syncedMastered: [] }));
  }, SAVE);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(aba => (window as any).openDashboard({ tab: aba }), tab);
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready', { timeout: 15_000 });
}

test('a trilha mostra os cinco selos, o conquistado e o próximo', async ({ page }) => {
  await abrir(page, { width: 1280, height: 800 });
  const palco = page.locator('.nqd-stage');
  await expect(palco.locator('.nqd-stage-art img')).toHaveAttribute('src', /guerreiro_glomerular/);
  await expect(palco.locator('.nqd-stage-meta')).toHaveText('Nível 7 · 34 de 100 acertos nesta jornada');
  const selos = palco.locator('.nqd-stage-trail li');
  await expect(selos).toHaveCount(5);
  await expect(selos.nth(0)).toHaveClass(/is-done/);
  await expect(selos.nth(1)).toHaveClass(/is-next/);
  await expect(selos.nth(2)).not.toHaveClass(/is-done|is-next/);
  await expect(palco.locator('.nqd-stage-next')).toHaveText('Próximo selo: Sábio do Microscópio, faltam 6 acertos.');
  await expect.poll(() => selos.nth(4).locator('img').evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

for (const [largura, fonte] of [[390, 16], [320, 32]]) {
  test(`a trilha cabe em ${largura} px com letra de ${fonte} px`, async ({ page }) => {
    await abrir(page, { width: largura, height: 800 });
    await page.addStyleTag({ content: `html { font-size: ${fonte}px !important; }` });
    const painel = page.locator('.nqd-main');
    expect(await painel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const palco = (await page.locator('.nqd-stage').boundingBox())!;
    const ultimo = (await page.locator('.nqd-stage-trail li').last().boundingBox())!;
    expect(ultimo.x + ultimo.width).toBeLessThanOrEqual(palco.x + palco.width + 1);
  });
}

test('Agora vem primeiro também na ordem de leitura', async ({ page }) => {
  await abrir(page, { width: 1280, height: 800 });
  const ordem = await page.locator('#nqdPane-overview [data-overview-section]').evaluateAll(els => els.map(el => (el as HTMLElement).dataset.overviewSection));
  expect(ordem).toEqual(['now', 'pace', 'review']);
  const dias = page.locator('.nqd-pulse-day');
  await expect(dias).toHaveCount(7);
  const painel = (await page.locator('.nqd-learning-pulse').boundingBox())!;
  const ultimo = (await dias.last().boundingBox())!;
  expect(ultimo.x + ultimo.width).toBeLessThanOrEqual(painel.x + painel.width);
});

test('conquistas: cartão baixo, com a arte ao lado do texto', async ({ page }, info) => {
  await abrir(page, { width: info.project.name === 'mobile' ? 390 : 1280, height: 800 }, 'achievements');
  const cartao = page.locator('.nqd-achievement').first();
  const arte = (await cartao.locator('.nqd-achievement-mark').boundingBox())!;
  const texto = (await cartao.locator('.nqd-achievement-body').boundingBox())!;
  expect(texto.x).toBeGreaterThanOrEqual(arte.x + arte.width);
  expect((await cartao.boundingBox())!.height).toBeLessThan(240);
});

test('mapa: áreas em grade e detalhe ocupando a linha ao abrir', async ({ page }) => {
  await abrir(page, { width: 1280, height: 800 }, 'mapa');
  const areas = page.locator('[data-map-area]:visible');
  const [a, b] = [(await areas.nth(0).boundingBox())!, (await areas.nth(1).boundingBox())!];
  expect(a.y).toBe(b.y);
  await areas.nth(0).locator('summary').click();
  await expect.poll(async () => (await areas.nth(0).boundingBox())!.width).toBeGreaterThan(a.width * 1.5);
});

test('ranking: pódio com retrato do herói e letra para quem não tem classe', async ({ page }) => {
  await abrir(page, { width: 1280, height: 800 }, 'ranking');
  const podio = page.locator('.nqd-ranking-podium li');
  await expect(podio).toHaveCount(3);
  await expect(podio.nth(0).locator('.nqd-ranking-avatar img')).toHaveAttribute('src', /guerreiro_glomerular\/nivel_08/);
  await expect(podio.nth(2).locator('.nqd-ranking-avatar img')).toHaveAttribute('src', /maga_metabolica\/nivel_10/);
  await expect(page.locator('.nqd-ranking-table tbody tr').last().locator('.nqd-ranking-avatar')).toHaveText('R');
});

test('ranking cabe no celular sem rolagem lateral', async ({ page }) => {
  await abrir(page, { width: 390, height: 800 }, 'ranking');
  await expect(page.locator('.nqd-ranking-podium li')).toHaveCount(3);
  expect(await page.locator('.nqd-main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const tabela = (await page.locator('.nqd-ranking-table').boundingBox())!;
  expect(tabela.x + tabela.width).toBeLessThanOrEqual(390);
});
