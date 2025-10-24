import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    // Check if user has already installed or dismissed
    const hasInstalled = localStorage.getItem('pwa-installed');
    const hasDismissed = localStorage.getItem('pwa-dismissed');
    
    if (hasInstalled || hasDismissed) {
      return;
    }

    // Set visited flag in localStorage
    if (!localStorage.getItem('pwa-first-visit')) {
      localStorage.setItem('pwa-first-visit', Date.now().toString());
      setHasVisited(false);
    } else {
      setHasVisited(true);
    }

    const handleInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('👋 PWA: Install prompt captured');
      e.preventDefault();
      setPrompt(e);
      setIsInstallable(true);
    };

    // Check if it's installable
    const checkInstallable = async () => {
      if (navigator.getInstalledRelatedApps) {
        try {
          const relatedApps = await navigator.getInstalledRelatedApps();
          const isInstalled = relatedApps.length > 0;
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

    // Show install prompt after 3 seconds if conditions are met
    const timer = setTimeout(() => {
      if (hasVisited && !localStorage.getItem('pwa-installed')) {
        console.log('👋 PWA: Showing install prompt');
        setShowPrompt(true);
      }
    }, 3000);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt as any);
    
    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('👋 PWA: App was installed');
      localStorage.setItem('pwa-installed', 'true');
      setIsInstallable(false);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt as any);
      clearTimeout(timer);
    };
  }, [hasVisited]);

    const handleInstallClick = async () => {
    if (!prompt) return;

    try {
      const result = await prompt.prompt();
      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        localStorage.setItem('pwa-installed', 'true');
      }
    } catch (error) {
      console.error('Failed to show install prompt:', error);
    }
  };  return { isInstallable, showPrompt, handleInstallClick };
}