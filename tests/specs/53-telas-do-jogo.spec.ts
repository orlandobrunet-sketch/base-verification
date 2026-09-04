import { test, expect, type Page } from '@playwright/test';
import { injectGameState, injectBossState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
import { medirGeometria } from '../helpers/geometria';

/**
 * As telas onde se joga: pergunta, feedback e confronto final.
 *
 * O DEFEITO MAIOR estava no chefe em 390px. Uma regra de grid marcada como
 * "(desktop)" no próprio comentário nunca foi restrita a desktop: ficou no
 * nível superior, com !important. Em 390px ela pedia 380 + 1fr + 80 = 460px de
 * colunas dentro de 374px úteis. O excesso empurrava o painel para -39px e a
 * borda esquerda da tela comia o começo de cada linha — o enunciado chegava
 * como "o planejar o acesso", "oença renal", "emodiálise", "DOQI atual".
 *
 * A pergunta clínica do confronto final chegava truncada no celular.
 *
 * Os outros: o crachá da referência era branco fixo sobre uma cor vinda dos
 * dados (2,54:1 no verde esmeralda); o ano herdava o acento cru (3,9:1); o
 * contador de questões tinha opacity 0,65 inline; e o play/pause do cronômetro
 * media 18x18 num controle usado durante a partida.
 */

/** Espera só o que termina: o jogo tem animações em laço infinito. */
async function assentar(page: Page) {
  await page.waitForTimeout(900);
  await page.evaluate(async () => {
    const finitas = document.getAnimations().filter((a: any) => {
      const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming().iterations : 1;
      return t !== Infinity;
    });
    await Promise.race([
      Promise.all(finitas.map((a: any) => a.finished.catch(() => {}))),
      new Promise((res) => setTimeout(res, 3000)),
    ]);
  }).catch(() => {});
}

/**
 * Rodapé e legendas soltas ficam de fora do critério de alvo de toque: são
 * links dentro de uma linha de texto, que a própria norma isenta (WCAG 2.5.8,
 * exceção "inline"). Medi-los só produzia ruído recorrente.
 */
const RUIDO = /nefroquest\.com|Política de Privacidade|Aplicativo/i;

test.describe('Telas do jogo', () => {
  test('o confronto final cabe na tela do celular', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await injectBossState(page);
    await page.waitForLoadState('load');
    await assentar(page);

    const medidas = await page.evaluate(() => {
      const caixa = (sel: string) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { esquerda: Math.round(r.left), direita: Math.round(r.right) };
      };
      return {
        painel: caixa('section.panel.right'),
        pergunta: caixa('.qbox'),
        opcoes: caixa('.options'),
        janela: window.innerWidth,
      };
    });

    for (const [nome, m] of Object.entries(medidas)) {
      if (!m || typeof m === 'number') continue;
      expect(m.esquerda, `${nome} começa fora da tela pela esquerda — o texto chega cortado`).toBeGreaterThanOrEqual(0);
      expect(m.direita, `${nome} termina fora da tela pela direita`).toBeLessThanOrEqual(medidas.janela);
    }
  });

  for (const largura of [1280, 390]) {
    test(`pergunta e feedback legíveis em ${largura}px`, async ({ page }, info) => {
      test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
      test.setTimeout(300_000);
      await page.setViewportSize({ width: largura, height: largura === 390 ? 844 : 800 });
      await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
      await injectGameState(page);
      await page.waitForLoadState('load');
      await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15_000 });
      await assentar(page);

      const falhas: string[] = [];
      const colher = async (etapa: string) => {
        for (const c of await page.evaluate(medirContraste, '#mainApp')) {
          if (RUIDO.test(c.texto)) continue;
          falhas.push(`${etapa}: "${c.texto}" ${c.razao}:1 (mínimo ${c.exigido}:1, ${c.px}px)`);
        }
        for (const g of await page.evaluate(medirGeometria, '#mainApp')) {
          if (RUIDO.test(g.texto)) continue;
          falhas.push(`${etapa}: ${g.tipo} em ${g.sel} (${g.detalhe}) "${g.texto}"`);
        }
      };

      await colher('pergunta');
      // Responder revela o cartão de referência, que só existe depois disso.
      await page.evaluate(() => (document.querySelector('#options .opt, .opt') as HTMLElement)?.click());
      await assentar(page);
      await colher('feedback');

      expect(falhas, `defeitos medidos em ${largura}px:\n${falhas.join('\n')}`).toEqual([]);
    });
  }

});
