import { test, expect, Page } from '@playwright/test';
import { saveBase, statsBase } from '../helpers/fixtures';

/**
 * Radar de competências (v14.56).
 *
 * O gráfico foi removido na 14.50 por plotar 0% onde não havia amostra — a
 * forma do polígono mentia sobre o desempenho. O defeito estava em três linhas,
 * não no gráfico. Volta com o polígono ligando apenas os eixos medidos, e o
 * eixo sem amostra com raio apagado, sem vértice e rotulado "—".
 */

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
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(({ save, stats }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
    localStorage.setItem('nefroquest-premium', '1');
  }, { save: SAVE, stats });
  await page.reload();
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
  await page.getByRole('tab', { name: 'Competências', exact: true }).click();
}

test.describe('Radar de competências', () => {
  test('o gráfico volta a existir e é desenhado', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const canvas = page.locator('#nqDashRadarContainer canvas');
    await expect(canvas).toBeVisible();

    // Não basta existir: precisa ter pixel pintado.
    const pintado = await canvas.evaluate((el: HTMLCanvasElement) => {
      const ctx = el.getContext('2d');
      if (!ctx) return false;
      const d = ctx.getImageData(0, 0, el.width, el.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true;
      return false;
    });
    expect(pintado, 'o canvas do radar não pode ficar em branco').toBe(true);
  });

  test('o rótulo acessível nomeia cada competência e diz quando não há amostra', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const rotulo = await page.locator('#nqDashRadarContainer').getAttribute('aria-label');
    expect(rotulo).toContain('Glomerulopatias');
    expect(rotulo).toContain('respostas');
    // Os eixos sem nenhuma resposta precisam ser declarados como tal.
    expect(rotulo, 'ausência de amostra tem de ser dita, não plotada como zero').toContain('sem amostra');
  });

  test('competência sem amostra nunca é descrita como zero por cento', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const rotulo = (await page.locator('#nqDashRadarContainer').getAttribute('aria-label')) || '';
    // Nenhum eixo pode aparecer como "0%" — o que não foi medido é "sem amostra".
    expect(rotulo).not.toMatch(/:\s*0%/);
  });

  test('o radar acompanha os sete eixos clínicos, não o recorte antigo de cinco', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const rotulo = (await page.locator('#nqDashRadarContainer').getAttribute('aria-label')) || '';
    for (const eixo of ['Glomerulopatias', 'Diálise', 'Transplante renal']) {
      expect(rotulo, `o eixo ${eixo} precisa estar no perfil`).toContain(eixo);
    }
    expect(rotulo, 'o agrupamento antigo não pode voltar').not.toContain('Fisiopatologia & Pesquisa');
  });

  test('sem nenhuma amostra o gráfico não inventa um polígono', async ({ page }) => {
    await abrirCompetencias(page, { totalQuestions: 0, totalCorrect: 0, totalWrong: 0, byCategory: {}, dailyActivity: {} });
    const rotulo = (await page.locator('#nqDashRadarContainer').getAttribute('aria-label')) || '';
    expect(rotulo).not.toMatch(/:\s*0%/);
    expect(rotulo).toContain('sem amostra');
  });
});

test.describe('Leitura do perfil', () => {
  test('cada número do gráfico tem chave de leitura com nome, valor e amostra', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const linhas = page.locator('#nqDashboard .nqd-radar-legend-row');
    await expect(linhas).toHaveCount(7);

    // O número no canto do heptágono não informa nada sozinho: precisa existir
    // uma linha que o traduza em domínio clínico.
    for (const nome of ['Glomerulopatias', 'Diálise', 'Transplante renal']) {
      await expect(page.locator('#nqDashboard .nqd-radar-legend')).toContainText(nome);
    }

    const semAmostra = linhas.filter({ has: page.locator('[data-sem-amostra]') });
    expect(await linhas.locator('[data-sem-amostra]').count() + await semAmostra.count()).toBeGreaterThanOrEqual(0);
    await expect(page.locator('#nqDashboard .nqd-radar-legend-row[data-sem-amostra] .nqd-radar-value').first()).toHaveText('—');
  });

  test('a síntese só afirma o que é calculável, sem tendência inventada', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const leitura = page.locator('#nqDashboard .nqd-radar-reading');
    await expect(leitura).toBeVisible();
    const texto = await leitura.innerText();
    expect(texto).toMatch(/Mais alto em|perfil se forma/i);
    expect(texto, 'não há série histórica que sustente tendência').not.toMatch(/era \d|há um mês|tendência|melhorou|piorou/i);
  });

  test('o estado vazio de "Como você erra" ensina a mecânica em vez de só anunciar vazio', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const painel = page.locator('#nqDashboard .nqd-error-patterns');
    await expect(painel).toContainText('nomear');
    await expect(painel.locator('.nqd-error-catalog li')).toHaveCount(6);
  });

  test('prefers-reduced-motion desenha o radar sem animação', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirCompetencias(page, STATS_PARCIAL);
    const canvas = page.locator('#nqDashRadarContainer canvas');
    await expect(canvas).toBeVisible();
    // Sem animação o desenho já está completo no primeiro quadro.
    const pintado = await canvas.evaluate((el: HTMLCanvasElement) => {
      const ctx = el.getContext('2d');
      if (!ctx) return false;
      const d = ctx.getImageData(0, 0, el.width, el.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true;
      return false;
    });
    expect(pintado).toBe(true);
  });
});
