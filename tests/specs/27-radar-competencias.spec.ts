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
  const mobileRadar = page.locator('#nqDashboard .nqd-skill-radar-mobile');
  if (await mobileRadar.isVisible()) await mobileRadar.locator('summary').click();
}

test.describe('Radar de competências', () => {
  test('o gráfico volta a existir e é desenhado', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const canvas = page.locator('#nqDashboard .nqd-radar:visible canvas');
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
    const rotulo = await page.locator('#nqDashboard .nqd-radar:visible').getAttribute('aria-label');
    expect(rotulo).toContain('Glomerulopatias');
    expect(rotulo).toContain('respostas');
    // Os eixos sem nenhuma resposta precisam ser declarados como tal.
    expect(rotulo, 'ausência de amostra tem de ser dita, não plotada como zero').toContain('sem amostra');
  });

  test('competência sem amostra nunca é descrita como zero por cento', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const rotulo = (await page.locator('#nqDashboard .nqd-radar:visible').getAttribute('aria-label')) || '';
    // Nenhum eixo pode aparecer como "0%" — o que não foi medido é "sem amostra".
    expect(rotulo).not.toMatch(/:\s*0%/);
  });

  test('o radar acompanha os sete eixos clínicos, não o recorte antigo de cinco', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const rotulo = (await page.locator('#nqDashboard .nqd-radar:visible').getAttribute('aria-label')) || '';
    for (const eixo of ['Glomerulopatias', 'Diálise', 'Transplante renal']) {
      expect(rotulo, `o eixo ${eixo} precisa estar no perfil`).toContain(eixo);
    }
    expect(rotulo, 'o agrupamento antigo não pode voltar').not.toContain('Fisiopatologia & Pesquisa');
  });

  test('sem amostra não mostra gráfico nem sete indicadores vazios', async ({ page }) => {
    await abrirCompetencias(page, { totalQuestions: 0, totalCorrect: 0, totalWrong: 0, byCategory: {}, dailyActivity: {} });
    await expect(page.locator('#nqDashboard .nqd-radar')).toHaveCount(0);
    await expect(page.locator('#nqDashboard .nqd-skill-row')).toHaveCount(0);
    await expect(page.locator('#nqDashboard .nqd-skill-empty')).toContainText('Nenhuma área é tratada como desempenho zero');
    await page.locator('#nqDashboard .nqd-skill-unmeasured-group summary').click();
    await expect(page.locator('#nqDashboard .nqd-skill-unmeasured')).toHaveCount(7);
  });
});

test.describe('Leitura do perfil', () => {
  test('a lista é principal e mantém os dados e áreas sem amostra sem legenda duplicada', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    await expect(page.locator('#nqDashboard .nqd-skill-row')).toHaveCount(4);
    await expect(page.locator('#nqDashboard .nqd-radar-legend-row')).toHaveCount(0);
    await page.locator('#nqDashboard .nqd-skill-unmeasured-group summary').click();
    await expect(page.locator('#nqDashboard .nqd-skill-unmeasured')).toHaveCount(3);
    await expect(page.locator('#nqDashboard .nqd-skill-list')).toContainText('Diálise');
    await expect(page.locator('#nqDashboard .nqd-skill-list')).toContainText('respostas');
  });

  test('o perfil visual parcial não anuncia tendência nem certeza completa', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const leitura = page.locator('#nqDashboard .nqd-skill-radar-side:visible, #nqDashboard .nqd-skill-radar-mobile-body:visible').first();
    await expect(leitura).toBeVisible();
    const texto = await leitura.innerText();
    expect(texto).toContain('não representa o perfil completo');
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
    const canvas = page.locator('#nqDashboard .nqd-radar:visible canvas');
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

  test('o perfil com dados preserva acessibilidade no desktop e celular', async ({ page }) => {
    await abrirCompetencias(page, STATS_PARCIAL);
    const results = await new AxeBuilder({ page }).include('#nqDashboard').analyze();
    const blocking = results.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical');
    expect(blocking, blocking.map(violation => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
  });
});
