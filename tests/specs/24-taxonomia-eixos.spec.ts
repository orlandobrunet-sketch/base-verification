import { test, expect } from '@playwright/test';

/**
 * Invariantes da taxonomia clínica (v14.53).
 *
 * Os eixos deixaram de ser agrupamento residual de categorias e passaram a ser
 * domínios clínicos. Estes cenários rodam contra o banco real e falham se o
 * recorte voltar a prometer o que não pode medir.
 *
 * Nota sobre `eval` nos page.evaluate abaixo: `topics` e `NEFRO_AXES` são
 * declarados com `const` no topo de scripts clássicos, o que cria binding
 * lexical global mas NÃO propriedade de `window` — não há como alcançá-los por
 * `window.x`. O `eval` aqui resolve um identificador fixo escrito no próprio
 * teste, sem qualquer entrada externa ou dado de usuário.
 */

async function carregar(page: import('@playwright/test').Page) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => Array.isArray((window as any).CORE_SKILLS));
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.waitForFunction(() => {
    try { return Array.isArray(eval('topics')) && eval('topics').length > 0; } catch { return false; }
  });
}

test.describe('Taxonomia clínica', () => {
  test('todo eixo é sustentado por questões que existem no banco', async ({ page }) => {
    await carregar(page);
    const vazios = await page.evaluate(() => {
      const conta: Record<string, number> = {};
      eval('topics').forEach((q: any) => { conta[q.cat] = (conta[q.cat] || 0) + 1; });
      return (window as any).CORE_SKILLS
        .map((s: any) => ({
          label: s.label,
          inexistentes: s.categories.filter((c: string) => !conta[c]),
          total: s.categories.reduce((a: number, c: string) => a + (conta[c] || 0), 0),
        }))
        .filter((s: any) => s.inexistentes.length > 0 || s.total === 0);
    });
    expect(vazios, 'nenhum eixo pode prometer uma categoria que o banco não tem').toEqual([]);
  });

  test('os eixos cobrem o banco inteiro, sem sobra nem duplicata', async ({ page }) => {
    await carregar(page);
    const r = await page.evaluate(() => {
      const conta: Record<string, number> = {};
      eval('topics').forEach((q: any) => { conta[q.cat] = (conta[q.cat] || 0) + 1; });
      const usadas = (window as any).CORE_SKILLS.flatMap((s: any) => s.categories);
      return {
        total: eval('topics').length,
        soma: usadas.reduce((a: number, c: string) => a + (conta[c] || 0), 0),
        duplicadas: usadas.filter((c: string, i: number) => usadas.indexOf(c) !== i),
        orfas: Object.keys(conta).filter(c => !usadas.includes(c)),
      };
    });
    expect(r.duplicadas, 'uma categoria não pode pertencer a dois eixos').toEqual([]);
    expect(r.orfas, 'nenhuma categoria pode ficar fora de todos os eixos').toEqual([]);
    expect(r.soma).toBe(r.total);
  });

  test('nenhum eixo é desproporcionalmente pequeno a ponto de não poder ser medido', async ({ page }) => {
    await carregar(page);
    // O eixo "Diagnóstico & Investigação" antigo tinha 31 questões (4,2% do
    // banco) e uma categoria fantasma — era anunciado e nunca media nada.
    const pequenos = await page.evaluate(() => {
      const conta: Record<string, number> = {};
      eval('topics').forEach((q: any) => { conta[q.cat] = (conta[q.cat] || 0) + 1; });
      const total = eval('topics').length;
      return (window as any).CORE_SKILLS
        .map((s: any) => ({ label: s.label, pct: s.categories.reduce((a: number, c: string) => a + (conta[c] || 0), 0) / total }))
        .filter((s: any) => s.pct < 0.05)
        .map((s: any) => s.label);
    });
    expect(pequenos).toEqual([]);
  });

  test('glomerulopatia não é medida como transplante', async ({ page }) => {
    await carregar(page);
    const eixoDeGlomerular = await page.evaluate(() =>
      (window as any).CORE_SKILLS.find((s: any) => s.categories.includes('glomerular'))?.label
    );
    expect(eixoDeGlomerular).toBe('Glomerulopatias');

    const eixoDeTransplante = await page.evaluate(() =>
      (window as any).CORE_SKILLS.find((s: any) => s.categories.includes('transplante'))
    );
    expect(eixoDeTransplante.categories, 'transplante não divide eixo com glomerulopatia').toEqual(['transplante']);
  });

  test('nenhum eixo de estudo aponta para categoria inexistente', async ({ page }) => {
    await carregar(page);
    const quebrados = await page.evaluate(() => {
      const cats = new Set(eval('topics').map((q: any) => q.cat));
      const axes = (window as any).NEFRO_AXES || eval('typeof NEFRO_AXES !== "undefined" ? NEFRO_AXES : []');
      return axes.filter((a: any) => !cats.has(a.cat)).map((a: any) => a.id);
    });
    expect(quebrados, 'o seletor de estudo não pode oferecer um tema com 0 questões').toEqual([]);
  });
});
