import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCredits } from '@/hooks/useCredits';
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

const Payment: React.FC = () => {
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
  
  const { updateCredits, updating } = useCredits({
    onError: (error) => {
      toast({
        title: "Credit Update Failed",
        description: error,
        variant: "destructive"
      });
    }
  });

  // Use the payment polling hook
  usePaymentPolling(currentPaymentRef, {
    onSuccess: async () => {
      setPaymentStatus('success');
      
      // Update user's credit balance
      const updated = await updateCredits(user.id, packageType, credits);
      
      if (updated) {
        toast({
          title: "Payment Successful",
          description: "Your credits have been added to your account",
        });
        setTimeout(() => navigate('/'), 2000);
      }
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
      console.log('Initiating payment with details:', {
        amount,
        phoneNumber,
        customerName: user.name,
        package: packageType
      });

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
            // Log detailed error information
            console.error('Payment Status Check Error:', {
              error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
              } : error,
              timestamp: new Date().toISOString(),
              checkNumber: checkCount,
              paymentDetails: {
                userId: user.id,
                phoneNumber,
                amount,
                packageType,
                credits,
                reference: response.reference
              }
            });
            setPaymentStatus('failed');
          }
        };

        // Start checking payment status
        setTimeout(checkStatus, 5000); // Start checking after 5 seconds
      } else {
        setPaymentStatus('failed');
        toast({
          title: "Payment Failed",
          description: response.error?.message || "Failed to initiate payment",
          variant: "destructive"
        });
      }
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

        {/* Payment Methods */}
        <div className="grid gap-6">
          {/* M-Pesa STK Push */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                <span>Pay with M-Pesa</span>
                <Badge variant="secondary">Recommended</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentStatus === 'idle' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the M-Pesa registered phone number
                    </p>
                  </div>
                  <Button 
                    onClick={handlePayment}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!phoneNumber || processing}
                  >
                    {processing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay Ksh ${amount.toLocaleString()} via M-Pesa`
                    )}
                  </Button>
                </>
              )}

              {paymentStatus === 'requesting' && (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Initiating payment request...</p>
                </div>
              )}

              {paymentStatus === 'pending' && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="font-semibold">Payment in Progress</p>
                  <p className="text-sm text-muted-foreground">
                    Please complete the payment on your phone {phoneNumber}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Do not close this page. Waiting for confirmation...
                  </p>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold text-green-600">Payment Successful!</p>
                  <p className="text-sm text-muted-foreground">
                    Credits have been added to your account
                  </p>
                  <p className="text-sm text-primary mt-4">
                    Redirecting to home page...
                  </p>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="text-center py-4">
                  <p className="font-semibold text-red-600">Payment Failed</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Payment was cancelled or failed
                  </p>
                  <Button 
                    onClick={() => setPaymentStatus('idle')}
                    variant="outline"
                    className="mr-2"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => setShowContactForm(true)}
                    variant="outline"
                  >
                    Contact Support
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Agent Option */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <span>Contact Our Agent</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showContactForm ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    Having trouble with M-Pesa? Our agents can help you complete the payment manually.
                  </p>
                  <Button 
                    onClick={() => setShowContactForm(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Contact Agent for Manual Payment
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Your Phone Number</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      placeholder="0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message to Agent</Label>
                    <textarea
                      id="message"
                      className="w-full min-h-[100px] p-2 border rounded"
                      placeholder="Please describe your payment issue or preferred payment method..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                    />
                  </div>

                  {/* Agent will see this info */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Request Details (Visible to Agent):</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>User:</strong> {user.name} ({user.email})</p>
                      <p><strong>User ID:</strong> {user.id}</p>
                      <p><strong>Package:</strong> {currentPackage.title}</p>
                      <p><strong>Amount:</strong> Ksh {amount.toLocaleString()}</p>
                      <p><strong>Credits:</strong> {currentPackage.description}</p>
                      <p><strong>Phone:</strong> {phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      onClick={submitContactRequest}
                      className="flex-1"
                      disabled={!contactMessage.trim()}
                    >
                      Submit Request
                    </Button>
                    <Button 
                      onClick={() => setShowContactForm(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Instructions */}
        <Card className="mt-6 bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>M-Pesa Payment Steps:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Enter your M-Pesa number (must be registered with M-Pesa)</li>
                <li>You will receive an M-Pesa prompt on your phone</li>
                <li>Enter your M-Pesa PIN to authorize the payment</li>
                <li>Wait for confirmation on this page</li>
              </ul>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Having trouble?</p>
                <p className="text-sm text-muted-foreground">
                  If you don't receive the M-Pesa prompt or encounter any issues, 
                  use the "Contact Agent" option below for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;