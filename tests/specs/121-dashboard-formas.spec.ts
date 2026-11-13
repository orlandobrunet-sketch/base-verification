import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

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
  await expect(page.locator('.nqd-stage-art img')).toHaveAttribute('src', 'assets/classes-cinema/clerigo_renal/nivel_05.webp');
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
    await expect(page.locator('.nqd-stage-art img')).toHaveAttribute('src', `assets/classes-cinema/clerigo_renal/nivel_${String(level).padStart(2, '0')}.webp`);
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
    const values = [84, 73, 74, 76, 76, 84, 82];
    const stats = JSON.parse(localStorage.getItem('nefroquest-detailed-stats') || '{}');
    // Usa o cálculo real com cem respostas por área; o componente recebe
    // também acertos e erros coerentes, em vez de um percentual avulso.
    stats.byCategory = Object.fromEntries((window as any).CORE_SKILLS.map((skill: any, index: number) => [skill.categories[0], { correct: values[index], wrong: 100 - values[index] }]));
    stats.totalQuestions = 700;
    stats.totalCorrect = values.reduce((sum, value) => sum + value, 0);
    stats.totalWrong = 700 - stats.totalCorrect;
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
    (window as any).openDashboard();
  });
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.getByRole('tab', { name: 'Competências', exact: true }).click();
  const chart = page.locator('svg.nqs-chart');
  await expect(chart).toBeVisible();
  await expect(chart.locator('.nqs-profile-fill')).toHaveCount(1);
  await expect(chart.locator('.nqs-profile-line')).toHaveCount(7);
  const missing = () => chart.evaluate(el => {
    const values = [84, 73, 74, 76, 76, 84, 82];
    const points = values.map((value, index) => {
      const angle = -Math.PI / 2 + 2 * Math.PI * index / values.length;
      return { x: 280 + Math.cos(angle) * 170 * value / 100, y: 280 + Math.sin(angle) * 170 * value / 100 };
    });
    const failures: string[] = [];
    const lines = [...el.querySelectorAll<SVGGeometryElement>('.nqs-profile-line')];
    for (let index = 0; index < points.length; index += 1) {
      const a = points[index], b = points[(index + 1) % points.length];
      const line = lines[index];
      if (!line || getComputedStyle(line).stroke !== 'rgb(181, 237, 241)') { failures.push(`${index}:stroke`); continue; }
      for (const fraction of [.2, .4, .6, .8]) {
        const actual = line.getPointAtLength(line.getTotalLength() * fraction);
        const expected = { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
        if (Math.hypot(actual.x - expected.x, actual.y - expected.y) > .02) failures.push(`${index}:${fraction}`);
      }
      const end = line.getPointAtLength(line.getTotalLength());
      const next = lines[(index + 1) % lines.length].getPointAtLength(0);
      if (Math.hypot(end.x - next.x, end.y - next.y) > .02) failures.push(`${index}:closure`);
    }
    return failures;
  });
  await expect.poll(missing, { message: 'todas as arestas, inclusive última→primeira, precisam ter o contorno ciano contínuo' }).toEqual([]);
});
