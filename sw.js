'use strict';
self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(k) {
      return Promise.all(k.map(function(n) { return caches.delete(n); }));
    }).then(function() { return self.clients.claim(); })
  );
});
/* Тільки мережа — без кешування взагалі */
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.indexOf('localhost:8888') > -1) return;
  if (url.indexOf('/rest/') > -1) return;
  /* JS файли — НІКОЛИ не кешуємо */
  if (url.indexOf('.js') > -1) return;
  e.respondWith(fetch(e.request));
});