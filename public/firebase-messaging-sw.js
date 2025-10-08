// Service Worker for Notifications
const NOTIFICATION_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const MIN_INTERVAL = 30 * 60 * 1000; // 30 minutes minimum between notifications

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

// Message type handlers
const messageHandlers = {
  message: (payload) => ({
    title: payload.notification?.title || 'New Message',
    body: payload.notification?.body || 'You have a new message',
    icon: '/opengraph-image.png',
    data: { ...payload.data, type: 'message' }
  }),
  match: (payload) => ({
    title: payload.notification?.title || 'New Match!',
    body: payload.notification?.body || 'You have a new match',
    icon: '/icons/icon-192x192.png',
    data: { ...payload.data, type: 'match' }
  }),
  like: (payload) => ({
    title: payload.notification?.title || 'New Like',
    body: payload.notification?.body || 'Someone liked your profile',
    icon: '/icons/icon-192x192.png',
    data: { ...payload.data, type: 'like' }
  })
};

// Function to get a random notification template
function getRandomNotification() {
  const randomIndex = Math.floor(Math.random() * notificationTemplates.length);
  return notificationTemplates[randomIndex];
}

// Function to show notification
async function showNotification() {
  const lastNotification = await self.registration.getNotifications();
  if (lastNotification.length > 0) {
    // Don't show too many notifications at once
    return;
  }

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
    // Store the last notification time
    await self.registration.putValue('lastNotificationTime', Date.now());
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Function to check if it's a good time to show notification (between 9 AM and 10 PM)
function isGoodTimeToNotify() {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 9 && hours <= 22;
}

// Function to schedule next notification
async function scheduleNextNotification() {
  const lastTime = await self.registration.getValue('lastNotificationTime') || 0;
  const now = Date.now();
  const timeSinceLastNotification = now - lastTime;

  // Only show notification if enough time has passed and it's a good time
  if (timeSinceLastNotification >= MIN_INTERVAL && isGoodTimeToNotify()) {
    await showNotification();
  }

  // Schedule next check
  setTimeout(() => scheduleNextNotification(), Math.min(NOTIFICATION_INTERVAL, MIN_INTERVAL));
}

// Service worker install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      self.registration.putValue('lastNotificationTime', Date.now())
    ])
  );
});

// Service worker activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      scheduleNextNotification()
    ])
  );
});

// Notification click handler
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
});