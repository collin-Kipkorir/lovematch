import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker and request notification permission
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Request notification permission first
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);

      // Start notifications immediately
      if (registration.active) {
        registration.active.postMessage({ type: 'START_NOTIFICATIONS' });
      }
    } catch (error) {
      console.log('SW registration failed:', error);
    }
  });
}
