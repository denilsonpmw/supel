
const CACHE_NAME = 'supel-v1.0.3-' + Date.now();
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
  const url = new URL(event.request.url);
  
  // Ignora requisições para Google Fonts se houver problemas de CSP
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    console.log('🔤 Tentando carregar fonte:', event.request.url);
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.warn('⚠️ Erro ao carregar fonte (será ignorado):', error);
        // Retorna uma resposta vazia para evitar quebrar a aplicação
        return new Response('', {
          status: 200,
          headers: { 'Content-Type': 'text/css' }
        });
      })
    );
    return;
  }
  
  // Só faz cache dos assets estáticos definidos em urlsToCache
  if (urlsToCache.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('📦 Servindo do cache:', event.request.url);
            return response;
          }
          console.log('🌐 Buscando online:', event.request.url);
          return fetch(event.request).catch((error) => {
            console.error('❌ Erro ao buscar recurso:', event.request.url, error);
            // Se falhar, retorna um fallback básico para assets críticos
            if (event.request.url.includes('manifest.json')) {
              return new Response('{}', {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            // Para outros recursos, retorna a página offline se disponível
            return caches.match('/offline.html') || new Response('Recurso offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
    return;
  }
  
  // Para todo o resto, sempre busca online com fallback
  event.respondWith(
    fetch(event.request).catch((error) => {
      console.log('🌐 Fetch failed for:', event.request.url, error);
      // Para navegação, retorna a página principal se estiver em cache
      if (event.request.mode === 'navigate') {
        return caches.match('/') || caches.match('/offline.html') || new Response('Aplicação offline', { 
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        });
      }
      // Para APIs e outros recursos, deixa o erro passar
      throw error;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
