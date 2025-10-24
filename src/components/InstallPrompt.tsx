import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const InstallPrompt = () => {
  const { isInstallable, showPrompt, handleInstallClick } = useInstallPrompt();
  const [dismissed, setDismissed] = React.useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  // Check if already installed or dismissed
  React.useEffect(() => {
    const hasInstalled = localStorage.getItem('pwa-installed');
    const hasDismissed = localStorage.getItem('pwa-dismissed');
    if (hasInstalled || hasDismissed) {
      setDismissed(true);
    }
  }, []);

  if (!isInstallable || !showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-800 z-50 mb-[4.5rem] sm:mb-0">
      <div className="max-w-xl mx-auto px-4 py-3">
        <div className="flex items-center space-x-4">
          {/* App Icon */}
          <div className="flex-shrink-0">
            <img 
              src="/opengraph-image.png" 
              alt="LoveMatch" 
              className="w-14 h-14 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" 
            />
          </div>
          
          {/* App Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              LoveMatch Kenya
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              Kenya's #1 Dating App
            </p>
            <div className="flex items-center mt-1 space-x-2">
              <div className="flex items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ⭐ 4.8
                </span>
              </div>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                1M+ installs
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleInstallClick}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              Install
            </Button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;