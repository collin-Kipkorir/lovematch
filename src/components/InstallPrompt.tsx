import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const InstallPrompt = () => {
  const { isInstallable, showPrompt, handleInstallClick } = useInstallPrompt();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || !showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-xl shadow-2xl p-6 mx-auto max-w-md border border-pink-400/20 z-50 backdrop-blur-sm bg-opacity-95">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>
      
      <div className="flex flex-col items-center text-center mb-4">
        <div className="flex-shrink-0 mb-4 relative">
          <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
          <img src="/icons/icon-192x192.png" alt="LoveMatch" className="w-20 h-20 rounded-2xl relative z-10 border-2 border-white/50" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Install LoveMatch</h3>
        <p className="text-white/90 mb-4 max-w-xs">
          Get the best dating experience with our app! Access your matches and chats instantly.
        </p>
        <div className="flex flex-col w-full gap-2">
          <Button
            onClick={handleInstallClick}
            className="w-full bg-white text-pink-600 hover:bg-pink-50 font-semibold text-lg py-6 rounded-xl shadow-lg transition-transform transform hover:scale-105"
          >
            Add to Home Screen
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white text-sm mt-2 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/20">
        <div className="flex flex-col items-center">
          <span className="text-white/90 text-sm">⚡ Fast Access</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white/90 text-sm">📱 Better Experience</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white/90 text-sm">💫 Get Updates</span>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;