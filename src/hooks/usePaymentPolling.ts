import { useState, useEffect, useRef } from 'react';
import { payHeroService } from '@/lib/payhero-service';
import { ref, update, get } from 'firebase/database';
import { database } from '@/lib/firebase';

interface UsePaymentPollingOptions {
  userId: string;
  packageType: 'message' | 'video' | 'premium';
  credits: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
  maxAttempts?: number;
  pollInterval?: number;
  checkoutRequestId?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const updateMessage = (elapsed: number) => {
  if (elapsed < 10) {
    return 'Checking payment status...';
  } else if (elapsed < 20) {
    return 'Still waiting for confirmation...';
  } else if (elapsed < 40) {
    return 'Please check your M-PESA messages...';
  } else {
    return 'This is taking longer than usual...';
  }
};

export function usePaymentPolling(paymentId: string | null, options: UsePaymentPollingOptions) {
  const {
    onSuccess,
    onError,
    onTimeout,
    maxAttempts = 90, // 3 minutes with 2-second intervals
    pollInterval = 2000,
    checkoutRequestId
  } = options;

  const [status, setStatus] = useState<'idle' | 'polling' | 'success' | 'failed' | 'timeout'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [message, setMessage] = useState('Initiating payment...');
  const [error, setError] = useState<string | null>(null);

  const pollSessionRef = useRef<{
    intervalId?: NodeJS.Timeout;
    timeoutId?: NodeJS.Timeout;
    attempts: number;
    startTime: number;
  }>({ attempts: 0, startTime: 0 });

  const cleanup = () => {
    if (pollSessionRef.current.intervalId) {
      clearInterval(pollSessionRef.current.intervalId);
      pollSessionRef.current.intervalId = undefined;
    }
    if (pollSessionRef.current.timeoutId) {
      clearTimeout(pollSessionRef.current.timeoutId);
      pollSessionRef.current.timeoutId = undefined;
    }
  };

  const updateUserCredits = async () => {
    try {
      const { userId } = options;
      // Get current user data
      const userRef = ref(database, userId);
      const userSnap = await get(userRef);
      const userData = userSnap.val();

      const currentCredits = userData?.credits || 0;
      const currentVideoCredits = userData?.videoCredits || 0;

      // Prepare update based on package type
      const updates: any = {};
      
      if (options.packageType === 'video') {
        updates[`${userId}/videoCredits`] = currentVideoCredits + options.credits;
      } else if (options.packageType === 'message') {
        updates[`${userId}/credits`] = currentCredits + options.credits;
      } else if (options.packageType === 'premium') {
        updates[`${userId}/credits`] = currentCredits + options.credits;
        updates[`${userId}/videoCredits`] = currentVideoCredits + 5; // 5 video credits for premium
      }

      // Update credits atomically
      await update(ref(database), updates);

      console.log('Credits updated successfully:', {
        userId: userId,
        packageType: options.packageType,
        credits: options.credits,
        timestamp: new Date().toISOString(),
        oldCredits: currentCredits,
        newCredits: currentCredits + options.credits
      });

      return true;
    } catch (error) {
      console.error('Error updating credits:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!paymentId) {
      setStatus('idle');
      return;
    }

    // Reset state for new payment
    setStatus('polling');
    setError(null);
    setElapsedTime(0);
    setMessage('Initiating payment...');

    // Clean up any existing polling
    cleanup();

    // Initialize polling session
    const sessionStartTime = Date.now();
    pollSessionRef.current = {
      attempts: 0,
      startTime: sessionStartTime
    };

    // Set up polling interval
    pollSessionRef.current.intervalId = setInterval(async () => {
      try {
        pollSessionRef.current.attempts++;
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        setElapsedTime(elapsed);
        updateMessage(elapsed);

        // Check if we've exceeded max attempts
        if (pollSessionRef.current.attempts >= maxAttempts) {
          cleanup();
          setStatus('timeout');
          setError('Payment request timed out. Please check your M-PESA messages to confirm status.');
          onTimeout?.();
          return;
        }

        // Use only the transaction reference (paymentId)
        if (!paymentId) {
          console.warn('No payment reference available for status check');
          return;
        }

        const response = await payHeroService.checkPaymentStatus(paymentId);

        // Log status check
        console.log(`[Payment Status Check] Attempt ${pollSessionRef.current.attempts}/${maxAttempts}:`, {
          timestamp: new Date().toISOString(),
          paymentId,
          status: response.status,
          elapsed: `${elapsed}s`,
          remaining: `${(maxAttempts - pollSessionRef.current.attempts) * 2}s`
        });

        // Update message based on status
        switch (response.status) {
          case 'SUCCESS':
            await updateUserCredits();
            cleanup();
            setStatus('success');
            onSuccess?.();
            break;
          
          case 'FAILED':
            cleanup();
            setStatus('failed');
            const errorMessage = response.error?.message || 'Payment failed';
            setError(errorMessage);
            onError?.(errorMessage);
            break;
          
          case 'QUEUED':
            if (elapsed >= 30) {
              setMessage('Payment is queued. Please check your M-PESA messages and accept the payment prompt.');
            } else {
              setMessage('Waiting for payment confirmation...');
            }
            break;
          
          default:
            if (elapsed >= 30) {
              setMessage('Please check your M-PESA messages and accept the payment prompt if you haven\'t already.');
            }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Don't fail on network errors, keep polling
        if (error instanceof Error && error.message.includes('NOT_FOUND')) {
          return;
        }
        cleanup();
        setStatus('failed');
        const errorMessage = error instanceof Error ? error.message : 'Failed to check payment status';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    }, pollInterval);

    // Set timeout for the entire polling session
    pollSessionRef.current.timeoutId = setTimeout(() => {
      cleanup();
      setStatus('timeout');
      setError('Payment request timed out. Please try again.');
      onTimeout?.();
    }, maxAttempts * pollInterval);

    // Cleanup on unmount or when paymentId changes
    return cleanup;
  }, [paymentId, maxAttempts, pollInterval, onSuccess, onError, onTimeout]);

  return {
    status,
    message,
    error,
    elapsedTime
  };
}