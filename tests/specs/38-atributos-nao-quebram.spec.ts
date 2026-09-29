import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * O valor de cada atributo (emoji + número) deve permanecer em uma linha.
 * O rótulo do atributo ocupa intencionalmente uma segunda linha no card Lumen.
 *
 * A regressão original espremia os distintivos abaixo do próprio conteúdo:
 * um min-width fixo substituía o mínimo automático do flex, permitindo quebrar
 * entre emoji e número. A largura do emoji varia conforme o sistema, então o
 * segundo cenário simula um valor mais largo para guardar também no runner.
 *
 * Agora medimos a linha do valor e seu encaixe no distintivo separadamente,
 * sem confundir o rótulo da segunda linha com uma quebra indesejada.
 */

async function abrirJogo(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 10000 });
  const abrirPersonagem = page.locator('.mobile-bottom-dock [data-action="openMobileDrawer"]');
  if (await abrirPersonagem.isVisible()) {
    await abrirPersonagem.click();
    await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);
  }
  await expect(page.locator('.equip-total-attributes .nql-stat-value').first()).toBeVisible({ timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
}

// A caixa precisa conter os valores; nowrap sozinho não basta, pois poderia
// apenas trocar uma quebra de linha por vazamento sobre o distintivo vizinho.
const MEDIR_ATRIBUTOS = (els: Element[]) => {
  const espremidos: string[] = [];
  const quebrados: string[] = [];
  const foraDoDistintivo: string[] = [];
  for (const el of els) {
    const valor = el.querySelector('.nql-stat-value') as HTMLElement | null;
    if (!valor) {
      quebrados.push('valor ausente');
      continue;
    }
    const texto = valor.textContent?.trim() ?? '';
    const badge = el as HTMLElement;
    const caixa = badge.getBoundingClientRect();
    const retanguloValor = valor.getBoundingClientRect();
    const estilo = getComputedStyle(badge);
    const esquerda = caixa.left + parseFloat(estilo.borderLeftWidth) + parseFloat(estilo.paddingLeft);
    const direita = caixa.right - parseFloat(estilo.borderRightWidth) - parseFloat(estilo.paddingRight);
    if (badge.clientWidth + 0.5 < badge.scrollWidth || valor.clientWidth + 0.5 < valor.scrollWidth) {
      espremidos.push(texto);
    }
    if (retanguloValor.left < esquerda - 0.5 || retanguloValor.right > direita + 0.5) {
      foraDoDistintivo.push(texto);
    }
    // Um Range mede as linhas reais de texto, inclusive quando o valor for
    // inline. A altura total do badge inclui o rótulo e não serve para isso.
    const range = document.createRange();
    range.selectNodeContents(valor);
    const linhas: number[] = [];
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.width > 0 && rect.height > 0 && !linhas.some(top => Math.abs(top - rect.top) <= 1)) {
        linhas.push(rect.top);
      }
    }
    if (linhas.length !== 1) quebrados.push(texto + ' (' + linhas.length + ' linhas)');
  }
  return { espremidos, quebrados, foraDoDistintivo };
};

function conferirAtributos(resultado: ReturnType<typeof MEDIR_ATRIBUTOS>) {
  expect(resultado.espremidos, 'atributos comprimidos abaixo do conteúdo').toEqual([]);
  expect(resultado.quebrados, 'emoji e número precisam ocupar uma única linha').toEqual([]);
  expect(resultado.foraDoDistintivo, 'valor precisa caber na área interna do próprio distintivo').toEqual([]);
}

test.describe('Atributos Totais', () => {
  test('com os valores reais, nenhum valor quebra nem é espremido', async ({ page }) => {
    await abrirJogo(page);
    const distintivos = page.locator('.equip-total-attributes .stat-badge');
    await expect(distintivos).toHaveCount(4);
    await expect(distintivos.locator('.nql-stat-value')).toHaveCount(4);
    conferirAtributos(await distintivos.evaluateAll(MEDIR_ATRIBUTOS));
  });

  test('conteúdo mais largo não espreme o valor nem o faz sair do distintivo', async ({ page }) => {
    await abrirJogo(page);
    const distintivos = page.locator('.equip-total-attributes .stat-badge');
    const valores = distintivos.locator('.nql-stat-value');
    await expect(valores).toHaveCount(4);
    const originais = await valores.allTextContents();
    // Emula a condição de conteúdo largo, preservando o emoji de cada atributo.
    // Altera apenas o valor; o rótulo e o tooltip permanecem no layout real.
    try {
      await valores.evaluateAll(els => els.forEach(el => {
        el.textContent = (el.textContent || '').replace(/\d+/, '1333');
      }));
      await expect(valores).toHaveText(originais.map(texto => texto.replace(/\d+/, '1333')));
      conferirAtributos(await distintivos.evaluateAll(MEDIR_ATRIBUTOS));
    } finally {
      await valores.evaluateAll((els, textos) => els.forEach((el, i) => { el.textContent = textos[i]; }), originais);
    }
  });

  test('no celular com texto a 200%, valores e rótulos cabem sem sobreposição', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await abrirJogo(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await expect(page.locator('html')).toHaveCSS('font-size', '32px');
    await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);

    for (const largura of [320, 390]) {
      await test.step(largura + 'px com texto a 200%', async () => {
        await page.setViewportSize({ width: largura, height: 844 });
        const distintivos = page.locator('.equip-total-attributes .stat-badge');
        await expect(distintivos).toHaveCount(4);
        conferirAtributos(await distintivos.evaluateAll(MEDIR_ATRIBUTOS));

        const rotulos = distintivos.locator('.nql-stat-label');
        await expect(rotulos).toHaveCount(4);
        for (const rotulo of await rotulos.all()) await expect(rotulo).toBeVisible();
        const problemas = await distintivos.evaluateAll(els => {
          const rotulosFora: string[] = [];
          const badgesSobrepostos: string[] = [];
          const caixas = els.map(el => el.getBoundingClientRect());
          els.forEach((el, i) => {
            const label = el.querySelector('.nql-stat-label') as HTMLElement;
            const rect = label.getBoundingClientRect();
            const caixa = caixas[i];
            const estilo = getComputedStyle(el);
            const esquerda = caixa.left + parseFloat(estilo.borderLeftWidth) + parseFloat(estilo.paddingLeft);
            const direita = caixa.right - parseFloat(estilo.borderRightWidth) - parseFloat(estilo.paddingRight);
            const topo = caixa.top + parseFloat(estilo.borderTopWidth) + parseFloat(estilo.paddingTop);
            const fundo = caixa.bottom - parseFloat(estilo.borderBottomWidth) - parseFloat(estilo.paddingBottom);
            if (label.clientWidth + 0.5 < label.scrollWidth
              || rect.left < esquerda - 0.5 || rect.right > direita + 0.5
              || rect.top < topo - 0.5 || rect.bottom > fundo + 0.5) {
              rotulosFora.push(label.textContent?.trim() ?? '?');
            }
            for (let j = i + 1; j < caixas.length; j++) {
              const outra = caixas[j];
              if (Math.min(caixa.right, outra.right) - Math.max(caixa.left, outra.left) > 0.5
                && Math.min(caixa.bottom, outra.bottom) - Math.max(caixa.top, outra.top) > 0.5) {
                badgesSobrepostos.push(i + '/' + j);
              }
            }
          });
          return { rotulosFora, badgesSobrepostos };
        });
        expect(problemas.rotulosFora, 'rótulos precisam caber dentro dos próprios distintivos').toEqual([]);
        expect(problemas.badgesSobrepostos, 'distintivos não podem se sobrepor').toEqual([]);
      });
    }
  });
});
