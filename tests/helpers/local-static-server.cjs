'use strict';

const { createServer } = require('node:http');
const { createReadStream, statSync } = require('node:fs');
const { resolve, extname, join, relative, sep } = require('node:path');

const raiz = resolve(__dirname, '../..');
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

function createLocalServer(arquivosSubstituidos = new Map()) {
  return createServer((req, res) => {
    const semQuery = decodeURIComponent((req.url || '/').split('?')[0]);
    let caminho = resolve(join(raiz, semQuery));

    if (caminho !== raiz && !caminho.startsWith(raiz + sep)) {
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
      const chave = relative(raiz, caminho).split(sep).join('/');
      const substituto = arquivosSubstituidos.get(chave);
      const tamanho = substituto === undefined ? statSync(caminho).size : Buffer.byteLength(substituto);
      res.writeHead(200, {
        'Content-Type': TIPOS[extname(caminho).toLowerCase()] || 'application/octet-stream',
        'Content-Length': tamanho,
        'Cache-Control': 'no-store',
      });
      if (substituto === undefined) createReadStream(caminho).pipe(res);
      else res.end(substituto);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
}

module.exports = { raiz, createLocalServer };
