import { test, expect, type Page } from '@playwright/test';
import { medirContraste } from '../helpers/contraste';

/**
 * O Grimório legado — o modal aberto pela rota "Biblioteca clínica" do Átrio e
 * pelo botão do dock — desenhava com o que houvesse na memória naquele
 * instante, sem nunca pedir o acervo.
 *
 * Medido antes do conserto, com refs.js e articles.js fora do ar:
 *
 *     contador: "0/0 artigos"     lista: "Nenhuma referência encontrada."
 *
 * Zero sobre zero não é um total: é a ausência de total. A tela dizia ao
 * usuário que seu Grimório estava vazio, quando o catálogo é que não chegou —
 * e não oferecia nenhuma saída. O mesmo valia durante a carga ociosa: abrir o
 * modal cedo demais mostrava o mesmo vazio, sem dizer que ainda carregava.
 *
 * A Central ganhou recuperação na spec 56; este é o outro consumidor.
 */

test.use({ serviceWorkers: 'block' });

async function abrir(page: Page, modo: 'bloqueia' | 'atrasa' | 'normal') {
  await page.route('**/*', (r) => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  // Sem isto, a carga ociosa vence a corrida e o cenário deixa de existir.
  await page.addInitScript(() => { (window as any).requestIdleCallback = () => 1; });
  if (modo !== 'normal') {
    for (const nome of ['refs', 'articles']) {
      await page.route(`**/data/${nome}.js`, async (rota) => {
        if (modo === 'bloqueia') return rota.abort();
        await new Promise((ok) => setTimeout(ok, 4000));
        return rota.continue();
      });
    }
  }
  await page.goto('/jogar/');
  await page.locator('[data-portal-route="guest"]').click();
  if (modo === 'normal') await page.evaluate(() => (window as any).carregarDadosGrimorio?.());
  await page.evaluate(() => (window as any).openBibliotecaModal());
}

const contador = (page: Page) => page.locator('#bibCount');
const lista = (page: Page) => page.locator('#bibList');

test.describe('Grimório legado: acervo ausente, atrasado e recuperado', () => {
  test('acervo fora do ar não vira "0/0", e a saída existe', async ({ page }) => {
    await abrir(page, 'bloqueia');
    await expect(lista(page)).toContainText('não pôde ser carregado');
    await expect(contador(page), 'zero sobre zero afirma um total que não existe').not.toContainText('0/0');
    await expect(page.locator('[data-action="_bibTentarNovamente"]')).toBeVisible();
  });

  test('a nova tentativa recupera o acervo inteiro', async ({ page }) => {
    await abrir(page, 'bloqueia');
    await expect(page.locator('[data-action="_bibTentarNovamente"]')).toBeVisible();
    await page.unroute('**/data/refs.js');
    await page.unroute('**/data/articles.js');
    await page.locator('[data-action="_bibTentarNovamente"]').click();
    await expect(contador(page)).toContainText(/\/\d{2,}\s+artigos/);
    await expect(page.locator('[data-action="_bibTentarNovamente"]')).toHaveCount(0);
  });

  test('durante a carga a tela diz que está carregando, não que está vazia', async ({ page }) => {
    await abrir(page, 'atrasa');
    await expect(lista(page)).toContainText(/carregando/i);
    await expect(lista(page), 'vazio e carregando são coisas diferentes').not.toContainText(/Nenhuma referência/i);
    // E o estado transitório termina sozinho quando a resposta chega.
    await expect(contador(page)).toContainText(/\/\d{2,}\s+artigos/, { timeout: 15000 });
  });

  test('com o acervo disponível nada muda', async ({ page }) => {
    // A contrapartida: o conserto não pode inventar estado de erro no caminho bom.
    await abrir(page, 'normal');
    await expect(contador(page)).toContainText(/\/\d{2,}\s+artigos/);
    await expect(page.locator('[data-action="_bibTentarNovamente"]')).toHaveCount(0);
  });

  test('o aviso é legível — não herda o cinza de "nada encontrado"', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'A medição de cor roda uma vez.');
    await abrir(page, 'bloqueia');
    await expect(lista(page)).toContainText('não pôde ser carregado');
    const falhas = await page.evaluate(medirContraste, '#bibList');
    expect(falhas.map(f => `${f.sel} ${f.razao}/${f.exigido} "${f.texto}"`), 'texto do aviso ilegível').toEqual([]);
  });
});
