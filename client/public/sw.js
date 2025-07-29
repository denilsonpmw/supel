
const CACHE_NAME = 'supel-v1.0.0-1752661413293';
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
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' }))))
      .catch((error) => console.log('Erro ao abrir cache:', error))
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
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }
  // Para todo o resto, sempre busca online (network only)
  event.respondWith(
    fetch(event.request)
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
