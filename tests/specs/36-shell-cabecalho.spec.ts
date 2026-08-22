import { test, expect, type Page } from '@playwright/test';

/**
 * O PR #761 removeu components.css do <link> do app com base numa medição de
 * cobertura de 5,6%. A medição estava certa para 94 das 96 classes — mas duas
 * eram usadas, e ficaram sem regra-base: .nql-skip-link e .nql-brand. O
 * resultado em produção foi um skip link permanentemente visível empurrando o
 * cabeçalho e a marca renderizada como link sublinhado do navegador.
 *
 * Nenhum teste pegou isso porque nenhum media o chrome do topo. Estes medem.
 */

async function abrirPortal(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.readyState === 'complete');
}

test.describe('Chrome do cabeçalho — o que o #761 deixou órfão', () => {
  test('o skip link fica fora da tela até receber foco', async ({ page }) => {
    await abrirPortal(page);
    const skip = page.locator('.nql-skip-link').first();
    await expect(skip).toHaveCount(1);

    // Fora de vista: a regra-base o empurra para cima com translateY(-200%).
    // Sem ela o elemento fica no fluxo, visível, no topo da página.
    const forDeVista = await skip.evaluate((el) => {
      const caixa = el.getBoundingClientRect();
      return caixa.bottom <= 0 || getComputedStyle(el).transform !== 'none';
    });
    expect(forDeVista, 'skip link deveria estar deslocado para fora da tela').toBe(true);

    const posicao = await skip.evaluate((el) => getComputedStyle(el).position);
    expect(posicao, 'skip link fora de position:fixed volta a empurrar o cabeçalho').toBe('fixed');
  });

  test('o skip link reaparece no foco — o atalho continua servindo para quem navega por teclado', async ({ page }) => {
    await abrirPortal(page);
    const skip = page.locator('.nql-skip-link').first();

    // O que prova o atalho não é estar visível com foco — sem CSS nenhum ele
    // está visível sempre, e uma asserção de "visível com foco" passaria dos
    // dois jeitos sem guardar nada. O que prova é a DIFERENÇA entre os dois
    // estados: sem a regra-base, transform é 'none' antes e depois.
    const semFoco = await skip.evaluate((el) => getComputedStyle(el).transform);
    await skip.focus();
    const comFoco = await skip.evaluate((el) => getComputedStyle(el).transform);

    expect(semFoco, 'sem foco o skip link precisa estar deslocado').not.toBe('none');
    expect(comFoco, 'com foco o deslocamento tem de zerar').not.toBe(semFoco);
    const dentroDaTela = await skip.evaluate((el) => el.getBoundingClientRect().top >= 0);
    expect(dentroDaTela, 'com foco o skip link precisa entrar na tela').toBe(true);
  });

  test('a marca não é renderizada como link cru do navegador', async ({ page }) => {
    await abrirPortal(page);
    const marca = page.locator('.nql-brand').first();
    await expect(marca).toHaveCount(1);

    const estilo = await marca.evaluate((el) => {
      const s = getComputedStyle(el);
      return { decoracao: s.textDecorationLine, display: s.display, familia: s.fontFamily };
    });
    expect(estilo.decoracao, 'a marca sublinhada é o sintoma de a regra-base ter sumido').toBe('none');
    // A regra-base declara inline-flex, mas a marca é item de um container
    // flex e o CSS blockifica itens flex — o valor computado vira `flex`. O que
    // importa é não ser o `inline` de um <a> sem estilo.
    expect(estilo.display, 'sem a regra-base a marca volta a ser um <a> inline').toMatch(/flex/);
    expect(estilo.familia.length).toBeGreaterThan(0);
  });

  test('o Quest da marca usa a cor de maestria, não o azul padrão de link', async ({ page }) => {
    await abrirPortal(page);
    // Comparar com uma cor fixa não guarda nada: sem a regra-base o <em>
    // simplesmente herda a cor do <a>, que pode não ser o azul do navegador. O
    // que a regra-base garante é que marca e destaque têm cores DIFERENTES —
    // --nql-text para a marca, --nql-mastery para o Quest. Herança as iguala.
    const { marca, destaque } = await page.evaluate(() => {
      const a = document.querySelector('.nql-brand') as HTMLElement;
      const em = a.querySelector('em') as HTMLElement;
      return { marca: getComputedStyle(a).color, destaque: getComputedStyle(em).color };
    });
    expect(destaque, 'o Quest herdando a cor da marca significa que a regra-base sumiu').not.toBe(marca);
    expect(destaque).not.toBe('rgba(0, 0, 0, 0)');
  });
});
