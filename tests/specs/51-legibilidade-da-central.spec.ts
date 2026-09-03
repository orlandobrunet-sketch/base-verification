import { test, expect, type Page } from '@playwright/test';
import { saveBase } from '../helpers/fixtures';
import { medirContraste } from '../helpers/contraste';

/**
 * Nenhum texto da Central pode ficar abaixo do mínimo legível.
 *
 * O DEFEITO: áreas de competência ainda sem amostra eram recuadas apagando a
 * linha inteira (`opacity: .62`). A opacidade não escolhe o que apaga — levou
 * junto o texto de 10,5px. Composto sobre o fundo, "01" caía a 2,92:1 e
 * "sem amostra" a 3,46:1, contra o mínimo de 4,5:1. Justo o rótulo que EXPLICA
 * o travessão era o menos legível da linha.
 *
 * E não havia opacidade que salvasse os dois lados: só a partir de .87 o texto
 * passa, e aí o recuo já não se enxerga. Opacidade era o instrumento errado.
 *
 * POR QUE ESTE TESTE E NÃO O AXE: o axe detecta isto de forma intermitente —
 * quando não consegue determinar o fundo com certeza devolve "incomplete" em
 * vez de "violation". O mesmo defeito apareceu em 2 de 3 execuções idênticas.
 * Os números, quando apareciam, eram sempre os mesmos: o defeito é constante,
 * só a detecção oscila. Aqui a medida é determinística.
 */

const SAVE = saveBase({
  level: 3, xp: 84, xpToNext: 240, score: 1682,
  streak: 2, gold: 271, correctTotal: 32, idx: 6,
  timestamp: Date.now() - 60 * 60 * 1000,
});

/* Estatística parcial de propósito: cobre áreas COM e SEM amostra na mesma
 * tela, que é exatamente onde o recuo por opacidade aparecia. */
const STATS = {
  version: 1,
  totalQuestions: 30,
  totalCorrect: 20,
  totalWrong: 10,
  byTopic: {},
  byCategory: {
    acido_base: { correct: 9, wrong: 1 },
    drc: { correct: 2, wrong: 8 },
    dialise: { correct: 5, wrong: 5 },
  },
  questionHistory: [],
  dailyActivity: {
    '2026-08-10': { count: 12, correct: 8, time: 360 },
    '2026-08-11': { count: 8, correct: 6, time: 210 },
  },
  timeStats: { totalTime: 570, questionCount: 20 },
  mostMissed: {},
  syncedMastered: [],
};

const ABAS = [
  { id: 'overview', nome: 'Visão geral' },
  { id: 'skills', nome: 'Competências' },
  { id: 'mapa', nome: 'Mapa clínico' },
  { id: 'achievements', nome: 'Conquistas' },
  { id: 'library', nome: 'Grimório' },
  { id: 'ranking', nome: 'Ranking' },
] as const;

async function abrirCentral(page: Page, comAcervo: boolean) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(async ({ save, stats, com }) => {
    localStorage.clear();
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
    const ids = ((window as any).questionBank || []).slice(0, 2).map((q: any) => String(q.id || q.qid));
    localStorage.setItem('nefroquest-sr-data', JSON.stringify({
      [ids[0]]: { due: Date.now() - 86_400_000, interval: 3, reps: 2 },
      [ids[1]]: { due: Date.now() + 86_400_000, interval: 3, reps: 2 },
    }));
    if (com) {
      // refs.js/articles.js carregam sob demanda; sem esperar, o acervo vem vazio.
      await (window as any).carregarDadosGrimorio?.();
      const total = (0, eval)('typeof nefroArticles !== "undefined" && Array.isArray(nefroArticles) ? nefroArticles.length : 0');
      if (total > 0) localStorage.setItem('unlockedArticles', JSON.stringify([0, 1, 2].filter(i => i < total)));
    }
  }, { save: SAVE, stats: STATS, com: comAcervo });
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 15_000 });
}

/**
 * O painel entra com um fade (`nqd-reveal`). Medir cor durante a transição mede
 * a transição, não o desenho — foi o que fez a mesma medição oscilar.
 */
async function esperarPainelAssentar(page: Page) {
  await page.waitForTimeout(600);
  await page.evaluate(async () => {
    const painel = document.querySelector('#nqDashboard .nqd-pane:not([hidden])') as HTMLElement | null;
    if (painel) await Promise.all(painel.getAnimations().map((a: any) => a.finished.catch(() => {})));
  });
}

const CENARIOS = [
  { largura: 1280, altura: 800, comAcervo: false },
  { largura: 1280, altura: 800, comAcervo: true },
  { largura: 390, altura: 844, comAcervo: false },
] as const;

for (const cenario of CENARIOS) {
  const rotulo = `${cenario.largura}px ${cenario.comAcervo ? 'com acervo' : 'sem acervo'}`;

  test(`todo texto da Central é legível — ${rotulo}`, async ({ page }, info) => {
    // As larguras já são fixadas aqui; rodar nos dois projetos mediria o mesmo
    // duas vezes.
    test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
    test.setTimeout(180_000);

    await page.setViewportSize({ width: cenario.largura, height: cenario.altura });
    await abrirCentral(page, cenario.comAcervo);

    const falhas: string[] = [];
    for (const aba of ABAS) {
      await page.getByRole('tab', { name: aba.nome, exact: true }).click();
      await esperarPainelAssentar(page);

      const achados = await page.evaluate(medirContraste, '#nqDashboard .nqd-pane:not([hidden])');
      for (const a of achados) {
        falhas.push(`${aba.nome}: ${a.sel} "${a.texto}" ${a.razao}:1 (mínimo ${a.exigido}:1, ${a.px}px, opacidade ${a.opacidade})`);
      }
    }

    expect(falhas, `texto abaixo do contraste mínimo em ${rotulo}:\n${falhas.join('\n')}`).toEqual([]);
  });
}
