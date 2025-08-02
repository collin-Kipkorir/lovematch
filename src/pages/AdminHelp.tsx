import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, MessageCircle, Phone, ArrowLeft, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Layout/Header';

const AdminHelp: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePayment = (packageType: string, credits: number, amount: number) => {
    // Navigate to payment page with package details
    navigate(`/payment?package=message&credits=${credits}&amount=${amount}`);
  };

  const handleVideoCreditPurchase = (packageType: string, credits: number, amount: number) => {
    // Navigate to payment page with video package details
    navigate(`/payment?package=video&credits=${credits}&amount=${amount}`);
  };

  const handlePremiumBundle = () => {
    // Navigate to payment page with premium bundle details
    navigate(`/payment?package=premium&credits=50&amount=2000`);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const creditPackages = [
    { credits: 5, price: 10, popular: false },
    { credits: 15, price: 25, popular: true },
    { credits: 30, price: 50, popular: false },
    { credits: 50, price: 80, popular: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Top Up Credits
          </h1>
          <p className="text-muted-foreground">
            Continue your conversations and unlock premium video calls!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Message Credits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Get credits to start conversations. Each message costs 1 credit.
              </p>
              <div className="space-y-2">
                 {creditPackages.map((pkg) => (
                   <Button
                     key={pkg.credits}
                     onClick={() => handlePayment('message', pkg.credits, pkg.price)}
                     className="w-full bg-gradient-primary"
                   >
                     {pkg.credits} Credits - Ksh {pkg.price.toLocaleString()}
                   </Button>
                 ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Video Call Credits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Premium video calling feature. Each session costs Ksh 500.
              </p>
              <Button
                onClick={() => handleVideoCreditPurchase('video', 1, 500)}
                className="w-full bg-accent text-accent-foreground"
              >
                Buy 1 Video Credit - Ksh 500
              </Button>
              <Button
                onClick={() => handleVideoCreditPurchase('video', 3, 1500)}
                variant="outline"
                className="w-full"
              >
                Buy 3 Video Credits - Ksh 1,500
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">💎 Premium Bundle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Complete package: 50 message credits + 5 video credits + premium features.
              </p>
              <Button
                onClick={handlePremiumBundle}
                className="w-full bg-gradient-passion"
              >
                Premium Bundle - Ksh 2,000
              </Button>
            </CardContent>
          </Card>
        </div>


        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span>Need Help?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Having trouble with payments or need assistance? Our support team is here to help!
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <h4 className="font-semibold">Email Support</h4>
                <p className="text-sm text-muted-foreground">support@lovematch.com</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold">Live Chat</h4>
                <p className="text-sm text-muted-foreground">Available 24/7</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold">Phone</h4>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHelp;