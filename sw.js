// NefroQuest Service Worker — v7.0
const CACHE = 'nefroquest-v7';
const ASSETS = [
  '/',
  '/index.html',
  '/perguntas.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/images/welcome-bg.png',
  '/assets/images/welcome-bg-portrait.jpg',
  '/assets/nefromancer.png',
  '/assets/sounds/bgmusic.mp3',
  '/assets/sounds/correct.wav',
  '/assets/sounds/wrong.wav',
  '/assets/sounds/levelup.wav',
  '/assets/sounds/streak.wav',
  '/assets/sounds/forge.wav',
  '/assets/sounds/chest.wav',
  '/assets/sounds/click.wav',
  '/assets/audio/welcome-theme.mp3',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.filter(Boolean)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  // Apenas GET, mesma origem
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200) return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => cached);
    })
  );
});
