import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { saveBase, statsBase } from '../helpers/fixtures';

/** A leitura por área é principal; o radar é complementar e exige três eixos medidos. */

const SAVE = saveBase();

/** Amostra em quatro dos sete eixos; três ficam sem nenhuma resposta. */
const STATS_PARCIAL = statsBase({
  byCategory: {
    glomerular: { correct: 18, wrong: 6 },
    drc: { correct: 9, wrong: 14 },
    dialise: { correct: 12, wrong: 4 },
    acido_base: { correct: 11, wrong: 3 },
  },
});

async function abrirCompetencias(page: Page, stats: unknown) {
  const origin = new URL(test.info().project.use.baseURL as string || process.env.BASE_URL || 'http://localhost:5500').origin;
  await page.route('**/*', route => route.request().method() === 'GET' && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(({ save, stats }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
    localStorage.setItem('nefroquest-premium', '1');
  }, { save: SAVE, stats });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
  await page.getByRole('tab', { name: 'Competências', exact: true }).click();
}

const rotulosDoAtlas = (page: Page) => page.locator('#nqDashboard .nqs-orbit-node')
  .evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label') || '').join('; '));

test.describe('Radar de competências', () => {
  test('o gráfico volta a existir e é desenhado', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const chart = page.locator('#nqDashboard svg.nqs-chart');
    await expect(chart).toBeVisible();
    await expect(chart.locator('.nqs-vertex-point')).toHaveCount(4);
    await expect(chart.locator('.nqs-profile-line')).toHaveCount(2);
    // Os segmentos precisam ter geometria e tinta, não apenas um SVG vazio.
    const pintado = await chart.locator('.nqs-profile-line').evaluateAll(lines => lines.every(line => {
      const style = getComputedStyle(line);
      return (line as SVGGeometryElement).getTotalLength() > 0 && style.stroke !== 'none' && Number(style.opacity) > 0;
    }));
    expect(pintado, 'o perfil SVG precisa ter segmentos visíveis').toBe(true);
  });

  test('o rótulo acessível nomeia cada competência e diz quando não há amostra', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const rotulo = await rotulosDoAtlas(page);
    expect(rotulo).toContain('Glomerulopatias');
    expect(rotulo).toContain('respostas');
    // Os eixos sem nenhuma resposta precisam ser declarados como tal.
    expect(rotulo, 'ausência de amostra tem de ser dita, não plotada como zero').toContain('Sem amostra');
  });

  test('competência sem amostra nunca é descrita como zero por cento', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const rotulo = await rotulosDoAtlas(page);
    // Nenhum eixo pode aparecer como "0%" — o que não foi medido é "sem amostra".
    expect(rotulo).not.toMatch(/\b0% de acertos/);
    await expect(page.locator('#nqDashboard .nqs-vertex-point')).toHaveCount(4);
  });

  test('o radar acompanha os sete eixos clínicos, não o recorte antigo de cinco', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const rotulo = await rotulosDoAtlas(page);
    await expect(page.locator('#nqDashboard .nqs-orbit-node')).toHaveCount(7);
    for (const eixo of ['Glomerulopatias', 'Diálise', 'Transplante renal']) {
      expect(rotulo, `o eixo ${eixo} precisa estar no perfil`).toContain(eixo);
    }
    expect(rotulo, 'o agrupamento antigo não pode voltar').not.toContain('Fisiopatologia & Pesquisa');
  });

  test('sem amostra mantém as sete áreas abertas sem desenhar desempenho ou indicadores zero', async ({ page }) => {
    await abrirCompetencias(page, { totalQuestions: 0, totalCorrect: 0, totalWrong: 0, byCategory: {}, dailyActivity: {} });
    await expect(page.locator('#nqDashboard .nqs-vertex-point, #nqDashboard .nqs-profile-line, #nqDashboard .nqs-profile-fill')).toHaveCount(0);
    await expect(page.locator('#nqDashboard .nqs-detail-value')).toHaveCount(0);
    await expect(page.locator('#nqDashboard .nqs-area[data-state="unseen"]')).toHaveCount(7);
    await expect(page.locator('#nqDashboard #nqsProfileContext')).toHaveText('O perfil visual aparece quando três áreas tiverem pelo menos cinco respostas.');
    for (const row of await page.locator('#nqDashboard .nqs-area').all()) await expect(row).not.toContainText('0%');
  });
});

test.describe('Leitura do perfil', () => {
  test('a lista é principal e mantém os dados e áreas sem amostra sem legenda duplicada', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    await expect(page.locator('#nqDashboard .nqs-area:is([data-state="attention"], [data-state="consolidating"], [data-state="consistent"])')).toHaveCount(4);
    await expect(page.locator('#nqDashboard .nqs-area-grid')).toHaveCount(1);
    await expect(page.locator('#nqDashboard .nqs-instrument')).toHaveCount(1);
    await expect(page.locator('#nqDashboard .nqs-area[data-state="unseen"]')).toHaveCount(3);
    await expect(page.locator('#nqDashboard .nqs-area-grid')).toContainText('Diálise');
    await expect(page.locator('#nqDashboard .nqs-area-grid')).toContainText('respostas');
    await expect(page.locator('#nqDashboard .nqs-area[data-skill-id="dialise"] .nqs-area-score')).toHaveText('75% de acertos na amostra');
  });

  test('o perfil visual parcial não anuncia tendência nem certeza completa', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const leitura = page.locator('#nqDashboard .nqs-instrument');
    await expect(leitura).toBeVisible();
    const texto = await leitura.innerText();
    expect(texto).toContain('Seu perfil observado é parcial');
    expect(texto).toContain('As áreas sem amostra suficiente ficam sem ponto. Os intervalos permanecem abertos.');
    await expect(leitura.locator('.nqs-profile-fill')).toHaveCount(0);
    expect(texto, 'não há série histórica que sustente tendência').not.toMatch(/era \d|há um mês|tendência|melhorou|piorou/i);
  });

  test('o estado vazio de "Como você erra" explica a mecânica sem etiquetas vazias', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const painel = page.locator('#nqDashboard .nqd-error-patterns');
    await expect(painel).toContainText('marcar o motivo');
    await expect(painel.locator('.nqd-error-catalog li')).toHaveCount(0);
  });

  test('prefers-reduced-motion desenha o radar sem animação', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirCompetencias(page, STATS_PARCIAL);
    const chart = page.locator('#nqDashboard svg.nqs-chart');
    await expect(chart).toBeVisible();
    await expect(chart.locator('.nqs-vertex-point')).toHaveCount(4);
    const lines = await chart.locator('.nqs-profile-line').evaluateAll(nodes => nodes.map(node => ({
      length: (node as SVGGeometryElement).getTotalLength(), animation: getComputedStyle(node).animationName,
      stroke: getComputedStyle(node).stroke, offset: getComputedStyle(node).strokeDashoffset,
    })));
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(line.length).toBeGreaterThan(0); expect(line.animation).toBe('none');
      expect(line.stroke).not.toBe('none'); expect(parseFloat(line.offset)).toBe(0);
    }
  });

  test('o perfil com dados preserva acessibilidade no desktop e celular', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const results = await new AxeBuilder({ page }).include('#nqDashboard').analyze();
    const blocking = results.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical');
    expect(blocking, blocking.map(violation => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
  });
});
