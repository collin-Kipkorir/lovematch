import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Request notification permission early
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('SW registered with scope:', registration.scope);

      // Check if service worker is active
      if (registration.active) {
        console.log('Service Worker is active');
      }

      // Listen for service worker state changes
      registration.addEventListener('statechange', () => {
        console.log('Service Worker state changed:', registration.active?.state);
      });

      // Force update if needed
      await registration.update();

    } catch (error) {
      console.error('SW registration failed:', error);
    }
  });

  // Log when service worker becomes active
  navigator.serviceWorker.ready.then(registration => {
    console.log('Service Worker is ready');
  });

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', event => {
    console.log('Message from service worker:', event.data);
  });
}
