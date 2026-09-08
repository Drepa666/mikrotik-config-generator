/* ============================================================
   MikroTik Config Generator — Service Worker v3.0 FINAL
   ВИПРАВЛЕНО: file:// для Electron — НЕ кешуємо, НЕ падаємо
   ============================================================ */
'use strict';

const CACHE_NAME = 'mt-config-v3';

const API_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'api.x.ai',
  'api.groq.com',
  'api.deepseek.com',
  'generativelanguage.googleapis.com'
];

/* ── INSTALL — без precache щоб не падати на file:// ── */
self.addEventListener('install', function(event) {
  console.log('[SW v3] Install');
  /* НЕ викликаємо cache.addAll — це падає в Electron */
  event.waitUntil(self.skipWaiting());
});

/* ── ACTIVATE ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys
            .filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
        );
      })
      .then(function() { return self.clients.claim(); })
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  var url;
  try { url = new URL(event.request.url); } catch(e) { return; }

  /* ✅ ГОЛОВНИЙ ЗАХИСТ — пропускаємо все що не http/https */
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  /* Пропускаємо AI API */
  if (API_HOSTS.some(function(h) { return url.hostname === h; })) return;

  /* Пропускаємо localhost proxy */
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  event.respondWith(
    caches.match(event.request)
      .then(function(cached) {
        if (cached) {
          /* Фонове оновлення */
          fetch(event.request)
            .then(function(r) {
              if (r && r.status === 200 && r.type === 'basic') {
                caches.open(CACHE_NAME)
                  .then(function(c) { c.put(event.request, r.clone()); });
              }
            })
            .catch(function() {});
          return cached;
        }

        return fetch(event.request)
          .then(function(r) {
            if (!r || r.status !== 200 || r.type !== 'basic') return r;
            var clone = r.clone();
            caches.open(CACHE_NAME)
              .then(function(c) { c.put(event.request, clone); });
            return r;
          })
          .catch(function() { return caches.match('./'); });
      })
  );
});

self.addEventListener('message', function(event) {
  if (!event.data) return;
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CACHE_CLEAR') caches.delete(CACHE_NAME);
});