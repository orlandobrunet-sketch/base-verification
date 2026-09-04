import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * A barra de abas da Central no celular.
 *
 * A barra rola horizontalmente e usa uma máscara que desvanece as bordas, para
 * sinalizar "há aba fora da vista" — sem ela, a aba cortada na borda lia como
 * defeito de renderização.
 *
 * O DEFEITO: a máscara era aplicada SEMPRE, inclusive já no fim da rolagem.
 * Medido em 390px: a aba Ranking ficava sob o esmaecimento da direita com a
 * rolagem no máximo, e a Visão geral sob o da esquerda. A aba ATIVA aparecia
 * apagada pela metade — exatamente o que a máscara existia para evitar.
 *
 * Afordância que não desliga vira o defeito que ela ia resolver.
 */

const ABAS = ['overview', 'skills', 'mapa', 'achievements', 'library', 'ranking'];
const PRIMEIRA = ABAS[0];
const ULTIMA = ABAS[ABAS.length - 1];

async function abrirCentralNoCelular(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => (document as any).fonts.ready);
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible({ timeout: 15000 });
}

async function irPara(page: Page, aba: string) {
  await page.evaluate((id) => (document.querySelector(`#nqDashboard [data-dash-tab="${id}"]`) as HTMLElement)?.click(), aba);
  // A rolagem é suave; medir antes de assentar mede o meio do caminho.
  await page.waitForTimeout(1200);
}

const estado = (page: Page, aba: string) => page.evaluate((id) => {
  const nav = document.querySelector('#nqDashboard .nqd-nav') as HTMLElement;
  const btn = document.querySelector(`#nqDashboard [data-dash-tab="${id}"]`) as HTMLElement;
  const n = nav.getBoundingClientRect(); const b = btn.getBoundingClientRect();
  const fade = nav.dataset.fade || 'AUSENTE';
  const est = getComputedStyle(nav);
  const fadeEsq = parseFloat(est.paddingLeft) || 12;
  const fadeDir = 20;
  return {
    fade,
    naBordaEsquerda: b.left < n.left + fadeEsq,
    naBordaDireita: b.right > n.right - fadeDir,
    dentroDaTela: b.left >= -1 && b.right <= window.innerWidth + 1,
    rotuloVisivel: (btn.querySelector('.nqd-nav-label') as HTMLElement)?.getBoundingClientRect().right <= window.innerWidth + 1,
  };
}, aba);

test.describe('Barra de abas da Central no celular', () => {
  test('a aba ativa nunca fica sob o esmaecimento', async ({ page }) => {
    await abrirCentralNoCelular(page);

    const apagadas: string[] = [];
    for (const aba of ABAS) {
      await irPara(page, aba);
      const e = await estado(page, aba);
      const esmaecidaEsq = e.naBordaEsquerda && (e.fade === 'ambos' || e.fade === 'esquerda');
      const esmaecidaDir = e.naBordaDireita && (e.fade === 'ambos' || e.fade === 'direita');
      if (esmaecidaEsq || esmaecidaDir) apagadas.push(`${aba} (fade=${e.fade})`);
    }
    expect(apagadas, `abas ativas apagadas pela própria máscara: ${apagadas.join(', ')}`).toEqual([]);
  });

  test('no começo o esmaecimento existe só à direita', async ({ page }) => {
    await abrirCentralNoCelular(page);
    await irPara(page, PRIMEIRA);
    const e = await estado(page, PRIMEIRA);
    expect(e.fade, 'na primeira aba não há nada escondido à esquerda').toBe('direita');
  });

  test('no fim o esmaecimento existe só à esquerda', async ({ page }) => {
    await abrirCentralNoCelular(page);
    await irPara(page, ULTIMA);
    const e = await estado(page, ULTIMA);
    expect(e.fade, 'na última aba não há nada escondido à direita').toBe('esquerda');
  });

  test('no meio o esmaecimento existe dos dois lados', async ({ page }) => {
    // A contrapartida: desligar demais tira a pista de que a barra rola.
    await abrirCentralNoCelular(page);
    await irPara(page, 'mapa');
    const e = await estado(page, 'mapa');
    expect(e.fade, 'no meio há aba escondida dos dois lados').toBe('ambos');
  });

  test('a aba ativa cabe inteira na tela, com o rótulo legível', async ({ page }) => {
    await abrirCentralNoCelular(page);
    const fora: string[] = [];
    for (const aba of ABAS) {
      await irPara(page, aba);
      const e = await estado(page, aba);
      if (!e.dentroDaTela || !e.rotuloVisivel) fora.push(aba);
    }
    expect(fora, `abas ativas cortadas pela tela: ${fora.join(', ')}`).toEqual([]);
  });
});
