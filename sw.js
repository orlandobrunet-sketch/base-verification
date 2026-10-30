// NefroQuest Service Worker — v16.40
const CACHE = 'nefroquest-v16.40';

// Apenas assets estáticos que raramente mudam (HTML não entra aqui — usa network-first)
const STATIC_ASSETS = [
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
  '/assets/cinema/v1/NefroQuest-camera-isolada-teste-04.mp4',
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
  '/js/cinema-victory-modal.js',
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
  '/js/chamber-workspace.js': '16.39',
  '/styles/lumen/chamber-workspace.css': '16.39',
  '/js/chamber-art.js': '16.39',
  '/styles/lumen/chamber-desktop.css': '16.39',
  '/js/cinema-poison-portraits.js': '16.39',
  '/js/cinema-movie-art.js': '16.39',
  '/js/cinema-movie-sound.js': '16.39',
  '/js/cinema-character-prologue.js': '16.39',
  '/js/cinema-equipment-seals.js': '16.39',
  '/js/cinema-victory-epilogue.js': '16.39',
  '/styles/lumen/cinemamotion.css': '16.39',
  '/styles/lumen/bossfinishing.css': '16.39',
  '/js/cinema-boss-art-states.js': '16.39',
  '/js/cinema-boss-static-adapter.js': '16.39',
  '/js/cinema-cinematic-intro.js': '16.39',
  '/js/cinema-entry-bridge.js': '16.39',
  '/js/cinema-entry-cinema.js': '16.39',
  '/js/cinema-entry-seen.js': '16.28',
  '/js/cinema-entry-source-config.js': '16.28',
  '/js/cinema-intro-bridge.js': '16.39',
  '/js/cinema-intro-source-config.js': '16.39',
  '/js/cinema-victory-bridge.js': '16.28',
  '/js/cinema-victory-source-config.js': '16.28',
  '/styles/lumen/cinemaboss.css': '16.28',
  '/styles/lumen/cinemaentry.css': '16.28',
  '/styles/lumen/cinemaframe.css': '16.28',
  '/styles/lumen/cinemalayout.css': '16.28',
  '/styles/lumen/cinemavictory.css': '16.28',
  '/js/question-revisions.js': '16.12',
  '/style.css': '16.25',
  '/styles/lumen/tokens.css': '15.77',
  '/styles/lumen/shell.css': '16.18',
  '/styles/lumen/portal.css': '15.94',
  '/styles/lumen/atrium.css': '16.25',
  '/styles/lumen/game.css': '16.23',
  '/styles/lumen/difficulty.css': '16.06',
  '/styles/lumen/dashboard.css': '16.25',
  '/styles/lumen/charselect.css': '16.07',
  '/styles/lumen/modes.css': '15.98',
  '/styles/lumen/forge.css': '16.25',
  '/styles/lumen/header.css': '15.91',
  '/styles/lumen/equipment.css': '16.18',
  '/styles/lumen/boss.css': '16.25',
  '/styles/lumen/ritual.css': '15.94',
  '/styles/lumen/ranking.css': '15.94',
  '/styles/lumen/achievements.css': '16.40',
  '/styles/lumen/oracle.css': '16.25',
  '/js/utils.js': '16.22',
  '/js/pilot.js': '16.06',
  '/js/character-benefits.js': '16.07',
  '/js/answer-presentation.js': '16.09',
  '/js/audio.js': '16.28',
  '/js/leaderboard.js': '16.07',
  '/js/study-mode.js': '16.25',
  '/js/game.js': '16.39',
  '/js/notifications.js': '11.90',
  '/js/auth.js': '15.92',
  '/js/portal.js': '13.20',
  '/js/atrium.js': '13.23',
  '/js/paywall.js': '15.34',
  '/js/account.js': '15.80',
  '/js/boss.js': '16.28',
  '/js/exam.js': '16.21',
  '/js/admin.js': '15.35',
  '/js/minigame.js': '16.18',
  '/js/minigame-acidbase.js': '16.39',
  '/js/achievements.js': '16.06',
  '/js/changelog.js': '15.94',
  '/js/equipment-preview.js': '16.00',
  '/js/dashboard.js': '16.25',
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
            .then(res => { if (res.ok) return cache.put(caminho, res.clone()); })
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
  const versaoPedida = url.searchParams.get('v');
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
            const cache = await caches.open(CACHE);
            await cache.put(assetCacheKey, res.clone());
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
