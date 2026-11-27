// NefroQuest Service Worker — v17.35
const CACHE = 'nefroquest-v17.35';

// Apenas assets estáticos que raramente mudam (HTML não entra aqui — usa network-first)
const STATIC_ASSETS = [
  '/assets/vendor/supabase-js-2.106.2/supabase.js',
  '/js/progression.js',
  '/assets/scenes/ritual-initiation.webp',
  '/js/chamber-expansion.js',
  '/styles/lumen/chamber-expansion.css',
  '/styles/lumen/chamber-entrance.css',
  '/js/chamber-workspace.js',
  '/styles/lumen/chamber-workspace.css',
  '/assets/chamber/patients/aldric.webp',
  '/assets/chamber/patients/mara.webp',
  '/assets/chamber/patients/theron.webp',
  '/assets/chamber/patients/vance.webp',
  '/assets/chamber/patients/kael.webp',
  '/assets/chamber/patients/vorgath.webp',
  '/assets/chamber/patients/selene.webp',
  '/assets/chamber/patients/edrin.webp',
  '/assets/chamber/patients/liora.webp',
  '/assets/chamber/patients/borius.webp',
  '/assets/chamber/patients/isolde.webp',
  '/assets/chamber/patients/corvin.webp',
  '/assets/chamber/patients/ophelia.webp',
  '/assets/chamber/patients/helena.webp',
  '/assets/chamber/patients/brann.webp',
  '/assets/chamber/patients/nara.webp',
  '/assets/chamber/patients/galen.webp',
  '/assets/chamber/patients/maelis.webp',
  '/assets/chamber/patients/ivar.webp',
  '/assets/chamber/patients/mireth.webp',
  '/js/chamber-art.js',
  '/assets/scenes/chamber-balance-still.webp',
  '/styles/lumen/chamber-desktop.css',
  '/assets/boss-cinema/v2/hit1.webp',
  '/assets/boss-cinema/v2/hit2.webp',
  '/assets/boss-cinema/v2/hit4.webp',
  '/assets/boss-cinema/v2/hit5.webp',
  '/assets/boss-cinema/v2/hit6.webp',
  '/assets/boss-cinema/v2/hit7.webp',
  '/js/cinema-poison-portraits.js',
  '/assets/poison-cinema/v2/nephros-nivel10-veneno-v2.webp',
  '/assets/poison-cinema/v2/aquaria-nivel10-veneno-v2.webp',
  '/assets/poison-cinema/v2/glomerulus-nivel10-veneno-v2.webp',
  '/js/cinema-movie-art.js',
  '/js/cinema-movie-sound.js',
  '/js/cinema-character-prologue.js',
  '/js/cinema-equipment-seals.js',
  '/js/cinema-victory-epilogue.js',
  '/styles/lumen/cinemamotion.css',
  '/styles/lumen/bossfinishing.css',
  '/assets/cinema-audio/v1/battle-dragon-due.mp3',
  '/assets/cinema-audio/v1/victory-sovereign-ascent.mp3',
  '/js/cinema-boss-art-states.js',
  '/js/cinema-boss-static-adapter.js',
  '/js/cinema-cinematic-intro.js',
  '/js/cinema-entry-bridge.js',
  '/js/cinema-entry-cinema.js',
  '/js/cinema-entry-seen.js',
  '/js/cinema-entry-source-config.js',
  '/js/cinema-intro-bridge.js',
  '/js/cinema-intro-source-config.js',
  '/js/cinema-victory-bridge.js',
  '/js/cinema-victory-source-config.js',
  '/styles/lumen/cinemaboss.css',
  '/styles/lumen/cinemaentry.css',
  '/styles/lumen/cinemaframe.css',
  '/styles/lumen/cinemalayout.css',
  '/styles/lumen/cinemavictory.css',
  '/offline.html',
  '/assets/sounds/bgmusic.mp3',
  '/assets/sounds/correct.mp3',
  '/assets/sounds/wrong.mp3',
  '/assets/sounds/levelup.mp3',
  '/assets/sounds/streak.mp3',
  '/assets/sounds/forge.mp3',
  '/assets/sounds/chest.mp3',
  '/assets/sounds/click.mp3',
  '/assets/sounds/boss.mp3',
  '/assets/sounds/victory.mp3',
  '/assets/audio/welcome-theme.mp3',
  '/assets/nefromancer.png',
  '/assets/scenes/forge-panorama-dark.webp',
  '/assets/chests/reliquias-sprites.png',
  '/assets/badges/badge1-384.jpg',
  '/assets/badges/badge2-384.jpg',
  '/assets/badges/badge3-384.jpg',
  '/assets/badges/badge4-384.jpg',
  '/assets/badges/badge5-384.jpg',
  '/assets/badges/badge1.png',
  '/assets/badges/badge2.png',
  '/assets/badges/badge3.png',
  '/assets/badges/badge4.png',
  '/assets/badges/badge5.png',
  '/assets/achievements/hemodialise.webp',
  '/assets/achievements/guardiao.webp',
  '/assets/achievements/cristal.webp',
  '/assets/achievements/transplante.webp',
  '/assets/achievements/microscopio.webp',
  '/assets/achievements/centenario.webp',
  '/assets/achievements/precisao.webp',
  '/assets/achievements/hardcore.webp',
  '/assets/achievements/alquimia.webp',
  '/assets/achievements/grimorio.webp',
  '/assets/achievements/louros.webp',
  '/assets/achievements/campeao.webp',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/landing/assets/favicon-q.ico',
  '/landing/assets/favicon.svg',
  '/landing/assets/favicon-32x32.png',
  '/landing/assets/favicon-192x192.png',
  '/data/refs.js',
  '/data/articles.js',
  '/data/topics.js',
  '/data/question-revision-manifest.js',
  '/data/question-source-positions.js',
  '/data/question-revision-history.js',
  '/js/question-revisions.js',
  '/data/rapid-quiz.js',
  '/data/competencies.js',
  '/style.css',
  '/styles/lumen/tokens.css',
  '/styles/lumen/shell.css',
  '/styles/lumen/portal.css',
  '/styles/lumen/atrium.css',
  '/styles/lumen/game.css',
  '/styles/lumen/difficulty.css',
  '/styles/lumen/dashboard.css',
  '/styles/lumen/charselect.css',
  '/styles/lumen/modes.css',
  '/styles/lumen/exam.css',
  '/styles/lumen/forge.css',
  '/styles/lumen/header.css',
  '/styles/lumen/equipment.css',
  '/styles/lumen/boss.css',
  '/styles/lumen/ritual.css',
  '/styles/lumen/ranking.css',
  '/styles/lumen/achievements.css',
  '/styles/lumen/oracle.css',
  '/assets/images/google-g.png',
  '/assets/images/google-sans-medium.woff2',
  '/assets/badges/badge1.webp',
  '/assets/badges/badge2.webp',
  '/assets/badges/badge3.webp',
  '/assets/badges/badge4.webp',
  '/assets/badges/badge5.webp',
  '/assets/badges/badge1-384.webp',
  '/assets/badges/badge2-384.webp',
  '/assets/badges/badge3-384.webp',
  '/assets/badges/badge4-384.webp',
  '/assets/badges/badge5-384.webp',
  '/js/library-catalog.js',
  '/js/utils.js',
  '/js/pilot.js',
  '/js/character-benefits.js',
  '/js/answer-presentation.js',
  '/js/audio.js',
  '/js/leaderboard.js',
  '/js/study-mode.js',
  '/js/game.js',
  '/js/notifications.js',
  '/js/auth.js',
  '/js/portal.js',
  '/js/atrium.js',
  '/js/paywall.js',
  '/js/account.js',
  '/js/boss.js',
  '/js/exam.js',
  '/js/admin.js',
  '/js/minigame.js',
  '/js/minigame-acidbase.js',
  '/js/achievements.js',
  '/js/changelog.js',
  '/js/equipment-preview.js',
  '/js/dashboard-skills.js',
  '/styles/lumen/skills.css',
  '/assets/images/grimoire-banner-1711.webp',
  '/js/dashboard.js',
];

// Versões dos assets — GERADO por scripts/bump-release.mjs, não editar à mão.
// A fonte da verdade é o cache-buster de jogar/index.html; `--check` acusa
// divergência na CI.
//
// Existe porque o install precisa pedir a MESMA URL que a página pede. Enquanto
// o SW buscava '/js/game.js' e a página '/js/game.js?v=14.61', eram duas
// entradas distintas no cache HTTP: todo asset versionado do precache era
// baixado duas vezes no primeiro acesso. A entrada continua sendo gravada sob a
// chave canônica (sem query), que é a que canonicalAssetKey() consulta.
// bump-release:asset-versions:início
const ASSET_VERSIONS = {
  '/js/progression.js': '16.84',
  '/js/chamber-expansion.js': '17.06',
  '/styles/lumen/chamber-expansion.css': '17.09',
  '/styles/lumen/chamber-entrance.css': '17.11',
  '/js/chamber-workspace.js': '17.16',
  '/styles/lumen/chamber-workspace.css': '17.16',
  '/js/chamber-art.js': '17.03',
  '/styles/lumen/chamber-desktop.css': '17.03',
  '/js/cinema-poison-portraits.js': '16.43',
  '/js/cinema-movie-art.js': '16.42',
  '/js/cinema-movie-sound.js': '16.42',
  '/js/cinema-character-prologue.js': '16.42',
  '/js/cinema-equipment-seals.js': '16.43',
  '/js/cinema-victory-epilogue.js': '16.43',
  '/styles/lumen/cinemamotion.css': '16.42',
  '/styles/lumen/bossfinishing.css': '17.17',
  '/js/cinema-boss-art-states.js': '16.39',
  '/js/cinema-boss-static-adapter.js': '16.43',
  '/js/cinema-cinematic-intro.js': '16.46',
  '/js/cinema-entry-bridge.js': '16.91',
  '/js/cinema-entry-cinema.js': '16.43',
  '/js/cinema-entry-seen.js': '16.28',
  '/js/cinema-entry-source-config.js': '16.28',
  '/js/cinema-intro-bridge.js': '16.43',
  '/js/cinema-intro-source-config.js': '16.39',
  '/js/cinema-victory-bridge.js': '17.21',
  '/js/cinema-victory-source-config.js': '16.28',
  '/styles/lumen/cinemaboss.css': '16.43',
  '/styles/lumen/cinemaentry.css': '16.28',
  '/styles/lumen/cinemaframe.css': '16.28',
  '/styles/lumen/cinemalayout.css': '16.43',
  '/styles/lumen/cinemavictory.css': '16.28',
  '/data/refs.js': '17.28',
  '/data/articles.js': '17.28',
  '/data/topics.js': '17.32',
  '/data/question-revision-manifest.js': '17.35',
  '/data/question-source-positions.js': '17.28',
  '/data/question-revision-history.js': '17.32',
  '/js/question-revisions.js': '17.27',
  '/data/competencies.js': '17.28',
  '/style.css': '17.34',
  '/styles/lumen/tokens.css': '15.77',
  '/styles/lumen/shell.css': '16.18',
  '/styles/lumen/portal.css': '17.15',
  '/styles/lumen/atrium.css': '17.15',
  '/styles/lumen/game.css': '17.34',
  '/styles/lumen/difficulty.css': '17.06',
  '/styles/lumen/dashboard.css': '17.17',
  '/styles/lumen/charselect.css': '17.15',
  '/styles/lumen/modes.css': '17.34',
  '/styles/lumen/exam.css': '17.15',
  '/styles/lumen/forge.css': '16.85',
  '/styles/lumen/header.css': '15.91',
  '/styles/lumen/equipment.css': '16.62',
  '/styles/lumen/boss.css': '16.84',
  '/styles/lumen/ritual.css': '17.24',
  '/styles/lumen/ranking.css': '17.15',
  '/styles/lumen/achievements.css': '17.34',
  '/styles/lumen/oracle.css': '16.25',
  '/js/library-catalog.js': '17.32',
  '/js/utils.js': '17.31',
  '/js/pilot.js': '17.17',
  '/js/character-benefits.js': '16.07',
  '/js/answer-presentation.js': '16.09',
  '/js/audio.js': '16.28',
  '/js/leaderboard.js': '17.15',
  '/js/study-mode.js': '17.34',
  '/js/game.js': '17.34',
  '/js/notifications.js': '11.90',
  '/js/auth.js': '17.17',
  '/js/portal.js': '17.15',
  '/js/atrium.js': '17.08',
  '/js/paywall.js': '17.34',
  '/js/account.js': '17.34',
  '/js/boss.js': '17.34',
  '/js/exam.js': '17.34',
  '/js/admin.js': '17.30',
  '/js/minigame.js': '17.34',
  '/js/minigame-acidbase.js': '17.24',
  '/js/achievements.js': '17.34',
  '/js/changelog.js': '17.15',
  '/js/equipment-preview.js': '16.62',
  '/js/dashboard-skills.js': '17.15',
  '/styles/lumen/skills.css': '17.15',
  '/js/dashboard.js': '17.34',
};
// bump-release:asset-versions:fim

// bump-release:offline-integrity:início
const OFFLINE_FILES = [
  ["/offline.html","009460e2ee29db01922860548958c17c07abb7074b1dca9cec2c0a7c141566fb"],
  ["/js/answer-presentation.js?v=16.09","3f6b509ad3f1a8a71f259837a358eb0e6f6ac34f0478bee36a6fa4f44a506a1e"],
  ["/data/question-revision-manifest.js?release=17.35","a47858a619ef048b00e958b64164303a8ae98bcc31648e5fe4777d22fd87ac66"],
  ["/data/question-revision-history.js?release=17.32","8d7040070f9b302ab1d4c8addf67e61b7b7577fdd2312c7cc4302174bd6e954d"],
  ["/js/question-revisions.js?v=17.27","855d5deb204150997ca2efbb46e2629535c4ed3c80d7371e85623cb7712ae6b4"],
  ["/data/topics.js?release=17.32","0f12b34e445d904c72e616a548f8c204d512041ed4550307ed2961a7216f05f8"],
];
// bump-release:offline-integrity:fim

// Única ponte para versões que ainda não gravavam um pacote verificado. A
// cópia canônica antiga pode já estar misturada: não confie no nome do cache.
const OFFLINE_LEGACY_CACHE = 'nefroquest-v17.34';
const OFFLINE_LEGACY_FILES = [
  ["/offline.html","a9158e983783203d22c98ed58b08c7e55bb36b7d49e9559c29567253c5ee29a6"],
  ["/js/answer-presentation.js?v=16.09","3f6b509ad3f1a8a71f259837a358eb0e6f6ac34f0478bee36a6fa4f44a506a1e"],
  ["/data/question-revision-manifest.js?release=17.34","dd8e82fccffdba3a50f9fe853732c84fa84717313d2282a923f8bfe77bde5b08"],
  ["/data/question-revision-history.js?release=17.32","8d7040070f9b302ab1d4c8addf67e61b7b7577fdd2312c7cc4302174bd6e954d"],
  ["/js/question-revisions.js?v=17.27","855d5deb204150997ca2efbb46e2629535c4ed3c80d7371e85623cb7712ae6b4"],
  ["/data/topics.js?release=17.32","0f12b34e445d904c72e616a548f8c204d512041ed4550307ed2961a7216f05f8"],
];

const OFFLINE_PREFIX = '/__nq_offline_bundle__/';
const OFFLINE_CACHE_PREFIX = 'nefroquest-offline-bundle-';
const offlineId = files => files[0][1];
const offlineKey = (id, item) => OFFLINE_PREFIX + id + '/' + item;
const offlineCacheName = id => OFFLINE_CACHE_PREFIX + id;
const currentOfflineId = offlineId(OFFLINE_FILES);
const OFFLINE_CLEAN_PATH = '/offline';
const offlinePaths = new Set(OFFLINE_FILES.map(([url]) => url.split('?')[0]));

async function verifiedOfflineResponse(response, hash) {
  if (!response?.ok || response.status !== 200 || response.redirected) return false;
  const digest = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('') === hash;
}

async function readOfflineBundle(id, knownCache) {
  try {
    if (!knownCache && !await caches.has(offlineCacheName(id))) return null;
    const cache = knownCache || await caches.open(offlineCacheName(id));
    const marker = await cache.match(offlineKey(id, 'ready'));
    if (!marker) return null;
    const files = await marker.json();
    if (!Array.isArray(files) || files.length !== OFFLINE_FILES.length || offlineId(files) !== id
      || !files.every((pair, i) => Array.isArray(pair) && typeof pair[0] === 'string'
        && pair[0].split('?')[0] === OFFLINE_FILES[i][0].split('?')[0] && /^[0-9a-f]{64}$/.test(pair[1]))) return null;
    const entries = await Promise.all(files.map((_, index) => cache.match(offlineKey(id, index))));
    return entries.every(Boolean) ? { id, files, cache, entries } : null;
  } catch (_) { return null; }
}

async function previousOfflineIds() {
  // CacheStorage.keys mantém a ordem de criação. Não abra caches alheios.
  return (await caches.keys()).reverse().filter(name => name.startsWith(OFFLINE_CACHE_PREFIX))
    .map(name => name.slice(OFFLINE_CACHE_PREFIX.length))
    .filter(id => id !== currentOfflineId && /^[0-9a-f]{64}$/.test(id));
}

async function previousOfflineBundle() {
  for (const id of await previousOfflineIds()) {
    const bundle = await readOfflineBundle(id);
    if (bundle) return bundle;
  }
  return null;
}

async function saveOfflineBundle(files, obtain) {
  const id = offlineId(files);
  try {
    const cache = await caches.open(offlineCacheName(id));
    const ready = await readOfflineBundle(id, cache);
    if (ready) return ready;
    // Enquanto incompleto, cada entrada fica sob um endereço privado. O
    // worker anterior usa caches.match global para os endereços canônicos.
    await cache.delete(offlineKey(id, 'ready'));
    for (let index = 0; index < files.length; index++) {
      const [path, hash] = files[index];
      const key = offlineKey(id, index);
      const staged = await cache.match(key);
      if (await verifiedOfflineResponse(staged, hash)) continue;
      const response = await obtain(path, hash);
      if (!await verifiedOfflineResponse(response, hash)) return null;
      await cache.put(key, response);
    }
    await cache.put(offlineKey(id, 'ready'), new Response(JSON.stringify(files)));
    return await readOfflineBundle(id, cache);
  } catch (_) { return null; } // quota, rede ou digest: não promove o pacote
}

async function migrateOfflineBundle() {
  const previous = await previousOfflineBundle();
  if (previous) return previous;
  if (!await caches.has(OFFLINE_LEGACY_CACHE)) return null;
  // Leia só a geração candidata à migração, nunca faça uma busca global.
  const cache = await caches.open(OFFLINE_LEGACY_CACHE);
  return saveOfflineBundle(OFFLINE_LEGACY_FILES, path => cache.match(path.split('?')[0]));
}

let offlinePreparation;
let lastOfflinePreparation = 0;
function prepareCurrentOfflineBundle(previous) {
  if (offlinePreparation) return offlinePreparation;
  if (Date.now() - lastOfflinePreparation < 5000) return Promise.resolve(null);
  lastOfflinePreparation = Date.now();
  offlinePreparation = saveOfflineBundle(OFFLINE_FILES, async (path, hash) => {
    const match = previous?.files.findIndex(([, digest]) => digest === hash) ?? -1;
    if (match >= 0) return previous.entries[match].clone();
    const options = { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) };
    if (path !== '/offline.html') return fetch(path, options);
    // Alguns hosts servem o mesmo documento por /offline. Tente apenas as
    // duas rotas conhecidas, sem seguir redirecionamentos ou pular o digest.
    const direct = await fetch(path, options).catch(() => null);
    return direct?.status === 200 ? direct : fetch(OFFLINE_CLEAN_PATH, options);
  }).finally(() => { offlinePreparation = null; });
  return offlinePreparation;
}

async function offlineStudyResponse(bundle) {
  if (!bundle) {
    return new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Estudo Offline</title><main><h1>Estudo Offline</h1><p>Reconecte-se para concluir o download das questões. Sua sessão salva não foi alterada.</p><a href="/offline.html">Tentar novamente</a></main></html>', {
      status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  let html = await bundle.entries[0].text();
  bundle.files.slice(1).forEach(([path], i) => {
    html = html.replace('src="' + path + '"', 'src="' + offlineKey(bundle.id, i + 1) + '"');
  });
  // Os scripts pedem a identidade do próprio documento, inclusive quando
  // outra versão fica pronta entre a navegação e o último script.
  const headers = new Headers(bundle.entries[0].headers);
  for (const key of ['Content-Length', 'Content-Encoding', 'ETag']) headers.delete(key);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(html, { headers });
}

async function serveOfflineStudy(event) {
  const current = await readOfflineBundle(currentOfflineId);
  if (current) return offlineStudyResponse(current);
  const previous = await previousOfflineBundle();
  const pending = prepareCurrentOfflineBundle(previous);
  if (previous) {
    // Continue estudando na versão íntegra enquanto a versão nova baixa.
    event.waitUntil(pending);
    return offlineStudyResponse(previous);
  }
  return offlineStudyResponse(await pending);
}

async function serveOfflineScript(path) {
  const m = path.match(/^\/__nq_offline_bundle__\/([0-9a-f]{64})\/([1-9][0-9]*)$/);
  if (m && Number(m[2]) < OFFLINE_FILES.length && await caches.has(offlineCacheName(m[1]))) {
    const cache = await caches.open(offlineCacheName(m[1]));
    if (await cache.match(offlineKey(m[1], 'ready'))) {
      const response = await cache.match(path);
      if (response) return response;
    }
  }
  return new Response('', { status: 404 });
}

// Uma resposta boa da rede continua utilizável se o cache estiver cheio ou
// indisponível. Isso não afeta o selo do Estudo Offline.
async function rememberApplicationAsset(key, response) {
  try {
    const cache = await caches.open(CACHE);
    await cache.put(key, response.clone());
    return cache;
  } catch (_) { return null; }
}

function canonicalAssetKey(request, url) {
  if (!url.searchParams.has('v') && !(url.pathname.startsWith('/data/') && url.searchParams.has('release'))) return request;
  return new Request(url.pathname, { method: 'GET', credentials: 'same-origin' });
}

async function canonicalizeVersionedAssetEntries(cache) {
  const requests = await cache.keys();
  await Promise.all(requests.map(async request => {
    const url = new URL(request.url);
    if (url.origin !== location.origin || (!url.searchParams.has('v') && !(url.pathname.startsWith('/data/') && url.searchParams.has('release')))) return;

    const canonicalKey = canonicalAssetKey(request, url);
    const existing = await cache.match(canonicalKey);
    if (!existing) {
      const response = await cache.match(request);
      if (response) await cache.put(canonicalKey, response);
    }
    await cache.delete(request);
  }));
}

let installOfflineReady;
self.addEventListener('install', e => {
  installOfflineReady = (async () => {
    let previous;
    try { previous = await migrateOfflineBundle(); } catch (_) { /* cache indisponível */ }
    const current = await prepareCurrentOfflineBundle(previous);
    if (!current && !previous) throw new Error('Nenhum pacote de Estudo Offline íntegro.');
    return current;
  })();
  e.waitUntil(installOfflineReady.then(async () => {
    const cache = await caches.open(CACHE).catch(() => null);
    if (cache) await Promise.allSettled(STATIC_ASSETS.filter(path => !offlinePaths.has(path)).map(async path => {
      const version = ASSET_VERSIONS[path];
      const parameter = path.startsWith('/data/') ? 'release' : 'v';
      const response = version
        ? await fetch(`${path}?${parameter}=${version}`)
        : await fetch(path, { cache: 'no-store' });
      if (response.ok) await cache.put(path, response);
    }));
    await self.skipWaiting();
  }));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE).catch(() => null);
    const current = await readOfflineBundle(currentOfflineId);
    if (current && cache) {
      await Promise.allSettled(current.files.slice(1).map(([path], i) =>
        cache.put(path.split('?')[0], current.entries[i + 1])));
    }
    if (cache) await canonicalizeVersionedAssetEntries(cache).catch(() => {});
    // Só aposente gerações antigas após confirmar a atual. Retenha até duas
    // anteriores para navegações que já receberam um documento anterior.
    if (current) {
      let retained = 0;
      for (const id of await previousOfflineIds()) {
        if (retained < 2 && await readOfflineBundle(id)) retained++;
        else await caches.delete(offlineCacheName(id)).catch(() => {});
      }
    }
    // O legado só é removido depois de selar o conjunto atual ou o anterior.
    // Nunca apague caches de outras aplicações da origem.
    await Promise.allSettled((await caches.keys()).filter(name =>
      name !== CACHE && /^nefroquest-v\d+\.\d+$/.test(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING' && installOfflineReady) {
    // A mensagem não contorna a verificação de prontidão da instalação.
    e.waitUntil(installOfflineReady.then(() => self.skipWaiting()).catch(() => {}));
  }
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname === '/clear-cache.html') return;
  if (url.pathname === '/version.json') return;
  if (url.pathname.startsWith(OFFLINE_PREFIX)) {
    e.respondWith(serveOfflineScript(url.pathname));
    return;
  }
  if (url.pathname === '/offline.html' || url.pathname === OFFLINE_CLEAN_PATH) {
    e.respondWith(serveOfflineStudy(e));
    return;
  }
  // Filmes usam respostas HTTP Range (206), que Cache.put nao aceita.
  // Deixe o navegador transmitir e buscar trechos sem interceptar a midia.
  if (url.pathname.startsWith('/assets/cinema/') && url.pathname.endsWith('.mp4')) return;

  // HTML e navegação → network-first com fallback para offline.html
  const isNav = e.request.mode === 'navigate'
    || url.pathname.endsWith('.html')
    || url.pathname === '/';

  if (isNav) {
    // Cache sob a pathname canônica (sem query string) para evitar cachear
    // versões com ?payment=approved, ?code=... etc. como entradas separadas.
    const canonicalKey = new Request(url.pathname, { method: 'GET', credentials: 'same-origin' });
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(async res => {
          if (res.ok) {
            await rememberApplicationAsset(canonicalKey, res);
          }
          return res;
        })
        .catch(() => caches.match(canonicalKey).then(cached => cached || serveOfflineStudy(e)))
    );
    return;
  }

  // Assets estáticos → cache-first (sons, imagens, fontes)
  // `?v=` apenas invalida o navegador/SW; o conteúdo é o mesmo pathname.
  // Usar uma chave canônica evita duplicatas e permite que o precache sem query
  // atenda a URL versionada quando o dispositivo estiver offline.
  const assetCacheKey = canonicalAssetKey(e.request, url);

  // Página mais nova que este Service Worker → não servir o cache dele.
  //
  // A chave canônica descarta a query, então `/js/game.js?v=14.79` e `?v=14.84`
  // apontam para a MESMA entrada. Sendo cache-first, o SW antigo respondia à
  // release nova com o conteúdo velho: HTML novo, JavaScript antigo, na mesma
  // carga. O `activate` até apaga caches de outro nome, mas só depois — a
  // página já montou misturada.
  //
  // A versão pedida na URL vem do HTML, que é network-first e portanto sempre
  // fresco. Se ela não bate com a que ESTE SW conhece, quem está atrasado é o
  // SW: vai à rede e não devolve o que tem guardado. Quando as duas batem, o
  // cache-first continua valendo inteiro — inclusive offline.
  const versaoPedida = (url.pathname.startsWith('/data/') ? url.searchParams.get('release') : null)
    ?? url.searchParams.get('v');
  const versaoConhecida = ASSET_VERSIONS[url.pathname];
  const swDesatualizado = versaoPedida !== null
    && versaoConhecida !== undefined
    && versaoPedida !== versaoConhecida;

  if (swDesatualizado) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(async res => {
          if (res.ok) {
            // Grava sob a chave canônica para que o próximo acesso — já com o
            // SW novo ativo — encontre o conteúdo certo.
            await rememberApplicationAsset(assetCacheKey, res);
          }
          return res;
        })
        // Sem rede, o cache velho ainda é melhor que falhar: offline, um app
        // coerente com a release anterior vale mais que uma tela em branco.
        .catch(() => caches.match(assetCacheKey).then(c => c || fetch(e.request)))
    );
    return;
  }

  e.respondWith(
    caches.match(assetCacheKey).then(async cached => {
      if (cached) return cached;

      // Compatibilidade com entradas gravadas por versões antigas do SW.
      // Migra no primeiro acesso sem exigir rede.
      if (assetCacheKey !== e.request) {
        const legacy = await caches.match(e.request);
        if (legacy) {
          const cache = await rememberApplicationAsset(assetCacheKey, legacy);
          if (cache) await cache.delete(e.request).catch(() => {});
          return legacy;
        }
      }

      return fetch(e.request).then(async res => {
        if (res.ok) {
          await rememberApplicationAsset(assetCacheKey, res);
        }
        return res;
      }).catch(() => caches.match(assetCacheKey));
    })
  );
});

// ── Web Push notifications ────────────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'NefroQuest', body: 'Você tem uma novidade!', url: '/jogar/', tag: 'nq-push',
                icon: '/landing/assets/favicon-192x192.png', badge: '/landing/assets/favicon-32x32.png' };
  try { if (e.data) Object.assign(data, e.data.json()); } catch {}
  // Campanhas antigas enviam os caminhos do N: mantém o conteúdo do push e usa a marca Q aprovada.
  const legacyIcon = /^(?:https:\/\/nefroquest\.com)?\/?assets\/images\/(?:favicon-(?:16x16|32x32|180x180|192x192|512x512)\.png|apple-touch-icon\.png)(?:\?.*)?$/;
  if (legacyIcon.test(data.icon)) data.icon = '/landing/assets/favicon-192x192.png';
  if (legacyIcon.test(data.badge)) data.badge = '/landing/assets/favicon-32x32.png';
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body, icon: data.icon, badge: data.badge,
      tag: data.tag, renotify: true, data: { url: data.url }
    })
  );
});

// ── Study reminder via Periodic Background Sync ──────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'nq-study-reminder') {
    e.waitUntil(
      self.registration.showNotification('NefroQuest — hora de estudar! 📚', {
        body: 'Mantenha sua sequência de estudos. Uma sessão rápida faz a diferença.',
        icon: '/landing/assets/favicon-192x192.png',
        badge: '/landing/assets/favicon-32x32.png',
        tag: 'nq-study-reminder',
        renotify: false,
        data: { url: '/jogar/' }
      })
    );
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/jogar/'));
});
