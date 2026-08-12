/* MikroTik Config Generator - Service Worker */
'use strict';

const CACHE_NAME    = 'mt-config-v2244';
const CACHE_VERSION = 2244;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './core.js',
  './validators.js',
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

self.addEventListener('install', function(event) {
  console.log('[SW] Installing v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(PRECACHE_ASSETS); })
      .then(function() {
        console.log('[SW] Precache complete (' + PRECACHE_ASSETS.length + ' files)');
        return self.skipWaiting();
      })
      .catch(function(err) { console.error('[SW] Precache failed:', err); })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Activating v' + CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url;
  try { url = new URL(event.request.url); } catch(e) { return; }
  if (API_HOSTS.some(function(h) { return url.hostname === h; })) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        fetch(event.request).then(function(r) {
          if (r && r.status === 200 && r.type === 'basic') {
            caches.open(CACHE_NAME).then(function(c) { c.put(event.request, r.clone()); });
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic')
          return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(event.request, clone); });
        return response;
      }).catch(function() { return caches.match('./'); });
    })
  );
});

self.addEventListener('message', function(event) {
  if (!event.data) return;
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CACHE_CLEAR') {
    caches.delete(CACHE_NAME).then(function() {
      console.log('[SW] Cache cleared');
    });
  }
});
