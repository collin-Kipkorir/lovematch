import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Button } from './ui/button';
import { X } from 'lucide-react';


const InstallPrompt = () => {
  const { showPrompt, handleInstallClick, setShowPrompt, isInstallable } = useInstallPrompt();
  const [dismissed, setDismissed] = React.useState(false);
  const [showManual, setShowManual] = React.useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  // If already installed or dismissed, don't render
  React.useEffect(() => {
    const hasInstalled = localStorage.getItem('pwa-installed');
    const hasDismissed = localStorage.getItem('pwa-dismissed');
    if (hasInstalled || hasDismissed) {
      setDismissed(true);
      setShowPrompt(false);
    }
  }, [setShowPrompt]);

  if (!showPrompt || dismissed) return null;

  // Detect desktop (PC) user agent
  const isDesktop = typeof window !== 'undefined' && !/android|iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleDownload = async () => {
    // Try native install prompt first
    const result = await handleInstallClick();
    // If not installable and on desktop, show manual instructions
    if (!isInstallable && isDesktop) {
      setShowManual(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleDismiss} />
      <div className="relative w-full max-w-md mx-4 bg-card/95 dark:bg-card/95 rounded-2xl shadow-romantic border border-border p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
          aria-label="Close"
        >
          <X />
        </button>

        <div className="flex items-center gap-4">
          <img src="/opengraph-image.png" alt="LoveMatch" className="w-16 h-16 rounded-xl shadow-sm border border-border" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-foreground">LoveMatch</div>
                <div className="text-sm text-muted-foreground">Kenya's #1 Dating App</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-foreground font-semibold">200K+ Ratings</div>
                <div className="text-xs text-muted-foreground">5 ★ average</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">200K+ installs</div>
              <div className="flex items-center gap-2">
                <Button onClick={handleDownload} className="bg-primary text-primary-foreground">Download</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Manual install instructions for desktop */}
        {showManual && (
          <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border">
            <div className="font-semibold text-lg text-foreground mb-2">How to install LoveMatch on your PC</div>
            <ol className="list-decimal ml-5 text-muted-foreground text-sm space-y-1">
              <li>Click the browser's <b>Install</b> or <b>Add to Home Screen</b> button in the address bar (usually a plus icon).</li>
              <li>If you don't see an install button, open your browser menu and look for <b>Install App</b> or <b>Add to Home Screen</b>.</li>
              <li>Follow the prompts to add LoveMatch to your device.</li>
            </ol>
            <div className="mt-3 text-xs text-muted-foreground">Supported on Chrome, Edge, Brave, and other modern browsers.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;