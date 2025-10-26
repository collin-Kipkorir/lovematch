import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Button } from './ui/button';
import { X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt = () => {
  const { showPrompt, handleInstallClick, setShowPrompt, isInstalled } = useInstallPrompt();
  const [installing, setInstalling] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const hasInstalled = localStorage.getItem('pwa-installed');
    if (hasInstalled) setShowPrompt(false);
  }, [setShowPrompt]);

  const handleDismiss = () => setShowPrompt(false);

  const showInstallNotification = async () => {
    if (!('Notification' in window)) return;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const notification = new Notification('LoveMatch Installed! 💖', {
          body: 'Click to open your new dating experience',
          icon: '/opengraph-image.png',
          badge: '/opengraph-image.png',
          tag: 'lovematch-installed',
          timestamp: Date.now(),
          requireInteraction: true
        });

        notification.onclick = () => {
          window.open('/', '_self');
          notification.close();
        };
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const handleDownload = async () => {
    setInstalling(true);
    const installed = await handleInstallClick();
    setInstalling(false);
    
    if (installed) {
      localStorage.setItem('pwa-installed', 'true');
      await showInstallNotification();
    }
  };

  // Accessibility: trap focus & block Esc
  React.useEffect(() => {
    if (!showPrompt) return;
    const modalEl = modalRef.current;
    if (!modalEl) return;
    const focusableSelector =
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(modalEl.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
      );
    const focusable = getFocusable();
    focusable[0]?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
      if (e.key === 'Tab') {
        const nodes = getFocusable();
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey && (active === first || active === modalEl)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showPrompt]);

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Blurred Background */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Floating Hearts for Atmosphere */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-pink-400 opacity-40"
            initial={{ y: '100vh', x: Math.random() * window.innerWidth }}
            animate={{
              y: [-100, '100vh'],
              x: `calc(${Math.random() * 100}vw)`,
              opacity: [0.2, 0.6, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 1.5,
            }}
          >
            <Heart className="w-4 h-4" />
          </motion.div>
        ))}

        {/* Modal Card */}
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-sm mx-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-pink-200/50 shadow-2xl rounded-3xl p-6 text-center"
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-2 rounded-full"
            aria-label="Dismiss install prompt"
          >
            <X className="w-5 h-5" />
          </button>

          {/* App Logo */}
          <motion.img
            src="/opengraph-image.png"
            alt="LoveMatch"
            className="w-20 h-20 mx-auto rounded-2xl shadow-md border border-pink-200 object-cover"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Text */}
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">LoveMatch</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Kenya’s #1 Dating App ❤️
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">200K+ Ratings</span>
              <span className="text-pink-500 font-medium">• 5 ★ average</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isInstalled ? (
              <Button
                onClick={handleDownload}
                disabled={installing}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 h-11 w-full sm:w-auto rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {installing ? (
                  <span className="inline-flex items-center">
                    <span className="mr-2">Installing...</span>
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-150" />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-300" />
                    </span>
                  </span>
                ) : (
                  <span className="font-semibold">Install App</span>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  window.open('/', '_self');
                  setShowPrompt(false);
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 h-11 w-full sm:w-auto rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Open App
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto rounded-xl transition-all"
            >
              Not Now
            </Button>
          </div>

          {/* Footer Info */}
          <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
            Install LoveMatch for faster access and an amazing dating experience 💖
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;
