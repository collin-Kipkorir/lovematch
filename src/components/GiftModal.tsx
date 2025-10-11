import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/lib/firebase';
import { ref, push, serverTimestamp } from 'firebase/database';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
}) => {
  const [giftAmount, setGiftAmount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGiftSubmit = async () => {
    if (!user || giftAmount < 1) return;

    setIsSubmitting(true);
    try {
      // Create a gift record in the database
      const giftRef = ref(database, 'userGifts');
      await push(giftRef, {
        fromUserId: user.id,
        fromUserName: user.name,
        toUserId: recipientId,
        toUserName: recipientName,
        quantity: giftAmount,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Gift Sent!',
        description: `Successfully sent ${giftAmount} gift${giftAmount > 1 ? 's' : ''} to ${recipientName}`,
      });

      onClose();
    } catch (error) {
      console.error('Error sending gift:', error);
      toast({
        title: 'Error',
        description: 'Failed to send gift. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <Gift className="h-5 w-5 text-primary" />
            Send Gifts to {recipientName}
          </DialogTitle>
          <DialogDescription>
            Send gifts to show your appreciation. The recipient can withdraw gifts once they reach 1000.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="giftAmount" className="text-sm font-medium text-foreground">
              Number of Gifts
            </label>
            <div className="flex gap-2">
              <Input
                id="giftAmount"
                type="number"
                min={1}
                value={giftAmount}
                onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-background"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setGiftAmount((prev) => Math.max(1, prev - 1))}
                className="shrink-0"
              >
                -
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setGiftAmount((prev) => prev + 1)}
                className="shrink-0"
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGiftSubmit}
            disabled={isSubmitting || giftAmount < 1}
            className="bg-gradient-to-r from-primary to-primary/90"
          >
            <Gift className="h-4 w-4 mr-2" />
            Send {giftAmount} Gift{giftAmount > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GiftModal;