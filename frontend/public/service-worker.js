// LocalMarket PWA Service Worker
const CACHE_NAME = 'localmarket-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Install: Pre-cache core UI shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache initial assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for dynamic content/APIs, cache-fallback for UI shell
self.addEventListener('fetch', (event) => {
  // Explicitly exclude all API calls and cross-origin backend calls so the browser
  // handles them natively over the network without caching or PWA synthetic fetch failures.
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('onrender.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  // Bypass WebSocket / Socket.io endpoints
  if (
    url.pathname.startsWith('/socket.io/') ||
    url.protocol.startsWith('ws')
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Fetch fresh copy from network and update cache in background
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || request.destination === 'image')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cached index.html for navigation requests when offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
