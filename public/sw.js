// Service Worker for Offline App Shell Support
const CACHE_NAME = 'app-shell-v1';
const APP_SHELL_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  // Add more static assets as needed
];

const IMAGE_CACHE = 'image-cache-v1';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Check if the request is for an image
  if (request.destination === 'image' || IMAGE_EXTENSIONS.some(ext => request.url.endsWith(ext))) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(request).then(response => {
          if (response) return response;
          return fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // Optionally, return a fallback image here
            return caches.match('/fallback-image.png');
          });
        })
      )
    );
    return;
  }
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
}); 