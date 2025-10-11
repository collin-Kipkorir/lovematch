import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/lib/firebase';
import { ref, get, update, push, set } from 'firebase/database';
import { CreditCard, MessageCircle, Video, Smartphone, Phone, ArrowLeft, CheckCircle, Copy, Zap, Receipt, Clock, AlertCircle } from 'lucide-react';

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

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, type = 'message' }) => {
  const { toast } = useToast();
  const { user, updateCredits, updateVideoCredits } = useAuth();
  const [step, setStep] = useState<'packages' | 'payment' | 'agent' | 'mpesa' | 'stk-payment' | 'manual-payment'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);

  const handleSuccessfulPayment = async () => {
    if (!user || !selectedPackage) return;
    
    try {
      // 1. Update user's credits based on package type
      if (type === 'video') {
        await updateVideoCredits(selectedPackage.credits);
      } else {
        await updateCredits(selectedPackage.credits);
      }

      // 2. Log the payment transaction
      const transactionRef = push(ref(database, 'paymentTransactions'));
      await set(transactionRef, {
        userId: user.id,
        packageType: type,
        credits: selectedPackage.credits,
        amount: selectedPackage.price,
        paymentMethod: step === 'stk-payment' ? 'mpesa-stk' : 'mpesa-manual',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  };
  
  // STK Push states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState<'safaricom' | 'airtel'>('safaricom');
  const [stkStatus, setStkStatus] = useState<'idle' | 'loading' | 'pending' | 'success' | 'failed'>('idle');
  const [pin, setPin] = useState('');
  
  // Manual payment states
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // TODO: Backend Integration - Store used messages to prevent reuse
  const [usedMessages] = useState(new Set([
    'QH51ABC12 Confirmed', // Example of already used message
    'QH51DEF34 Confirmed'
  ]));

  const creditPackages: CreditPackage[] = [
    { credits: 25, price: 50, description: 'Starter package' },
    { credits: 50, price: 90, description: 'Most popular choice', savings: 'Save 10%' },
    { credits: 100, price: 160, description: 'Best value package', savings: 'Save 20%' },
    { credits: 200, price: 300, description: 'Premium package', savings: 'Save 25%' }
  ];

  const packages = creditPackages;

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setStep('payment');
  };

  const handleMpesaPayment = () => {
    setStep('mpesa');
  };

  const handleSTKPayment = () => {
    setStep('stk-payment');
  };

  const handleManualPayment = () => {
    setStep('manual-payment');
  };

  const handleContactAgent = () => {
    setStep('agent');
  };

  // TODO: Backend Integration - Replace with actual phone validation
  const validatePhoneNumber = (phone: string): boolean => {
    if (provider === 'safaricom') {
      return /^(?:\+254|254|0)?[17]\d{8}$/.test(phone.replace(/\s/g, ''));
    } else {
      return /^(?:\+254|254|0)?[17]\d{8}$/.test(phone.replace(/\s/g, ''));
    }
  };

  // TODO: Backend Integration - Replace with actual STK Push API call
  const initiateSTKPush = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: `Please enter a valid ${provider} phone number`,
        variant: "destructive"
      });
      return;
    }

    setStkStatus('loading');
    
    // TODO: Backend Integration Point
    /*
    const stkRequest = {
      phoneNumber: formatPhoneNumber(phoneNumber),
      amount: selectedPackage?.price,
      provider: provider,
      packageType: type,
      credits: selectedPackage?.credits,
      userId: user?.id
    };

    try {
      const response = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(stkRequest)
      });

      if (!response.ok) throw new Error('STK Push failed');
      
      const result = await response.json();
      setStkStatus('pending');
      
      // Poll for payment status
      pollPaymentStatus(result.checkoutRequestId);
      
    } catch (error) {
      console.error('STK Push error:', error);
      setStkStatus('failed');
      toast({
        title: "STK Push Failed",
        description: "Please try again or use manual payment",
        variant: "destructive"
      });
    }
    */

    // Simulate STK push
    setTimeout(() => {
      setStkStatus('pending');
      toast({
        title: "STK Push Sent",
        description: `Check your ${provider} phone for payment prompt`,
      });
    }, 2000);
  };

  // TODO: Backend Integration - Handle PIN confirmation
  const confirmPayment = async () => {
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter your 4-digit M-Pesa PIN",
        variant: "destructive"
      });
      return;
    }

    // TODO: Backend Integration - Verify PIN and complete payment
    /*
    await verifyPaymentPIN(pin, checkoutRequestId);
    */

      // Process successful payment
    try {
      await handleSuccessfulPayment();
      setStkStatus('success');
      toast({
        title: "Payment Successful!",
        description: `${selectedPackage?.credits} credits added to your account`,
      });
      
      setTimeout(() => {
        onClose();
        resetModal();
      }, 2000);
    } catch (error) {
      console.error('Payment processing error:', error);
      setStkStatus('failed');
      toast({
        title: "Error Processing Payment",
        description: "There was an error adding credits. Please contact support.",
        variant: "destructive"
      });
    }
  };

  const verifyMpesaMessage = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your payment",
        variant: "destructive"
      });
      return;
    }

    if (!mpesaMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please paste your M-Pesa confirmation message",
        variant: "destructive"
      });
      return;
    }

    // Extract transaction ID from M-Pesa message
    const messageId = mpesaMessage.match(/[A-Z0-9]{8,}/)?.[0];
    if (!messageId) {
      toast({
        title: "Invalid Message",
        description: "Please paste the complete M-Pesa confirmation message",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Check if message was already used
      const usedMessageRef = ref(database, `usedMpesaMessages/${messageId}`);
      const snapshot = await get(usedMessageRef);

      if (snapshot.exists()) {
        toast({
          title: "Message Already Used",
          description: "This M-Pesa message has already been used. Each message can only be used once.",
          variant: "destructive"
        });
        setIsVerifying(false);
        return;
      }

      // Mark message as used
      await set(usedMessageRef, {
        userId: user.id,
        message: mpesaMessage,
        timestamp: new Date().toISOString()
      });

      // Process the payment
      await handleSuccessfulPayment();

      toast({
        title: "Payment Verified!",
        description: `${selectedPackage?.credits} credits have been added to your account.`,
      });

      setTimeout(() => {
        onClose();
        resetModal();
      }, 2000);

    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Verification Failed",
        description: "There was an error verifying your payment. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }

    setIsVerifying(true);

    // TODO: Backend Integration Point
    /*
    try {
      const verificationRequest = {
        message: mpesaMessage,
        expectedAmount: selectedPackage?.price,
        tillNumber: '5678901',
        userId: user?.id,
        packageType: type,
        credits: selectedPackage?.credits
      };

      const response = await fetch('/api/payments/verify-mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(verificationRequest)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      if (result.success) {
        // Mark message as used
        await markMessageAsUsed(messageId);
        
        // Add credits to user account
        await addCreditsToUser(user?.id, type, selectedPackage?.credits);
        
        toast({
          title: "Payment Verified!",
          description: `${selectedPackage?.credits} credits added to your account`,
        });

        setTimeout(() => {
          onClose();
          resetModal();
        }, 2000);
      } else {
        throw new Error(result.error || 'Invalid payment details');
      }
      
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Please check your message and try again",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
    */

    // Simulate verification process
    setTimeout(() => {
      // Simple validation for demo
      const hasAmount = mpesaMessage.includes(selectedPackage?.price.toString() || '');
      const hasTillNumber = mpesaMessage.includes('5678901');
      const hasConfirmation = mpesaMessage.toLowerCase().includes('confirmed');

      if (hasAmount && hasTillNumber && hasConfirmation) {
        toast({
          title: "Payment Verified!",
          description: `${selectedPackage?.credits} credits added to your account`,
        });
        
        setTimeout(() => {
          onClose();
          resetModal();
        }, 2000);
      } else {
        toast({
          title: "Verification Failed",
          description: "Message doesn't match expected payment details",
          variant: "destructive"
        });
      }
      
      setIsVerifying(false);
    }, 3000);
  };

  const resetModal = () => {
    setStep('packages');
    setSelectedPackage(null);
    setPhoneNumber('');
    setProvider('safaricom');
    setStkStatus('idle');
    setPin('');
    setMpesaMessage('');
    setIsVerifying(false);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full bg-card border-border flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center flex items-center justify-center gap-2 relative">
            {(step !== 'packages') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === 'payment') setStep('packages');
                  else if (step === 'agent' || step === 'mpesa') setStep('payment');
                  else if (step === 'stk-payment' || step === 'manual-payment') setStep('mpesa');
                }}
                className="absolute left-0 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CreditCard className="h-5 w-5" />
            {step === 'packages' 
              ? 'Buy Credits'
              : step === 'payment' 
                ? 'Choose Payment Method'
                : step === 'agent'
                  ? 'Contact Agent'
                  : step === 'mpesa'
                    ? 'M-Pesa Payment'
                    : step === 'stk-payment'
                      ? 'STK Push Payment'
                      : 'Manual Payment'
            }
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-auto min-h-0">
          <div className="space-y-4 p-1">
            {step === 'packages' ? (
              <>
                <div className="text-center text-muted-foreground px-2">
                  <p>Purchase credits to unlock features</p>
                  <p>Choose a package to continue:</p>
                </div>

                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <Card 
                      key={pkg.credits}
                      className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" 
                      onClick={() => handlePackageSelect(pkg)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm sm:text-base">
                              {pkg.credits} Credits
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{pkg.description}</p>
                            {pkg.savings && (
                              <span className="inline-block bg-gradient-primary text-primary-foreground text-xs px-2 py-1 rounded-full mt-1">
                                {pkg.savings}
                              </span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-base sm:text-lg">Ksh {pkg.price.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Ksh {(pkg.price / pkg.credits).toFixed(0)} per credit</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : step === 'payment' ? (
              <>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">Selected Package</h3>
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="font-medium">
                      {selectedPackage?.credits} {type === 'message' ? 'Messages' : 'Video Credits'}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      Ksh {selectedPackage?.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Card 
                    className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" 
                    onClick={handleMpesaPayment}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base">Pay via M-Pesa</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">Quick and secure mobile payment</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" 
                    onClick={handleContactAgent}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base">Contact Agent</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">Our agent will contact you for payment</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : step === 'agent' ? (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Agent Contact Requested</h3>
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="font-medium">
                      {selectedPackage?.credits} {type === 'message' ? 'Messages' : 'Video Credits'}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      Ksh {selectedPackage?.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Our payment agent will contact you within 30 minutes</li>
                      <li>• Have your phone ready for verification</li>
                      <li>• Credits will be added after payment confirmation</li>
                    </ul>
                  </div>

                  <Card className="border-primary/20">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>+254 712 345 678</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText('+254712345678')}
                            className="p-1 h-auto"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span>WhatsApp: +254 712 345 678</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open('https://wa.me/254712345678', '_blank')}
                            className="p-1 h-auto"
                          >
                            <ArrowLeft className="h-3 w-3 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="text-center">
                    <Button 
                      onClick={() => {
                        onClose();
                        resetModal();
                      }}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </>
            ) : step === 'mpesa' ? (
              <>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">M-Pesa Payment</h3>
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="font-medium">
                      {selectedPackage?.credits} {type === 'message' ? 'Messages' : 'Video Credits'}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      Ksh {selectedPackage?.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card 
                    className="border-green-200 hover:border-green-400 transition-colors cursor-pointer" 
                    onClick={handleSTKPayment}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Zap className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">STK Push Payment</h3>
                          <p className="text-sm text-muted-foreground">Instant payment via your phone</p>
                          <p className="text-xs text-green-600 font-medium">Recommended</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={handleManualPayment}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Receipt className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Manual Buy Goods Payment</h3>
                          <p className="text-sm text-muted-foreground">Pay via M-Pesa menu and verify</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : step === 'stk-payment' ? (
              <>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">STK Push Payment</h3>
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="font-medium">
                      {selectedPackage?.credits} {type === 'message' ? 'Messages' : 'Video Credits'}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      Ksh {selectedPackage?.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {stkStatus === 'idle' && (
                    <>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="provider">Select Network Provider</Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant={provider === 'safaricom' ? 'default' : 'outline'}
                              onClick={() => setProvider('safaricom')}
                              className="flex-1"
                            >
                              Safaricom
                            </Button>
                            <Button
                              variant={provider === 'airtel' ? 'default' : 'outline'}
                              onClick={() => setProvider('airtel')}
                              className="flex-1"
                            >
                              Airtel
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder={provider === 'safaricom' ? '0712345678' : '0732123456'}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter your {provider} phone number
                          </p>
                        </div>

                        <Button 
                          onClick={initiateSTKPush}
                          className="w-full"
                          disabled={!phoneNumber}
                        >
                          Send STK Push to {phoneNumber || 'Your Phone'}
                        </Button>
                      </div>
                    </>
                  )}

                  {stkStatus === 'loading' && (
                    <div className="text-center py-6">
                      <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="font-semibold">Initiating STK Push...</p>
                      <p className="text-sm text-muted-foreground">Please wait</p>
                    </div>
                  )}

                  {stkStatus === 'pending' && (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <Smartphone className="h-12 w-12 mx-auto mb-3 text-green-600" />
                        <p className="font-semibold text-green-600">STK Push Sent!</p>
                        <p className="text-sm text-muted-foreground">
                          Check your phone {phoneNumber} for M-Pesa payment prompt
                        </p>
                      </div>

                       <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3">Enter Your M-Pesa PIN</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="pin">M-Pesa PIN</Label>
                              <div className="flex justify-center">
                                <InputOTP
                                  value={pin}
                                  onChange={(value) => setPin(value)}
                                  maxLength={4}
                                >
                                  <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                  </InputOTPGroup>
                                </InputOTP>
                              </div>
                              <p className="text-xs text-muted-foreground text-center">
                                Enter your 4-digit M-Pesa PIN to complete payment
                              </p>
                            </div>
                            <Button 
                              onClick={confirmPayment}
                              className="w-full bg-green-600 hover:bg-green-700"
                              disabled={pin.length !== 4}
                            >
                              Confirm Payment
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {stkStatus === 'success' && (
                    <div className="text-center py-6">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
                      <p className="font-semibold text-green-600 text-lg">Payment Successful!</p>
                      <p className="text-sm text-muted-foreground">
                        Credits have been added to your account
                      </p>
                    </div>
                  )}

                  {stkStatus === 'failed' && (
                    <div className="text-center py-6 space-y-4">
                      <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
                      <div>
                        <p className="font-semibold text-red-600">Payment Failed</p>
                        <p className="text-sm text-muted-foreground">
                          Payment was cancelled or failed
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setStkStatus('idle')}
                          variant="outline"
                          className="flex-1"
                        >
                          Try Again
                        </Button>
                        <Button 
                          onClick={handleManualPayment}
                          variant="outline"
                          className="flex-1"
                        >
                          Manual Payment
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : step === 'manual-payment' ? (
              <>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">Manual Payment Verification</h3>
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="font-medium">
                      {selectedPackage?.credits} {type === 'message' ? 'Messages' : 'Video Credits'}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      Ksh {selectedPackage?.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h4>
                      <ol className="text-sm text-blue-800 space-y-1">
                        <li>1. Go to M-Pesa menu on your phone</li>
                        <li>2. Select "Buy Goods and Services"</li>
                        <li>3. Enter Till Number: <span className="font-bold">5678901</span></li>
                        <li>4. Enter amount: <span className="font-bold">Ksh {selectedPackage?.price.toLocaleString()}</span></li>
                        <li>5. Enter your PIN and confirm</li>
                        <li>6. Copy the confirmation message below</li>
                      </ol>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Till Number:</span>
                      <span className="font-bold">5678901</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText('5678901');
                          toast({ title: "Copied!", description: "Till number copied to clipboard" });
                        }}
                        className="p-1 h-auto"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Amount:</span>
                      <span className="font-bold">Ksh {selectedPackage?.price.toLocaleString()}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPackage?.price.toString() || '');
                          toast({ title: "Copied!", description: "Amount copied to clipboard" });
                        }}
                        className="p-1 h-auto"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="mpesa-message">M-Pesa Confirmation Message</Label>
                      <Textarea
                        id="mpesa-message"
                        placeholder="Paste your M-Pesa confirmation message here...
Example: QH51ABC123 Confirmed. You have paid Ksh 300.00 to LOVABLE CREDITS for account 5678901 on 1/1/2024 at 10:30 AM. M-Pesa balance is Ksh 2,500.00"
                        value={mpesaMessage}
                        onChange={(e) => setMpesaMessage(e.target.value)}
                        rows={4}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠️ Each M-Pesa message can only be used once
                      </p>
                    </div>

                    <Button 
                      onClick={verifyMpesaMessage}
                      className="w-full"
                      disabled={!mpesaMessage.trim() || isVerifying}
                    >
                      {isVerifying ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Verifying Payment...
                        </>
                      ) : (
                        'Verify Payment'
                      )}
                    </Button>
                  </div>

                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-800">
                          <p className="font-semibold mb-1">Important:</p>
                          <ul className="space-y-1">
                            <li>• Make sure you pay the exact amount to our till number</li>
                            <li>• Copy the entire M-Pesa confirmation message</li>
                            <li>• Each message can only be used once for security</li>
                            <li>• Credits will be added immediately after verification</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 space-y-4 pt-4 border-t">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span>Secure payment via M-Pesa or agent contact</span>
          </div>

          <Button variant="outline" onClick={handleClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default PaymentModal;