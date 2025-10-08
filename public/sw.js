// Enhanced Service Worker with versioning and better caching
const CACHE_VERSION = 'v1';
const CACHE = `lovematch-${CACHE_VERSION}`;
const NOTIFICATION_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const MIN_INTERVAL = 10 * 60 * 1000; // 10 minutes minimum between notifications

// Notification templates
const notificationTemplates = [
  {
    title: "New Matches Nearby! 💕",
    body: "Someone special might be just around the corner. Check out new profiles in your area!",
    icon: "/icons/icon-192x192.png",
    action: "/matches"
  },
  {
    title: "You're Popular! 🌟",
    body: "Someone liked your profile in the last hour. See who it might be!",
    icon: "/icons/icon-192x192.png",
    action: "/profile"
  },
  {
    title: "Don't Miss Out! 💬",
    body: "Someone is interested in chatting with you. Open the app to connect!",
    icon: "/icons/icon-192x192.png",
    action: "/chats"
  },
  {
    title: "Your Perfect Match? ❤️",
    body: "We found someone who matches your interests! Check them out now.",
    icon: "/icons/icon-192x192.png",
    action: "/matches"
  },
  {
    title: "Love is in the Air! 💫",
    body: "Your profile is getting attention! Log in to see who's interested.",
    icon: "/icons/icon-192x192.png",
    action: "/profile"
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
  console.log('Attempting to show notification...');
  
  // Check notification permission
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  const template = getRandomNotification();
  console.log('Selected notification template:', template);

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
    // Test if we can show notifications
    if (!self.registration.showNotification) {
      console.error('Notifications not supported');
      return;
    }

    await self.registration.showNotification(template.title, options);
    const now = Date.now();
    console.log('Notification shown successfully at:', new Date(now).toLocaleString());
    
    // Store last notification time
    await self.registration.putValue('lastNotificationTime', now);
    console.log('Notification time stored');
  } catch (error) {
    console.error('Error showing notification:', error);
    // Try to show a simpler notification as fallback
    try {
      await self.registration.showNotification('LoveMatch', {
        body: template.body,
        icon: template.icon
      });
    } catch (fallbackError) {
      console.error('Fallback notification also failed:', fallbackError);
    }
  }
}

// Function to check if it's a good time to show notification (between 6 AM and 11 PM for more coverage)
function isGoodTimeToNotify() {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 6 && hours <= 23; // Extended hours for more frequent notifications
}

// Function to schedule next notification
async function scheduleNextNotification() {
  console.log('Scheduling next notification...');
  
  try {
    const lastTime = await self.registration.getValue('lastNotificationTime') || 0;
    const now = Date.now();
    const timeSinceLastNotification = now - lastTime;

    console.log('Time since last notification:', Math.floor(timeSinceLastNotification / 1000), 'seconds');
    console.log('Current hour:', new Date().getHours());
    console.log('Is good time to notify:', isGoodTimeToNotify());

    // Show notification if minimum time has passed
    if (timeSinceLastNotification >= MIN_INTERVAL && isGoodTimeToNotify()) {
      console.log('Conditions met, showing notification...');
      await showNotification();
    } else {
      console.log('Skipping notification:', {
        timePassed: timeSinceLastNotification >= MIN_INTERVAL,
        goodTime: isGoodTimeToNotify()
      });
    }

    // Clear any existing timer
    if (notificationTimer) {
      clearTimeout(notificationTimer);
    }

    // Schedule next notification immediately for testing
    console.log('Scheduling next check in:', NOTIFICATION_INTERVAL / 1000, 'seconds');
    notificationTimer = setTimeout(scheduleNextNotification, NOTIFICATION_INTERVAL);
  } catch (error) {
    console.error('Error in scheduleNextNotification:', error);
    // Retry scheduling with exponential backoff
    const retryDelay = Math.min(NOTIFICATION_INTERVAL, 60000); // Max 1 minute retry delay
    console.log('Retrying in', retryDelay / 1000, 'seconds');
    notificationTimer = setTimeout(scheduleNextNotification, retryDelay);
  }
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
  console.log('Service Worker activating...');
  
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
      // Send test notification immediately
      (async () => {
        try {
          console.log('Sending test notification...');
          await showNotification();
          console.log('Test notification sent successfully');
        } catch (error) {
          console.error('Test notification failed:', error);
        }
        return scheduleNextNotification();
      })(),
      // Broadcast activation
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            timestamp: Date.now()
          });
        });
      })
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
    clearTimeout(notificationTimer);
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