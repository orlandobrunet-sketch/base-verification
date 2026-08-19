// NefroQuest Service Worker — v14.69
const CACHE = 'nefroquest-v14.69';

// Apenas assets estáticos que raramente mudam (HTML não entra aqui — usa network-first)
const STATIC_ASSETS = [
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
  '/assets/badges/badge1-384.jpg',
  '/assets/badges/badge2-384.jpg',
  '/assets/badges/badge3-384.jpg',
  '/assets/badges/badge4-384.jpg',
  '/assets/badges/badge5-384.jpg',
  '/manifest.json',
  '/favicon.ico',
  '/data/refs.js',
  '/data/articles.js',
  '/data/topics.js',
  '/data/rapid-quiz.js',
  '/data/competencies.js',
  '/style.css',
  '/styles/lumen/tokens.css',
  '/styles/lumen/components.css',
  '/styles/lumen/motion.css',
  '/styles/lumen/portal.css',
  '/styles/lumen/atrium.css',
  '/styles/lumen/game.css',
  '/styles/lumen/difficulty.css',
  '/styles/lumen/dashboard.css',
  '/styles/lumen/charselect.css',
  '/js/utils.js',
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
  '/style.css': '14.18',
  '/styles/lumen/tokens.css': '13.20',
  '/styles/lumen/components.css': '13.20',
  '/styles/lumen/motion.css': '13.20',
  '/styles/lumen/portal.css': '14.02',
  '/styles/lumen/atrium.css': '14.18',
  '/styles/lumen/game.css': '14.13',
  '/styles/lumen/difficulty.css': '14.34',
  '/styles/lumen/dashboard.css': '14.62',
  '/styles/lumen/charselect.css': '14.61',
  '/js/utils.js': '11.90',
  '/js/audio.js': '14.69',
  '/js/leaderboard.js': '11.90',
  '/js/study-mode.js': '14.53',
  '/js/game.js': '14.61',
  '/js/notifications.js': '11.90',
  '/js/auth.js': '13.44',
  '/js/portal.js': '13.20',
  '/js/atrium.js': '13.23',
  '/js/paywall.js': '11.90',
  '/js/account.js': '11.90',
  '/js/boss.js': '11.90',
  '/js/exam.js': '11.90',
  '/js/admin.js': '11.90',
  '/js/minigame.js': '14.34',
  '/js/minigame-acidbase.js': '11.90',
  '/js/achievements.js': '14.52',
  '/js/changelog.js': '11.90',
  '/js/dashboard.js': '14.62',
};
// bump-release:asset-versions:fim

function canonicalAssetKey(request, url) {
  if (!url.searchParams.has('v')) return request;
  return new Request(url.pathname, { method: 'GET', credentials: 'same-origin' });
}

async function canonicalizeVersionedAssetEntries(cache) {
  const requests = await cache.keys();
  await Promise.all(requests.map(async request => {
    const url = new URL(request.url);
    if (url.origin !== location.origin || !url.searchParams.has('v')) return;

    const canonicalKey = canonicalAssetKey(request, url);
    const existing = await cache.match(canonicalKey);
    if (!existing) {
      const response = await cache.match(request);
      if (response) await cache.put(canonicalKey, response);
    }
    await cache.delete(request);
  }));
}

self.addEventListener('install', e => {
  // CRÍTICO: skipWaiting() chamado IMEDIATAMENTE — não bloqueia no precache
  self.skipWaiting();

  // Precache em background; falhas individuais são ignoradas.
  //
  // Asset COM buster: pede a mesma URL versionada que a página pediu segundos
  // antes, sem `no-store`. O cache HTTP atende e o download não se repete. O
  // frescor não depende disso — a URL muda a cada release do arquivo.
  //
  // Asset SEM buster (áudio, imagens, data/*.js): mantém `no-store`. Sem URL
  // versionada, deixar o cache HTTP responder poderia gravar uma cópia velha no
  // cache do SW, e ela ficaria lá pelo ciclo inteiro da release — inclusive de
  // data/topics.js, que é conteúdo médico. Aqui frescor vale mais que banda.
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        STATIC_ASSETS.map(caminho => {
          const versao = ASSET_VERSIONS[caminho];
          const busca = versao
            ? fetch(`${caminho}?v=${versao}`)
            : fetch(caminho, { cache: 'no-store' });
          return busca
            .then(res => { if (res.ok) cache.put(caminho, res.clone()); })
            .catch(() => {});
        })
      )
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => caches.open(CACHE))
      .then(cache => canonicalizeVersionedAssetEntries(cache))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname === '/clear-cache.html') return;
  if (url.pathname === '/version.json') return;

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
            const cache = await caches.open(CACHE);
            await cache.put(canonicalKey, res.clone());
          }
          return res;
        })
        .catch(() => caches.match(canonicalKey).then(cached => cached || caches.match('/offline.html')))
    );
    return;
  }

  // Assets estáticos → cache-first (sons, imagens, fontes)
  // `?v=` apenas invalida o navegador/SW; o conteúdo é o mesmo pathname.
  // Usar uma chave canônica evita duplicatas e permite que o precache sem query
  // atenda a URL versionada quando o dispositivo estiver offline.
  const assetCacheKey = canonicalAssetKey(e.request, url);
  e.respondWith(
    caches.match(assetCacheKey).then(async cached => {
      if (cached) return cached;

      // Compatibilidade com entradas gravadas por versões antigas do SW.
      // Migra no primeiro acesso sem exigir rede.
      if (assetCacheKey !== e.request) {
        const legacy = await caches.match(e.request);
        if (legacy) {
          const cache = await caches.open(CACHE);
          await cache.put(assetCacheKey, legacy.clone());
          await cache.delete(e.request);
          return legacy;
        }
      }

      return fetch(e.request).then(async res => {
        if (res.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(assetCacheKey, res.clone());
        }
        return res;
      }).catch(() => caches.match(assetCacheKey));
    })
  );
});

// ── Web Push notifications ────────────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'NefroQuest', body: 'Você tem uma novidade!', url: '/jogar/', tag: 'nq-push',
                icon: '/assets/images/favicon-192x192.png', badge: '/assets/images/favicon-32x32.png' };
  try { if (e.data) Object.assign(data, e.data.json()); } catch {}
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
        icon: '/assets/images/favicon-192x192.png',
        badge: '/assets/images/favicon-32x32.png',
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
