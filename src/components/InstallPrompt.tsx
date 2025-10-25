import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Button } from './ui/button';


const InstallPrompt = () => {
  const { showPrompt, handleInstallClick, setShowPrompt, isInstallable, isInstalled } = useInstallPrompt();
  const [showManual, setShowManual] = React.useState(false);
  const [installing, setInstalling] = React.useState(false);

  // If already installed, don't render
  React.useEffect(() => {
    const hasInstalled = localStorage.getItem('pwa-installed');
    if (hasInstalled) {
      setShowPrompt(false);
    }
  }, [setShowPrompt]);
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

    // Put initial focus on the first focusable element (Download button)
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
  }, [showPrompt, showManual]);

  if (!showPrompt) return null;

  const handleDownload = async () => {
    setInstalling(true);
    // Try native install prompt first (returns true if accepted)
    const accepted = await handleInstallClick();
    setInstalling(false);

    // If accepted or already installed, the hook will set isInstalled
    if (isInstalled) return;

    // If not installable (no native prompt) and on desktop, show manual instructions
    if (!isInstallable && isDesktop) {
      setShowManual(true);
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/40" />
  <div ref={modalRef} tabIndex={-1} className="relative w-full max-w-md mx-4 bg-card/95 dark:bg-card/95 rounded-2xl shadow-romantic border border-border p-5">

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
                  <Button onClick={handleDownload} className="bg-primary text-primary-foreground flex items-center justify-center" disabled={installing} aria-live={installing ? 'polite' : undefined}>
                    {installing ? (
                      <span className="inline-flex items-center" role="status" aria-live="polite">
                        <span className="mr-2 text-sm">Installing</span>
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                          <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                          <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                        </span>
                      </span>
                    ) : (
                      'Download'
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => { window.open('/', '_self'); setShowPrompt(false); }} className="bg-primary text-primary-foreground">
                    Open
                  </Button>
                )}
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