importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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

firebase.initializeApp({
  apiKey: "AIzaSyCjm2rR2H57hj1kP5iXjBDXDpZhV7xAE6E",
  authDomain: "lovematch-e5642.firebaseapp.com",
  databaseURL: "https://lovematch-e5642-default-rtdb.firebaseio.com",
  projectId: "lovematch-e5642",
  storageBucket: "lovematch-e5642.firebasestorage.app",
  messagingSenderId: "756020356395",
  appId: "1:756020356395:web:da0072c699f43ded1b516e",
  measurementId: "G-1X0FCLF7LH"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/opengraph-image.png',
    badge: '/favicon.ico',
    tag: payload.data?.messageId || 'new-message',
    data: payload.data,
    renotify: true,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Message'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ],
    // Vibration pattern
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
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

  // Determine the URL to open based on notification type and data
  let urlToOpen;
  if (data.chatId) {
    urlToOpen = new URL(`/chat/${data.chatId}`, self.location.origin).href;
  } else if (data.type === 'match') {
    urlToOpen = new URL('/matches', self.location.origin).href;
  } else if (data.type === 'like') {
    urlToOpen = new URL('/profile', self.location.origin).href;
  } else {
    urlToOpen = new URL('/chats', self.location.origin).href;
  }

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    // Check if there is already a window/tab open with the target URL
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      // If we have an exact URL match, focus that window
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
      // If we have a window open to any page in our app, navigate it to the target URL
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