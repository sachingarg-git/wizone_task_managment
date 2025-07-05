
// Wizone Mobile Service Worker
const CACHE_NAME = 'wizone-mobile-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/mobile/assets/icon.png'
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
      .then((response) => response || fetch(event.request))
  );
});
