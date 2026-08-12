/* ============================================================
   MikroTik Config Generator — Service Worker
   Версія: 1.0.0
   ============================================================ */
'use strict';

const CACHE_NAME    = 'mt-config-v2513';
const CACHE_VERSION = 2513;

/* Файли для кешування при встановленні */
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './core.js',
  './manifest.webmanifest'
];

/* Домени AI-провайдерів — НЕ кешуємо */
/* ⚠️ SYNC: При додаванні нового AI-провайдера в index.html
   → додай його hostname сюди теж!
   Поточні провайдери: anthropic, openai, grok, groq, deepseek, gemini */
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
        return self.skipWaiting();   // активуємо одразу
      })
      .catch(function(err) {
        console.error('[SW] Precache failed:', err);
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
        return self.clients.claim();  // бере контроль над всіма вкладками
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

  /* Пропускаємо AI API — вони мають йти в мережу напряму */
  if (API_HOSTS.some(function(host) { return url.hostname === host; })) {
    return;
  }

  /* Chrome extensions та інші схеми */
  if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'file:') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(cached) {
        if (cached) {
          /* Є в кеші — повертаємо, але у фоні оновлюємо */
          var fetchPromise = fetch(event.request)
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
              return networkResponse;
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
            /* Офлайн-фолбек: повертаємо головну сторінку */
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
});