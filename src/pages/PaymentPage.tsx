import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Smartphone, CheckCircle, Clock, MessageCircle, Video, Phone } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Layout/Header';
import { payHeroService } from '@/lib/payhero-service';
import { usePaymentPolling } from '@/hooks/usePaymentPolling';

interface PaymentDetails {
  phoneNumber: string;
  paymentMethod: 'mpesa' | 'card';
}

const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'requesting' | 'pending' | 'success' | 'failed'>('idle');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [currentPaymentRef, setCurrentPaymentRef] = useState<string | null>(null);

  // Get package details from URL params
  const packageType = searchParams.get('package') as 'message' | 'video' | 'premium' || 'message';
  const credits = parseInt(searchParams.get('credits') || '5');
  const amount = parseInt(searchParams.get('amount') || '250');

  const packageDetails = {
    message: {
      icon: MessageCircle,
      title: 'Message Credits',
      description: `${credits} message credits`
    },
    video: {
      icon: Video,
      title: 'Video Credits', 
      description: `${credits} video call credits`
    },
    premium: {
      icon: CheckCircle,
      title: 'Premium Bundle',
      description: `${credits} message credits + 5 video credits`
    }
  };

  const currentPackage = packageDetails[packageType];

  // Use the payment polling hook
  usePaymentPolling(currentPaymentRef, {
    onSuccess: () => {
      setPaymentStatus('success');
      toast({
        title: "Payment Successful",
        description: "Your credits have been added to your account",
      });
      setTimeout(() => navigate('/'), 2000);
    },
    onError: (error) => {
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: error || "The payment was not completed. Please try again.",
        variant: "destructive"
      });
    },
    onTimeout: () => {
      setPaymentStatus('failed');
      toast({
        title: "Payment Timeout",
        description: "The payment process took too long. Please try again or contact support.",
        variant: "destructive"
      });
    }
  });

  const handlePayment = async (): Promise<void> => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setPaymentStatus('requesting');
    setCurrentPaymentRef(null);

    try {
      const paymentReference = `${user.id}-${Date.now()}`;
      
      // Initiate PayHero STK Push
      const response = await payHeroService.initiateSTKPush({
        amount: amount,
        currency: "KES",
        customerName: user.name,
        phoneNumber: phoneNumber,
        provider: "MPESA",
        reference: paymentReference
      });

      if (!response.success) {
        setPaymentStatus('failed');
        toast({
          title: "Payment Failed",
          description: response.error?.message || "Failed to initiate payment",
          variant: "destructive"
        });
        return;
      }

      setPaymentStatus('pending');
      setCurrentPaymentRef(response.reference);
      toast({
        title: "Payment Initiated",
        description: "Please check your phone for the M-PESA prompt",
      });

    } catch (error) {
      console.error('Payment Error:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const submitContactRequest = async () => {
    if (!contactMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details about your payment request",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Request Submitted",
      description: "Our support team will contact you within 24 hours to process your payment",
    });

    // Log contact request (TODO: implement backend integration)
    console.log('Contact Request:', {
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      phoneNumber,
      packageType: currentPackage.title,
      amount,
      message: contactMessage,
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Packages</span>
          </Button>
        </div>

        {/* Package Summary */}
        <Card className="mb-6 bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <currentPackage.icon className="h-5 w-5" />
              <span>{currentPackage.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">{currentPackage.description}</p>
                <p className="text-muted-foreground">For: {user.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">Ksh {amount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardContent className="p-6">
            {!showContactForm ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={processing}
                  />
                </div>

                <div className="space-y-4">
                  <Button 
                    className="w-full" 
                    disabled={processing || !phoneNumber}
                    onClick={handlePayment}
                  >
                    {processing ? (
                      <span className="flex items-center space-x-2">
                        <Clock className="animate-spin h-4 w-4" />
                        <span>Processing...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>Pay with M-Pesa</span>
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowContactForm(true)}
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    placeholder="Please describe your payment request..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={submitContactRequest}
                    disabled={!contactMessage.trim()}
                  >
                    Submit Request
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowContactForm(false)}
                  >
                    Back to Payment
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;