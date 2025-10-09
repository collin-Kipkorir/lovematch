// Service Worker for Notifications
const CACHE_VERSION = 'v1';
const CACHE = `lovematch-${CACHE_VERSION}`;
const NOTIFICATION_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds
const MIN_INTERVAL = 2 * 60 * 1000; // 2 minutes minimum between notifications
const DEBUG = true; // Enable debug mode for testing

// Notification templates
const notificationTemplates = [
  {
    title: "New Matches Nearby! 💕",
    body: "Someone special might be just around the corner. Check out new profiles in your area!",
    icon: "/icons/icon-192x192.png",
    action: "/"
  },
  {
    title: "You're Popular! 🌟",
    body: "Someone liked your profile in the last hour. See who it might be!",
    icon: "/icons/icon-192x192.png",
    action: "/"
  },
  {
    title: "Don't Miss Out! 💬",
    body: "Someone is interested in chatting with you. Open the app to connect!",
    icon: "/icons/icon-192x192.png",
    action: "/"
  },
  {
    title: "Your Perfect Match? ❤️",
    body: "We found someone who matches your interests! Check them out now.",
    icon: "/icons/icon-192x192.png",
    action: "/"
  },
  {
    title: "Love is in the Air! 💫",
    body: "Your profile is getting attention! Log in to see who's interested.",
    icon: "/icons/icon-192x192.png",
    action: "/"
  },
  {
    title: "Weekend Special! 🎉",
    body: "More singles are active now! It's the perfect time to find your match.",
    icon: "/icons/icon-192x192.png",
    action: "/"
  }
];

let notificationTimer;

// Function to get a random notification template
function getRandomNotification() {
  const randomIndex = Math.floor(Math.random() * notificationTemplates.length);
  return notificationTemplates[randomIndex];
}

// Function to show notification
async function showNotification() {
  const template = getRandomNotification();
  const options = {
    body: template.body,
    icon: template.icon,
    badge: '/favicon.ico',
    tag: 'engagement-notification',
    data: { url: template.action },
    renotify: true,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Now'
      },
      {
        action: 'close',
        title: 'Not Now'
      }
    ],
    vibrate: [200, 100, 200]
  };

  try {
    await self.registration.showNotification(template.title, options);
    // Store last notification time
    await self.registration.putValue('lastNotificationTime', Date.now());
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Function to check if it's a good time to show notification (between 6 AM and 11 PM for more coverage)
function isGoodTimeToNotify() {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 6 && hours <= 23; // Extended hours for more frequent notifications
}

// Function to start periodic notifications
function startPeriodicNotifications() {
  if (DEBUG) console.log('Starting periodic notifications...');
  
  // Clear any existing timer
  if (notificationTimer) {
    clearInterval(notificationTimer);
  }

  // Show first notification immediately
  showNotification();

  // Set up recurring notifications
  notificationTimer = setInterval(() => {
    if (isGoodTimeToNotify()) {
      showNotification();
    }
  }, NOTIFICATION_INTERVAL);

  if (DEBUG) console.log('Notification interval set to run every 2 minutes');
}

// Assets that will be cached on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/opengraph-image.png'
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
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      caches.open(CACHE).then(cache => cache.addAll(PRECACHE_ASSETS)),
      self.registration.putValue('lastNotificationTime', Date.now())
    ])
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    Promise.all([
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (CACHE !== cacheName) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim(),
      startPeriodicNotifications() // Start notifications on activation
    ])
  );
});

// Background sync for offline messages
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Push notification handling
// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  // Close the notification
  notification.close();

  // Handle different actions
  if (action === 'close') {
    return;
  }

  // Get the URL to open
  const urlToOpen = new URL(data.url || '/', self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    // Check if there is already a window/tab open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      // If we have a window open to any page in our app, navigate it
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        return Promise.all([
          client.focus(),
          client.navigate(urlToOpen)
        ]);
      }
    }
    // If no window/tab is open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// Clean up timer on service worker termination
self.addEventListener('terminate', () => {
  if (notificationTimer) {
    clearInterval(notificationTimer);
  }
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