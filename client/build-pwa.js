import fs from 'fs';
import path from 'path';

console.log('🔧 Configurando build do PWA...');

// Verificar se os arquivos PWA existem
const pwaFiles = [
  'public/manifest.json',
  'public/sw.js',
  'public/icons/icon-72x72.png',
  'public/icons/icon-96x96.png',
  'public/icons/icon-128x128.png',
  'public/icons/icon-144x144.png',
  'public/icons/icon-152x152.png',
  'public/icons/icon-192x192.png',
  'public/icons/icon-384x384.png',
  'public/icons/icon-512x512.png'
];

console.log('📋 Verificando arquivos PWA...');
pwaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NÃO ENCONTRADO`);
  }
});

// Verificar se o manifest.json tem as configurações corretas
const manifestPath = 'public/manifest.json';
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  console.log('\n📋 Verificando configurações do manifest.json...');
  console.log(`✅ display: ${manifest.display}`);
  console.log(`✅ start_url: ${manifest.start_url}`);
  console.log(`✅ theme_color: ${manifest.theme_color}`);
  console.log(`✅ background_color: ${manifest.background_color}`);
  
  if (manifest.display !== 'fullscreen') {
    console.log('⚠️  ATENÇÃO: display deve ser "fullscreen" para esconder a barra de endereços');
  }
}

// Gerar service worker dinâmico com cache busting
const swPath = 'public/sw.js';
const buildTimestamp = Date.now();
const swContent = `
const CACHE_NAME = 'supel-v1.0.0-${buildTimestamp}';
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
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' }))))
      .catch((error) => console.log('Erro ao abrir cache:', error))
  );
});

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
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.includes(self.location.origin)) {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;

fs.writeFileSync(swPath, swContent, 'utf8');
console.log(`✅ Service worker dinâmico gerado com timestamp: ${buildTimestamp}`);

console.log('\n🚀 PWA configurado para produção!');
console.log('💡 Dicas para garantir que a barra de endereços seja escondida:');
console.log('   1. Certifique-se de que o manifest.json tem "display": "fullscreen"');
console.log('   2. Verifique se todos os ícones estão presentes');
console.log('   3. Teste em diferentes dispositivos e navegadores');
console.log('   4. Use HTTPS em produção (obrigatório para PWA)'); 