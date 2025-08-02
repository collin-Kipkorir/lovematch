import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Smartphone, CheckCircle, Clock, Phone, MessageCircle, Video } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Layout/Header';

// TODO: Backend Integration - Replace with actual API types
interface PaymentRequest {
  id: string;
  userId: string;
  amount: number;
  phoneNumber: string;
  packageType: 'message' | 'video' | 'premium';
  packageDetails: {
    credits: number;
    description: string;
  };
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  transactionId?: string;
}

interface ContactRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  phoneNumber: string;
  packageType: string;
  amount: number;
  message: string;
  timestamp: string;
  status: 'pending' | 'contacted' | 'resolved';
}

const Payment: React.FC = () => {
  const { user, updateCredits, updateVideoCredits } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Payment state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'requesting' | 'pending' | 'success' | 'failed'>('idle');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  
  // Get package details from URL params
  const packageType = searchParams.get('package') as 'message' | 'video' | 'premium' || 'message';
  const credits = parseInt(searchParams.get('credits') || '5');
  const amount = parseInt(searchParams.get('amount') || '250');

  // Package definitions
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

  // TODO: Backend Integration - Replace with actual phone validation
  const validatePhoneNumber = (phone: string): boolean => {
    // Kenyan phone number format validation
    const kenyaPhoneRegex = /^(\+?254|0)?[17]\d{8}$/;
    return kenyaPhoneRegex.test(phone.replace(/\s/g, ''));
  };

  // TODO: Backend Integration - Replace with actual M-Pesa STK Push API
  const initiateSTKPush = async (): Promise<boolean> => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number (e.g., 0712345678)",
        variant: "destructive"
      });
      return false;
    }

    setPaymentStatus('requesting');

    // TODO: Backend Integration Point
    // Replace this simulation with actual M-Pesa API call
    /*
    const paymentRequest: PaymentRequest = {
      id: generateUniqueId(),
      userId: user!.id,
      amount,
      phoneNumber: formatPhoneNumber(phoneNumber),
      packageType,
      packageDetails: {
        credits,
        description: currentPackage.description
      },
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(paymentRequest)
      });

      if (!response.ok) {
        throw new Error('Payment initiation failed');
      }

      const result = await response.json();
      
      // Store payment request in database for tracking
      await storePaymentRequest(paymentRequest);
      
      // Start polling for payment status
      pollPaymentStatus(result.checkoutRequestId);
      
    } catch (error) {
      console.error('STK Push failed:', error);
      setPaymentStatus('failed');
      return false;
    }
    */

    // Simulate STK push request
    setTimeout(() => {
      setPaymentStatus('pending');
      toast({
        title: "STK Push Sent",
        description: `Check your phone ${phoneNumber} for M-Pesa payment prompt`,
      });

      // Simulate payment completion after 5 seconds
      setTimeout(() => {
        // TODO: Backend Integration - This should be handled by webhook from M-Pesa
        simulatePaymentCompletion();
      }, 5000);
    }, 2000);

    return true;
  };

  // TODO: Backend Integration - Replace with webhook handler
  const simulatePaymentCompletion = () => {
    const isSuccess = Math.random() > 0.2; // 80% success rate for demo

    if (isSuccess) {
      // TODO: Backend Integration - Update database with successful payment
      /*
      await updatePaymentStatus(paymentId, 'completed', {
        transactionId: mpesaTransactionId,
        receipt: mpesaReceipt
      });
      
      await updateUserCredits(user.id, packageType, credits);
      */

      setPaymentStatus('success');
      
      // Update local credits (TODO: This should come from backend after payment confirmation)
      if (packageType === 'message') {
        updateCredits(credits);
      } else if (packageType === 'video') {
        updateVideoCredits(credits);
      } else if (packageType === 'premium') {
        updateCredits(credits);
        updateVideoCredits(5);
      }

      toast({
        title: "Payment Successful!",
        description: `${currentPackage.description} has been added to your account`,
      });

      // Redirect after success
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: "Payment was cancelled or failed. Please try again or contact support.",
        variant: "destructive"
      });
    }
  };

  // TODO: Backend Integration - Submit contact request to admin
  const submitContactRequest = async () => {
    if (!contactMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details about your payment request",
        variant: "destructive"
      });
      return;
    }

    // TODO: Backend Integration Point
    /*
    const contactRequest: ContactRequest = {
      id: generateUniqueId(),
      userId: user!.id,
      userName: user!.name,
      userEmail: user!.email,
      phoneNumber,
      packageType: currentPackage.title,
      amount,
      message: contactMessage,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    try {
      await fetch('/api/admin/contact-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(contactRequest)
      });

      // Send notification to admin dashboard
      await notifyAdminNewContactRequest(contactRequest);
      
    } catch (error) {
      console.error('Contact request failed:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support directly",
        variant: "destructive"
      });
      return;
    }
    */

    // Simulate successful submission
    toast({
      title: "Request Submitted",
      description: "Our support team will contact you within 24 hours to process your payment",
    });

    // TODO: Backend Integration - Store in database and notify admin
    console.log('Contact Request (TODO: Send to backend):', {
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
            onClick={() => navigate('/admin-help')}
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
                    onClick={initiateSTKPush}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!phoneNumber}
                  >
                    Pay Ksh {amount.toLocaleString()} via M-Pesa
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
                  <Smartphone className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold">STK Push Sent!</p>
                  <p className="text-sm text-muted-foreground">
                    Check your phone {phoneNumber} for M-Pesa payment prompt
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete the payment to receive your credits
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
                    <Textarea
                      id="message"
                      placeholder="Please describe your payment issue or preferred payment method..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={4}
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
              <p><strong>M-Pesa STK Push:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Enter your M-Pesa registered phone number</li>
                <li>Click "Pay via M-Pesa" button</li>
                <li>Check your phone for M-Pesa payment prompt</li>
                <li>Enter your M-Pesa PIN to complete payment</li>
                <li>Credits will be added automatically upon successful payment</li>
              </ul>
              
              <p className="mt-4"><strong>Contact Agent:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use this option if M-Pesa payment fails</li>
                <li>Our agent will contact you within 24 hours</li>
                <li>Alternative payment methods available (Bank transfer, etc.)</li>
                <li>Manual credit addition after payment verification</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;