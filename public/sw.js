// Service Worker for Love Match App
const CACHE_NAME = "love-match-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Install event - cache static assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", event => {
  // Serve cached resources when available. If the network fetch fails (for
  // example the dev server is not running during development), gracefully
  // fall back to a cached index.html or a 503 response instead of throwing
  // an uncaught "Failed to fetch" error in the page console.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).catch(() => {
          // Try to return a cached index.html as a sensible fallback for SPA
          return caches.match('/index.html').then(fallback => {
            if (fallback) return fallback;
            return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
          });
        });
      })
  );
});

// Push event - handle notifications
self.addEventListener("push", event => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: {
        url: data.url || "/"
      },
      vibrate: [100, 50, 100],
      requireInteraction: data.requireInteraction || false
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error("Push notification error:", error);
  }
});

// Notification click event
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const url = event.notification.data.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window" })
      .then(windowClients => {
        // If a window client is already open, focus it
        for (const client of windowClients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});