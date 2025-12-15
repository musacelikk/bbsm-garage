// Service Worker for PWA
const CACHE_NAME = 'bbsm-garage-v1';
const urlsToCache = [
  '/',
  '/login/dashboard',
  '/BBSM.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache'de varsa cache'den döndür, yoksa network'ten al
        return response || fetch(event.request);
      })
  );
});
