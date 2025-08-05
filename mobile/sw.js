// Service Worker for Wizone Mobile APK
const CACHE_NAME = 'wizone-mobile-v1.0';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', function(event) {
  console.log('📱 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📱 Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch handler
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, always go to network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match('/');
      })
    );
    return;
  }
  
  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate service worker
self.addEventListener('activate', function(event) {
  console.log('📱 Service Worker: Activated');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('📱 Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});