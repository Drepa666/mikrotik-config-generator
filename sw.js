/* ============================================================
   MikroTik Config Generator — Service Worker
   Версія: 1.1.0 — виправлено file:// для Electron
   ============================================================ */
'use strict';

const CACHE_NAME    = 'mt-config-v2';
const CACHE_VERSION = 2;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

const API_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'api.x.ai',
  'api.groq.com',
  'api.deepseek.com',
  'generativelanguage.googleapis.com'
];

/* ── INSTALL ── */
self.addEventListener('install', function(event) {
  console.log('[SW] Installing v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(function() {
        console.log('[SW] Precache complete');
        return self.skipWaiting();
      })
      .catch(function(err) {
        console.warn('[SW] Precache failed (ok in Electron):', err);
      })
  );
});

/* ── ACTIVATE ── */
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating');
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys
            .filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  var url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    return;
  }

  /* ✅ ВИПРАВЛЕННЯ: file:// та chrome-extension:// — пропускаємо повністю
     Electron завантажує файли через file:// — Service Worker не може
     повернути Response для таких запитів → TypeError */
  if (url.protocol === 'file:' ||
      url.protocol === 'chrome-extension:' ||
      url.protocol === 'blob:') {
    return;
  }

  /* Тільки http/https */
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  /* AI API — не кешуємо, пропускаємо напряму */
  if (API_HOSTS.some(function(host) { return url.hostname === host; })) {
    return;
  }

  /* Proxy localhost — не кешуємо */
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(cached) {
        if (cached) {
          /* Є в кеші — повертаємо, у фоні оновлюємо */
          fetch(event.request)
            .then(function(networkResponse) {
              if (
                networkResponse &&
                networkResponse.status === 200 &&
                networkResponse.type === 'basic'
              ) {
                caches.open(CACHE_NAME).then(function(cache) {
                  cache.put(event.request, networkResponse.clone());
                });
              }
            })
            .catch(function() { /* offline — не страшно */ });

          return cached;
        }

        /* Немає в кеші — качаємо і кешуємо */
        return fetch(event.request)
          .then(function(response) {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            var toCache = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, toCache);
            });

            return response;
          })
          .catch(function() {
            return caches.match('./');
          });
      })
  );
});

/* ── MESSAGES ── */
self.addEventListener('message', function(event) {
  if (!event.data) return;

  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data === 'CACHE_CLEAR') {
    caches.delete(CACHE_NAME).then(function() {
      console.log('[SW] Cache cleared');
    });
  }
});'use strict';
const CACHE_NAME = 'mt-config-v3631';

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