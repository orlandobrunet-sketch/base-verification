import { test, expect, type Page } from '@playwright/test';

/**
 * A sugestão de artigo nunca chegou a ninguém.
 *
 * O formulário mandava `{ subject, message }`. A função `send-contact` exige
 * `{ name, email, message }`, os três não vazios, com o e-mail validado por
 * regex — e devolve 400 quando falta qualquer um. Como o formulário não tinha
 * campo de identidade, TODA sugestão voltava 400.
 *
 * E a tela dizia "Erro ao enviar. Tente novamente." — que promete um sucesso
 * que nunca viria. Tentar de novo dava o mesmo 400, para sempre.
 *
 * Estes testes leem o corpo que sai na rede, não o que a tela diz.
 */

test.use({ serviceWorkers: 'block' });

async function abrirFormulario(page: Page) {
  await page.route('**/*', (r) => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/');
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(() => (window as any).carregarDadosGrimorio?.());
  await page.evaluate(() => (window as any).openBibliotecaModal());
  // O formulário nasce dentro de um painel recolhido; esperar visibilidade
  // sem abri-lo trava. Abre pelo caminho do usuário.
  await page.locator('.bib-suggest-toggle').click();
  await expect(page.locator('#bibSuggestName')).toBeVisible();
}

/** Intercepta a chamada e devolve o corpo enviado, sem deixá-la sair. */
async function capturarEnvio(page: Page) {
  const enviados: any[] = [];
  await page.route('**/functions/v1/send-contact', async (rota) => {
    try { enviados.push(JSON.parse(rota.request().postData() || '{}')); } catch { enviados.push(null); }
    await rota.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  return enviados;
}

const preencher = (page: Page, campos: Record<string, string>) =>
  page.evaluate((c) => {
    for (const [id, valor] of Object.entries(c)) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.value = valor;
    }
  }, campos);

test.describe('Sugestão de artigo', () => {
  test('o corpo enviado satisfaz o contrato de send-contact', async ({ page }) => {
    await abrirFormulario(page);
    const enviados = await capturarEnvio(page);
    await preencher(page, {
      bibSuggestUrl: '10.1056/NEJMoa2024816',
      bibSuggestReason: 'Ensaio central sobre SGLT2 em DRC.',
      bibSuggestName: 'Ana Ribeiro',
      bibSuggestEmail: 'ana@exemplo.com',
    });
    await page.locator('.bib-submit-btn').click();
    await expect.poll(() => enviados.length).toBe(1);

    const corpo = enviados[0];
    // O que a função exige, exatamente.
    for (const campo of ['name', 'email', 'message']) {
      expect(String(corpo?.[campo] ?? '').trim().length, `campo obrigatório "${campo}" vazio`).toBeGreaterThan(0);
    }
    expect(corpo.email, 'e-mail precisa passar na regex da função').toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    // O conteúdo da sugestão não pode se perder na mudança de formato.
    expect(corpo.message).toContain('10.1056/NEJMoa2024816');
    expect(corpo.message).toContain('SGLT2');
  });

  test('sem e-mail válido, nem sai da tela — e o motivo é dito', async ({ page }) => {
    await abrirFormulario(page);
    const enviados = await capturarEnvio(page);
    await preencher(page, {
      bibSuggestUrl: 'https://exemplo.org/artigo',
      bibSuggestName: 'Ana Ribeiro',
      bibSuggestEmail: 'ana-arroba-exemplo',
    });
    await page.locator('.bib-submit-btn').click();
    await expect(page.locator('#bibSuggestMsg')).toContainText(/e-mail válido/i);
    // O ponto: não gastar uma viagem que voltaria 400.
    expect(enviados, 'não deve chamar a função com corpo que ela recusa').toHaveLength(0);
  });

  test('os quatro campos têm rótulo, não só placeholder', async ({ page }) => {
    await abrirFormulario(page);
    const semRotulo = await page.evaluate(() =>
      ['bibSuggestUrl', 'bibSuggestReason', 'bibSuggestName', 'bibSuggestEmail'].filter((id) => {
        const campo = document.getElementById(id);
        if (!campo) return true;
        const rotulo = document.querySelector(`label[for="${id}"]`);
        return !(rotulo && (rotulo.textContent || '').trim().length > 0) && !campo.getAttribute('aria-label');
      }));
    expect(semRotulo, `campos sem rótulo: ${semRotulo.join(', ')}`).toEqual([]);
  });
});
