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
    // mark dismissed so prompt won't reappear
    try {
      localStorage.setItem('pwa-dismissed', 'true');
    } catch (e) {
      /* ignore */
    }
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
    // Try native install prompt first (returns true if accepted)
    const accepted = await handleInstallClick();
    setInstalling(false);

    // If accepted or already installed, the hook will set isInstalled
    if (isInstalled) return;

    // If not installable (no native prompt), just stop the installing state.
    // We intentionally do not redirect to any app store — install remains PWA-only.
    if (!isInstallable) {
      setInstalling(false);
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleDismiss} />
      <div ref={modalRef} tabIndex={-1} className="relative w-full max-w-md mx-4 bg-card/95 dark:bg-card/95 rounded-2xl shadow-romantic border border-border p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-2 rounded-full"
          aria-label="Dismiss install prompt"
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
                {!isInstalled ? (
                  <>
                    <Button onClick={handleDownload} className="bg-primary text-primary-foreground flex items-center justify-center" disabled={installing} aria-live={installing ? 'polite' : undefined}>
                      {installing ? (
                        <span className="inline-flex items-center" role="status" aria-live="polite">
                          <span className="mr-2 text-sm">Installing</span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
                            <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
                            <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
                          </span>
                        </span>
                      ) : (
                          'Install'
                        )}
                    </Button>

                    <Button variant="ghost" onClick={() => {
                      // snooze for 1 hour
                      const until = Date.now() + 60 * 60 * 1000;
                      try { localStorage.setItem('pwa-snoozed', String(until)); } catch (e) { console.error('Failed to set snooze', e); }
                      setShowPrompt(false);
                    }} className="ml-2">
                      Snooze 1h
                    </Button>
                    <Button variant="ghost" onClick={() => {
                      // Just dismiss modal - will reappear on next interval
                      setShowPrompt(false);
                    }} className="ml-2">
                      Try Again
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => { window.open('/', '_self'); setShowPrompt(false); }} className="bg-primary text-primary-foreground">
                    Open
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