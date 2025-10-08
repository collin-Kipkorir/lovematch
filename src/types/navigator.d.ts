interface InstalledRelatedApp {
  id: string;
  platform: string;
  url: string;
  version: string;
}

interface NavigatorExtended extends Navigator {
  getInstalledRelatedApps?: () => Promise<InstalledRelatedApp[]>;
}

declare global {
  interface Window {
    navigator: NavigatorExtended;
  }
}