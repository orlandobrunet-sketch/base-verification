import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * Quem aumenta a fonte do navegador perdia metade da Central.
 *
 * O contêiner da Central trazia `min-width: 20rem` com `overflow: hidden`
 * logo abaixo. Em `rem`, esse piso ACOMPANHA O TEXTO: a 16px vale 320px, e a
 * 200% vale 640px — dentro de uma tela de 390. O excesso era cortado, e sem
 * rolagem para alcançá-lo.
 *
 * Medido antes: "Sala de Condut…", "Dr. Glome…", "Uma decisão clara para
 * cont…". 52 elementos transbordando; o conteúdo simplesmente sumia.
 *
 * O piso existe para proteger de VIEWPORT estreito, não para escalar com a
 * fonte — então passou a px. Depois: 4 elementos, e nenhum texto perdido.
 *
 * Aumentar a fonte no navegador é o ajuste de acessibilidade mais comum que
 * existe. É o caminho de quem enxerga pouco, e era justamente quem a Central
 * deixava de fora.
 */

test.use({ serviceWorkers: 'block' });

async function abrir(page: Page, largura: number, escalaDoTexto: number) {
  await page.setViewportSize({ width: largura, height: largura <= 360 ? 568 : 844 });
  await page.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort()));
  if (escalaDoTexto !== 1) {
    // É assim que o navegador aplica "tamanho da fonte" a layout em rem.
    await page.addInitScript((escala) => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = 16 * (escala as number) + 'px';
      });
    }, escalaDoTexto);
  }
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => (document as any).fonts?.ready);
  await page.evaluate(() => (window as any).openDashboard?.());
  await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 25000 });
  await page.waitForTimeout(600);
}

const larguraDaCentral = (page: Page) => page.evaluate(() => {
  const el = document.querySelector('#nqDashboard') as HTMLElement | null;
  return el ? Math.round(el.getBoundingClientRect().width) : -1;
});

test.describe('Texto ampliado não corta a Central', () => {
  test('a 200%, a Central continua cabendo na tela', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Uma medição basta para o contrato.');
    test.setTimeout(180000);
    await abrir(page, 390, 2);

    const largura = await larguraDaCentral(page);
    expect(largura, `a Central ocupa ${largura}px numa tela de 390`).toBeLessThanOrEqual(392);

    // E o que o corte fazia sumir precisa estar legível.
    const painel = page.locator('#nqdPane-overview');
    await expect(painel).toContainText('Sala de Conduta');
    await expect(painel).toContainText(/continuar aprendendo/i);
  });

  test('a 100%, nada muda — o piso segue protegendo tela estreita', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Uma medição basta para o contrato.');
    test.setTimeout(180000);
    /* A contrapartida: trocar rem por px não pode desfazer a proteção contra
     * viewport minúsculo, que é o motivo de o piso existir. */
    await abrir(page, 320, 1);
    const largura = await larguraDaCentral(page);
    expect(largura, 'o piso de 320px deixou de valer').toBeGreaterThanOrEqual(320);
    expect(largura).toBeLessThanOrEqual(322);
    await expect(page.locator('#nqdPane-overview')).toContainText('Sala de Conduta');
  });

  test('em 320px, a página não rola na horizontal', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Uma medição basta para o contrato.');
    test.setTimeout(180000);
    // 320×568 é uma das linhas de base que o roadmap manda registrar.
    await abrir(page, 320, 1);
    const rola = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(rola, 'a 320px a página passou a rolar de lado').toBe(false);
  });
});
