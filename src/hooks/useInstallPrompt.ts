import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setPrompt(e);
      setIsInstallable(true);
    };

    // Show install prompt after 3 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt as any);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!prompt) return;

    const result = await prompt.prompt();
    if (result.userChoice.outcome === 'accepted') {
      setIsInstallable(false);
    }
  };

  return { isInstallable, showPrompt, handleInstallClick };
}