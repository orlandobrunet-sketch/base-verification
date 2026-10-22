import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/');
});

async function abrir(page: Page, level = 5) {
  await injectGameState(page, { level, correctTotal: (level - 1) * 10 + 4, xp: 150, character: 'nephros' });
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
}

const journeySnapshot = (page: Page) => page.evaluate(() => JSON.stringify((0, eval)('({idx:state.idx,level:state.level,xp:state.xp,correctTotal:state.correctTotal,lives:state.lives,score:state.score})')));

test('Visão geral conserva a identidade pessoal sem card de personagem ou evoluções e sem responder a jornada', async ({ page }) => {
  await abrir(page);
  const before = await journeySnapshot(page);
  const overview = page.locator('#nqdPane-overview');
  await expect(overview.locator('.nqd-journey,.nqd-form-trail,.nqd-form-node,.nqd-form-dialog')).toHaveCount(0);
  await expect(page.locator('.nqd-profile-avatar img')).toHaveAttribute('src', 'assets/classes-cinema/clerigo_renal/nivel_05.webp');
  await expect(overview.getByRole('heading', { name: 'Seu ritmo', exact: true })).toBeVisible();
  await page.keyboard.press('1');
  expect(await journeySnapshot(page)).toBe(before);
  await page.locator('.nqd-brand-close').click();
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  await expect(page.locator('#question')).not.toBeEmpty();
  expect(await journeySnapshot(page)).toBe(before);
});

test('sidebar mantém o título pessoal inteiro em uma linha legível e Dashboard junto da marca', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await abrir(page);
  await page.evaluate(() => {
    (window as any).closeDashboard();
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
      version: 1, totalQuestions: 300, totalCorrect: 200, totalWrong: 100,
      byTopic: {}, byCategory: {}, questionHistory: [], dailyActivity: {},
      timeStats: { totalTime: 9000, questionCount: 300 }, mostMissed: {},
    }));
    return (window as any).openDashboard();
  });
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  const title = page.locator('.nqd-profile-level');
  await expect(title).toHaveText('Erudito do Equilíbrio');
  await expect(title).toBeVisible();
  const metrics = await title.evaluate(el => {
    const rect = el.getBoundingClientRect(), rail = el.closest('.nqd-rail')!.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(el);
    const lines = [...range.getClientRects()].filter(line => line.width > 0);
    const brand = document.querySelector('.nqd-brand')!.getBoundingClientRect();
    const kicker = document.querySelector('.nqd-rail-kicker')!.getBoundingClientRect();
    return { lines: lines.length, fontSize: parseFloat(getComputedStyle(el).fontSize),
      fontFamily: getComputedStyle(el).fontFamily, titleBounds: {left: rect.left, right: rect.right},
      railBounds: {left: rail.left, right: rail.right}, glyphBounds: lines.map(line => ({left: line.left, right: line.right})),
      inside: lines.every(line => line.left >= rect.left - 1 && line.right <= rect.right + 1 && line.left >= rail.left && line.right <= rail.right),
      kickerGap: kicker.top - brand.bottom };
  });
  // Registra a fonte realmente escolhida pelo Chromium, além da pilha CSS.
  // O diagnóstico é opcional; as verificações de geometria abaixo são obrigatórias.
  const typography: Record<string, unknown> = {};
  let session: CDPSession | undefined;
  try {
    session = await page.context().newCDPSession(page);
    await session.send('DOM.enable');
    await session.send('CSS.enable');
    const { root } = await session.send('DOM.getDocument');
    for (const selector of ['.nqd-profile-level', '.nqd-metric-context', '#nqdPane-overview h2']) {
      const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
      typography[selector] = nodeId ? (await session.send('CSS.getPlatformFontsForNode', { nodeId })).fonts : [];
    }
  } catch (error) {
    typography.unavailable = String(error);
  } finally {
    if (session) await session.detach().catch(error => { typography.detachError = String(error); });
  }
  await testInfo.attach('sidebar-typography-and-bounds', {
    body: Buffer.from(JSON.stringify({ metrics, typography }, null, 2)), contentType: 'application/json',
  });
  expect(metrics.lines).toBe(1);
  expect(metrics.fontSize).toBeGreaterThanOrEqual(12);
  expect(metrics.inside, JSON.stringify(metrics)).toBe(true);
  expect(metrics.kickerGap).toBeGreaterThanOrEqual(-1);
  expect(metrics.kickerGap).toBeLessThanOrEqual(12);
});

test('320px e texto a 200% preservam a coluna de leitura e o retorno após rolar', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await abrir(page);
  const before = await journeySnapshot(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('32px');
  const overview = page.locator('#nqdPane-overview');
  await expect(overview.locator('.nqd-journey,.nqd-form-trail,.nqd-form-node')).toHaveCount(0);
  const main = page.locator('.nqd-main');
  expect(await main.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await main.evaluate(el => { el.scrollTop = el.scrollHeight; });
  const back = page.locator('.nqd-brand-close');
  const geometry = await back.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height, hit: el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
  });
  expect(geometry.width).toBeGreaterThanOrEqual(44);
  expect(geometry.height).toBeGreaterThanOrEqual(44);
  expect(geometry.hit).toBe(true);
  await back.click();
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  expect(await journeySnapshot(page)).toBe(before);
});

for (const level of [1, 9, 10]) {
  test(`nível ${level} mantém o avatar atual sem criar uma galeria de evoluções na Visão geral`, async ({ page }) => {
    await abrir(page, level);
    const before = await journeySnapshot(page);
    const overview = page.locator('#nqdPane-overview');
    await expect(overview.locator('.nqd-journey,.nqd-form-trail,.nqd-form-node')).toHaveCount(0);
    await expect(page.locator('.nqd-profile-avatar img')).toHaveAttribute('src', `assets/classes-cinema/clerigo_renal/nivel_${String(level).padStart(2, '0')}.webp`);
    await expect(overview.locator('[data-action="_dashPreviewForm"]')).toHaveCount(0);
    await expect(overview).not.toContainText('Nível 11');
    await page.locator('.nqd-brand-close').click();
    expect(await journeySnapshot(page)).toBe(before);
  });
}

test('contorno de desempenho fecha a última aresta e fica contínuo com os sete eixos', async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => {
    (window as any).closeDashboard();
    const ids = ['glomerulopatias', 'hidroeletrolitico_acidobase', 'drc_nefroprotecao', 'nefrologia_geral_diagnostico', 'lra_critico', 'dialise', 'transplante'];
    const values = [84, 73, 74, 76, 76, 84, 82];
    (window as any).getCoreSkillsStats = () => ids.map((id, index) => ({ id, label: id, totalAnswered: 100, accuracy: values[index] }));
    (window as any).openDashboard();
  });
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.getByRole('tab', { name: 'Competências', exact: true }).click();
  const mobile = page.locator('.nqd-skill-radar-mobile');
  if (await mobile.isVisible()) await mobile.locator('summary').click();
  const canvas = page.locator('.nqd-radar:visible canvas');
  await expect(canvas).toBeVisible();
  const missing = () => canvas.evaluate((el: HTMLCanvasElement) => {
    const ctx = el.getContext('2d')!;
    const ratio = el.width / 380;
    const values = [84, 73, 74, 76, 76, 84, 82];
    const points = values.map((value, index) => {
      const angle = -Math.PI / 2 + 2 * Math.PI * index / values.length;
      return { x: 190 + Math.cos(angle) * 108 * value / 100, y: 190 + Math.sin(angle) * 108 * value / 100 };
    });
    const failures: string[] = [];
    for (let index = 0; index < points.length; index += 1) {
      const a = points[index], b = points[(index + 1) % points.length];
      for (const fraction of [.2, .4, .6, .8]) {
        const x = Math.round((a.x + (b.x - a.x) * fraction) * ratio);
        const y = Math.round((a.y + (b.y - a.y) * fraction) * ratio);
        const pixels = ctx.getImageData(x - 2, y - 2, 5, 5).data;
        let cyan = false;
        for (let offset = 0; offset < pixels.length; offset += 4) {
          if (Math.abs(pixels[offset] - 159) < 20 && Math.abs(pixels[offset + 1] - 219) < 20 && Math.abs(pixels[offset + 2] - 228) < 20 && pixels[offset + 3] > 180) cyan = true;
        }
        if (!cyan) failures.push(`${index}:${fraction}`);
      }
    }
    return failures;
  });
  await expect.poll(missing, { message: 'todas as arestas, inclusive última→primeira, precisam ter o contorno ciano contínuo' }).toEqual([]);
});
