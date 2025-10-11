4// Service Worker for Notifications
const CACHE_VERSION = 'v1';
const CACHE = `lovematch-${CACHE_VERSION}`;
const NOTIFICATION_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds
const MIN_INTERVAL = 2 * 60 * 1000; // 2 minutes minimum between notifications
const DEBUG = true; // Enable debug mode for testing

const notificationTemplates = [
  {
    title: "💌 Someone just liked your profile!",
    body: "They think you’re amazing 😍 — open the app to see who’s crushing on you!",
    icon: "/icons/icon-192x192.png",
    action: "/matches"
  },
  {
    title: "📩 New Message from {name}",
    body: "Someone just sent you a message — don’t keep them waiting 😉",
    icon: "/icons/icon-192x192.png",
    action: "/chat/{chatId}"
  },
  {
    title: "✨ You’ve got a new admirer!",
    body: "Someone  can’t stop looking at your profile 👀. Check who it is!",
    icon: "/icons/icon-192x192.png",
    action: "/likes"
  },
  {
    title: "❤️ Match Found!",
    body: "We found someone who shares your love  Say hello now!",
    icon: "/icons/icon-192x192.png",
    action: "/matches"
  },
  {
    title: "🔥 You’re Trending!",
    body: "Your profile got 25 new views today! See who’s checking you out 😉",
    icon: "/icons/icon-192x192.png",
    action: "/views"
  },
  {
    title: "💬 Someone replied to your message!",
    body: "They just replied — keep the spark going 🔥",
    icon: "/icons/icon-192x192.png",
    action: "/chat/{chatId}"
  },
  {
    title: "🌍 Someone abroad liked you!",
    body: "A user from {country} liked your vibe 😘. Premium users can chat instantly!",
    icon: "/icons/icon-192x192.png",
    action: "/premium"
  },
  {
    title: "🎁 Unlock More Matches!",
    body: "Boost your visibility and get noticed by more singles near you 💫",
    icon: "/icons/icon-192x192.png",
    action: "/boost"
  },
  {
    title: "⏰ Don’t miss out!",
    body: "{name} is online right now — chat before they log off!",
    icon: "/icons/icon-192x192.png",
    action: "/chat/{chatId}"
  },
  {
    title: "💖 It’s a Match!",
    body: "You and ... liked each other! Start chatting and see where it goes 💬",
    icon: "/icons/icon-192x192.png",
    action: "/matches"
  },
  {
    title: "🎉 Weekend Love Rush!",
    body: "More users are active this weekend. Open the app and find your perfect match!",
    icon: "/icons/icon-192x192.png",
    action: "/"
  },
  {
    title: "👀 Someone viewed your profile!",
    body: "Someone checked you out recently… maybe it’s time to say hi 😉",
    icon: "/icons/icon-192x192.png",
    action: "/views"
  }
];


let notificationTimer;

// Function to get a random notification template
function getRandomNotification() {
  const randomIndex = Math.floor(Math.random() * notificationTemplates.length);
  return notificationTemplates[randomIndex];
}

// Maximum retries for showing a notification
const MAX_NOTIFICATION_RETRIES = 3;

// Function to show notification with retries
async function showNotification(retryCount = 0) {
    const template = getRandomNotification();
    const options = {
        body: template.body,
        icon: template.icon,
        badge: '/favicon.ico',
        tag: 'engagement-notification',
        data: { url: template.action },
        renotify: true,
        requireInteraction: true,
        silent: false,
        persistent: true,
        actions: [
            {
                action: 'view',
                title: 'Open App'
            }
        ],
        vibrate: [200, 100, 200, 100, 200]
    };

    try {
        // Check if service worker is active
        if (!self.registration.active) {
            throw new Error('Service worker not active');
        }

        await self.registration.showNotification(template.title, options);
        lastNotificationTime = Date.now();
        
        if (DEBUG) console.log('Notification shown successfully at:', new Date().toISOString());
        
        // Send success message to clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ 
                type: 'NOTIFICATION_SHOWN',
                timestamp: lastNotificationTime
            });
        });
    } catch (error) {
        console.error('Error showing notification:', error);
        
        // Retry logic
        if (retryCount < MAX_NOTIFICATION_RETRIES) {
            if (DEBUG) console.log(`Retrying notification (${retryCount + 1}/${MAX_NOTIFICATION_RETRIES})...`);
            setTimeout(() => showNotification(retryCount + 1), 1000);
        } else {
            // If all retries fail, try to restart the service worker
            if (DEBUG) console.log('All retries failed, attempting to restart service worker...');
            self.registration.update();
        }
    }
}

// Function to check if it's a good time to show notification (between 6 AM and 11 PM for more coverage)
function isGoodTimeToNotify() {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 6 && hours <= 23; // Extended hours for more frequent notifications
}

// Global interval IDs
let globalNotificationInterval;
let heartbeatInterval;
let watchdogInterval;

// Timestamp of last notification
let lastNotificationTime = Date.now();

// Function to send heartbeat
async function sendHeartbeat() {
    if (DEBUG) console.log('Sending heartbeat...');
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'HEARTBEAT' });
    });
}

// Watchdog function to monitor and restart if needed
function watchdogCheck() {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime;
    
    if (timeSinceLastNotification > NOTIFICATION_INTERVAL * 2) {
        if (DEBUG) console.log('Watchdog: Notifications appear to be stopped, restarting...');
        startPeriodicNotifications();
    }
}

// Function to ensure notification timer is running
function ensureNotificationTimer() {
    if (!globalNotificationInterval) {
        if (DEBUG) console.log('Starting new notification interval');
        globalNotificationInterval = setInterval(async () => {
            await showNotification();
            lastNotificationTime = Date.now();
        }, NOTIFICATION_INTERVAL);
    }
    
    // Ensure heartbeat is running
    if (!heartbeatInterval) {
        heartbeatInterval = setInterval(sendHeartbeat, 30000); // Heartbeat every 30 seconds
    }
    
    // Ensure watchdog is running
    if (!watchdogInterval) {
        watchdogInterval = setInterval(watchdogCheck, 60000); // Check every minute
    }
}

// Function to start periodic notifications
async function startPeriodicNotifications() {
    if (DEBUG) console.log('Starting periodic notifications...', new Date().toISOString());
    
    // Clear all existing timers
    if (notificationTimer) {
        clearInterval(notificationTimer);
    }
    if (globalNotificationInterval) {
        clearInterval(globalNotificationInterval);
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    if (watchdogInterval) {
        clearInterval(watchdogInterval);
    }

    try {
        // Show first notification immediately
        await showNotification();
        
        // Set up the main notification interval
        globalNotificationInterval = setInterval(showNotification, NOTIFICATION_INTERVAL);
        
        // Set up the heartbeat interval
        heartbeatInterval = setInterval(sendHeartbeat, 30000);
        
        // Set up the watchdog interval
        watchdogInterval = setInterval(watchdogCheck, 60000);
        
        // Set up a backup interval to ensure all timers keep running
        notificationTimer = setInterval(() => {
            ensureNotificationTimer();
        }, NOTIFICATION_INTERVAL / 2);
        
        if (DEBUG) {
            console.log('All intervals set up successfully:', {
                notification: NOTIFICATION_INTERVAL,
                heartbeat: 30000,
                watchdog: 60000,
                backup: NOTIFICATION_INTERVAL / 2
            });
        }

        // Register periodic sync if available
        try {
            if ('periodicSync' in self.registration) {
                await self.registration.periodicSync.register('notifications', {
                    minInterval: NOTIFICATION_INTERVAL
                });
                if (DEBUG) console.log('Periodic sync registered');
            }
        } catch (syncError) {
            console.warn('Periodic sync registration failed:', syncError);
        }
    } catch (error) {
        console.error('Error in startPeriodicNotifications:', error);
        // Retry after 5 seconds if there's an error
        setTimeout(startPeriodicNotifications, 5000);
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
    if (DEBUG) console.log('Service Worker installing...');
    event.waitUntil(
        Promise.all([
            self.skipWaiting(),
            caches.open(CACHE).then(cache => cache.addAll(PRECACHE_ASSETS))
        ])
    );
});

self.addEventListener("activate", function(event) {
    if (DEBUG) console.log('Service Worker activating...');
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

    // Set up periodic check to ensure notifications are running
    setInterval(() => {
        if (DEBUG) console.log('Periodic check for notification service');
        ensureNotificationTimer();
    }, 60000); // Check every minute
});

// Background sync for offline messages
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (DEBUG) console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'START_NOTIFICATIONS') {
    startPeriodicNotifications();
  }
  
  if (event.data && event.data.type === 'RESTART_NOTIFICATIONS') {
    if (notificationTimer) {
      clearInterval(notificationTimer);
    }
    startPeriodicNotifications();
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

// Clean up timers on service worker termination
self.addEventListener('terminate', () => {
    if (DEBUG) console.log('Service Worker terminating...');
    if (notificationTimer) {
        clearInterval(notificationTimer);
    }
    if (globalNotificationInterval) {
        clearInterval(globalNotificationInterval);
    }
    // Attempt to restart notifications before terminating
    startPeriodicNotifications();
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