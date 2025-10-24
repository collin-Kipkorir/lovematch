interface Window {
  __paymentPolls?: {
    [key: string]: NodeJS.Timeout;
  };
}