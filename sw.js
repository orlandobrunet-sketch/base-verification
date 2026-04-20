// NefroQuest Service Worker — v9.3
const CACHE = 'nefroquest-v9.3';

// Apenas assets estáticos que raramente mudam (HTML não entra aqui — usa network-first)
const STATIC_ASSETS = [
  '/assets/sounds/bgmusic.mp3',
  '/assets/sounds/correct.wav',
  '/assets/sounds/wrong.wav',
  '/assets/sounds/levelup.wav',
  '/assets/sounds/streak.wav',
  '/assets/sounds/forge.wav',
  '/assets/sounds/chest.wav',
  '/assets/sounds/click.wav',
  '/assets/audio/welcome-theme.mp3',
  '/assets/images/welcome-bg.png',
  '/assets/images/welcome-bg-portrait.jpg',
  '/assets/nefromancer.png',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', e => {
  // CRÍTICO: skipWaiting() chamado IMEDIATAMENTE — não bloqueia no precache
  self.skipWaiting();

  // Precache em background; falhas individuais são ignoradas
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        STATIC_ASSETS.map(url =>
          fetch(url, { cache: 'no-store' })
            .then(res => { if (res.ok) cache.put(url, res.clone()); })
            .catch(() => {})
        )
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

  // HTML e navegação → network-first com cache: no-store para bypassar CDN/HTTP cache
  const isNav = e.request.mode === 'navigate'
    || url.pathname.endsWith('.html')
    || url.pathname === '/';

  if (isNav) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets estáticos → cache-first (sons, imagens, fontes)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match(e.request));
    })
  );
});
