// Wizone IT Support Portal Service Worker
const CACHE_NAME = 'wizone-mobile-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/mobile/assets/icon.png',
  '/mobile/assets/adaptive-icon.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle app install prompt
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('App install prompt available');
  event.preventDefault();
  // Store the event for later use
  self.deferredPrompt = event;
});