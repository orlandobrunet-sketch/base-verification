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

// Assets com cache-buster próprio em jogar/index.html.
// `style.css` entra explicitamente: é o maior CSS do projeto (520 KB) e ficava
// fora do padrão `styles/lumen/`, então a ferramenta nunca subia o buster dele
// — quem já tinha o arquivo em cache continuava com a versão velha.
const BUSTER = /(js\/[a-z0-9-]+\.js|styles\/lumen\/[a-z]+\.css|style\.css)\?v=([0-9.]+)/g;

const html = ler('jogar/index.html');
const comBuster = [...html.matchAll(BUSTER)]
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
    [...htmlBase.matchAll(new RegExp(BUSTER.source, 'g'))].map(m => [m[1], m[2]])
  );
} catch { /* base indisponível: sem comparação possível, não acusa */ }

const suspeitos = naoMudaram.filter(a => busterBase.has(a.arquivo) && busterBase.get(a.arquivo) !== a.versao);
if (suspeitos.length) {
  console.log('\n⚠  buster alterado sem que o arquivo tenha mudado:');
  suspeitos.forEach(a => console.log(`  ${a.arquivo}: ${busterBase.get(a.arquivo)} -> ${a.versao} — arquivo intocado seria rebaixado`));
}

// ── ASSET_VERSIONS do sw.js ───────────────────────────────────────────────
// O install do SW precisa pedir a MESMA URL versionada que a página pede, senão
// cada asset do precache vira uma segunda entrada no cache HTTP e é baixado de
// novo no primeiro acesso. O mapa é derivado do HTML, nunca escrito à mão.
const MARCA_INI = '// bump-release:asset-versions:início';
const MARCA_FIM = '// bump-release:asset-versions:fim';

// Comparação insensível a fim de linha: no Windows um editor grava o arquivo em
// CRLF e o bloco gerado aqui sai em LF. Sem normalizar, `--check` acusaria
// deriva onde não há — e o gate perderia credibilidade justamente por ruído.
const normalizar = s => s.replace(/\r\n/g, '\n');

function blocoEntre(texto, ini, fim) {
  const i = texto.indexOf(ini);
  if (i < 0) return null;
  // Procurar o delimitador final DEPOIS do inicial: buscar do começo casaria um
  // `];` de qualquer array declarado acima e o bloco viria vazio ou invertido.
  const f = texto.indexOf(fim, i + ini.length);
  if (f < 0) return null;
  return { i: i + ini.length, f, conteudo: normalizar(texto.slice(i + ini.length, f)).trim() };
}

function mapaDesejado(htmlTexto, swTexto) {
  const lista = blocoEntre(swTexto, 'const STATIC_ASSETS = [', '];');
  if (!lista) throw new Error('STATIC_ASSETS não encontrado em sw.js');
  const estaticos = [...lista.conteudo.matchAll(/'(\/[^']+)'/g)].map(m => m[1]);
  const versoes = new Map([...htmlTexto.matchAll(new RegExp(BUSTER.source, 'g'))].map(m => [m[1], m[2]]));
  const linhas = estaticos
    .filter(c => versoes.has(c.replace(/^\//, '')))
    .map(c => `  '${c}': '${versoes.get(c.replace(/^\//, ''))}',`);
  return linhas.length ? `const ASSET_VERSIONS = {\n${linhas.join('\n')}\n};` : 'const ASSET_VERSIONS = {};';
}

/** Caminhos do STATIC_ASSETS do sw.js, sem a barra inicial. */
function estaticosDoSw(swTexto) {
  const lista = blocoEntre(swTexto, 'const STATIC_ASSETS = [', '];');
  if (!lista) throw new Error('STATIC_ASSETS não encontrado em sw.js');
  return [...lista.conteudo.matchAll(/'(\/[^']+)'/g)].map(m => m[1].replace(/^\//, ''));
}

const swAtual = ler('sw.js');
const mapaAtual = blocoEntre(swAtual, MARCA_INI, MARCA_FIM);
const mapaEsperado = mapaDesejado(html, swAtual);
const mapaDerivou = !mapaAtual || mapaAtual.conteudo !== mapaEsperado;

if (mapaDerivou) {
  console.log(`\n⚠  ASSET_VERSIONS do sw.js está fora de sincronia com jogar/index.html`);
  if (apenasChecar) console.log('   rode: node scripts/bump-release.mjs <versão>  (ou --sync para só regerar o mapa)');
}

// ── Asset precacheado SEM buster que mudou e não teria como chegar ao usuário ──
// Um arquivo do STATIC_ASSETS que não tem cache-buster no HTML (data/*.js,
// áudio, imagens) só é rebaixado quando o NOME DO CACHE muda — ou seja, quando
// a versão sobe. Alterá-lo sem subir a versão publica uma correção que o
// usuário antigo nunca recebe: o SW continua servindo a cópia velha do cache
// pelo resto do ciclo.
//
// Isto foi encontrado editando data/competencies.js: o `--check` dava verde
// justamente porque o arquivo NÃO tem buster, que é o que o torna perigoso.
let versaoBase = versaoAtual;
try {
  versaoBase = JSON.parse(
    execFileSync('git', ['show', `${base}:version.json`], { cwd: raiz, encoding: 'utf8' })
  ).version;
} catch { /* base indisponível: sem comparação, não acusa */ }

const semBuster = estaticosDoSw(swAtual).filter(p => !comBuster.some(a => a.arquivo === p));
const precacheMudou = semBuster.filter(p => alterados.includes(p));
const versaoParada = versaoBase === novaVersao;

if (precacheMudou.length && versaoParada) {
  console.log('\n⚠  asset do precache mudou sem que a versão suba:');
  precacheMudou.forEach(p => console.log(`  ${p} — sem cache-buster, só é rebaixado quando a versão muda`));
  console.log(`  a versão segue ${versaoAtual}: quem já tem o app continuaria com a cópia velha.`);
}

if (apenasChecar) {
  process.exit(suspeitos.length || mapaDerivou || (precacheMudou.length && versaoParada) ? 1 : 0);
}

// `--sync` regera só o mapa, sem tocar em versão: serve para quem mexeu no
// STATIC_ASSETS sem estar fazendo release.
if (args.includes('--sync')) {
  const b = blocoEntre(swAtual, MARCA_INI, MARCA_FIM);
  if (!b) { console.error('marcadores de ASSET_VERSIONS não encontrados em sw.js'); process.exit(1); }
  escrever('sw.js', swAtual.slice(0, b.i) + `\n${mapaEsperado}\n` + swAtual.slice(b.f));
  console.log('\nASSET_VERSIONS regerado.');
  process.exit(0);
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

// 5) ASSET_VERSIONS do sw.js, derivado do HTML JÁ com os busters finais.
//    Precisa vir depois do passo 4, senão o mapa nasce apontando para a versão
//    anterior dos arquivos que acabaram de subir.
{
  const swFinal = ler('sw.js');
  const b = blocoEntre(swFinal, MARCA_INI, MARCA_FIM);
  if (!b) { console.error('marcadores de ASSET_VERSIONS não encontrados em sw.js'); process.exit(1); }
  const mapa = mapaDesejado(ler('jogar/index.html'), swFinal);
  escrever('sw.js', swFinal.slice(0, b.i) + `\n${mapa}\n` + swFinal.slice(b.f));
}

console.log(`\nrelease ${novaVersao} aplicada.`);
