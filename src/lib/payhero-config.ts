// PayHero configuration
export const PAYHERO_CONFIG = {
  BASE_URL: 'https://backend.payhero.co.ke',  // Always use production URL
  ACCOUNT_ID: import.meta.env.VITE_PAYHERO_ACCOUNT_ID || '3278',
  CHANNEL_ID: import.meta.env.VITE_PAYHERO_CHANNEL_ID || '3838',
  AUTH_TOKEN: import.meta.env.VITE_PAYHERO_AUTH_TOKEN || 'Basic OWZZWVUwTG9SSkdnZ0pvUmhwQ3M6SDREdWwxQTVTT0N2QksxUk85dTE1eUJoazFXWHhJNFZMcm80Sks0MA==',
  CALLBACK_URL: import.meta.env.VITE_PAYHERO_CALLBACK_URL || 'http://localhost:5000/api/payment-callback',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || ''  // Empty string for relative paths
};

// PayHero API endpoints - exact endpoints as per documentation
export const PAYHERO_ENDPOINTS = {
  INITIATE_PAYMENT: '/api/v2/payments',
  CHECK_STATUS: '/api/v2/transaction-status',  // Note: This is used with a query parameter
  CHECK_TRANSACTION: '/api/v2/transactions',   // Used for direct transaction lookup
  WEBHOOK: '/api/v2/payments/webhook'
};

// Payment providers supported by PayHero
export const PAYMENT_PROVIDERS = {
  MPESA: 'm-pesa',
  AIRTEL: 'airtel-money',
  TKASH: 't-kash'
} as const;

// Currency codes
export const CURRENCIES = {
  KES: 'KES',
  USD: 'USD'
} as const;

export type PaymentProvider = typeof PAYMENT_PROVIDERS[keyof typeof PAYMENT_PROVIDERS];
export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];
