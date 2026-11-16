import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const previous = read('tests/service-worker/fixtures/sw-17.27.js').replace(/\r\n/g, '\n');
const release = JSON.parse(read('version.json')).version;
const origin = 'https://nefroquest.com';
class BrowserRequest extends Request {
  constructor(value, options) { super(typeof value === 'string' ? new URL(value, origin) : value, options); }
}
function worker(source, {offline = false} = {}) {
  const handlers = new Map(), responses = new Map(), network = [];
  const key = request => new URL(typeof request === 'string' ? request : request.url, origin).href;
  const cache = {match: async request => responses.get(key(request))?.clone(),
    put: async (request, response) => {responses.set(key(request), response.clone());},
    delete: async request => responses.delete(key(request)), keys: async () => [...responses.keys()].map(x => new BrowserRequest(x))};
  vm.runInNewContext(source, {self: {addEventListener: (name, fn) => handlers.set(name, fn), skipWaiting() {}, clients: {claim: async () => {}}},
    location: {origin}, URL, Request: BrowserRequest, console,
    caches: {match: cache.match, open: async () => cache, keys: async () => [], delete: async () => {}},
    fetch: async request => {network.push(key(request)); if (offline) throw Error('Offline'); return new Response('current ' + key(request));}});
  return {network, seed: (pathname, value) => responses.set(key(pathname), new Response(value)),
    async request(url) {let result; handlers.get('fetch')({request: new BrowserRequest(url), respondWith: promise => {result = promise;}}); return (await result)?.text();},
    async install() {let result; handlers.get('install')({waitUntil: promise => {result = promise;}}); await result;},
    async activate() {let result; handlers.get('activate')({waitUntil: promise => {result = promise;}}); await result;}};
}
function scriptURLs(html) {return [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m => m[1]);}
async function nativeLazyURLs() {
  const library = vm.createContext({});
  vm.runInContext(read('js/library-catalog.js'), library);
  const scripts = [], context = vm.createContext({Promise, Error, window: {NQLibraryCatalog: library.NQLibraryCatalog},
    document: {querySelector: () => ({getAttribute: () => scriptURLs(read('jogar/index.html')).find(url => url.includes('js/library-catalog.js'))}),
      createElement: () => ({remove() {}}), head: {appendChild(script) {scripts.push(script.src);
      if (script.src.includes('refs.js')) context.refsDB = {};
      if (script.src.includes('articles.js')) context.nefroArticles = [];
      script.onload();}}},
    buildDeck: () => [], syncMasteredToDetailedStats() {}, _requiresQuestionRevisionCatalog: () => false,
    questionBank: null, HISTORY_SIZE: 30});
  const utils = read('js/utils.js');
  vm.runInContext(utils.slice(utils.indexOf('let _promessaGrimorio = null;'), utils.indexOf('window.carregarDadosGrimorio = carregarDadosGrimorio;')) + '\nglobalThis.carregarDadosGrimorio = carregarDadosGrimorio;', context);
  const game = read('js/game.js');
  vm.runInContext(game.slice(game.indexOf('let _topicsPromise = null;'), game.indexOf('window._loadTopics = _loadTopics;')), context);
  await context._loadTopics();
  // The question path needs refs only; library/idle later loads the articles.
  // Exercise both native paths so the article release URL remains covered.
  await context.carregarDadosGrimorio();
  return scripts;
}

test('new data requests bypass the exact published 17.27 worker before its replacement activates', async () => {
  assert.equal(createHash('sha256').update(previous).digest('hex'), 'f39cbbfdc5fc6500f055959c3bd844320a99cacdf24bb77fdc44021a7354f38c');
  const urls = [...scriptURLs(read('jogar/index.html')), ...scriptURLs(read('offline.html')), ...await nativeLazyURLs()]
    .filter(url => /(?:^|\/)data\/(?:topics|refs|articles|question-revision-manifest|question-revision-history|question-source-positions)\.js/.test(url));
  for (const pathname of ['/data/topics.js', '/data/refs.js', '/data/articles.js', '/data/question-revision-manifest.js', '/data/question-revision-history.js']) {
    assert(urls.some(url => new URL(url, origin).pathname === pathname), 'Native data consumer missing: ' + pathname);
  }
  for (const url of urls) {
    const old = worker(previous), pathname = new URL(url, origin).pathname;
    if (previous.includes("'" + pathname + "'")) old.seed(pathname, 'old 17.27');
    assert.match(await old.request(url), /^current /, 'Old worker served stale bytes for ' + url);
    assert.equal(old.network.length, 1, url);
  }
});

test('the current worker reads versioned data from canonical precache while offline', async () => {
  const current = worker(read('sw.js'), {offline: true});
  for (const name of ['topics', 'refs', 'articles', 'question-revision-manifest', 'question-revision-history', 'question-source-positions']) {
    current.seed('/data/' + name + '.js', 'approved ' + name);
    assert.equal(await current.request('/data/' + name + '.js?release=' + release), 'approved ' + name);
  }
  assert.deepEqual(current.network, []);
});

test('a newer data release bypasses this workers canonical cache', async () => {
  const current = worker(read('sw.js'));
  current.seed('/data/topics.js', 'old canonical topics');
  assert.match(await current.request('/data/topics.js?release=999.0'), /^current /);
  assert.equal(current.network.length, 1);
});

test('activation canonicalizes release data entries for unversioned offline consumers', async () => {
  const current = worker(read('sw.js'), {offline: true});
  current.seed('/data/topics.js?release=' + release, 'saved approved topics');
  await current.activate();
  assert.equal(await current.request('/data/topics.js'), 'saved approved topics');
  assert.deepEqual(current.network, []);
});

test('precache asks for the same release URLs as data consumers', async () => {
  const current = worker(read('sw.js'));
  await current.install();
  for (const name of ['topics', 'refs', 'articles', 'question-revision-manifest', 'question-revision-history', 'question-source-positions']) {
    assert(current.network.includes(origin + '/data/' + name + '.js?release=' + release), name);
  }
});
