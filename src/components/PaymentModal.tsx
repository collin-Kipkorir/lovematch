'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { usePaymentPolling } from '@/hooks/usePaymentPolling';
import { database } from '@/lib/firebase';
import { ref, get, push, set, onValue, query, orderByChild, equalTo, update } from 'firebase/database';
import { payHeroService } from '@/lib/services/payhero';
import { MessageCircle, Video, Phone, ArrowLeft, Receipt, Clock, AlertCircle, Copy, CreditCard, Smartphone, CheckCircle } from 'lucide-react';

import type { User } from '@/context/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'message' | 'video';
}

interface CreditPackage {
  credits: number;
  price: number;
  description: string;
  savings?: string;
}

const creditPackages: CreditPackage[] = [
  { credits: 25, price: 1, description: 'Starter package' },
  { credits: 50, price: 2, description: 'Most popular', savings: 'Save 10%' },
  { credits: 100, price: 160, description: 'Best value', savings: 'Save 20%' },
  { credits: 200, price: 300, description: 'Premium package', savings: 'Save 25%' },
  { credits: 500, price: 700, description: 'Pro package', savings: 'Save 30%' },
  { credits: 1000, price: 1200, description: 'Ultimate package', savings: 'Save 40%' }
];

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, type = 'message' }) => {
  const { toast } = useToast();
  const { user, updateCredits, updateVideoCredits } = useAuth();

  // Cleanup all polling intervals when component unmounts
  useEffect(() => {
    return () => {
      console.log('Component unmounting - cleaning up all payment polls');
      const existingIntervals = window.__paymentPolls || {};
      Object.values(existingIntervals).forEach((interval: any) => clearInterval(interval));
      window.__paymentPolls = {};
    };
  }, []);
  
  // Modal state
  const [step, setStep] = useState<'packages' | 'payment' | 'agent' | 'stk-push'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(creditPackages[0]); // Default to starter package
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isTestMode] = useState(import.meta.env.MODE === 'development');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stkStatus, setStkStatus] = useState<'idle' | 'processing' | 'failed' | 'success'>('idle');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('Initiating payment...');
  const [processingTime, setProcessingTime] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const resetModal = useCallback(() => {
    setStep('packages');
    setSelectedPackage(creditPackages[0]); // Reset to starter package instead of null
    setPhoneNumber('');
    setIsProcessing(false);
    setStkStatus('idle');
    setProcessingError(null);
    setProcessingMessage('Initiating payment...');
    setProcessingTime(0);
  }, []);

  const handleClose = useCallback(() => {
    // Stop all polling first
    setIsProcessing(false);
    setCurrentPaymentId(null);  // This will trigger usePaymentPolling cleanup
    
    // Clear any running intervals (safety cleanup)
    if (window._paymentPollIntervals) {
      Object.values(window._paymentPollIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      window._paymentPollIntervals = {};
    }
    
    // Reset state and close
    onClose();
    resetModal();
  }, [onClose, resetModal]);

  // Track successful payments to prevent duplicates
  const processedPayments = useRef(new Set<string>());

  // Accept optional paymentData (from Firebase/payhero) so we can log provider refs
  const handleSuccessfulPayment = useCallback(async (paymentData?: any) => {
    if (!user || !selectedPackage) {
      console.error('Missing user or package data');
      toast({
        title: "System Error",
        description: "Critical data missing. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    // Generate a unique key for this payment
    const paymentKey = paymentData?.reference || paymentData?.providerReference || currentPaymentId;
    
    // Check if we've already processed this payment
    if (processedPayments.current.has(paymentKey)) {
      console.log('Payment already processed, skipping:', paymentKey);
      return;
    }

    try {
      // Mark payment as processed
      processedPayments.current.add(paymentKey);
      console.log('Processing new payment:', paymentKey);

      // Get current user data
      const userRef = ref(database, `users/${user.id}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();
      const currentCredits = userData?.credits || 0;
      const currentVideoCredits = userData?.videoCredits || 0;

      console.log('Current balances before update:', {
        currentCredits,
        currentVideoCredits,
        userId: user.id
      });
      
      // Get purchased credits from payment data or selected package
      const creditsToAdd = paymentData?.package?.credits ?? selectedPackage.credits;
      const amountPaid = paymentData?.amount ?? selectedPackage.price;

      // Calculate new credits by adding purchased amount to existing balance
      const updates: Record<string, number> = {};
      if (type === 'video') {
        const newVideoCredits = currentVideoCredits + creditsToAdd;
        updates[`users/${user.id}/videoCredits`] = newVideoCredits;
        updateVideoCredits(newVideoCredits);
        
        console.log('Updating video credits:', {
          from: currentVideoCredits,
          adding: creditsToAdd,
          to: newVideoCredits
        });
      } else {
        const newCredits = currentCredits + creditsToAdd;
        updates[`users/${user.id}/credits`] = newCredits;
        updateCredits(newCredits);
        
        console.log('Updating regular credits:', {
          from: currentCredits,
          adding: creditsToAdd,
          to: newCredits
        });
      }

      // Generate unique transaction ID
      const transactionRef = push(ref(database, 'paymentTransactions'));
      if (!transactionRef.key) {
        throw new Error('Failed to create transaction record');
      }

      // Create atomic update object combining credit updates and transaction record
      const allUpdates = {
        ...updates,
        [`paymentTransactions/${transactionRef.key}`]: {
          userId: user.id,
          packageType: type,
          credits: creditsToAdd,
          amount: amountPaid,
          paymentMethod: 'mpesa-stk',
          status: 'completed',
          checkoutRequestId: paymentData?.checkoutRequestId || checkoutRequestId || null,
          paymentReference: paymentData?.paymentReference || paymentData?.providerReference || null,
          providerReference: paymentData?.providerReference || null,
          timestamp: new Date().toISOString(),
          transactionId: transactionRef.key
        }
      };

      // Perform atomic update
      console.log('Performing atomic update:', allUpdates);
      await update(ref(database), allUpdates);

      toast({
        title: "Payment Successful!",
        description: `${selectedPackage.credits} credits have been added to your account`,
        variant: "success"
      });

      // Close modal after a brief delay to show success message (3s)
      setTimeout(() => {
        onClose();
        resetModal();
      }, 3000);
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Log the failed transaction
      const errorTransactionRef = push(ref(database, 'failedTransactions'));
      await set(errorTransactionRef, {
        userId: user.id,
        packageType: type,
        credits: paymentData?.package?.credits ?? selectedPackage.credits,
        amount: paymentData?.amount ?? selectedPackage.price,
        paymentMethod: 'mpesa-stk',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }).catch(console.error);

      toast({
        title: "Error Processing Payment",
        description: "There was an error adding credits. Our team has been notified and will assist you shortly.",
        variant: "destructive"
      });
    }
  }, [user, selectedPackage, type, updateVideoCredits, updateCredits, toast, onClose, resetModal, checkoutRequestId]);
  
  // Only start polling if we have a selected package
  const { status: pollStatus, message: pollMessage, error: pollError, elapsedTime } = usePaymentPolling(
    selectedPackage && currentPaymentId ? currentPaymentId : null,
    {
      userId: user.id,
      packageType: type,
      credits: selectedPackage?.credits || 0,
      checkoutRequestId,
      onSuccess: async (paymentDataFromPoll?: any) => {
        // Centralize success handling to avoid duplicate credit updates.
        setStkStatus('success');
        setStep('success');

        try {
          // Determine a stable payment key (reference/providerReference or currentPaymentId)
          const paymentKey = paymentDataFromPoll?.reference || paymentDataFromPoll?.providerReference || currentPaymentId;

          // If we've already processed this payment elsewhere (firebase listener or manual), skip
          if (paymentKey && processedPayments.current.has(paymentKey)) {
            console.log('onSuccess: payment already processed, skipping duplicate update:', paymentKey);
            return;
          }

          // Delegate to the shared success handler which performs atomic updates and logging
          await handleSuccessfulPayment(paymentDataFromPoll || {
            amount: selectedPackage?.price,
            package: selectedPackage,
            checkoutRequestId,
            reference: currentPaymentId
          });

          toast({
            title: "Payment Successful!",
            description: `Credits have been added to your account.`,
            variant: "success"
          });
        } catch (error) {
          console.error('Error in onSuccess handler:', error);
          toast({
            title: "Error",
            description: "Failed to finalize credits. Please contact support.",
            variant: "destructive"
          });
        }
      },
      onError: (error) => {
        setStkStatus('failed');
        setProcessingError(error);
        
        // Log failed transaction
        const errorTransactionRef = push(ref(database, 'failedTransactions'));
        set(errorTransactionRef, {
          userId: user.id,
          packageType: type,
          credits: selectedPackage?.credits || 0,
          amount: selectedPackage?.price || 0,
          paymentMethod: 'mpesa-stk',
          status: 'failed',
          error: error,
          timestamp: new Date().toISOString()
        }).catch(console.error);

        toast({
          title: "Payment Failed",
          description: error,
          variant: "destructive"
        });
      },
      onTimeout: () => {
        setStkStatus('failed');
        setProcessingError('Payment request timed out. Please try again.');
        toast({
          title: "Payment Timeout",
          description: "The payment request has expired. Please try again.",
          variant: "destructive"
        });
      }
    }
  );

  // Update processing message and time from polling hook
  useEffect(() => {
    if (pollMessage) {
      setProcessingMessage(pollMessage);
    }
    if (typeof elapsedTime === 'number') {
      setProcessingTime(elapsedTime);
    }
  }, [pollMessage, elapsedTime]);

  // Handle poll status changes
  useEffect(() => {
    if (pollStatus === 'success') {
      setStkStatus('success');
    } else if (pollStatus === 'failed' || pollStatus === 'timeout') {
      setStkStatus('failed');
    }
  }, [pollStatus]);

  // Monitor payment reference in Firebase
  useEffect(() => {
    if (!currentPaymentId || stkStatus !== 'processing') return;

    // Unique id for this polling session so we can track and clear it reliably
    const pollSessionId = `poll_${currentPaymentId}_${Date.now()}`;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

    const paymentRef = ref(database, `stkPushRequests`);

    // Function to check transaction status via PayHero API
    const checkTransactionStatus = async (reference: string) => {
      try {
        const response = await payHeroService.checkTransactionStatus(reference);
        console.log('PayHero status response:', response);

        if (!response) {
          console.error('No response from PayHero status check');
          return;
        }

        // Find the payment record by PayHero reference
        const snapshot = await get(query(
          paymentRef, 
          orderByChild('paymentReference'),
          equalTo(reference)
        ));

        if (!snapshot.exists()) {
          console.error('Payment record not found for reference:', reference);
          return;
        }

        const [firebaseKey, paymentData] = Object.entries(snapshot.val())[0];
        const currentTime = new Date().toISOString();

        // Update database based on status
        switch (response.status) {
          case 'SUCCESS':
            await set(ref(database, `stkPushRequests/${firebaseKey}`), {
              ...paymentData,
              status: 'SUCCESS',
              mpesaReceiptNumber: response.provider_reference,
              thirdPartyReference: response.third_party_reference,
              transactionDate: response.transaction_date,
              providerReference: response.provider_reference,
              lastUpdated: currentTime,
              completedAt: currentTime
            });
            break;

          case 'FAILED':
            await set(ref(database, `stkPushRequests/${firebaseKey}`), {
              ...paymentData,
              status: 'FAILED',
              error: 'Payment failed',
              lastUpdated: currentTime
            });
            break;

          case 'QUEUED':
            // Update timestamp but maintain queued status
            await set(ref(database, `stkPushRequests/${firebaseKey}`), {
              ...paymentData,
              status: 'QUEUED',
              lastUpdated: currentTime
            });
            break;

          default:
            console.log('Unhandled payment status:', response.status);
            await set(ref(database, `stkPushRequests/${firebaseKey}`), {
              ...paymentData,
              status: response.status,
              lastUpdated: currentTime
            });
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    };

    // Poll every 2 seconds
    let pollCount = 0;
    pollInterval = setInterval(async () => {
      if (stkStatus === 'processing') {
        pollCount++;
        console.log(`[Poll #${pollCount}] Checking payment status for ID: ${currentPaymentId}`);
        
        try {
          // Get fresh response from PayHero
          const response = await payHeroService.checkTransactionStatus(currentPaymentId);
          console.log(`[Poll #${pollCount}] PayHero Response:`, {
            timestamp: new Date().toISOString(),
            status: response?.status,
            reference: currentPaymentId,
            details: response
          });
          
          checkTransactionStatus(currentPaymentId);
        } catch (error) {
          console.error(`[Poll #${pollCount}] Error checking status:`, error);
        }
      }
    }, 2000);

    // Listen for updates to payment status in Firebase
    const unsubscribe = onValue(
      query(paymentRef, orderByChild('paymentReference'), equalTo(currentPaymentId)),
      async (snapshot) => {
        if (!snapshot.exists()) {
          console.log('No payment data found');
          return;
        }
        
        const [_, paymentData] = Object.entries(snapshot.val())[0];
        console.log('Payment update received:', paymentData);
        
        const status = (paymentData.status || '').toUpperCase();
        console.log('Current payment status:', status);

        switch (status) {
          case 'SUCCESS':
              console.log('Payment successful, updating UI...');
              // Clear polling interval for this session
              try {
                if (window.__paymentPolls?.[pollSessionId]) {
                  clearInterval(window.__paymentPolls[pollSessionId]);
                  delete window.__paymentPolls[pollSessionId];
                }
              } catch (e) {
                console.warn('Error clearing global poll registry', e);
              }

              if (pollInterval) {
                clearInterval(pollInterval);
              }

              // Stop external polling hook by clearing currentPaymentId
              setCurrentPaymentId(null);

              setStkStatus('success');
              setStep('success');
              toast({
                title: "Payment Successful! 🎉",
                description: `${selectedPackage?.credits} credits have been added to your account. Receipt: ${paymentData.providerReference || paymentData.providerReference}`,
                variant: "default"
              });

              // Provide paymentData to the shared success handler so it can log provider refs
              await handleSuccessfulPayment(paymentData);
              break;

          case 'FAILED':
            console.log('Payment failed:', paymentData.error);
            setStkStatus('failed');
            toast({
              title: "Payment Failed",
              description: paymentData.error || "The payment could not be processed. Please try again.",
              variant: "destructive"
            });
            setTimeout(() => {
              setStep('packages');
              setStkStatus('idle');
            }, 2000);
            break;

          case 'QUEUED':
            console.log('Payment queued, awaiting MPesa...');
            toast({
              title: "Payment Processing",
              description: "Please check your phone and enter your M-Pesa PIN to complete payment",
              variant: "default"
            });
            break;

          default:
            console.log('Unhandled payment status:', status);
        }
    });

    // Start timeout check after 3 minutes
    const timeoutId = setTimeout(() => {
      if (stkStatus === 'processing') {
        setStkStatus('failed');
        void set(ref(database, `stkPushRequests/${currentPaymentId}`), {
          status: 'FAILED',
          lastUpdated: new Date().toISOString(),
          error: 'Payment request timed out after 3 minutes'
        });
        toast({
          title: "Payment Timeout",
          description: "The payment request has expired. Please try again.",
          variant: "destructive"
        });
        setStep('packages');
        setStkStatus('idle');
      }
    }, 180000); // 3 minutes timeout

    // Store the interval in our global registry
    if (pollInterval) {
      window.__paymentPolls = window.__paymentPolls || {};
      window.__paymentPolls[pollSessionId] = pollInterval;
    }

    // Store cleanup function
    cleanupRef.current = () => {
      // Clear this specific polling interval
      if (window.__paymentPolls?.[pollSessionId]) {
        clearInterval(window.__paymentPolls[pollSessionId]);
        delete window.__paymentPolls[pollSessionId];
      }
      clearTimeout(timeoutId);
      unsubscribe();
    };

    // Cleanup on unmount or when currentPaymentId changes
    return () => {
      console.log(`Cleaning up payment monitoring for session: ${pollSessionId}`);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [currentPaymentId, stkStatus, selectedPackage, handleSuccessfulPayment, handleClose, toast, setStep]);
  
  // Test phone numbers for development
  const TEST_PHONE_NUMBERS = {
    success: '0722000000',  // Number that will always succeed
    timeout: '0722111111',  // Number that will timeout
    insufficient: '0722222222',  // Number with insufficient funds
    failed: '0722333333'  // Number that will fail
  };

  // Phone number validation and formatting
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove any spaces
    const cleanPhone = phone.replace(/\s/g, '');
    
    // For international numbers (must start with + and have 7-15 digits)
    if (step === 'agent') {
      return /^\+[1-9]\d{6,14}$/.test(cleanPhone);
    }
    
    // For local M-Pesa numbers
    const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) {
      return true;
    }
    if (cleanPhone.length === 12 && cleanPhone.startsWith('2547')) {
      return true;
    }
    return false;
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Convert to international format if needed
    if (cleanPhone.length === 10 && cleanPhone.startsWith('07')) {
      return `254${cleanPhone.slice(1)}`;
    }
    if (cleanPhone.length === 12 && cleanPhone.startsWith('2547')) {
      return cleanPhone;
    }
    return phone;
  };

  const getTestResult = (phone: string): string | null => {
    if (!isTestMode) return null;
    
    switch(phone) {
      case TEST_PHONE_NUMBERS.success:
        return 'Payment will succeed';
      case TEST_PHONE_NUMBERS.timeout:
        return 'Payment will timeout';
      case TEST_PHONE_NUMBERS.insufficient:
        return 'Payment will fail - insufficient funds';
      case TEST_PHONE_NUMBERS.failed:
        return 'Payment will fail - general error';
      default:
        return null;
    }
  };

  const handlePackageSelect = useCallback((pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setStep('payment');
  }, []);

  const handleStkPush = useCallback(() => {
    setStep('stk-push');
  }, []);

  const submitAgentRequest = useCallback(async () => {
    if (!phoneNumber || !selectedPackage || !user) {
      toast({
        title: "Missing Information",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create credit request record
      const requestRef = push(ref(database, 'creditRequests'));
      
      await set(requestRef, {
        userId: user.id,
        userName: user.name || 'User',
        phoneNumber: formatPhoneNumber(phoneNumber),
        packageDetails: {
          credits: selectedPackage.credits,
          price: selectedPackage.price,
          type: type
        },
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      // Notify admin/agent (you can implement this based on your notification system)
      const notificationRef = push(ref(database, 'notifications/admin'));
      await set(notificationRef, {
        type: 'credit_request',
        userId: user.id,
        userName: user.name || 'User',
        phoneNumber: formatPhoneNumber(phoneNumber),
        requestId: requestRef.key,
        packageDetails: {
          credits: selectedPackage.credits,
          price: selectedPackage.price
        },
        timestamp: new Date().toISOString(),
        read: false
      });

      toast({
        title: "Request Submitted Successfully",
        description: "An agent will contact you shortly to process your payment",
        variant: "success"
      });

      // Close modal after success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting credit request:', error);
      toast({
        title: "Request Failed",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [phoneNumber, selectedPackage, user, type, toast, handleClose]);

  const handleContactAgent = useCallback(() => {
    setStep('agent');
  }, []);



  const initiateSTKPush = useCallback(async (): Promise<void> => {
    if (!phoneNumber || !selectedPackage) {
      toast({
        title: "Missing Information",
        description: "Please select a package and enter your phone number",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a payment",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Safaricom number",
        variant: "destructive"
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    let paymentId: string | null = null;
    
    setIsProcessing(true);
    setStkStatus('processing');

    try {
      // Initialize payment record in Firebase
      const paymentRef = push(ref(database, 'stkPushRequests'));
      paymentId = paymentRef.key;

      if (!paymentId) {
        throw new Error('Failed to create payment record');
      }

      // Store initial request details
      await set(paymentRef, {
        userId: user.id,
        phoneNumber: formattedPhone,
        amount: selectedPackage.price,
        status: 'pending',
        package: {
          credits: selectedPackage.credits,
          type: type
        },
        timestamp: new Date().toISOString(),
        environment: import.meta.env.MODE
      });

      // Initialize payment with PayHero
      const response = await payHeroService.initiatePayment({
        amount: selectedPackage.price,
        phone_number: formattedPhone,
        external_reference: paymentId,
        customer_name: user?.name || 'Customer',
        callback_url: import.meta.env.VITE_PAYHERO_CALLBACK_URL
      });

      // Normalize response shape from payHeroService
      const serverData = response?.data || {};

      // Store the CheckoutRequestID if available
      if (serverData.CheckoutRequestID) {
        setCheckoutRequestId(serverData.CheckoutRequestID);
        // Update Firebase record with CheckoutRequestID
        await update(paymentRef, {
          checkoutRequestId: serverData.CheckoutRequestID
        });
      }

      // Track number of retries
      let retryCount = 0;
      const MAX_RETRIES = 30; // 1 minute maximum polling time (2 second intervals)

      // Set up polling to check transaction status every 2 seconds
      const pollInterval = setInterval(async () => {
        try {
          // Increment retry counter and update processing time
          retryCount++;
          const elapsedSeconds = (retryCount * 2);
          setProcessingTime(elapsedSeconds);
          
          // Update processing message based on time elapsed
          if (elapsedSeconds <= 10) {
            setProcessingMessage('Checking payment status...');
          } else if (elapsedSeconds <= 30) {
            setProcessingMessage('Still processing your payment...');
          } else if (elapsedSeconds <= 50) {
            setProcessingMessage('This is taking longer than usual. Please be patient...');
          } else {
            setProcessingMessage('Almost done. Finalizing your payment...');
          }
          
          // Stop polling if we've hit max retries
          if (retryCount >= MAX_RETRIES) {
            clearInterval(pollInterval);
            setStkStatus('failed');
            setProcessingError('Payment status check timed out. Please check your M-PESA messages to confirm payment status.');
            throw new Error('Payment status check timed out. Please check your M-PESA messages to confirm payment status.');
          }

          // Get fresh status from PayHero API (use PayHero reference when available, otherwise our paymentId)
          const referenceToCheck = serverData?.reference || serverData?.external_reference || paymentId;
          const statusCheck = await payHeroService.checkPaymentStatus(referenceToCheck as string);
          
          if (!statusCheck?.success) {
            // For NOT_FOUND or network errors, continue polling
            if (statusCheck?.error?.code === 'NOT_FOUND' || statusCheck?.error?.code === 'NETWORK_ERROR') {
              const elapsedTime = ((retryCount * 2000) / 1000).toFixed(1); // Convert to seconds
              console.log(`[${new Date().toISOString()}] Payment Status Check (${elapsedTime}s):`, {
                reference: referenceToCheck,
                attempt: retryCount,
                maxAttempts: MAX_RETRIES,
                timeRemaining: `${((MAX_RETRIES - retryCount) * 2).toFixed(1)}s`,
                status: statusCheck.error.code,
                message: statusCheck.error.message,
                amount: serverData.amount || selectedPackage.price
              });
              return;
            }
            
            // For other errors (invalid reference, etc), stop polling
            clearInterval(pollInterval);
            setIsProcessing(false);
            setStkStatus('failed');
            toast({
              title: "Payment Status Check Failed",
              description: statusCheck?.error?.message || "Failed to check payment status",
              variant: "destructive"
            });
            return;
          }

          // Log detailed payment status
          console.log(`[${new Date().toISOString()}] PayHero Payment Status:`, {
            status: statusCheck.data?.status || statusCheck.status,
            reference: referenceToCheck,
            checkoutRequestId: serverData.CheckoutRequestID,
            transactionDate: statusCheck.data?.transaction_date || statusCheck.transaction_date,
            providerReference: statusCheck.data?.provider_reference || statusCheck.provider_reference,
                amount: serverData.amount || selectedPackage.price
          });

                      // Handle payment completion
          const remoteStatus = statusCheck.data?.status || statusCheck.status;
          if (remoteStatus === 'SUCCESS' || remoteStatus === 'FAILED') {
            // Stop ALL polling mechanisms immediately
            clearInterval(pollInterval);
            
            // Clear any existing poll intervals from window
            if (window._paymentPollIntervals) {
              Object.values(window._paymentPollIntervals).forEach(interval => {
                if (interval) clearInterval(interval);
              });
              window._paymentPollIntervals = {};
            }
            
            setCurrentPaymentId(null); // This will stop the usePaymentPolling hook
            setIsProcessing(false);
            
            if (remoteStatus === 'SUCCESS') {
              const completedTimestamp = new Date().toISOString();
              console.log(`✅ Payment Successful (${completedTimestamp}):`, {
                amount: serverData.amount || selectedPackage.price,
                credits: selectedPackage.credits,
                reference: referenceToCheck,
                transactionDate: statusCheck.data?.transaction_date || statusCheck.transaction_date,
                providerReference: statusCheck.data?.provider_reference || statusCheck.provider_reference,
                completedAt: completedTimestamp
              });

              // Pass payment data to the success handler to update credits
              await handleSuccessfulPayment({
                amount: serverData.amount || selectedPackage.price,
                reference: referenceToCheck,
                checkoutRequestId: serverData.CheckoutRequestID,
                providerReference: statusCheck.data?.provider_reference || statusCheck.provider_reference,
                package: selectedPackage,
                timestamp: completedTimestamp
              });

              setStkStatus('success');
            } else {
              console.log('❌ Payment Failed:', {
                reference: referenceToCheck,
                reason: statusCheck.data?.error || statusCheck.error || 'Unknown error',
                transactionDate: statusCheck.data?.transaction_date || statusCheck.transaction_date
              });
              setStkStatus('failed');
              setProcessingError(statusCheck.data?.error || statusCheck.error || 'Unknown error occurred');
              toast({
                title: "Payment Failed",
                description: statusCheck.data.error || "The payment could not be processed. Please try again or contact support if the issue persists.",
                variant: "destructive"
              });
            }
            
            setIsProcessing(false);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 2000);

      // Clear polling after 3 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        console.log('Payment status polling stopped after timeout');
      }, 180000);

      if (!response.success || !response.data) {
        clearInterval(pollInterval);
        throw new Error(response.error || 'Payment initiation failed');
      }

      // Update record with successful initiation
      await set(paymentRef, {
        status: serverData.status || 'QUEUED',
        checkoutRequestId: serverData.CheckoutRequestID,
        paymentReference: serverData.reference,
        externalReference: serverData.external_reference || paymentId,
        updatedAt: new Date().toISOString(),
        initialResponse: response // Store the full initial response
      });

      // Set current payment ID to begin monitoring
      setCurrentPaymentId(paymentId);

      // Set the status to processing and show the waiting dialog
      setStkStatus('processing');
      setStep('stk-push');

      // Show message to check phone
      toast({
        title: "Payment Initiated",
        description: "Please check your phone to complete the payment"
      });

    } catch (error) {
      console.error('STK Push error:', error);
      setStkStatus('failed');
      
      // Update payment record with error
      if (paymentId) {
        void set(ref(database, `stkPushRequests/${paymentId}`), {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          lastUpdated: new Date().toISOString()
        });
      }

      // Show appropriate error message
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (!currentPaymentId) {
        setIsProcessing(false);
        setStkStatus('idle');
      }
    }
  }, [phoneNumber, selectedPackage, user, toast, type, currentPaymentId]);

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only allow closing if we're not in processing state
        if (!open && stkStatus !== 'processing') {
          handleClose();
        }
      }}
    >
    <DialogContent className="max-w-md w-[95vw] sm:w-full bg-card border-border flex flex-col h-auto max-h-[85vh] gap-0 p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Purchase Credits</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6">
          <div className="space-y-4 py-4">
            {step === 'packages' && (
              <div className="grid gap-4">
                {creditPackages.map((pkg, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedPackage === pkg ? 'border-primary' : ''
                    }`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <CardContent className="flex justify-between items-center p-4">
                      <div>
                        <h3 className="font-semibold">{pkg.credits} Credits</h3>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        {pkg.savings && (
                          <span className="text-xs text-green-600">{pkg.savings}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">KSH {pkg.price}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {step === 'payment' && selectedPackage && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">
                    {selectedPackage.credits} Credits
                  </h3>
                  <p className="text-2xl font-bold">
                    KSH {selectedPackage.price}
                  </p>
                </div>

                <div className="grid gap-4">
                  <Button
                    onClick={handleStkPush}
                    className="w-full h-auto py-4 gap-3"
                  >
                    <Smartphone className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-semibold">Pay with M-Pesa</p>
                      <p className="text-xs opacity-90">
                        Get credits instantly via STK push
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleContactAgent}
                    className="w-full h-auto py-4 gap-3"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-semibold">International Payment Options</p>
                      <p className="text-xs opacity-90">
                        Pay with PayPal/Binance • 24/7 Support
                      </p>
                    </div>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setStep('packages')}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Change Package
                </Button>
              </div>
            )}

            {step === 'agent' && selectedPackage && (
              <div className="p-4 space-y-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Selected Package</p>
                  <p className="text-3xl font-bold text-primary mt-1">USD {(selectedPackage.price / 150).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedPackage.credits} Credits</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Payment Options:</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <img src="/icons/paypal.svg" alt="PayPal" className="h-6 w-6" />
                        <div className="text-sm">
                          <p className="font-medium">PayPal</p>
                          <p className="text-xs text-muted-foreground">Fast & secure payment</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <img src="/icons/binance.svg" alt="Binance" className="h-6 w-6" />
                        <div className="text-sm">
                          <p className="font-medium">Binance Pay</p>
                          <p className="text-xs text-muted-foreground">Crypto payment option</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">How it works:</h4>
                    <ul className="text-sm space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        Enter your WhatsApp number with country code
                      </li>
                      <li className="flex items-start gap-2">
                        <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        Choose PayPal or Binance payment option
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        Get instant response within 2-5 minutes
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        Credits added immediately after payment
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">WhatsApp Number (with country code)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Example: +1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +1 for USA)</p>
                </div>

                <Button 
                  className="w-full bg-primary" 
                  onClick={submitAgentRequest}
                  disabled={!phoneNumber || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting request...
                    </>
                  ) : (
                    'Connect with Payment Agent'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setStep('payment')}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Choose Another Payment Method
                </Button>
              </div>
            )}

            {step === 'stk-push' && selectedPackage && (
              <div className="p-4">
                {/* Initial payment form */}
                {stkStatus === 'idle' && (
                  <div className="space-y-6">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                      <p className="text-3xl font-bold text-primary mt-1">KSH {selectedPackage.price}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedPackage.credits} Credits</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium">M-Pesa Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="07XX XXX XXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>

                      <Button
                        onClick={initiateSTKPush}
                        disabled={isProcessing || !phoneNumber}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isProcessing ? 'Processing...' : 'Pay with M-Pesa'}
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => setStep('payment')}
                      className="w-full text-sm"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Change Payment Method
                    </Button>
                  </div>
                )}

                {/* Processing state */}
                {stkStatus === 'processing' && (
                  <div className="text-center space-y-4 p-6">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20"></div>
                      <div className="relative flex items-center justify-center w-full h-full rounded-full bg-green-100">
                        <Clock className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-900">{processingMessage}</p>
                      <p className="text-sm text-muted-foreground">
                        Time elapsed: {processingTime}s
                      </p>
                      <div className="mt-4 text-sm text-muted-foreground space-y-2">
                        <p>1. Check your phone for M-PESA prompt</p>
                        <p>2. Enter your M-PESA PIN to complete</p>
                        <p>3. Wait for confirmation</p>
                      </div>
                    </div>
                    {processingTime > 30 && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          Taking longer than usual? Make sure to:
                          <br />
                          - Check for M-PESA prompt on your phone
                          <br />
                          - Ensure you have sufficient balance
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Success state - only shown after processing completes */}
                {stkStatus === 'success' && (
                  <div className="text-center space-y-4 p-6">
                    <div className="relative">
                      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="absolute top-0 left-0 w-full h-full">
                        <div className="animate-[ping_1s_ease-out_1] rounded-full bg-green-400 opacity-20"></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-green-600">Payment Successful!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedPackage.credits} credits have been added to your account
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        Your credits are now available
                      </p>
                    </div>
                    <Button 
                      onClick={handleClose}
                      className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                    >
                      Done
                    </Button>
                  </div>
                )}

                {/* Error/Failed state */}
                {(stkStatus === 'error' || stkStatus === 'failed') && (
                  <div className="text-center space-y-4 p-6">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-red-600">Payment Failed</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {processingError || 'Payment request was unsuccessful'}
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        setStkStatus('idle');
                        setProcessingError(null);
                        setProcessingMessage('');
                        setProcessingTime(0);
                      }}
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 space-y-4 pt-4 border-t">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span>Secure payment via M-Pesa or agent contact</span>
          </div>

          {stkStatus !== 'processing' && (
            <Button variant="outline" onClick={handleClose} className="w-full">
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;