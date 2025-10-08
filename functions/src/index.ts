import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface NotificationData {
  type: 'message' | 'match' | 'like';
  senderId: string;
  senderName: string;
  chatId: string;
  message: string;
  timestamp: number;
  read: boolean;
}

admin.initializeApp();

export const sendMessageNotification = functions.database
  .ref('/notifications/{userId}/{notificationId}')
  .onCreate(async (snapshot: functions.database.DataSnapshot, context: functions.EventContext) => {
    const notificationData = snapshot.val() as NotificationData;
    const userId = context.params.userId;

    try {
      // Get user's FCM token
      const userTokenDoc = await admin.firestore()
        .collection('userTokens')
        .doc(userId)
        .get();

      if (!userTokenDoc.exists) {
        console.log('No token found for user:', userId);
        return null;
      }

      const userToken = userTokenDoc.data()?.token;
      if (!userToken) {
        console.log('Invalid token for user:', userId);
        return null;
      }

      // Construct notification message
      const message = {
        notification: {
          title: `Message from ${notificationData.senderName}`,
          body: notificationData.message,
        },
        data: {
          chatId: notificationData.chatId,
          senderId: notificationData.senderId,
          type: 'message',
          messageId: context.params.notificationId,
        },
        token: userToken,
        webpush: {
          notification: {
            icon: '/opengraph-image.png',
            badge: '/favicon.ico',
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'View Message'
              }
            ]
          },
          fcmOptions: {
            link: `/chat/${notificationData.chatId}`
          }
        }
      };

      // Send the notification
      const response = await admin.messaging().send(message);
      console.log('Successfully sent notification:', response);

      // Clean up the notification
      await snapshot.ref.remove();

      return null;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });