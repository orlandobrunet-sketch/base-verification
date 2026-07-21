// NefroQuest Service Worker — v13.02
const CACHE = 'nefroquest-v13.02';

// Apenas assets estáticos que raramente mudam (HTML não entra aqui — usa network-first)
const STATIC_ASSETS = [
  '/offline.html',
  '/assets/sounds/bgmusic.mp3',
  '/assets/sounds/correct.wav',
  '/assets/sounds/wrong.wav',
  '/assets/sounds/levelup.wav',
  '/assets/sounds/streak.wav',
  '/assets/sounds/forge.wav',
  '/assets/sounds/chest.wav',
  '/assets/sounds/click.wav',
  '/assets/sounds/boss.wav',
  '/assets/sounds/victory.wav',
  '/assets/audio/welcome-theme.mp3',
  '/assets/nefromancer.png',
  '/manifest.json',
  '/favicon.ico',
  '/data/refs.js',
  '/data/articles.js',
  '/data/topics.js',
  '/data/rapid-quiz.js',
  '/data/competencies.js',
  '/style.css',
  '/js/utils.js',
  '/js/audio.js',
  '/js/leaderboard.js',
  '/js/study-mode.js',
  '/js/game.js',
  '/js/notifications.js',
  '/js/auth.js',
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
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(async res => {
        if (res.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(e.request, res.clone());
        }
        return res;
      }).catch(() => caches.match(e.request));
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
