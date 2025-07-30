
const CACHE_NAME = 'supel-v1.0.1-' + Date.now();
const urlsToCache = [
  '/',
  '/manifest.json',
  '/sw.js',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado:', new Date().toISOString());
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Fazendo cache dos recursos...');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('✅ Cache criado com sucesso');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erro ao criar cache:', error);
        // Força a instalação mesmo com erro de cache
        self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado:', new Date().toISOString());
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
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Só faz cache dos assets estáticos definidos em urlsToCache
  if (urlsToCache.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).catch(() => {
            // Se falhar, retorna um fallback básico para assets críticos
            if (event.request.url.includes('manifest.json')) {
              return new Response('{}', {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            throw new Error('Recurso não disponível offline');
          });
        })
    );
    return;
  }
  
  // Para todo o resto, sempre busca online com fallback
  event.respondWith(
    fetch(event.request).catch((error) => {
      console.log('Fetch failed for:', event.request.url, error);
      // Para navegação, retorna a página principal se estiver em cache
      if (event.request.mode === 'navigate') {
        return caches.match('/') || new Response('Offline', { 
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      throw error;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
