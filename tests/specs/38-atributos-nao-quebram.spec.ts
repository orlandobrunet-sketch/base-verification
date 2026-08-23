import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * "Atributos Totais" é uma linha de quatro distintivos — ataque, defesa,
 * conhecimento e sorte — dentro de um contêiner flex. Reportado com captura de
 * tela: o de Conhecimento aparecia com o ícone numa linha e o número na outra.
 *
 * O MECANISMO, medido e não suposto: a regra do distintivo declarava
 * `min-width: 2.1rem`. Um item flex normalmente não encolhe abaixo do próprio
 * conteúdo, porque o mínimo automático o protege — mas declarar `min-width`
 * SUBSTITUI esse mínimo automático. A partir daí, conteúdo mais largo que
 * 2.1rem é espremido, e o texto quebra na única oportunidade que tem: entre o
 * emoji e o número.
 *
 * Por isso aparecia primeiro no de Conhecimento, e por isso não reproduzia no
 * ambiente de teste: a largura do emoji depende da fonte do sistema. Nenhuma
 * largura de viewport reproduzia — de 1600px a 320px, nada. O que reproduz é
 * conteúdo mais largo que o mínimo declarado, que é o que a fonte de emoji do
 * Windows produz e a do runner não.
 *
 * O segundo cenário abaixo força essa condição de propósito, para o teste
 * guardar em qualquer sistema em vez de depender da fonte instalada.
 */

async function abrirJogo(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.equip-total-attributes .stat-badge').first()).toBeVisible({ timeout: 10000 });
}

// Um distintivo espremido abaixo do próprio conteúdo é a condição que força a
// quebra de linha. Meia unidade de tolerância cobre arredondamento subpixel.
const MEDIR_ESPREMIDOS = (els: Element[]) => els
  .filter((el) => el.getBoundingClientRect().width + 0.5 < el.scrollWidth)
  .map((el) => el.textContent?.trim().slice(0, 8) ?? '?');

const MEDIR_QUEBRADOS = (els: Element[]) => els
  .map((el) => {
    const estilo = getComputedStyle(el);
    const alturaDeLinha = parseFloat(estilo.lineHeight) || parseFloat(estilo.fontSize) * 1.2;
    const alturaDoConteudo = el.clientHeight
      - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
    return { texto: el.textContent?.trim().slice(0, 8) ?? '', razao: alturaDoConteudo / alturaDeLinha };
  })
  .filter((d) => d.razao > 1.6)
  .map((d) => `${d.texto} (${d.razao.toFixed(2)}x)`);

test.describe('Atributos Totais', () => {
  test('com os valores reais, nenhum distintivo quebra nem é espremido', async ({ page }) => {
    await abrirJogo(page);
    const distintivos = page.locator('.equip-total-attributes .stat-badge');
    expect(await distintivos.count(), 'precisa haver distintivos para medir').toBeGreaterThan(1);

    const espremidos = await distintivos.evaluateAll(MEDIR_ESPREMIDOS);
    const quebrados = await distintivos.evaluateAll(MEDIR_QUEBRADOS);
    expect(espremidos, `espremidos abaixo do conteúdo: ${espremidos.join(', ')}`).toEqual([]);
    expect(quebrados, `quebrando em duas linhas: ${quebrados.join(', ')}`).toEqual([]);
  });

  test('conteúdo mais largo que o mínimo declarado não espreme o distintivo', async ({ page }) => {
    await abrirJogo(page);

    // Este é o cenário que guarda. Sem `flex-shrink: 0` e `white-space: nowrap`,
    // qualquer conteúdo acima de 2.1rem é espremido aqui — verificado removendo
    // as duas declarações: os quatro distintivos passam a aparecer espremidos.
    const { espremidos, quebrados } = await page.evaluate(() => {
      const caixa = document.querySelector('.equip-total-attributes') as HTMLElement;
      const els = Array.from(caixa.querySelectorAll('.stat-badge')) as HTMLElement[];
      const originais = els.map((el) => el.firstChild?.nodeValue ?? '');
      // Emula uma fonte de emoji mais larga alargando o texto, sem tocar no CSS.
      els.forEach((el) => { if (el.firstChild) el.firstChild.nodeValue = '⚔️1333'; });
      void caixa.offsetHeight;

      const medirEspremidos = (nos: HTMLElement[]) => nos
        .filter((el) => el.getBoundingClientRect().width + 0.5 < el.scrollWidth)
        .map((el) => el.textContent?.trim().slice(0, 8) ?? '?');
      const medirQuebrados = (nos: HTMLElement[]) => nos
        .map((el) => {
          const s = getComputedStyle(el);
          const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.2;
          const h = el.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
          return { texto: el.textContent?.trim().slice(0, 8) ?? '', razao: h / lh };
        })
        .filter((d) => d.razao > 1.6)
        .map((d) => `${d.texto} (${d.razao.toFixed(2)}x)`);

      const resultado = { espremidos: medirEspremidos(els), quebrados: medirQuebrados(els) };
      els.forEach((el, i) => { if (el.firstChild) el.firstChild.nodeValue = originais[i]; });
      return resultado;
    });

    expect(espremidos, `com conteúdo largo, espremidos: ${espremidos.join(', ')}`).toEqual([]);
    expect(quebrados, `com conteúdo largo, quebrados: ${quebrados.join(', ')}`).toEqual([]);
  });
});
