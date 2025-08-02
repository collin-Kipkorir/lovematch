import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Check, CreditCard, DollarSign, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  moderator: {
    id: string;
    moderatorName: string;
    moderatorId: string;
    totalCurrentEarnings: number;
    creditCommission: number;
    referralCommission: number;
    paymentMethod: string;
    paymentDetails: string;
    totalPaidToDate: number;
    onHoldAmount?: number;
    firstHalfEarnings?: number;
    secondHalfEarnings?: number;
  } | null;
  onPaymentProcessed: (paymentData: any) => void;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  onClose,
  moderator,
  onPaymentProcessed
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCycle, setPaymentCycle] = useState('full');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!moderator) return null;

  const maxPaymentAmount = moderator.totalCurrentEarnings;
  
  // Calculate earnings for specific periods
  const firstHalfEarnings = Math.floor(moderator.totalCurrentEarnings * 0.5); // 1st-15th earnings
  const secondHalfEarnings = moderator.totalCurrentEarnings - firstHalfEarnings; // 16th-end earnings
  const onHoldAmount = moderator.onHoldAmount || 0;
  
  // Half month payment: 1st-15th + on hold amount
  const halfMonthAmount = firstHalfEarnings + onHoldAmount;
  
  // Full month payment: entire current earnings + on hold amount
  const fullMonthAmount = moderator.totalCurrentEarnings + onHoldAmount;

  const handlePaymentCycleChange = (cycle: string) => {
    setPaymentCycle(cycle);
    if (cycle === 'half') {
      setPaymentAmount(halfMonthAmount.toString());
    } else if (cycle === 'full') {
      setPaymentAmount(fullMonthAmount.toString());
    } else {
      setPaymentAmount('');
    }
  };

  const handleProcessPayment = async () => {
    const amount = parseInt(paymentAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const maxAllowedAmount = paymentCycle === 'half' ? halfMonthAmount : fullMonthAmount;
    if (amount > maxAllowedAmount) {
      toast.error(`Payment amount cannot exceed available amount: KSh ${maxAllowedAmount.toLocaleString()}`);
      return;
    }

    if (!paymentReference.trim()) {
      toast.error('Please enter a payment reference');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const remainingBalance = maxPaymentAmount - amount;
      const paymentData = {
        moderatorId: moderator.id,
        moderatorName: moderator.moderatorName,
        amount,
        paymentCycle,
        paymentReference: paymentReference.trim(),
        paymentNotes: paymentNotes.trim(),
        paymentMethod: moderator.paymentMethod,
        paymentDetails: moderator.paymentDetails,
        remainingBalance,
        processedAt: new Date().toISOString(),
        status: remainingBalance > 0 ? 'partial_payment' : 'fully_paid'
      };

      onPaymentProcessed(paymentData);
      
      toast.success(`Payment of KSh ${amount.toLocaleString()} processed successfully!`);
      
      // Reset form
      setPaymentAmount('');
      setPaymentCycle('full');
      setPaymentReference('');
      setPaymentNotes('');
      onClose();
    } catch (error) {
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const remainingAfterPayment = maxPaymentAmount - (parseInt(paymentAmount) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Payment - {moderator.moderatorName}
          </DialogTitle>
          <DialogDescription>
            Process manual payment for moderator earnings. Choose payment cycle and amount carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Moderator Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Earnings Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Current Month Earnings</Label>
                  <p className="text-2xl font-bold text-green-600">KSh {moderator.totalCurrentEarnings.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">On Hold Amount</Label>
                  <p className="text-lg font-semibold text-orange-600">KSh {onHoldAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Paid to Date</Label>
                  <p className="text-lg font-semibold">KSh {moderator.totalPaidToDate.toLocaleString()}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Credit Commission (30%)</Label>
                  <p className="font-semibold">KSh {moderator.creditCommission.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Referral Commission (5%)</Label>
                  <p className="font-semibold">KSh {moderator.referralCommission.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Payment Method:</span>
                  <Badge variant="outline" className="capitalize">{moderator.paymentMethod}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{moderator.paymentDetails}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Cycle Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Payment Cycle (Twice Monthly)</Label>
            <p className="text-sm text-muted-foreground mb-3">Choose the payment period for this processing cycle</p>
            <div className="grid grid-cols-3 gap-3">
              <Card 
                className={`cursor-pointer transition-colors ${paymentCycle === 'half' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                onClick={() => handlePaymentCycleChange('half')}
              >
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold">Half Month</p>
                  <p className="text-xs text-muted-foreground mb-1">1st-15th + On Hold</p>
                  <p className="text-sm font-medium">KSh {halfMonthAmount.toLocaleString()}</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${paymentCycle === 'full' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                onClick={() => handlePaymentCycleChange('full')}
              >
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold">Full Month</p>
                  <p className="text-xs text-muted-foreground mb-1">Full Month + On Hold</p>
                  <p className="text-sm font-medium">KSh {fullMonthAmount.toLocaleString()}</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${paymentCycle === 'custom' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                onClick={() => handlePaymentCycleChange('custom')}
              >
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <p className="font-semibold">Custom</p>
                  <p className="text-sm text-muted-foreground">Enter amount</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Payment Breakdown */}
            {(paymentCycle === 'half' || paymentCycle === 'full') && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-3">Payment Breakdown</h4>
                <div className="space-y-2 text-sm">
                  {paymentCycle === 'half' && (
                    <>
                      <div className="flex justify-between">
                        <span>Earnings (1st-15th):</span>
                        <span>KSh {firstHalfEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>On Hold Amount:</span>
                        <span>KSh {onHoldAmount.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total Available:</span>
                        <span>KSh {halfMonthAmount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  {paymentCycle === 'full' && (
                    <>
                      <div className="flex justify-between">
                        <span>Current Month Earnings:</span>
                        <span>KSh {moderator.totalCurrentEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>On Hold Amount:</span>
                        <span>KSh {onHoldAmount.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total Available:</span>
                        <span>KSh {fullMonthAmount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount (KSh)</Label>
            <Input
              id="paymentAmount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter payment amount"
              max={maxPaymentAmount}
              min="1"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Available: KSh {maxPaymentAmount.toLocaleString()}</span>
              {remainingAfterPayment > 0 && (
                <span className="text-orange-600">
                  Remaining: KSh {remainingAfterPayment.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label htmlFor="paymentReference">Payment Reference *</Label>
            <Input
              id="paymentReference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g., MPX789123456, BNK456789123, PP123456789"
            />
            <p className="text-xs text-muted-foreground">
              Enter the transaction reference from your payment provider
            </p>
          </div>

          {/* Payment Notes */}
          <div className="space-y-2">
            <Label htmlFor="paymentNotes">Payment Notes (Optional)</Label>
            <Textarea
              id="paymentNotes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Add any additional notes about this payment..."
              rows={3}
            />
          </div>

          {/* Warning for remaining balance */}
          {remainingAfterPayment > 0 && remainingAfterPayment < 1000 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-800">Remaining Balance Notice</p>
                <p className="text-sm text-orange-700">
                  The remaining balance of KSh {remainingAfterPayment.toLocaleString()} is below the minimum threshold 
                  and will be put on hold until it accumulates to KSh 1,000 or more.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleProcessPayment} disabled={isProcessing || !paymentAmount || !paymentReference.trim()}>
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Process Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentProcessingModal;