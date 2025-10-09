// Keep Service Worker Alive
(function keepServiceWorkerAlive() {
    // Function to restart notifications
    async function restartNotifications() {
        try {
            const registration = await navigator.serviceWorker.ready;
            registration.active.postMessage({ type: 'RESTART_NOTIFICATIONS' });
        } catch (error) {
            console.error('Error restarting notifications:', error);
        }
    }

    // Restart notifications every 30 minutes to ensure they keep running
    setInterval(restartNotifications, 30 * 60 * 1000);

    // Also restart on visibility change (when tab becomes visible)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            restartNotifications();
        }
    });

    // Initial start
    restartNotifications();
})();