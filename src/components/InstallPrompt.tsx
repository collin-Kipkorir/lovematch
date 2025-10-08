import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const InstallPrompt = () => {
  const { isInstallable, showPrompt, handleInstallClick } = useInstallPrompt();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || !showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mx-auto max-w-md border border-gray-200 dark:border-gray-700 z-50">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <X size={20} />
      </button>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <img src="/opengraph-image.png" alt="LoveMatch" className="w-16 h-16 rounded-xl" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1 dark:text-white">Install LoveMatch App</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Install our app for a better experience and quick access!
          </p>
          <Button
            onClick={handleInstallClick}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white"
          >
            Install App
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;