// Function to keep the service worker alive
function keepServiceWorkerAlive() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    return;
  }

  const channel = new MessageChannel();
  channel.port1.onmessage = (event) => {
    if (event.data === 'alive') {
      // Service worker is alive
      setTimeout(keepServiceWorkerAlive, 20000); // Check every 20 seconds
    }
  };

  try {
    navigator.serviceWorker.controller.postMessage('keepalive', [channel.port2]);
  } catch (error) {
    console.error('Service worker keepalive error:', error);
  }
}

// Start keepalive when page loads
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    keepServiceWorkerAlive();
  });
}