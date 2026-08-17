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

    // Competência cujas keywords, todas elas, não casam com nada da categoria
    const totalmenteMortas = COMPS.filter((c: any) => {
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
    // Teto do estado atual (49%). Era 56% antes da purga.
    expect(r.pct, `fallback em ${(r.pct * 100).toFixed(0)}% de ${r.total} atribuições`).toBeLessThanOrEqual(0.50);
  });

  test('nenhuma competência tem 100% das keywords mortas', async ({ page }) => {
    await carregar(page);
    const r = await medir(page);
    // Teto do estado atual: 7, contra 9 antes desta curadoria e 11 antes da
    // purga. As sete restantes NÃO são do mesmo tipo, e a distinção decide o
    // que ainda é curável por keyword — nada disto era visível quando a lista
    // foi escrita como fila única de curadoria.
    //
    // CINCO SÃO O FALLBACK da própria categoria. `_nqMatchComps` filtra por
    // `!c.fallback` antes de olhar keyword alguma, então a keyword de um
    // fallback nunca é consultada. Estar "100% morta" ali é verdade trivial:
    // reescrevê-las não muda uma única atribuição. O que resolve é o fallback
    // deixar de carregar nome clínico específico — decisão de produto, porque
    // muda o que o Mapa diz ao médico:
    //
    //   glomerular       · Imunossupressão em glomerulopatias
    //   transplante      · Imunossupressão pós-transplante
    //   genetica         · Outras doenças genéticas renais
    //   nefrologia_geral · Semiologia renal e propedêutica
    //   uti              · LRA e TRS no paciente crítico
    //
    // DUAS SÃO ESPECÍFICAS, e nelas o problema não é a keyword: é que a
    // categoria não tem a questão. `uti` tem 17 questões, todas de LRA/TRS,
    // nenhuma de eletrólitos; `farmacologia` não tem questão de
    // imunossupressor — as que existem estão em glomerular e transplante.
    // Nenhuma palavra escrita aqui alcança conteúdo que não existe:
    //
    //   farmacologia · Imunossupressores: uso e toxicidade
    //   uti          · Distúrbios eletrolíticos no paciente crítico
    expect(r.totalmenteMortas.length,
      `competências sem nenhuma keyword viva: ${r.totalmenteMortas.join(', ')}`).toBeLessThanOrEqual(7);
  });

  test('o número de temas inalcançáveis não volta a crescer', async ({ page }) => {
    await carregar(page);
    const r = await medir(page);
    // Desceu de 4 para 2: "Controle de PA e SRAA na ND" e "Doenças
    // tubulointersticiais" passaram a ser alcançados. Os 2 restantes são os
    // dois temas cuja categoria não tem a questão — o teto só desce quando o
    // conteúdo existir, não por keyword nova.
    expect(r.inalcancaveis.length,
      `temas sem nenhuma questão: ${r.inalcancaveis.join(', ')}`).toBeLessThanOrEqual(2);
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
