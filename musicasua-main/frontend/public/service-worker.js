// Service Worker para cachear imagens e assets
const CACHE_NAME = 'musicasua-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/images/default-album.png',
  '/images/default-avatar.png'
];

// Instalar e cachear assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      ).then(() => self.skipWaiting()); // Skip waiting, ativa logo
    }).catch(() => self.skipWaiting()) // Mesmo se falhar, ativa
  );
});

// Estratégia: Network First, fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar requests não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Para imagens do Storage, usar cache-first
  if (request.url.includes('storage') || request.url.includes('/storage/')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          // Cachear resposta bem-sucedida
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      }).catch(() => {
        // Se falhar e tiver em cache, retorna cache
        return caches.match(request);
      })
    );
    return;
  }

  // Para APIs, usar network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
