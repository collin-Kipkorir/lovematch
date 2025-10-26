import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // If user already installed or dismissed, don't show
    const hasInstalled = localStorage.getItem('pwa-installed');
    const hasDismissed = localStorage.getItem('pwa-dismissed');
    if (hasInstalled || hasDismissed) return;

    const handleInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('👋 PWA: Install prompt captured');
      e.preventDefault();
      setPrompt(e);
      setIsInstallable(true);
    };

    // Try checking for related installed apps where supported
    const checkInstallable = async () => {
      if ((navigator as any).getInstalledRelatedApps) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          const isInstalled = relatedApps && relatedApps.length > 0;
          if (isInstalled) {
            localStorage.setItem('pwa-installed', 'true');
            setIsInstallable(false);
            return;
          }
        } catch (error) {
          console.log('👋 PWA: Could not check installed apps', error);
        }
      }
    };

    checkInstallable();

    // Show our custom install prompt every 5s until installed/dismissed
    const interval = setInterval(() => {
      if (!localStorage.getItem('pwa-installed') && !localStorage.getItem('pwa-dismissed')) {
        setShowPrompt(true);
      }
    }, 5000);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt as any);
    window.addEventListener('appinstalled', () => {
      console.log('👋 PWA: App was installed');
      localStorage.setItem('pwa-installed', 'true');
      setIsInstallable(false);
      setIsInstalled(true);
      // keep the prompt visible so the UI can show Open button
      setShowPrompt(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt as any);
      clearInterval(interval);
    };
  }, []);

  const handleInstallClick = async () => {
    if (prompt) {
      try {
        const result = await prompt.prompt();
        if (result.outcome === 'accepted') {
          setIsInstallable(false);
          localStorage.setItem('pwa-installed', 'true');
          setIsInstalled(true);
          // keep prompt visible so component can show Open button
        }
        return result.outcome === 'accepted';
      } catch (error) {
        console.error('Failed to show install prompt:', error);
      }
    }

    // No store redirects: fallback to manual instructions handled by the UI.
    // Return false so caller can show manual install instructions instead.
    return false;
  };

  // Initialize installed state from localStorage
  useEffect(() => {
    const hasInstalled = localStorage.getItem('pwa-installed');
    if (hasInstalled) setIsInstalled(true);
  }, []);

  return { isInstallable, showPrompt, handleInstallClick, setShowPrompt, isInstalled };
}