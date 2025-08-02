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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, Building2, CreditCard } from 'lucide-react';

interface PaymentInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPaymentInfo?: {
    method: 'mpesa' | 'bank' | 'paypal';
    details: any;
  };
}

const PaymentInfoModal: React.FC<PaymentInfoModalProps> = ({
  open,
  onOpenChange,
  currentPaymentInfo
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank' | 'paypal'>(
    currentPaymentInfo?.method || 'mpesa'
  );
  const [formData, setFormData] = useState({
    // M-Pesa fields
    mpesaPhone: currentPaymentInfo?.details?.phone || '',
    
    // Bank fields
    bankName: currentPaymentInfo?.details?.bankName || '',
    accountNumber: currentPaymentInfo?.details?.accountNumber || '',
    accountHolderName: currentPaymentInfo?.details?.accountHolderName || '',
    swiftCode: currentPaymentInfo?.details?.swiftCode || '',
    
    // PayPal fields
    paypalEmail: currentPaymentInfo?.details?.email || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Here you would save to your backend
    console.log('Saving payment info:', { method: paymentMethod, details: formData });
    onOpenChange(false);
  };

  const renderPaymentFields = () => {
    switch (paymentMethod) {
      case 'mpesa':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span>M-Pesa Mobile Money</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mpesaPhone">Phone Number</Label>
              <Input
                id="mpesaPhone"
                placeholder="+254 700 000 000"
                value={formData.mpesaPhone}
                onChange={(e) => handleInputChange('mpesaPhone', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter your M-Pesa registered phone number
              </p>
            </div>
          </div>
        );

      case 'bank':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Bank Transfer</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kcb">KCB Bank</SelectItem>
                    <SelectItem value="equity">Equity Bank</SelectItem>
                    <SelectItem value="coop">Co-operative Bank</SelectItem>
                    <SelectItem value="absa">Absa Bank</SelectItem>
                    <SelectItem value="stdchart">Standard Chartered</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  placeholder="Full name as per bank records"
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
                <Input
                  id="swiftCode"
                  placeholder="KCBLKENX"
                  value={formData.swiftCode}
                  onChange={(e) => handleInputChange('swiftCode', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Required for international transfers
                </p>
              </div>
            </div>
          </div>
        );

      case 'paypal':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>PayPal</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="your-email@example.com"
                value={formData.paypalEmail}
                onChange={(e) => handleInputChange('paypalEmail', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must match your PayPal account email
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Information</DialogTitle>
          <DialogDescription>
            Set up your payment method to receive earnings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value: 'mpesa' | 'bank' | 'paypal') => setPaymentMethod(value)}
              className="grid grid-cols-1 gap-4"
            >
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">M-Pesa</p>
                    <p className="text-xs text-muted-foreground">Mobile money transfer</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">Direct to bank account</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">PayPal</p>
                    <p className="text-xs text-muted-foreground">International payments</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {renderPaymentFields()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Payment Info
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentInfoModal;