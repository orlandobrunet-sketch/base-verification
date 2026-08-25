import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * NQ-04 — nenhuma superfície cai no serif padrão do navegador.
 *
 * O DEFEITO, medido: `game.css` declara `font-family: var(--nql-font-body)` no
 * próprio <body>, mas os tokens de tipografia estavam escopados em
 * `[data-nq-ui="lumen"]`, que casa com #mainApp e #welcomeScreen e nunca com o
 * <body>. A variável não resolvia, a declaração virava inválida, e o navegador
 * caía no seu serif padrão — Times New Roman, uma fonte que não existe no
 * sistema visual. As variáveis de COR não sofriam porque o game.css as
 * redeclara no body; as de fonte, ninguém redeclarava.
 *
 * Quem estava dentro de um contêiner Lúmen não sentia nada — por isso a tela de
 * questão parecia correta. Quem é pendurado direto no <body> (Preços,
 * Privacidade, Conta, Biblioteca, seletores) renderizava em Times.
 *
 * ARMADILHA DE MEDIÇÃO, registrada porque me pegou: `injectGameState` recarrega
 * a página e espera apenas `domcontentloaded`, que dispara ANTES de as folhas
 * de estilo terminarem. Medir ali devolve o padrão do navegador para TUDO, e o
 * resultado parece um defeito gigante que não existe. Estes cenários esperam
 * `load` e `document.fonts.ready` de propósito. Sem isso o teste mede o nada.
 */

const SUPERFICIES: Array<[string, string]> = [
  ['Preços', 'showPricingModal'],
  ['Privacidade', 'showPrivacyPolicy'],
  ['Conta', 'openAccountModal'],
  ['Biblioteca', 'openBibliotecaModal'],
  ['Seletor de eixos', 'showAxesSelector'],
  ['Login', 'openAuthModal'],
];

async function abrirComEstiloPronto(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => (document as any).fonts.ready);
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
}

const TEXTOS_EM_SERIF_PADRAO = () => {
  const nos = Array.from(document.querySelectorAll('*')).filter((n) => n.children.length === 0) as HTMLElement[];
  const achados: string[] = [];
  for (const n of nos) {
    if (['SCRIPT', 'STYLE', 'TITLE', 'NOSCRIPT'].includes(n.tagName)) continue;
    const caixa = n.getBoundingClientRect();
    if (!(caixa.width > 0 && caixa.height > 0)) continue;
    const texto = (n.textContent || '').trim();
    if (!/[a-zA-Z0-9]/.test(texto)) continue; // emoji não tem tipografia a defender
    if (/Times/i.test(getComputedStyle(n).fontFamily)) achados.push(texto.slice(0, 32));
  }
  return [...new Set(achados)];
};

test.describe('Tipografia sem cair no padrão do navegador', () => {
  test('os três tokens de fonte resolvem no body', async ({ page }) => {
    await abrirComEstiloPronto(page);

    const tokens = await page.evaluate(() => {
      const b = getComputedStyle(document.body);
      return {
        corpo: b.getPropertyValue('--nql-font-body').trim(),
        display: b.getPropertyValue('--nql-font-display').trim(),
        instrumento: b.getPropertyValue('--nql-font-instrument').trim(),
        aplicada: b.fontFamily,
      };
    });

    // Token vazio é o que torna a declaração inválida e produz o Times.
    expect(tokens.corpo, '--nql-font-body não resolve no body').not.toBe('');
    expect(tokens.display, '--nql-font-display não resolve no body').not.toBe('');
    expect(tokens.instrumento, '--nql-font-instrument não resolve no body').not.toBe('');
    expect(tokens.aplicada, 'o body caiu no serif padrão do navegador').not.toMatch(/Times/i);
  });

  test('a tela de questão não tem texto no serif padrão', async ({ page }) => {
    await abrirComEstiloPronto(page);
    const achados = await page.evaluate(TEXTOS_EM_SERIF_PADRAO);
    expect(achados, `texto em Times New Roman: ${achados.join(' | ')}`).toEqual([]);
  });

  for (const [nome, fn] of SUPERFICIES) {
    test(`${nome} não tem texto no serif padrão`, async ({ page }) => {
      await abrirComEstiloPronto(page);

      const existe = await page.evaluate((f) => typeof (window as any)[f] === 'function', fn);
      test.skip(!existe, `${fn} não existe nesta build`);

      await page.evaluate((f) => { try { (window as any)[f](); } catch (e) { /* a superfície pode exigir estado extra */ } }, fn);
      await page.waitForTimeout(400);

      const achados = await page.evaluate(TEXTOS_EM_SERIF_PADRAO);
      expect(achados, `${nome} com texto em Times New Roman: ${achados.join(' | ')}`).toEqual([]);
    });
  }
});
