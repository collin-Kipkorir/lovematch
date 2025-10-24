import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// Only register the service worker in production builds.
// During development the dev server may not be running on the same origin
// (or may restart frequently) which causes fetch failures from the SW.
// Guarding registration prevents noisy "Failed to fetch" errors in the console.
if (import.meta.env.MODE === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Request notification permission first
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }

      // Register service worker with proper scope and update handling
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      console.log('Service Worker registered:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found!');
        
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            if (confirm('New version available! Reload to update?')) {
              window.location.reload();
            }
          }
        });
      });

      // Load keepalive script in production only
      const script = document.createElement('script');
      script.src = '/sw-keepalive.js';
      document.head.appendChild(script);

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });

  // Handle controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller changed');
  });
} else {
  // Helpful dev-time log and guidance for clearing an old service worker
  if (typeof window !== 'undefined') {
    console.log('Skipping service worker registration in development. If you see SW fetch errors, unregister the SW in DevTools > Application > Service Workers.');
  }
}
