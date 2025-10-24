import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const handlePayheroCallback = functions.https.onRequest(async (req, res) => {
    // Log the incoming callback for debugging
    console.log('Received PayHero callback:', JSON.stringify(req.body, null, 2));

    if (!req.body || !req.body.response) {
        console.error('Invalid callback payload');
        return res.status(400).json({ error: 'Invalid callback payload' });
    }

    const {
        Amount,
        CheckoutRequestID,
        ExternalReference,
        MpesaReceiptNumber,
        Phone,
        ResultCode,
        ResultDesc,
        Status
    } = req.body.response;

    // Reference to the STK push request in Realtime Database
    const db = admin.database();
    const paymentRef = db.ref(`stkPushRequests/${ExternalReference}`);

    try {
        // Get the current payment data
        const snapshot = await paymentRef.once('value');
        const paymentData = snapshot.val();

        if (!paymentData) {
            console.error('Payment record not found:', ExternalReference);
            return res.status(404).json({ error: 'Payment record not found' });
        }

        // Update the payment status
        const updateData = {
            status: Status.toLowerCase(),  // Keep the original status but lowercase it
            mpesaReceiptNumber: MpesaReceiptNumber,
            checkoutRequestId: CheckoutRequestID,
            resultCode: ResultCode,
            resultDescription: ResultDesc,
            processedAmount: Amount,
            processedPhone: Phone,
            updatedAt: admin.database.ServerValue.TIMESTAMP,
            lastUpdated: new Date().toISOString()  // Additional timestamp for tracking
        };

        console.log('Updating payment record:', JSON.stringify(updateData, null, 2));
        await paymentRef.update(updateData);

        // If payment is successful, update user credits
        if (Status === 'Success' && ResultCode === 0) {
            if (paymentData.userId && paymentData.credits) {
                const userRef = db.ref(`users/${paymentData.userId}`);
                
                // Get current user data
                const userSnapshot = await userRef.once('value');
                const userData = userSnapshot.val();
                
                // Calculate new credits
                const currentCredits = userData.credits || 0;
                const newCredits = currentCredits + paymentData.credits;

                // Update user's credits and add transaction record
                const updates = {
                    [`users/${paymentData.userId}/credits`]: newCredits,
                    [`users/${paymentData.userId}/lastPurchase`]: admin.database.ServerValue.TIMESTAMP,
                    [`transactions/${paymentData.userId}/${Date.now()}`]: {
                        type: 'credit-purchase',
                        amount: Amount,
                        credits: paymentData.credits,
                        mpesaReceiptNumber: MpesaReceiptNumber,
                        status: 'completed',
                        timestamp: admin.database.ServerValue.TIMESTAMP
                    }
                };

                // Perform all updates in one atomic operation
                await db.ref().update(updates);

                console.log(`Successfully updated credits for user ${paymentData.userId}. New balance: ${newCredits}`);
            }
        }

        return res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('Error processing callback:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
                    const userDoc = await transaction.get(userRef);
                    if (!userDoc.exists) {
                        throw new Error('User document not found');
                    }

                    const userData = userDoc.data();
                    const currentCredits = userData?.credits || 0;
                    const newCredits = currentCredits + paymentData.credits;

                    transaction.update(userRef, { 
                        credits: newCredits,
                        lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Add to credit history
                    const creditHistoryRef = db.collection('creditHistory').doc();
                    transaction.set(creditHistoryRef, {
                        userId: paymentData.userId,
                        credits: paymentData.credits,
                        type: 'purchase',
                        paymentId: ExternalReference,
                        mpesaReceiptNumber: MpesaReceiptNumber,
                        amount: Amount,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                });

                // Send notification to user
                const notificationRef = db.collection('notifications').doc();
                await notificationRef.set({
                    userId: paymentData.userId,
                    type: 'payment_success',
                    title: 'Payment Successful',
                    message: `Your payment of KES ${Amount} was successful. ${paymentData.credits} credits have been added to your account.`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        // Send success response back to PayHero
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error processing payment callback:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});