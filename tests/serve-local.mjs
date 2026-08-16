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

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const porta = Number(process.argv[2] || 5500);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.webm': 'video/webm',
};

createServer((req, res) => {
  const semQuery = decodeURIComponent((req.url || '/').split('?')[0]);
  let caminho = resolve(join(raiz, semQuery));

  // Nunca servir fora da raiz do projeto
  if (!caminho.startsWith(raiz)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  try {
    if (statSync(caminho).isDirectory()) caminho = join(caminho, 'index.html');
  } catch {
    res.writeHead(404).end('not found');
    return;
  }

  try {
    const tamanho = statSync(caminho).size;
    res.writeHead(200, {
      'Content-Type': TIPOS[extname(caminho).toLowerCase()] || 'application/octet-stream',
      'Content-Length': tamanho,
      'Cache-Control': 'no-store',
    });
    createReadStream(caminho).pipe(res);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(porta, '127.0.0.1', () => {
  console.log(`servindo ${raiz} em http://127.0.0.1:${porta}`);
});
