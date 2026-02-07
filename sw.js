/**
 * Service Worker - Wycliffe Pro
 * Estratégia: Cache First (Cache Primeiro) com Network Fallback
 */

const CACHE_NAME = 'wycliffe-cache-v3';

// Ficheiros que o App precisa para abrir e funcionar o básico
const INITIAL_ASSETS = [
  './app/index.html',
  './app/verbete.html',
  './app/favoritos.html',
  './manifest.json',
  './icon.png',
  './data/index_busca.json',
  './data/biblia_acf.json'
];

// 1. Instalação: Guarda os ficheiros base no telemóvel
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: A preparar ambiente offline...');
      return cache.addAll(INITIAL_ASSETS);
    })
  );
  // Força o Service Worker a tornar-se ativo imediatamente
  self.skipWaiting();
});

// 2. Ativação: Limpa caches antigos se houver uma nova versão
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Interceção de Pedidos: A mágica do Offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      
      // Se o ficheiro já estiver no cache, entrega-o imediatamente (muito rápido)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Se não estiver no cache, tenta buscar na rede
      return fetch(event.request).then(networkResponse => {
        
        // Se for um ficheiro JSON de dicionário (ex: dicionario_A.json)
        // vamos guardá-lo no cache para que na próxima vez funcione offline
        if (event.request.url.includes('.json')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // Se a rede falhar e o ficheiro não estiver no cache,
        // podes retornar uma página de erro personalizada se quiseres
        console.log('SW: Ficheiro não disponível offline e sem rede.');
      });
    })
  );
});