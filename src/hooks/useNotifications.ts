import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { doc, setDoc, deleteField } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db, messaging } from '@/lib/firebase';
import { NotificationPayload, FCMToken } from '@/types/notifications';
import { toast } from '@/hooks/use-toast';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useNotifications() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isTokenRefreshing, setIsTokenRefreshing] = useState(false);

  // Utility function to store token in Firestore
  const storeTokenInFirestore = useCallback(async (token: string, retryCount = 0): Promise<boolean> => {
    try {
      if (!user?.id) throw new Error('No user ID available');
      
      const tokenData: FCMToken = {
        token,
        platform: 'web',
        updatedAt: new Date().toISOString(),
        deviceId: navigator.userAgent
      };

      await setDoc(doc(db, 'userTokens', user.id), tokenData, { merge: true });
      return true;
    } catch (error) {
      console.error(`Failed to store token (attempt ${retryCount + 1}):`, error);
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return storeTokenInFirestore(token, retryCount + 1);
      }
      return false;
    }
  }, [user?.id]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted' && messaging) {
        setIsTokenRefreshing(true);
        try {
          const currentToken = await getToken(messaging, {
            vapidKey: VAPID_KEY
          });

          if (currentToken) {
            setFcmToken(currentToken);
            const stored = await storeTokenInFirestore(currentToken);
            if (!stored) {
              toast({
                title: 'Warning',
                description: 'Failed to store notification token. You may not receive notifications.',
                variant: 'destructive'
              });
            }
          } else {
            throw new Error('No token received from FCM');
          }
        } finally {
          setIsTokenRefreshing(false);
        }
      }
    } catch (error) {
      console.error('Error getting notification permission:', error);
      toast({
        title: 'Notification Error',
        description: 'Failed to enable notifications. Please try again later.',
        variant: 'destructive'
      });
    }
  }, [storeTokenInFirestore]);

  // Handle token refresh
  const handleTokenRefresh = useCallback(async () => {
    if (!messaging || !user?.id) return;
    
    setIsTokenRefreshing(true);
    try {
      await deleteToken(messaging);
      const newToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (newToken) {
        setFcmToken(newToken);
        await storeTokenInFirestore(newToken);
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      toast({
        title: 'Token Refresh Failed',
        description: 'Failed to refresh notification token. You may not receive notifications.',
        variant: 'destructive'
      });
    } finally {
      setIsTokenRefreshing(false);
    }
  }, [user?.id, storeTokenInFirestore]);

  // Handle foreground messages
  useEffect(() => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    setNotificationPermission(Notification.permission);

    if (user?.id && messaging) {
      const unsubscribe = onMessage(messaging, (payload: NotificationPayload) => {
        // Handle foreground messages
        if (payload.notification) {
          const notification = new Notification(payload.notification.title || 'New Message', {
            body: payload.notification.body,
            icon: payload.notification.icon || '/opengraph-image.png',
            badge: '/favicon.ico',
            tag: payload.data?.messageId || 'new-message',
            data: payload.data,
            requireInteraction: true
          });

          notification.onclick = () => {
            notification.close();
            window.focus();
            if (payload.data?.chatId) {
              window.location.href = `/chat/${payload.data.chatId}`;
            }
          };

          // Play notification sound
          const audio = new Audio('/notification-sound.mp3');
          audio.play().catch(err => console.log('Failed to play notification sound:', err));
        }
      });

      // Set up token refresh
      navigator.serviceWorker?.ready.then((registration) => {
        registration.active?.postMessage({ type: 'INIT_FCM', token: fcmToken });
      });

      return () => unsubscribe();
    }
  }, [user?.id, fcmToken]);

  // Handle cleanup on unmount
  useEffect(() => {
    const cleanup = async () => {
      if (user?.id && fcmToken) {
        try {
          await setDoc(doc(db, 'userTokens', user.id), {
            token: deleteField(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error('Failed to clean up token:', error);
        }
      }
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [user?.id, fcmToken]);

  // Check and request permission on mount
  useEffect(() => {
    if (user?.id && Notification.permission === 'default') {
      requestPermission();
    }
  }, [user?.id, requestPermission]);

  return {
    notificationPermission,
    requestPermission,
    fcmToken,
    isTokenRefreshing,
    refreshToken: handleTokenRefresh
  };
}