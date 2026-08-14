'use strict';

/* SW без кешу — завжди свіжі файли */
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  /* Не кешуємо нічого — завжди з мережі */
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
