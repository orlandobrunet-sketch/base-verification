import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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
 * ESTE TESTE É UM UPGRADE DE VERDADE. Ele roda em Node, então reescreve os
 * arquivos servidos entre uma carga e outra, exatamente como uma release faz.
 * Toda mutação é desfeita no final, com o conteúdo original guardado em memória.
 */

const RAIZ = path.resolve(__dirname, '..', '..');
const ALVO = path.join(RAIZ, 'js', 'changelog.js');   // asset pequeno e periférico
const HTML = path.join(RAIZ, 'jogar', 'index.html');
const SW = path.join(RAIZ, 'sw.js');

const MARCA_NOVA = 'window.__NQ_MARCA_DE_RELEASE__ = "v-nova";';

type Original = { caminho: string; conteudo: string };
let originais: Original[] = [];

function guardar(...caminhos: string[]) {
  originais = caminhos.map((c) => ({ caminho: c, conteudo: fs.readFileSync(c, 'utf8') }));
}
function restaurar() {
  for (const o of originais) fs.writeFileSync(o.caminho, o.conteudo, 'utf8');
  originais = [];
}

/** Simula a publicação de uma release: muda o asset, o buster e o nome do cache. */
function publicarRelease(versaoNova: string) {
  const asset = fs.readFileSync(ALVO, 'utf8');
  fs.writeFileSync(ALVO, `${MARCA_NOVA}\n${asset}`, 'utf8');

  const html = fs.readFileSync(HTML, 'utf8');
  fs.writeFileSync(HTML, html.replace(/(js\/changelog\.js\?v=)[0-9.]+/, `$1${versaoNova}`), 'utf8');

  const sw = fs.readFileSync(SW, 'utf8');
  fs.writeFileSync(SW, sw
    .replace(/const CACHE = 'nefroquest-v[0-9.]+';/, `const CACHE = 'nefroquest-v${versaoNova}';`)
    .replace(/('\/js\/changelog\.js': ')[0-9.]+/, `$1${versaoNova}`), 'utf8');
}

async function esperarServiceWorkerAtivo(page: Page) {
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg?.active;
  }, undefined, { timeout: 30000 });
  // Dá tempo ao precache — o install não bloqueia nele de propósito.
  await page.waitForTimeout(2500);
}

test.describe('Upgrade de release não mistura versões', () => {
  test.beforeEach(() => guardar(ALVO, HTML, SW));
  test.afterEach(() => restaurar());

  test('depois de uma release, o asset servido é o novo — não o do cache anterior', async ({ page }) => {
    // ── vN: primeira visita, o SW instala e precacheia ──────────────────────
    await page.goto('/jogar/', { waitUntil: 'load' });
    await esperarServiceWorkerAtivo(page);

    const antes = await page.evaluate(() => (window as any).__NQ_MARCA_DE_RELEASE__ ?? null);
    expect(antes, 'a marca não pode existir antes da release').toBeNull();

    // ── publica vN+1 enquanto a aba está aberta ─────────────────────────────
    publicarRelease('99.99');

    // ── vN+1: a pessoa recarrega ────────────────────────────────────────────
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);

    const depois = await page.evaluate(() => (window as any).__NQ_MARCA_DE_RELEASE__ ?? null);
    expect(
      depois,
      'o HTML novo pediu ?v=99.99 e recebeu o conteúdo antigo do cache — HTML novo com JS velho',
    ).toBe('v-nova');
  });

  test('offline, a página abre com o conjunto precacheado', async ({ page, context }) => {
    // Na PRIMEIRA visita o Service Worker ainda não controla a página: aquela
    // navegação não passa por ele e o HTML não entra no cache. Medido — foi o
    // que derrubou a primeira versão deste cenário. Só a partir da segunda
    // carga o app tem um conjunto offline completo, e é esse o caso real de
    // quem volta ao app.
    await page.goto('/jogar/', { waitUntil: 'load' });
    await esperarServiceWorkerAtivo(page);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(4000); // precache é background e pesado

    const temHtmlEmCache = await page.evaluate(async () => {
      const nomes = await caches.keys();
      const c = await caches.open(nomes[0]);
      return (await c.keys()).some((r) => new URL(r.url).pathname === '/jogar/');
    });
    expect(temHtmlEmCache, 'a segunda carga precisa deixar o HTML em cache').toBe(true);

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => { /* a navegação pode recusar */ });
    const abriu = await page.evaluate(() => ({
      offlinePage: /offline/i.test(document.title),
      temSuperficie: !!document.querySelector('#mainApp, #welcomeScreen, #landingScreen'),
    }));
    await context.setOffline(false);

    expect(abriu.offlinePage, 'caiu na página de offline em vez de servir o app').toBe(false);
    expect(abriu.temSuperficie, 'offline, o app precisa abrir com o conjunto precacheado').toBe(true);
  });
});
