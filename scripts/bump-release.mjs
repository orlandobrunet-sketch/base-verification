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

import { createHash } from 'node:crypto';
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

const metadadosVersao = JSON.parse(ler('version.json'));
const versaoAtual = metadadosVersao.version;
const novaVersao = alvo || versaoAtual;
const releaseDoManifesto = ler('data/question-revision-manifest.js').match(/"release":"([^"\n]+)"/)?.[1];
const manifestoDerivou = releaseDoManifesto !== novaVersao;

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
// The generated manifest changes when only release metadata advances too.
if (manifestoDerivou) alterados.push('data/question-revision-manifest.js');

// Assets com cache-buster próprio em jogar/index.html.
// `style.css` entra explicitamente: é o maior CSS do projeto (520 KB) e ficava
// fora do padrão `styles/lumen/`, então a ferramenta nunca subia o buster dele
// — quem já tinha o arquivo em cache continuava com a versão velha.
const BUSTER = /((?:js|data)\/[a-z0-9-]+\.js|styles\/lumen\/[a-z0-9-]+\.css|style\.css)\?(?:v|release)=([0-9.]+)/g;
const DATA_BUSTER = /(data\/[a-z0-9-]+\.js)\?release=([0-9.]+)/g;
const DATA_CONSUMERS = ['js/game.js', 'js/utils.js', 'offline.html'];
const consumerBuster = file => new RegExp((file === 'offline.html' ? BUSTER : DATA_BUSTER).source, 'g');
function bustersDoApp(htmlTexto, leitor = ler) {
  const entries = [...htmlTexto.matchAll(new RegExp(BUSTER.source, 'g'))];
  for (const file of DATA_CONSUMERS) {
    entries.push(...leitor(file).matchAll(consumerBuster(file)));
  }
  const versions = new Map();
  for (const match of entries) {
    if (versions.has(match[1]) && versions.get(match[1]) !== match[2])
      throw new Error(`Versões de dados divergentes entre consumidores: ${match[1]}`);
    versions.set(match[1], match[2]);
  }
  return [...versions].map(([arquivo, versao]) => ({arquivo, versao}));
}

const html = ler('jogar/index.html');
const comBuster = bustersDoApp(html);

// Updating a lazy data URL changes its loader's bytes too. Advance that
// JavaScript buster even when only its underlying data changed initially.
for (const file of DATA_CONSUMERS) {
  if ([...ler(file).matchAll(consumerBuster(file))]
    .some(match => alterados.includes(match[1]) && match[2] !== novaVersao)) alterados.push(file);
}

const precisamBump = comBuster.filter(a => alterados.includes(a.arquivo));
const naoMudaram = comBuster.filter(a => !alterados.includes(a.arquivo));
const bustersAtrasados = precisamBump.filter(a => a.versao !== novaVersao);

console.log(`base: ${base}`);
console.log(`versão: ${versaoAtual}${alvo && alvo !== versaoAtual ? ` -> ${novaVersao}` : ' (mantida)'}`);
console.log(`\nassets alterados (buster sobe para ${novaVersao}):`);
if (!precisamBump.length) console.log('  nenhum');
precisamBump.forEach(a => console.log(`  ${a.arquivo}  ${a.versao} -> ${novaVersao}`));
if (apenasChecar && bustersAtrasados.length) {
  console.log('\n⚠  assets alterados ainda apontam para um cache-buster anterior:');
  bustersAtrasados.forEach(a => console.log(`  ${a.arquivo}: ${a.versao}; esperado ${novaVersao}`));
}

// O erro clássico do replace global: o buster de um asset MUDOU em relação à
// base, mas o arquivo em si não. O usuário rebaixaria algo intocado.
// Comparar com a base é o único critério sem falso positivo — repo limpo não
// pode acusar nada.
let busterBase = new Map();
try {
  const baseLer = p => execFileSync('git', ['show', `${base}:${p}`], { cwd: raiz, encoding: 'utf8' });
  busterBase = new Map(bustersDoApp(baseLer('jogar/index.html'), baseLer).map(a => [a.arquivo, a.versao]));
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
  const versoes = new Map(bustersDoApp(htmlTexto).map(a => [a.arquivo, a.versao]));
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

const OFFLINE_INI = '// bump-release:offline-integrity:início';
const OFFLINE_FIM = '// bump-release:offline-integrity:fim';
function offlineIntegrity() {
  const html = ler('offline.html');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=[^>]*>/gi)];
  const urls = scripts.map(([tag]) => {
    const url = tag.match(/\bsrc="(\/(?:js|data)\/[a-z0-9-]+\.js\?(?:v|release)=\d+\.\d+)"/)?.[1];
    if (!url) throw new Error(`Script de Estudo Offline sem URL estável: ${tag}`);
    return url;
  });
  if (urls.length !== 5 || new Set(urls.map(url => url.split('?')[0])).size !== 5)
    throw new Error('Estudo Offline requer cinco scripts locais versionados e distintos.');
  const rows = ['/offline.html', ...urls].map(url => {
    const bytes = readFileSync(resolve(raiz, '.' + url.split('?')[0]));
    return '  ' + JSON.stringify([url, createHash('sha256').update(bytes).digest('hex')]) + ',';
  });
  return 'const OFFLINE_FILES = [\n' + rows.join('\n') + '\n];';
}

function escreverOfflineIntegrity() {
  const sw = ler('sw.js');
  const marker = blocoEntre(sw, OFFLINE_INI, OFFLINE_FIM);
  if (!marker) throw new Error('Marcadores de integridade do Estudo Offline ausentes.');
  escrever('sw.js', sw.slice(0, marker.i) + '\n' + offlineIntegrity() + '\n' + sw.slice(marker.f));
}

const swAtual = ler('sw.js');
const mapaAtual = blocoEntre(swAtual, MARCA_INI, MARCA_FIM);
const mapaEsperado = mapaDesejado(html, swAtual);
const offlineDerivou = blocoEntre(swAtual, OFFLINE_INI, OFFLINE_FIM)?.conteudo !== offlineIntegrity();
if (offlineDerivou) console.log('\n⚠  Digest do pacote de Estudo Offline desatualizado.');
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

// A numeração pública fica em displayVersion; o identificador técnico nunca regride.
function compararReleaseTecnico(left, right) {
  const partes = value => {
    if (typeof value !== 'string' || !/^\d+\.\d+$/.test(value)) return null;
    const numbers = value.split('.').map(Number);
    return numbers.every(Number.isSafeInteger) ? numbers : null;
  };
  const a = partes(left), b = partes(right);
  if (!a || !b) return null;
  return a[0] === b[0] ? Math.sign(a[1] - b[1]) : Math.sign(a[0] - b[0]);
}
const contraAtual = compararReleaseTecnico(novaVersao, versaoAtual);
const contraBase = compararReleaseTecnico(novaVersao, versaoBase);
if (contraAtual === null || contraBase === null || contraAtual < 0 || contraBase < 0) {
  console.error('Release técnico inválido ou menor que a versão atual/base. Use displayVersion para a numeração pública.');
  process.exit(1);
}

// O catálogo publicado identifica o release técnico, mesmo sem mudança clínica.
// Conferir aqui evita descobrir metadado antigo apenas na bateria E2E completa.
if (manifestoDerivou) {
  console.log(`\nManifesto de questões no release ${releaseDoManifesto || 'ausente'}; esperado ${novaVersao}.`);
}

if (apenasChecar) {
  process.exit(suspeitos.length || bustersAtrasados.length || mapaDerivou || manifestoDerivou || offlineDerivou || (precacheMudou.length && versaoParada) ? 1 : 0);
}

// `--sync` regera só o mapa, sem tocar em versão: serve para quem mexeu no
// STATIC_ASSETS sem estar fazendo release.
if (args.includes('--sync')) {
  const b = blocoEntre(swAtual, MARCA_INI, MARCA_FIM);
  if (!b) { console.error('marcadores de ASSET_VERSIONS não encontrados em sw.js'); process.exit(1); }
  escrever('sw.js', swAtual.slice(0, b.i) + `\n${mapaEsperado}\n` + swAtual.slice(b.f));
  escreverOfflineIntegrity();
  console.log('\nASSET_VERSIONS e integridade do Estudo Offline regerados.');
  process.exit(0);
}

if (!alvo) {
  console.error('\nInforme a nova versão (ex.: node scripts/bump-release.mjs 14.63) ou use --check.');
  process.exit(1);
}

// O gerador valida os quatro perfis reais antes de escrever o manifesto.
if (manifestoDerivou) {
  execFileSync(process.execPath, [resolve(raiz, 'tools/build-question-revision-manifest.cjs'), novaVersao],
    { cwd: raiz, stdio: 'inherit' });
}

// 1) version.json
escrever('version.json', `${JSON.stringify({ ...metadadosVersao, version: novaVersao })}\n`);

// 2) sw.js — comentário do topo e nome do cache
let sw = ler('sw.js');
sw = sw.replace(/(\/\/ NefroQuest Service Worker — v)\d+\.\d+/, `$1${novaVersao}`)
       .replace(/(const CACHE = 'nefroquest-v)\d+\.\d+/, `$1${novaVersao}`);
escrever('sw.js', sw);

// 3) release do Sentry e rótulos visíveis
for (const p of ['index.html', 'jogar/index.html']) {
  let s = ler(p);
  s = s.replace(/nefroquest@\d+\.\d+/g, `nefroquest@${novaVersao}`);
  s = s.replace(/>v\d+\.\d+</g, `>v${metadadosVersao.displayVersion || novaVersao}<`);
  escrever(p, s);
}

// 4) cache-buster SOMENTE dos arquivos que o diff acusa
let jogar = ler('jogar/index.html');
precisamBump.forEach(a => {
  const parameter = a.arquivo.startsWith('data/') ? 'release' : 'v';
  jogar = jogar.replace(new RegExp(`${a.arquivo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?(?:v|release)=[0-9.]+`, 'g'), `${a.arquivo}?${parameter}=${novaVersao}`);
});
escrever('jogar/index.html', jogar);

for (const file of DATA_CONSUMERS) {
  const before = ler(file);
  const after = before.replace(consumerBuster(file), (match, asset) => {
    const parameter = asset.startsWith('data/') ? 'release' : 'v';
    return alterados.includes(asset) ? `${asset}?${parameter}=${novaVersao}` : match;
  });
  if (after !== before) escrever(file, after);
}

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

escreverOfflineIntegrity();

console.log(`\nrelease ${novaVersao} aplicada.`);
