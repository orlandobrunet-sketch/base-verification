#!/usr/bin/env node
/**
 * Servidor estático para rodar a suíte localmente.
 *
 * Existe por um motivo específico: `python -m http.server` é single-threaded e
 * atende uma requisição por vez. O cenário do Turnstile em
 * specs/17-lumen-portal.spec.ts abre uma SEGUNDA página e dispara um
 * `route.fetch()` concorrente enquanto a primeira ainda navega — o servidor
 * recusa a conexão simultânea e o teste falha com ECONNREFUSED.
 *
 * Isso produziu uma "instabilidade do Portal" que atravessou uma sessão
 * inteira: quatro cenários diferentes falhando de forma aparentemente
 * aleatória, sempre no mesmo spec, sempre passando quando rodados isolados.
 * Não era defeito do app nem do teste — era o harness.
 *
 * A CI já usa `serve` (Node, concorrente), por isso lá nunca reproduziu igual.
 *
 *   node tests/serve-local.mjs 5500
 *   BASE_URL=http://127.0.0.1:5500 npx playwright test
 */

import helpers from './helpers/local-static-server.cjs';

const porta = Number(process.argv[2] || 5500);
helpers.createLocalServer().listen(porta, '127.0.0.1', () => {
  console.log(`servindo ${helpers.raiz} em http://127.0.0.1:${porta}`);
});
