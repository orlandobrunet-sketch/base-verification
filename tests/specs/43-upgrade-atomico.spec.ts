import { test as base, expect, type Page } from '@playwright/test';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { createLocalServer } from '../helpers/local-static-server.cjs';

/**
 * NQ-01, terceiro eixo: uma release nunca mistura HTML novo com JS/CSS antigo.
 *
 * O DEFEITO: o Service Worker grava assets sob uma chave SEM a query string —
 * `/js/game.js?v=14.79` e `?v=14.84` viram a mesma entrada. E a busca de asset
 * é cache-first: havendo entrada, ela é devolvida sem que ninguém confira a
 * versão pedida. Depois de uma release, o HTML chega fresco pela rede e pede
 * `?v=nova`; o SW antigo, ainda no controle, entrega o conteúdo velho.
 *
 * O que salva hoje é o `activate` apagar caches de nome diferente — mas isso
 * acontece DEPOIS de a página já ter carregado com a mistura.
 *
 * O servidor de cada cenário simula a publicação ao mudar três respostas em
 * memória. Nenhum arquivo do jogo muda durante a execução.
 */

const RAIZ = path.resolve(__dirname, '..', '..');
const ALVO = 'js/changelog.js';   // asset pequeno e periférico
const HTML = 'jogar/index.html';
const SW = 'sw.js';

const MARCA_NOVA = 'window.__NQ_MARCA_DE_RELEASE__ = "v-nova";';

const lerArquivo = (relativo: string) => fs.readFileSync(path.join(RAIZ, relativo), 'utf8');

const test = base.extend<{ releaseServer: { url: string; publicar: (versaoNova: string) => void } }>({
  releaseServer: async ({}, use) => {
    const substituicoes = new Map<string, string>();
    const servidor = createLocalServer(substituicoes);
    const ouvindo = once(servidor, 'listening');
    servidor.listen(0, '127.0.0.1');
    await ouvindo;
    try {
      const endereco = servidor.address();
      if (!endereco || typeof endereco === 'string') throw new Error('Servidor local indisponível');
      await use({
        url: `http://127.0.0.1:${endereco.port}/jogar/`,
        publicar(versaoNova) {
          substituicoes.set(ALVO, `${MARCA_NOVA}\n${lerArquivo(ALVO)}`);
          substituicoes.set(HTML, lerArquivo(HTML).replace(/(js\/changelog\.js\?v=)[0-9.]+/, `$1${versaoNova}`));
          substituicoes.set(SW, lerArquivo(SW)
            .replace(/const CACHE = 'nefroquest-v[0-9.]+';/, `const CACHE = 'nefroquest-v${versaoNova}';`)
            .replace(/('\/js\/changelog\.js': ')[0-9.]+/, `$1${versaoNova}`));
        },
      });
    } finally {
      const encerrado = once(servidor, 'close');
      servidor.close();
      servidor.closeAllConnections();
      await encerrado;
    }
  },
});

function nomeCacheDaRelease() {
  const { version } = JSON.parse(lerArquivo('version.json'));
  return `nefroquest-v${version}`;
}

async function esperarServiceWorkerControlando(page: Page) {
  // A Promise de um predicado async pode encerrar a espera antes do resultado.
  // O controlador ativo confirma que esta aba já pode navegar pelo worker.
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
}

test.describe('Upgrade de release não mistura versões', () => {
  test('depois de uma release, o asset servido é o novo — não o do cache anterior', async ({ page, releaseServer }) => {
    // ── vN: primeira visita, o SW instala e precacheia ──────────────────────
    await page.goto(releaseServer.url, { waitUntil: 'load' });
    await esperarServiceWorkerControlando(page);

    const antes = await page.evaluate(() => (window as any).__NQ_MARCA_DE_RELEASE__ ?? null);
    expect(antes, 'a marca não pode existir antes da release').toBeNull();
    const assetAnterior = await page.evaluate(async (cacheName) => {
      return (await caches.match('/js/changelog.js', { cacheName }))?.text();
    }, nomeCacheDaRelease());
    expect(assetAnterior, 'a release anterior precisa ter o script em cache').toBeTruthy();

    // ── publica vN+1 enquanto a aba está aberta ─────────────────────────────
    releaseServer.publicar('99.99');

    // ── vN+1: a pessoa recarrega ────────────────────────────────────────────
    await page.reload({ waitUntil: 'load' });

    const depois = await page.evaluate(() => (window as any).__NQ_MARCA_DE_RELEASE__ ?? null);
    expect(
      depois,
      'o HTML novo pediu ?v=99.99 e recebeu o conteúdo antigo do cache — HTML novo com JS velho',
    ).toBe('v-nova');
  });

  test('offline, a página abre com o conjunto precacheado', async ({ page, context, releaseServer }) => {
    // Na PRIMEIRA visita o Service Worker ainda não controla a página: aquela
    // navegação não passa por ele e o HTML não entra no cache. Medido — foi o
    // que derrubou a primeira versão deste cenário. Só a partir da segunda
    // carga o app tem um conjunto offline completo, e é esse o caso real de
    // quem volta ao app.
    await page.goto(releaseServer.url, { waitUntil: 'load' });
    await esperarServiceWorkerControlando(page);
    const online = await page.reload({ waitUntil: 'load' });
    expect(online?.ok(), 'a segunda carga precisa funcionar com rede').toBe(true);
    expect(online?.fromServiceWorker(), 'a segunda carga precisa passar pelo worker').toBe(true);

    const temHtmlEmCache = await page.evaluate(async (cacheName) => {
      return !!(await caches.match('/jogar/', { cacheName }));
    }, nomeCacheDaRelease());
    expect(temHtmlEmCache, 'a segunda carga precisa deixar o HTML no cache da release').toBe(true);

    await context.setOffline(true);
    try {
      const offline = await page.reload({ waitUntil: 'domcontentloaded' });
      expect(offline?.ok(), 'a navegação offline precisa devolver uma nova resposta').toBe(true);
      expect(offline?.fromServiceWorker(), 'o worker precisa servir a navegação offline').toBe(true);
      await expect(page).not.toHaveTitle(/offline/i);
      await expect(page.locator('#mainApp, #welcomeScreen, #landingScreen').first()).toBeAttached();
    } finally {
      await context.setOffline(false);
    }
  });
});
