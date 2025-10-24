import { useState } from 'react';
import { ref, get, update } from 'firebase/database';
import { database } from '@/lib/firebase';

interface UseCreditsOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useCredits(options: UseCreditsOptions = {}) {
  const [updating, setUpdating] = useState(false);

  const updateCredits = async (userId: string, packageType: string, creditAmount: number) => {
    try {
      setUpdating(true);
      
      // First get current user data
      const userRef = ref(database, `${userId}`);
      const userSnap = await get(userRef);
      const userData = userSnap.val();

      // Calculate new values
      const currentCredits = userData?.credits || 0;
      const currentVideoCredits = userData?.videoCredits || 0;
      
      // Prepare update based on package type
      const updates: any = {};
      
      if (packageType === 'message') {
        updates[`${userId}/credits`] = currentCredits + creditAmount;
      } else if (packageType === 'video') {
        updates[`${userId}/videoCredits`] = currentVideoCredits + creditAmount;
      } else if (packageType === 'premium') {
        // Premium package gives both message and video credits
        updates[`${userId}/credits`] = currentCredits + creditAmount;
        updates[`${userId}/videoCredits`] = currentVideoCredits + 5; // 5 video credits for premium
      }

      // Update the database
      await update(ref(database), updates);

      options.onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error updating credits:', error);
      options.onError?.(error instanceof Error ? error.message : 'Failed to update credits');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateCredits,
    updating
  };
}