import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Button } from './ui/button';
import { X } from 'lucide-react';


const InstallPrompt = () => {
  const { showPrompt, handleInstallClick, setShowPrompt, isInstallable, isInstalled } = useInstallPrompt();
  const [installing, setInstalling] = React.useState(false);

  // If already installed, don't render
  React.useEffect(() => {
    const hasInstalled = localStorage.getItem('pwa-installed');
    if (hasInstalled) {
      setShowPrompt(false);
    }
  }, [setShowPrompt]);

  const handleDismiss = () => {
    setShowPrompt(false);
  };
  // Detect desktop (PC) user agent
  const isDesktop = typeof window !== 'undefined' && !/android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // Refs for focus-trap
  const modalRef = React.useRef<HTMLDivElement | null>(null);

  // Focus trap and Escape-key blocking
  React.useEffect(() => {
    const modalEl = modalRef.current;
    if (!modalEl) return;

    // Find focusable elements inside the modal
    const focusableSelector = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(modalEl.querySelectorAll<HTMLElement>(focusableSelector))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

  // Put initial focus on the first focusable element (Install button)
    const focusable = getFocusable();
    if (focusable.length) {
      focusable[0].focus();
    } else {
      // fallback focus
      modalEl.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Escape so modal can't be dismissed via keyboard
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === 'Tab') {
        const nodes = getFocusable();
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }

        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement;

        if (e.shiftKey) {
          if (active === first || active === modalEl) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showPrompt]);

  if (!showPrompt) return null;

  const handleDownload = async () => {
    setInstalling(true);
    await handleInstallClick();
    setInstalling(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div ref={modalRef} tabIndex={-1} className="relative w-full max-w-md mx-4 bg-background/95 backdrop-blur-sm dark:bg-card/95 rounded-3xl shadow-2xl border border-border/30 p-6">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 p-2 rounded-full transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-5">
          <img src="/opengraph-image.png" alt="LoveMatch" className="w-20 h-20 rounded-2xl shadow-md border border-border/50 object-cover" />
          <div className="flex-1 pt-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold text-foreground tracking-tight">LoveMatch</div>
                <div className="text-sm font-medium text-muted-foreground/90 mt-0.5">Kenya's #1 Dating App</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground/90">200K+ Ratings</div>
                <div className="text-xs font-medium text-primary mt-0.5">5 ★ average</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground/75">200K+ installs</div>
              <div className="flex items-center gap-3">
                {!isInstalled ? (
                  <Button 
                    onClick={handleDownload} 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center justify-center px-8 h-11 rounded-xl transition-all w-full sm:w-auto" 
                    disabled={installing} 
                    aria-live={installing ? 'polite' : undefined}
                  >
                    {installing ? (
                      <span className="inline-flex items-center" role="status" aria-live="polite">
                        <span className="mr-2 text-sm font-medium">Installing</span>
                        <span className="flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse delay-0" />
                          <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse delay-150" />
                          <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse delay-300" />
                        </span>
                      </span>
                    ) : (
                      <span className="text-base font-medium">Install App</span>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => { window.open('/', '_self'); setShowPrompt(false); }} 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 px-8 h-11 rounded-xl transition-all"
                  >
                    <span className="text-base font-medium">Open</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default InstallPrompt;