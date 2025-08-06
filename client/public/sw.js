
const CACHE_NAME = 'supel-v1.9.3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/sw.js',
  '/logo-1024.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  // Assets principais serão adicionados dinamicamente
];

self.addEventListener('install', (event) => {
  // console.log('🔧 Service Worker instalado:', new Date().toISOString(), 'Cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        // console.log('📦 Fazendo cache dos recursos...', urlsToCache);
        
        // Primeiro, buscar a página principal para descobrir os assets
        let assetsToCache = [...urlsToCache];
        try {
          const response = await fetch('/');
          if (response.ok) {
            const html = await response.text();
            
            // Extrair arquivos CSS e JS do HTML
            const cssMatches = html.match(/href="([^"]*\.css)"/g);
            const jsMatches = html.match(/src="([^"]*\.js)"/g);
            
            if (cssMatches) {
              cssMatches.forEach(match => {
                const url = match.match(/href="([^"]*)"/)[1];
                if (!assetsToCache.includes(url)) {
                  assetsToCache.push(url);
                }
              });
            }
            
            if (jsMatches) {
              jsMatches.forEach(match => {
                const url = match.match(/src="([^"]*)"/)[1];
                if (!assetsToCache.includes(url)) {
                  assetsToCache.push(url);
                }
              });
            }
          }
        } catch (error) {
          // console.warn('⚠️ Erro ao detectar assets dinamicamente:', error.message);
        }
        
        // Tentar fazer cache de cada recurso individualmente
        const cachePromises = assetsToCache.map(async (url) => {
          try {
            const request = new Request(url, { cache: 'reload' });
            const response = await fetch(request);
            if (response.ok) {
              await cache.put(request, response);
              // console.log('✅ Cache criado para:', url);
            } else {
              // console.warn('⚠️ Recurso não encontrado (ignorado):', url, response.status);
            }
          } catch (error) {
            // console.warn('⚠️ Erro ao fazer cache (ignorado):', url, error.message);
          }
        });
        
        await Promise.allSettled(cachePromises);
        // console.log('✅ Cache setup concluído');
        return true;
      })
      .then(() => {
        // console.log('✅ Service Worker pronto para uso');
        self.skipWaiting();
      })
      .catch((error) => {
        // console.error('❌ Erro crítico no cache:', error);
        // Força a instalação mesmo com erro crítico
        self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  // console.log('✅ Service Worker ativado:', new Date().toISOString(), 'Cache:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // console.log('🧹 Limpando caches antigos. Existentes:', cacheNames);
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // console.log('🔄 Assumindo controle de todas as abas');
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignora requisições para Google Fonts se houver problemas de CSP
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // console.log('🔤 Tentando carregar fonte:', event.request.url);
    event.respondWith(
      fetch(event.request).catch((error) => {
        // console.warn('⚠️ Erro ao carregar fonte (será ignorado):', error);
        // Retorna uma resposta vazia para evitar quebrar a aplicação
        return new Response('', {
          status: 200,
          headers: { 'Content-Type': 'text/css' }
        });
      })
    );
    return;
  }
  
  // Só faz cache dos assets estáticos definidos em urlsToCache OU assets /assets/*
  if (urlsToCache.includes(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            // console.log('📦 Servindo do cache:', event.request.url);
            return response;
          }
          // console.log('🌐 Buscando online:', event.request.url);
          return fetch(event.request).then(fetchResponse => {
            // Se for um asset /assets/*, fazer cache automático
            if (url.pathname.startsWith('/assets/') && fetchResponse.ok) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return fetchResponse;
          }).catch((error) => {
            // console.error('❌ Erro ao buscar recurso:', event.request.url, error);
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
    fetch(event.request).then(response => {
      // Cache runtime automático para navegação principal
      if (event.request.mode === 'navigate' && response.ok) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
      }
      return response;
    }).catch((error) => {
      // console.log('🌐 Fetch failed for:', event.request.url, error);
      // Para navegação, retorna a página principal se estiver em cache
      if (event.request.mode === 'navigate') {
        return caches.match('/') || caches.match('/offline.html') || new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>SUPEL - Offline</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: #f5f5f5; 
                }
                .container { 
                  max-width: 400px; 
                  margin: 0 auto; 
                  background: white; 
                  padding: 30px; 
                  border-radius: 8px; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                }
                .retry { 
                  background: #1976d2; 
                  color: white; 
                  border: none; 
                  padding: 10px 20px; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  margin-top: 20px; 
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>SUPEL</h1>
                <p>Aplicativo offline. Conecte-se à internet para continuar.</p>
                <button class="retry" onclick="window.location.reload()">Tentar Novamente</button>
              </div>
            </body>
          </html>
        `, { 
          status: 200,
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
