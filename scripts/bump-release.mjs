#!/usr/bin/env node
/**
 * Bump de release do NefroQuest.
 *
 * O ritual de versão vive em seis lugares e errar um deles tem consequência
 * real: sem o bump o Service Worker serve o arquivo antigo do cache; com bump
 * a mais, o usuário rebaixa um arquivo grande que não mudou.
 *
 * Esta é a classe de erro mais repetida do projeto — três vezes numa única
 * sessão, inclusive depois de anotada. O remédio é derivar do `git diff` em
 * vez de confiar em replace global.
 *
 *   node scripts/bump-release.mjs 14.63            # compara com origin/main
 *   node scripts/bump-release.mjs 14.63 --base HEAD~1
 *   node scripts/bump-release.mjs --check          # só relata, não escreve
 *
 * O que faz:
 *  - version.json, o CACHE do sw.js e o release do Sentry nos dois HTML
 *  - os rótulos de versão visíveis em jogar/index.html
 *  - o cache-buster APENAS dos arquivos que o diff acusa como alterados
 *
 * O que NÃO faz: tocar no buster de arquivo intocado.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const apenasChecar = args.includes('--check');
const baseIdx = args.indexOf('--base');
const base = baseIdx >= 0 ? args[baseIdx + 1] : 'origin/main';
const alvo = args.find(a => /^\d+\.\d+$/.test(a));

const ler = p => readFileSync(resolve(raiz, p), 'utf8');
const escrever = (p, s) => writeFileSync(resolve(raiz, p), s, 'utf8');

const versaoAtual = JSON.parse(ler('version.json')).version;
const novaVersao = alvo || versaoAtual;

// Arquivos alterados em relação à base, incluindo o que ainda não foi commitado
let alterados = [];
try {
  // execFileSync com array: `base` vem da linha de comando e não deve passar
  // por shell — sem interpolação, metacaractere não é interpretado.
  const commitados = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: raiz, encoding: 'utf8' });
  const pendentes = execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd: raiz, encoding: 'utf8' });
  alterados = [...new Set(`${commitados}\n${pendentes}`.split('\n').map(l => l.trim()).filter(Boolean))];
} catch (erro) {
  console.error(`Não foi possível comparar com "${base}": ${erro.message}`);
  process.exit(1);
}

// Assets com cache-buster próprio em jogar/index.html
const html = ler('jogar/index.html');
const comBuster = [...html.matchAll(/(js\/[a-z0-9-]+\.js|styles\/lumen\/[a-z]+\.css)\?v=([0-9.]+)/g)]
  .map(m => ({ arquivo: m[1], versao: m[2] }));

const precisamBump = comBuster.filter(a => alterados.includes(a.arquivo));
const naoMudaram = comBuster.filter(a => !alterados.includes(a.arquivo));

console.log(`base: ${base}`);
console.log(`versão: ${versaoAtual}${alvo && alvo !== versaoAtual ? ` -> ${novaVersao}` : ' (mantida)'}`);
console.log(`\nassets alterados (buster sobe para ${novaVersao}):`);
if (!precisamBump.length) console.log('  nenhum');
precisamBump.forEach(a => console.log(`  ${a.arquivo}  ${a.versao} -> ${novaVersao}`));

// O erro clássico do replace global: o buster de um asset MUDOU em relação à
// base, mas o arquivo em si não. O usuário rebaixaria algo intocado.
// Comparar com a base é o único critério sem falso positivo — repo limpo não
// pode acusar nada.
let busterBase = new Map();
try {
  const htmlBase = execFileSync('git', ['show', `${base}:jogar/index.html`], { cwd: raiz, encoding: 'utf8' });
  busterBase = new Map(
    [...htmlBase.matchAll(/(js\/[a-z0-9-]+\.js|styles\/lumen\/[a-z]+\.css)\?v=([0-9.]+)/g)].map(m => [m[1], m[2]])
  );
} catch { /* base indisponível: sem comparação possível, não acusa */ }

const suspeitos = naoMudaram.filter(a => busterBase.has(a.arquivo) && busterBase.get(a.arquivo) !== a.versao);
if (suspeitos.length) {
  console.log('\n⚠  buster alterado sem que o arquivo tenha mudado:');
  suspeitos.forEach(a => console.log(`  ${a.arquivo}: ${busterBase.get(a.arquivo)} -> ${a.versao} — arquivo intocado seria rebaixado`));
}

if (apenasChecar) {
  process.exit(suspeitos.length ? 1 : 0);
}

if (!alvo) {
  console.error('\nInforme a nova versão (ex.: node scripts/bump-release.mjs 14.63) ou use --check.');
  process.exit(1);
}

// 1) version.json
escrever('version.json', `${JSON.stringify({ version: novaVersao })}\n`);

// 2) sw.js — comentário do topo e nome do cache
let sw = ler('sw.js');
sw = sw.replace(/v\d+\.\d+/g, `v${novaVersao}`);
escrever('sw.js', sw);

// 3) release do Sentry e rótulos visíveis
for (const p of ['index.html', 'jogar/index.html']) {
  let s = ler(p);
  s = s.replace(/nefroquest@\d+\.\d+/g, `nefroquest@${novaVersao}`);
  s = s.replace(/>v\d+\.\d+</g, `>v${novaVersao}<`);
  escrever(p, s);
}

// 4) cache-buster SOMENTE dos arquivos que o diff acusa
let jogar = ler('jogar/index.html');
precisamBump.forEach(a => {
  jogar = jogar.replace(new RegExp(`${a.arquivo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=[0-9.]+`, 'g'), `${a.arquivo}?v=${novaVersao}`);
});
escrever('jogar/index.html', jogar);

console.log(`\nrelease ${novaVersao} aplicada.`);
