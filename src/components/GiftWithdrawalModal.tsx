import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { AlertCircle } from 'lucide-react';

interface GiftWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalGifts: number;
  userId: string;
}

const GiftWithdrawalModal: React.FC<GiftWithdrawalModalProps> = ({
  isOpen,
  onClose,
  totalGifts,
  userId
}) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawalAmount = parseInt(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount < 1000) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is 1,000 gifts",
        variant: "destructive"
      });
      return;
    }

    if (withdrawalAmount > totalGifts) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough gifts to withdraw this amount",
        variant: "destructive"
      });
      return;
    }

    if (!paymentDetails) {
      toast({
        title: "Missing Details",
        description: "Please provide your payment details",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create withdrawal request
      const withdrawalRef = push(ref(database, 'withdrawalRequests'));
      await set(withdrawalRef, {
        userId,
        amount: withdrawalAmount,
        paymentMethod,
        paymentDetails,
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request has been submitted and will be processed soon.",
      });

      onClose();
    } catch (error) {
      console.error('Withdrawal request error:', error);
      toast({
        title: "Request Failed",
        description: "There was an error submitting your withdrawal request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Gifts</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Available Balance</Label>
            <div className="p-3 bg-muted rounded-lg text-sm">
              {totalGifts.toLocaleString()} gifts available
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Minimum 1,000 gifts"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Minimum withdrawal: 1,000 gifts</p>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value: 'mpesa' | 'bank') => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">
              {paymentMethod === 'mpesa' ? 'M-Pesa Number' : 'Bank Account Details'}
            </Label>
            <Input
              id="details"
              placeholder={paymentMethod === 'mpesa' ? 'Enter M-Pesa number' : 'Enter bank account details'}
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 text-xs">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              Withdrawals are typically processed within 24-48 hours. Make sure your payment details are correct.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              type="button"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Withdraw'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GiftWithdrawalModal;