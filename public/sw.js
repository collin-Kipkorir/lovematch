// Enhanced Service Worker with versioning and better caching
const CACHE_VERSION = 'v1';
const CACHE = `lovematch-${CACHE_VERSION}`;

// Assets that will be cached on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/opengraph-image.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Assets that will be cached on use
const DYNAMIC_CACHE_URLS = [
  /\.(js|css)$/,  // All JS and CSS files
  /^\/assets\//,   // All files in the assets directory
  /\.(png|jpg|jpeg|gif|svg|webp)$/, // All image files
];

// Function to determine if a request should be cached
const shouldCache = (url) => {
  return DYNAMIC_CACHE_URLS.some(pattern => {
    if (typeof pattern === 'string') {
      return url.includes(pattern);
    }
    return pattern.test(url);
  });
};

self.addEventListener("install", function (event) {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(precacheFiles);
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (CACHE !== cacheName) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline messages
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Push notification handling
self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/notification-badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Message'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('LoveMatch', options)
  );
});

// Enhanced fetch handler with network-first strategy for API calls
self.addEventListener('fetch', function(event) {
  // API calls - Network first, fallback to cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets - Cache first, network fallback
  if (shouldCache(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request).then(fetchResponse => {
            const clone = fetchResponse.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, clone));
            return fetchResponse;
          });
        })
    );
    return;
  }

  // Everything else - Network first
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});