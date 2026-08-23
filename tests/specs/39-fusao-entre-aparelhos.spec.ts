import { test, expect, type Page } from '@playwright/test';

/**
 * NQ-01, segundo eixo: dois aparelhos não apagam o melhor histórico.
 *
 * A fusão de estatísticas detalhadas dizia "local prevalece se existir". Bastava
 * o segundo aparelho ter UMA questão respondida para descartar inteiro o
 * histórico da nuvem — e o sync seguinte subia a versão pobre por cima da rica.
 *
 * A fusão nova é monotônica (nada anda para trás) e comutativa (a ordem de
 * sincronização não muda o resultado). Contadores usam máximo, conjuntos usam
 * união, e o questionHistory — a única parte do payload com identidade de
 * evento, qid mais data — usa união exata por evento.
 */

async function abrirApp(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any)._mergeDetailedStats === 'function');
}

const APARELHO_RICO = {
  schemaVersion: 1,
  totalQuestions: 300, totalCorrect: 240, totalWrong: 60,
  byTopic: { 'Glomerulopatias': { correct: 80, wrong: 20 }, 'Diálise': { correct: 60, wrong: 15 } },
  byCategory: { glomerular: { correct: 80, wrong: 20 } },
  dailyActivity: { '2026-08-20': 40, '2026-08-21': 55 },
  mostMissed: { '1e5e88e9': 7 },
  timeStats: { totalTime: 9000, questionCount: 300 },
  questionHistory: [
    { qid: '1e5e88e9', topic: 'Diálise', correct: true, time: 30, date: '2026-08-21T10:00:00.000Z' },
    { qid: '66b811c3', topic: 'Diálise', correct: false, time: 44, date: '2026-08-20T10:00:00.000Z' },
  ],
  syncedMastered: ['1e5e88e9'],
};

const APARELHO_POBRE = {
  schemaVersion: 1,
  totalQuestions: 2, totalCorrect: 1, totalWrong: 1,
  byTopic: { 'Transplante': { correct: 1, wrong: 1 } },
  byCategory: { transplante: { correct: 1, wrong: 1 } },
  dailyActivity: { '2026-08-22': 2 },
  mostMissed: { 'c6c8ab22': 1 },
  timeStats: { totalTime: 70, questionCount: 2 },
  questionHistory: [
    { qid: 'c6c8ab22', topic: 'Transplante', correct: false, time: 40, date: '2026-08-22T09:00:00.000Z' },
  ],
  syncedMastered: [],
};

test.describe('Fusão de progresso entre dois aparelhos', () => {
  test('o aparelho pobre não apaga o histórico do rico', async ({ page }) => {
    await abrirApp(page);

    const r = await page.evaluate(({ rico, pobre }) => {
      // O aparelho pobre é o LOCAL; o rico veio da nuvem. É o cenário que
      // perdia tudo: local não-vazio descartava a nuvem inteira.
      const f = (window as any)._mergeDetailedStats(pobre, rico);
      return {
        totalQuestions: f.totalQuestions,
        totalCorrect: f.totalCorrect,
        topicos: Object.keys(f.byTopic).sort(),
        dias: Object.keys(f.dailyActivity).sort(),
        historico: f.questionHistory.length,
        tempo: f.timeStats.totalTime,
        dominadas: f.syncedMastered,
      };
    }, { rico: APARELHO_RICO, pobre: APARELHO_POBRE });

    expect(r.totalQuestions, 'o total não pode cair para o do aparelho pobre').toBe(300);
    expect(r.totalCorrect).toBe(240);
    expect(r.tempo).toBe(9000);
    // Os tópicos dos DOIS aparelhos sobrevivem — nenhum lado é descartado.
    expect(r.topicos).toEqual(['Diálise', 'Glomerulopatias', 'Transplante']);
    expect(r.dias).toEqual(['2026-08-20', '2026-08-21', '2026-08-22']);
    expect(r.historico, 'os três eventos distintos precisam sobreviver').toBe(3);
    expect(r.dominadas).toEqual(['1e5e88e9']);
  });

  test('a ordem da sincronização não muda o resultado', async ({ page }) => {
    await abrirApp(page);

    const iguais = await page.evaluate(({ rico, pobre }) => {
      const merge = (window as any)._mergeDetailedStats;
      return JSON.stringify(merge(pobre, rico)) === JSON.stringify(merge(rico, pobre));
    }, { rico: APARELHO_RICO, pobre: APARELHO_POBRE });

    expect(iguais, 'fundir A com B tem de dar o mesmo que fundir B com A').toBe(true);
  });

  test('fundir de novo não muda nada — sincronizar duas vezes não infla o histórico', async ({ page }) => {
    await abrirApp(page);

    const estavel = await page.evaluate(({ rico, pobre }) => {
      const merge = (window as any)._mergeDetailedStats;
      const uma = merge(pobre, rico);
      const duas = merge(uma, rico);
      const tres = merge(duas, rico);
      return JSON.stringify(uma) === JSON.stringify(duas) && JSON.stringify(duas) === JSON.stringify(tres);
    }, { rico: APARELHO_RICO, pobre: APARELHO_POBRE });

    expect(estavel, 'sincronizações repetidas precisam convergir, não acumular').toBe(true);
  });

  test('nenhum contador da fusão é menor que o de qualquer um dos lados', async ({ page }) => {
    await abrirApp(page);

    // A propriedade que importa, afirmada como propriedade e não como exemplo:
    // o histórico nunca anda para trás, campo a campo.
    const rebaixados = await page.evaluate(({ rico, pobre }) => {
      const f = (window as any)._mergeDetailedStats(pobre, rico);
      const problemas: string[] = [];
      for (const campo of ['totalQuestions', 'totalCorrect', 'totalWrong']) {
        const maior = Math.max((rico as any)[campo], (pobre as any)[campo]);
        if (f[campo] < maior) problemas.push(`${campo}: ${f[campo]} < ${maior}`);
      }
      for (const [dia, valor] of Object.entries({ ...rico.dailyActivity, ...pobre.dailyActivity })) {
        if ((f.dailyActivity[dia] ?? 0) < (valor as number)) problemas.push(`dia ${dia}`);
      }
      if (f.timeStats.totalTime < Math.max(rico.timeStats.totalTime, pobre.timeStats.totalTime)) problemas.push('timeStats.totalTime');
      return problemas;
    }, { rico: APARELHO_RICO, pobre: APARELHO_POBRE });

    expect(rebaixados, `campos rebaixados pela fusão: ${rebaixados.join(', ')}`).toEqual([]);
  });

  test('o caminho real da sincronização usa a fusão, não a regra antiga', async ({ page }) => {
    await abrirApp(page);

    // Os cenários acima exercitam a função pura. Este exercita a LIGAÇÃO dela
    // em _mergeCloudProgress, que é onde o defeito vivia: a função podia estar
    // perfeita e o ponto de uso continuar dizendo "local prevalece se existir".
    // Sem este cenário, devolver a regra antiga passa despercebido — verificado.
    const depois = await page.evaluate(({ rico, pobre }) => {
      localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(pobre));
      (window as any)._mergeCloudProgress({ detailedStats: rico });
      return JSON.parse(localStorage.getItem('nefroquest-detailed-stats') || '{}');
    }, { rico: APARELHO_RICO, pobre: APARELHO_POBRE });

    expect(depois.totalQuestions, 'o caminho real descartou o histórico da nuvem').toBe(300);
    expect(Object.keys(depois.byTopic).sort()).toEqual(['Diálise', 'Glomerulopatias', 'Transplante']);
  });

  test('a fusão não inventa progresso somando o que os dois já tinham', async ({ page }) => {
    await abrirApp(page);

    // A contrapartida da regra acima. Somar contadores contaria duas vezes a
    // base comum, e inventar progresso é pior que subestimar.
    const total = await page.evaluate(({ rico, pobre }) => {
      return (window as any)._mergeDetailedStats(pobre, rico).totalQuestions;
    }, { rico: APARELHO_RICO, pobre: APARELHO_POBRE });

    expect(total, 'a fusão não pode somar 300 + 2').toBe(300);
  });
});
