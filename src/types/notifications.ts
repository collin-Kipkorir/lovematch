export interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    image?: string;
  };
  data?: {
    messageId?: string;
    chatId?: string;
    senderId?: string;
    type?: 'message' | 'match' | 'like' | 'system';
    [key: string]: string | undefined;
  };
}

export interface FCMToken {
  token: string;
  platform: 'web' | 'android' | 'ios';
  updatedAt: string;
  deviceId?: string;
}

export interface TokenRegistrationResponse {
  success: boolean;
  error?: string;
}