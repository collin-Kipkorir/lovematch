import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import * as cors from 'cors';

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

// Import payment callback handler
export { handlePayheroCallback } from './payments/paymentCallbacks';

// Configure CORS middleware
const corsHandler = cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:5000',
    'http://localhost:3000',
    'https://lovematch-e5642.web.app',
    'https://lovematch-e5642.firebaseapp.com',
    'https://lovematchke.vercel.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
});

// STK Push endpoint
export const stkPush = functions.https.onRequest((req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

    // Handle actual requests with CORS middleware
  return corsHandler(req, res, async () => {
    try {
      // Validate request body
      const { phoneNumber, amount, accountReference, transactionDesc } = req.body;
      
      if (!phoneNumber || !amount || !accountReference) {
        res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: phoneNumber, amount, or accountReference' 
        });
        return;
      }
      
      // Log the payment request
      console.log('Processing payment request:', {
        phoneNumber,
        amount,
        accountReference,
        transactionDesc
      });    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Handle actual requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    try {
      // Validate request body
      const { phoneNumber, amount, accountReference } = req.body;
      
      if (!phoneNumber || !amount || !accountReference) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      // Log the incoming request
      console.log('STK Push Request:', {
        phoneNumber,
        amount,
        accountReference,
        headers: req.headers
      });

      // Validate phone number format
      const phoneRegex = /^254[17]\d{8}$/;
      if (!phoneRegex.test(phoneNumber)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid phone number format. Must be 254XXXXXXXXX' 
        });
        return;
      }

      // Validate amount
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 1) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid amount. Must be a positive number' 
        });
        return;
      }

      // Create payment record in Firebase
      const paymentRef = admin.database().ref('stkPushRequests').push();
      await paymentRef.set({
        phoneNumber,
        amount: numAmount,
        accountReference,
        status: 'pending',
        timestamp: admin.database.ServerValue.TIMESTAMP,
        environment: process.env.FUNCTIONS_EMULATOR ? 'development' : 'production'
      });

      // TODO: Add your actual M-Pesa API integration here
      // For now, we'll simulate a successful response
      const simulatedResponse = {
        MerchantRequestID: "29115-34620561-1",
        CheckoutRequestID: "ws_CO_191220191020363925",
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
        CustomerMessage: "Success. Request accepted for processing"
      };

      // Update the payment record with the response
      await paymentRef.update({
        ...simulatedResponse,
        lastUpdated: admin.database.ServerValue.TIMESTAMP
      });

      res.status(200).json({ 
        success: true, 
        message: 'STK Push initiated successfully',
        ...simulatedResponse,
        paymentId: paymentRef.key
      });
    } catch (error) {
      console.error('STK Push error:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});

// Notification trigger
export const onNotificationCreated = functions.database
  .ref('/notifications/{userId}/{notificationId}')
  .onCreate(async (snapshot: functions.database.DataSnapshot, context: functions.EventContext) => {
    try {
      const notificationData = snapshot.val() as NotificationData;
      const userId = context.params.userId;

      // Get the user's FCM token
      const userRef = admin.database().ref(`/users/${userId}/fcmToken`);
      const tokenSnapshot = await userRef.once('value');
      const fcmToken = tokenSnapshot.val();

      if (!fcmToken) {
        console.log('No FCM token found for user:', userId);
        return null;
      }

      // Prepare notification message
      const message = {
        token: fcmToken,
        notification: {
          title: `New ${notificationData.type} from ${notificationData.senderName}`,
          body: notificationData.message
        },
        data: {
          type: notificationData.type,
          senderId: notificationData.senderId,
          chatId: notificationData.chatId,
          timestamp: notificationData.timestamp.toString()
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