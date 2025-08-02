/* 
 * ModeratorReferrals Component
 * 
 * BACKEND INTEGRATION REQUIREMENTS:
 * 
 * 1. API Endpoints needed:
 *    - GET /api/moderator/referrals - Fetch referral data and statistics
 *    - GET /api/moderator/referral-code - Get unique referral code
 *    - POST /api/moderator/referrals/invite - Send email invitation
 *    - GET /api/moderator/referrals/history - Fetch referral history with pagination
 *    - GET /api/moderator/referrals/commissions - Get commission earnings from referrals
 * 
 * 2. Database Schema needed:
 *    - moderator_referrals: id, referrer_id, referee_id, referral_code, status, created_at
 *    - referral_commissions: id, referrer_id, referee_id, amount, month, created_at
 *    - email_invitations: id, moderator_id, email, status, sent_at, accepted_at
 * 
 * 3. Features to implement:
 *    - Email invitation system with templates
 *    - Social media sharing integration
 *    - Referral link tracking and analytics
 *    - Commission calculation and payment processing
 * 
 * 4. External integrations:
 *    - Email service (SendGrid, AWS SES, etc.)
 *    - WhatsApp Business API for direct sharing
 *    - Social media APIs for sharing
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  DollarSign, 
  Share2, 
  Copy, 
  Mail, 
  MessageSquare,
  TrendingUp,
  Calendar
} from 'lucide-react';

// TODO: Backend Integration - Replace with API call
// GET /api/moderator/referrals/stats
const referralStats = {
  totalReferrals: 8,        // TODO: Count from moderator_referrals table
  activeReferrals: 6,       // TODO: Count active referrals only
  totalCommissions: 245.75, // TODO: Sum from referral_commissions table
  monthlyCommissions: 67.50, // TODO: Sum for current month
  referralCode: 'MOD2024JD' // TODO: Generate unique code for moderator
};

// TODO: Backend Integration - Replace with API call
// GET /api/moderator/referrals/history
const referralHistory = [
  {
    id: 1,
    name: 'Sarah Johnson',         // TODO: Fetch from users table
    email: 'sarah.j@email.com',    // TODO: Fetch from users table
    joinDate: '2024-06-15',        // TODO: Fetch from moderator_referrals.created_at
    status: 'active',              // TODO: Calculate based on recent activity
    totalEarnings: 890.25,         // TODO: Sum from moderator_earnings table
    yourCommission: 44.51,         // TODO: Calculate 5% of totalEarnings
    monthlyCommission: 15.75       // TODO: Sum commission for current month
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    joinDate: '2024-05-20',
    status: 'active',
    totalEarnings: 1205.50,
    yourCommission: 60.28,
    monthlyCommission: 22.50
  },
  {
    id: 3,
    name: 'Emily Davis',
    email: 'emily.d@email.com',
    joinDate: '2024-07-01',
    status: 'pending',              // TODO: Status: pending, active, inactive
    totalEarnings: 0,
    yourCommission: 0,
    monthlyCommission: 0
  },
  {
    id: 4,
    name: 'Alex Rodriguez',
    email: 'alex.r@email.com',
    joinDate: '2024-04-10',
    status: 'active',
    totalEarnings: 1567.80,
    yourCommission: 78.39,
    monthlyCommission: 18.75
  },
  {
    id: 5,
    name: 'Lisa Wang',
    email: 'lisa.w@email.com',
    joinDate: '2024-03-25',
    status: 'active',
    totalEarnings: 987.60,
    yourCommission: 49.38,
    monthlyCommission: 12.25
  }
];

const ModeratorReferrals: React.FC = () => {
  // TODO: Backend Integration - State for email invitation
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  // TODO: Backend Integration - Copy referral link function
  const handleCopyReferralLink = () => {
    // TODO: Get referral link from API or construct with moderator's unique code
    const referralLink = `https://lovematch.com/apply/moderator?ref=${referralStats.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    
    // TODO: Track referral link copy event for analytics
    // POST /api/analytics/events { type: 'referral_link_copied', moderator_id: ... }
    
    toast({
      title: "Referral link copied!",
      description: "Share this link with potential moderators.",
    });
  };

  // TODO: Backend Integration - Send email invitation
  const handleSendInvite = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send the invitation.",
        variant: "destructive"
      });
      return;
    }
    
    // TODO: Backend API call to send invitation email
    /*
    try {
      await fetch('/api/moderator/referrals/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          referralCode: referralStats.referralCode,
          moderatorId: currentModeratorId 
        })
      });
      
      // Track invitation sent event
      // POST /api/analytics/events { type: 'referral_invitation_sent', email, moderator_id }
      
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({
        title: "Failed to send invitation",
        description: "Please try again later.",
        variant: "destructive"
      });
      return;
    }
    */
    
    toast({
      title: "Invitation sent!",
      description: `Moderator application link sent to ${email}`,
    });
    setEmail('');
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-1">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Refer & Earn</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Invite friends to become moderators and earn 5% commission from their earnings</p>
      </div>

      {/* Referral Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">{referralStats.activeReferrals} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ksh {(referralStats.totalCommissions * 130).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ksh {(referralStats.monthlyCommissions * 130).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">5% commission rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Code</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{referralStats.referralCode}</div>
            <p className="text-xs text-muted-foreground">Your unique code</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Tools */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Share Your Referral Link</CardTitle>
            <CardDescription>Copy and share your unique referral link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input 
                value={`https://lovematch.com/apply/moderator?ref=${referralStats.referralCode}`}
                readOnly
                className="flex-1"
              />
              <Button onClick={handleCopyReferralLink} size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <MessageSquare className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Social
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Direct Invitation</CardTitle>
            <CardDescription>Invite someone directly via email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleSendInvite} className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How the Referral Program Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Share2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">1. Share Your Link</h3>
              <p className="text-sm text-muted-foreground">Share your unique referral link with friends who would make great moderators</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">2. They Apply & Get Hired</h3>
              <p className="text-sm text-muted-foreground">When they apply using your link and get hired as a moderator</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">3. You Earn 5% Commission</h3>
              <p className="text-sm text-muted-foreground">Earn 5% commission from their earnings for as long as they work</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referrals</CardTitle>
          <CardDescription>Track your referred moderators and earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 lg:space-y-4">
            {referralHistory.map((referral) => (
              <div key={referral.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-3 lg:p-4 border border-border rounded-lg space-y-3 lg:space-y-0">
                <div className="space-y-1">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-3 space-y-1 lg:space-y-0">
                    <p className="font-medium">{referral.name}</p>
                    <Badge variant={referral.status === 'active' ? 'default' : 'secondary'}>
                      {referral.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{referral.email}</p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {referral.joinDate}</span>
                  </div>
                </div>
                <div className="space-y-1 lg:text-right">
                  <p className="text-sm font-semibold">Commission: Ksh {(referral.yourCommission * 130).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">This month: Ksh {(referral.monthlyCommission * 130).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeratorReferrals;