import { test, expect, Page } from '@playwright/test';

/**
 * Saúde do classificador de competências (v14.58).
 *
 * 413 de 607 keywords nunca casavam com questão alguma — quase todas do padrão
 * "conceito + sufixo de categoria" ('ieca hipertensao', 'tacrolimus farm',
 * 'cvvh ') que não ocorre em prosa clínica. O efeito era o Mapa dar nome
 * clínico específico a baldes genéricos: "Metas de PA na DRC" concentrava 93%
 * de tudo que é hipertensão, incluindo emergência hipertensiva e
 * hiperaldosteronismo.
 *
 * Estes cenários rodam o classificador real sobre as 742 questões e impedem
 * que a situação regrida. Os limiares são tetos do estado atual, não metas
 * arbitrárias: apertam conforme a curadoria avança.
 *
 * Nota sobre `eval`: `topics` e `NQ_COMPETENCIES` são `const` no topo de
 * scripts clássicos — binding lexical global, não propriedade de `window`.
 * O eval resolve um identificador fixo escrito aqui, sem entrada externa.
 */

async function carregar(page: Page) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any)._nqMatchComps === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.waitForFunction(() => {
    try { return Array.isArray(eval('topics')) && eval('topics').length > 0; } catch { return false; }
  });
}

async function medir(page: Page) {
  return page.evaluate(() => {
    const norm = (window as any)._nqNorm;
    const match = (window as any)._nqMatchComps;
    const COMPS = eval('NQ_COMPETENCIES');
    const TOPICS = eval('topics');

    const porCat: Record<string, string[]> = {};
    TOPICS.forEach((q: any) => {
      (porCat[q.cat] = porCat[q.cat] || []).push(norm(`${q.t} ${q.q}`));
    });

    let fallback = 0, total = 0;
    const contagem: Record<string, number> = {};
    TOPICS.forEach((q: any) => {
      match(norm(`${q.t} ${q.q}`), q.cat).forEach((id: string) => {
        total++;
        contagem[id] = (contagem[id] || 0) + 1;
        if ((COMPS.find((c: any) => c.id === id) || {}).fallback) fallback++;
      });
    });

    // Competência ESPECÍFICA cujas keywords, todas elas, não casam com nada da
    // categoria. Fallback fica de fora: `_nqMatchComps` o escolhe por ser
    // fallback e nunca lê suas keywords, então "morta" ali não descreve
    // defeito nenhum — misturar os dois inflava a conta com casos que
    // curadoria não alcança e escondia os que ela alcança.
    const totalmenteMortas = COMPS.filter((c: any) => {
      if (c.fallback) return false;
      const pool = porCat[c.cat] || [];
      return c.keywords.every((k: string) => !pool.some(txt => txt.includes(norm(k))));
    }).map((c: any) => c.label);

    return {
      fallback, total,
      pct: fallback / total,
      inalcancaveis: COMPS.filter((c: any) => !contagem[c.id]).map((c: any) => c.label),
      totalmenteMortas,
    };
  });
}

test.describe('Classificador de competências', () => {
  test('a maioria das atribuições não cai mais no balde genérico', async ({ page }) => {
    await carregar(page);
    const r = await medir(page);
    // Teto do estado atual (43%). Era 49% antes da curadoria da DRC e 56% antes
    // da purga original. O teto acompanha a curadoria: cada tema alcançado tira
    // questão do balde genérico e o número só desce.
    expect(r.pct, `fallback em ${(r.pct * 100).toFixed(0)}% de ${r.total} atribuições`).toBeLessThanOrEqual(0.44);
  });

  test('nenhuma competência tem 100% das keywords mortas', async ({ page }) => {
    await carregar(page);
    const r = await medir(page);
    // Zero. O teto era 9 e agora o teste finalmente afirma o que o nome diz,
    // porque a métrica passou a contar só competência específica.
    //
    // Os três temas que sobravam sem conserto por keyword saíram por decisão do
    // dono, aplicando um princípio só: imunossupressão não é tema em si.
    //  - em transplante e glomerulopatias os fallbacks se chamavam
    //    "Imunossupressão ..." e recebiam xenotransplante, perfusão de órgão,
    //    aparelho justaglomerular e proteinúria em fita. Foram renomeados para
    //    o que de fato são;
    //  - em farmacologia o tema foi removido: onde a droga importa, ela
    //    pertence à doença.
    //
    // Zero é teto rígido de propósito. Competência específica que não alcança
    // uma questão sequer é tema que o Mapa anuncia ao médico e nunca mede.
    expect(r.totalmenteMortas.length,
      `competências específicas sem nenhuma keyword viva: ${r.totalmenteMortas.join(', ')}`).toBe(0);
  });

  test('o número de temas inalcançáveis não volta a crescer', async ({ page }) => {
    await carregar(page);
    const r = await medir(page);
    // Zero, contra 4. Dois foram alcançados por curadoria (Controle de PA e
    // SRAA na ND, Doenças tubulointersticiais) e dois saíram por não terem
    // conteúdo na categoria. Nenhum tema do Mapa fica sem uma única questão.
    expect(r.inalcancaveis.length,
      `temas sem nenhuma questão: ${r.inalcancaveis.join(', ')}`).toBe(0);
  });

  test('hipertensão deixou de concentrar quase tudo num único balde', async ({ page }) => {
    await carregar(page);
    const dist = await page.evaluate(() => {
      const norm = (window as any)._nqNorm;
      const match = (window as any)._nqMatchComps;
      const COMPS = eval('NQ_COMPETENCIES');
      const n: Record<string, number> = {};
      eval('topics').filter((q: any) => q.cat === 'hipertensao').forEach((q: any) => {
        match(norm(`${q.t} ${q.q}`), 'hipertensao').forEach((id: string) => { n[id] = (n[id] || 0) + 1; });
      });
      const fb = COMPS.find((c: any) => c.cat === 'hipertensao' && c.fallback);
      const totalCat = eval('topics').filter((q: any) => q.cat === 'hipertensao').length;
      return { noFallback: n[fb.id] || 0, totalCat };
    });
    // Antes: 25 de 27 (93%). O balde não pode voltar a engolir a categoria.
    expect(dist.noFallback / dist.totalCat).toBeLessThan(0.5);
  });
});
