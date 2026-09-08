/* ============================================================
   MikroTik Config Generator — Service Worker
   Версія: 1.1.0 — виправлено file:// для Electron
   ============================================================ */
'use strict';
df373077ba0a50caae866a8cd14c5b3fbfe380d1

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(k) {
      return Promise.all(k.map(function(n) { return caches.delete(n); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  /* Не кешуємо JS, proxy та REST */
  if (url.indexOf('.js') > -1) return;
  if (url.indexOf('localhost:8888') > -1) return;
  if (url.indexOf('/rest/') > -1) return;
  if (url.indexOf('/ssh/') > -1) return;
  e.respondWith(fetch(e.request).catch(function() {
    return caches.match(e.request);
  }));
});