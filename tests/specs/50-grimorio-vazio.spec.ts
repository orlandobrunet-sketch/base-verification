import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * O Grimório vazio dizia a mesma coisa três vezes.
 *
 * Com acervo zerado a aba mostrava, em sequência:
 *   "Seu Grimório começa vazio"            (resumo)
 *   "0 pergaminhos · 0 fontes clínicas"    (contagem)
 *   "Sua primeira descoberta acenderá esta estante."  (estante)
 *   "Seu Grimório aguarda a primeira descoberta."     (acervo)
 *
 * Mais uma estante desenhada sem nada dentro, que aparecia como uma barra
 * cinza solta e lia como elemento quebrado.
 *
 * Repetir a mesma ausência em três vozes não informa mais — faz a tela parecer
 * defeituosa. Vazio passa a falar uma vez só, no único bloco que oferece ação.
 */

const CHAVES_DE_ACERVO = ['unlockedArticles', 'nq-unlocked-refs', 'nq-bib-favorites'];

async function abrirGrimorio(page: Page, comAcervo: boolean) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
  await page.evaluate(async ({ chaves, com }) => {
    const g = window as any;
    await g._loadTopics?.();
    // refs.js e articles.js carregam separados e sob demanda (620 KB fora do
    // caminho crítico). Sem esperar por eles, refsDB nem existe e o acervo
    // aparece vazio mesmo com a chave semeada.
    await g.carregarDadosGrimorio?.();
    if (com) {
      /* Semeia referências que ALGUMA QUESTÃO cita.
       *
       * O acervo só conta refs alcançáveis pelo banco — pegar chaves quaisquer
       * de refsDB produzia acervo vazio e fazia este cenário falhar sem que o
       * produto tivesse defeito. */
      // `refsDB` é declarado com `const` em data/refs.js, e const NÃO vira
      // propriedade de window — só existe como variável global nua. Por isso o
      // próprio app testa `typeof refsDB`, e não `window.refsDB`. Ler pelo
      // window devolvia undefined e o acervo aparecia vazio mesmo semeado.
      const base = (0, eval)('typeof refsDB === "object" ? refsDB : null');
      const citadas = new Set<string>();
      for (const q of (g.questionBank || [])) {
        for (const r of (q.refs || [])) if (base && base[r]) citadas.add(r);
        if (citadas.size >= 4) break;
      }
      localStorage.setItem('nq-unlocked-refs', JSON.stringify([...citadas]));
      // Artigos são índices em nefroArticles — outro caminho para o acervo.
      const artigos = (0, eval)('typeof nefroArticles !== "undefined" && Array.isArray(nefroArticles) ? nefroArticles.length : 0');
      if (artigos > 0) localStorage.setItem('unlockedArticles', JSON.stringify([0, 1, 2].filter((i) => i < artigos)));
    } else {
      chaves.forEach((c: string) => localStorage.removeItem(c));
    }
  }, { chaves: CHAVES_DE_ACERVO, com: comAcervo });
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => (document.querySelector('#nqDashboard [data-dash-tab="library"]') as HTMLElement)?.click());
  await page.waitForTimeout(800);
}

const textoDoPainel = (page: Page) =>
  page.locator('#nqdPane-library').innerText();

test.describe('Grimório vazio', () => {
  test('a ausência é dita uma vez só', async ({ page }) => {
    await abrirGrimorio(page, false);
    const texto = await textoDoPainel(page);

    const anuncios = [
      /começa vazio/i,
      /acenderá esta estante/i,
      /aguarda a primeira descoberta/i,
    ].filter((r) => r.test(texto));

    expect(
      anuncios.length,
      `o vazio foi anunciado ${anuncios.length} vezes no mesmo painel`,
    ).toBe(1);
  });

  test('vazio não mostra contagem de zeros nem estante sem nada', async ({ page }) => {
    await abrirGrimorio(page, false);
    const painel = page.locator('#nqdPane-library');

    await expect(painel.locator('.nqd-library-summary'), 'resumo de zeros não deve existir').toHaveCount(0);
    await expect(painel.locator('.nqd-library-shelf'), 'estante vazia parecia elemento quebrado').toHaveCount(0);
    await expect(painel, 'não anunciar "0 pergaminhos"').not.toContainText(/0 pergaminhos/i);
  });

  test('vazio mantém a ação de sair dali', async ({ page }) => {
    // Tirar as vozes repetidas não pode tirar a porta de saída.
    await abrirGrimorio(page, false);
    const painel = page.locator('#nqdPane-library');
    await expect(painel.locator('[data-library-empty]')).toHaveCount(1);
    await expect(painel.locator('[data-library-empty] button')).toHaveCount(1);
  });

  test('com acervo, o resumo e a estante voltam', async ({ page }) => {
    // A contrapartida: esconder o resumo no vazio não pode escondê-lo sempre.
    await abrirGrimorio(page, true);
    const painel = page.locator('#nqdPane-library');
    await expect(painel.locator('.nqd-library-summary'), 'com acervo o resumo precisa aparecer').toHaveCount(1);
    await expect(painel.locator('.nqd-library-shelf'), 'com acervo a estante precisa aparecer').toHaveCount(1);
    await expect(painel).not.toContainText(/começa vazio/i);
  });
});
