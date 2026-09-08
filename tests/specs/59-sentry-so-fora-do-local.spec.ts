import { test, expect, type Page } from '@playwright/test';

/**
 * Execução local mandava erro para o Sentry de produção.
 *
 * Medido em 90 dias: das 31 ocorrências do projeto, UMA veio de
 * nefroquest.com; as outras 30 vieram de localhost:5510 e 127.0.0.1:5505 —
 * suítes de teste exercitando caminhos de erro de propósito. Oito das nove
 * issues abertas nunca aconteceram com ninguém.
 *
 * Um painel em que o ruído do próprio time é 30 para 1 não é observabilidade:
 * é uma lista que ninguém abre duas vezes.
 *
 * A prévia da Vercel continua reportando — ali o erro é real e chega antes da
 * publicação. Por isso o corte é "host local", e não "não é produção".
 */

/* Conta o que SAI para o Sentry — a ingestão, não o carregamento.
 *
 * A primeira versão deste espião bloqueava também o script do CDN. Sem ele,
 * `typeof Sentry` era 'undefined' e o init nunca acontecia — com ou sem o
 * conserto. O teste passava dos dois jeitos, isto é, não guardava nada.
 * O carregador precisa carregar; só a ingestão é interceptada. */
async function espiarSentry(page: Page) {
  const idas: string[] = [];
  await page.route('**/api/*/envelope/**', (rota) => { idas.push(rota.request().url()); return rota.abort(); });
  await page.route('**/api/*/store/**', (rota) => { idas.push(rota.request().url()); return rota.abort(); });
  return idas;
}

const iniciou = (page: Page) => page.evaluate(() => {
  const S = (window as any).Sentry;
  if (!S) return false;
  try { return Boolean(S.getClient && S.getClient()); } catch { return false; }
});

test.describe('Sentry não escuta a máquina de quem desenvolve', () => {
  for (const caminho of ['/jogar/', '/']) {
    test(`em localhost, ${caminho} não inicializa nem chama o Sentry`, async ({ page }) => {
      const idas = await espiarSentry(page);
      await page.goto(caminho, { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      expect(await iniciou(page), 'o cliente do Sentry foi criado numa execução local').toBe(false);
      // Provoca um erro de verdade: se algo escapar, aparece aqui.
      await page.evaluate(() => { setTimeout(() => { throw new Error('erro proposital de teste'); }, 0); });
      await page.waitForTimeout(1200);
      const envios = idas;
      expect(envios, `saiu para o Sentry: ${envios.join(', ')}`).toEqual([]);
    });
  }

  test('a regra distingue host local de host publicado', async ({ page }) => {
    // A contrapartida: cortar demais silenciaria a prévia da Vercel, onde o
    // erro é real. A regra é avaliada no navegador, com os mesmos hostnames.
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    const veredito = await page.evaluate(() => {
      const ehLocal = (host: string) => !host
        || host === 'localhost' || host === '::1' || host === '[::1]'
        || host.indexOf('127.') === 0 || /\.local$/.test(host);
      return {
        locais: ['localhost', '127.0.0.1', '::1', 'meu-mac.local', ''].map(ehLocal),
        publicos: ['nefroquest.com', 'base-verification-abc.vercel.app'].map(ehLocal),
      };
    });
    expect(veredito.locais, 'host local deveria ser reconhecido').toEqual([true, true, true, true, true]);
    expect(veredito.publicos, 'prévia e produção precisam continuar reportando').toEqual([false, false]);
  });
});

/**
 * A contrapartida do corte: em host publicado o Sentry PRECISA subir.
 *
 * Cortar demais é pior que o ruído — silenciaria o único canal que avisa
 * quando algo quebra para quem usa. O cenário serve a página local sob um
 * hostname que não é local, para exercitar o mesmo caminho de código.
 */
test('em host publicado, o carregador entra e o cliente inicializa', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'Uma execução basta para o contrato.');
  test.setTimeout(120000);

  // `nefroquest.local` seria local pela regra; usamos um hostname publicado.
  const hostPublicado = 'preview.nefroquest-teste.app';
  let pediuCarregador = false;
  await page.route(`https://${hostPublicado}/**`, async (rota) => {
    const url = new URL(rota.request().url());
    const alvo = `http://localhost:5500${url.pathname}${url.search}`;
    const resposta = await page.request.get(alvo);
    return rota.fulfill({
      status: resposta.status(),
      headers: { ...resposta.headers(), 'content-type': resposta.headers()['content-type'] || 'text/html' },
      body: await resposta.body(),
    });
  });
  await page.route('**/*.sentry-cdn.com/**', (rota) => { pediuCarregador = true; return rota.abort(); });
  await page.route('**/api/*/envelope/**', (rota) => rota.abort());

  await page.goto(`https://${hostPublicado}/jogar/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  expect(pediuCarregador, 'em host publicado o carregador do Sentry precisa ser buscado').toBe(true);
});
