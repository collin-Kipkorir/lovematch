/* 
 * ModeratorEarnings Component
 * 
 * BACKEND INTEGRATION REQUIREMENTS:
 * 
 * 1. API Endpoints needed:
 *    - GET /api/moderator/earnings - Fetch earnings data with pagination
 *    - GET /api/moderator/earnings/stats - Get earnings statistics
 *    - GET /api/moderator/payment-info - Get payment method configuration
 *    - PUT /api/moderator/payment-info - Update payment method
 *    - POST /api/moderator/earnings/export - Export earnings data
 *    - PUT /api/moderator/earnings/{id}/approve - Approve payment
 *    - PUT /api/moderator/earnings/{id}/hold - Hold payment
 *    - PUT /api/moderator/earnings/{id}/reject - Reject payment
 * 
 * 2. Database Schema needed:
 *    - moderator_earnings: id, moderator_id, user_id, amount, commission_type, status, created_at
 *    - moderator_payment_info: moderator_id, method, bank_details, mpesa_phone, paypal_email
 *    - payment_requests: id, moderator_id, amount, status, requested_at, processed_at
 * 
 * 3. Real-time updates:
 *    - WebSocket connection for live earnings updates
 *    - Notification system for payment status changes
 * 
 * 4. Payment Processing:
 *    - Integration with M-Pesa API for mobile payments
 *    - Bank transfer processing system
 *    - PayPal integration for international payments
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Settings, Download, CreditCard, Users, CheckCircle, Clock, Smartphone } from 'lucide-react';
import { useModeratorEarnings } from '@/hooks/useModeratorEarnings';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import EarningsStats from './EarningsStats';
import EarningsFilters from './EarningsFilters';
import EarningsList from './EarningsList';
import EarningsPagination from './EarningsPagination';
import PaymentInfoModal from './PaymentInfoModal';

const ModeratorEarnings: React.FC = () => {
  // TODO: Backend Integration - State management for payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { canManageCredits } = useAdminAuth();
  
  // TODO: Backend Integration - Custom hook that handles all API calls
  // This hook should connect to real backend endpoints
  const {
    earnings,          // TODO: GET /api/moderator/earnings
    stats,            // TODO: GET /api/moderator/earnings/stats
    paymentInfo,      // TODO: GET /api/moderator/payment-info
    filters,          // Local state for filtering
    loading,          // Loading states for API calls
    totalPages,       // Pagination from backend
    totalCount,       // Total records count
    fetchEarnings,    // TODO: Function to fetch earnings with filters
    approvePayment,   // TODO: PUT /api/moderator/earnings/{id}/approve
    holdPayment,      // TODO: PUT /api/moderator/earnings/{id}/hold
    rejectPayment,    // TODO: PUT /api/moderator/earnings/{id}/reject
    updatePaymentInfo, // TODO: PUT /api/moderator/payment-info
    exportEarnings,   // TODO: POST /api/moderator/earnings/export
    bulkApprovePayments, // TODO: POST /api/moderator/earnings/bulk-approve
    setFilters        // Local filter state setter
  } = useModeratorEarnings();

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
    fetchEarnings({ ...filters, ...newFilters, page: 1 });
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    await exportEarnings(format);
  };

  const handleRefresh = () => {
    fetchEarnings();
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-1">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Moderator Earnings Dashboard</h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          Track your commission earnings and payment status
        </p>
        <div className="mt-2 text-xs text-muted-foreground space-y-1">
          <p>• Earn 30% commission on credits purchased by assigned users</p>
          <p>• Earn 5% commission on monthly earnings from your referrals</p>
          <p>• Earnings ≥ KSh 1,000 are processed for payment</p>
          <p>• Earnings &lt; KSh 1,000 accumulate until threshold is met</p>
        </div>
      </div>

      {/* Earnings Stats */}
      <EarningsStats stats={stats} loading={loading} />

      {/* TODO: Backend Integration - Payment System Overview Component */}
      {/* BACKEND: This section needs API endpoint: GET /api/moderator/payment-info */}
      <Card className="bg-gradient-premium border-2 border-primary/20 shadow-elegant relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <span className="bg-gradient-text bg-clip-text text-transparent">Payment System Overview</span>
          </CardTitle>
          <CardDescription className="text-base">How the moderator payment system works - understand your earnings</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 relative">
          {/* Commission Structure Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-primary rounded-full"></div>
                Commission Structure
              </h4>
              <div className="space-y-3">
                {/* TODO: Backend - Fetch commission rates from API */}
                <div className="group p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:shadow-card transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Credit Purchase Commission</p>
                        <p className="text-sm text-muted-foreground">From assigned users</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform">30%</span>
                  </div>
                </div>
                
                <div className="group p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:shadow-card transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Referral Commission</p>
                        <p className="text-sm text-muted-foreground">Monthly from referrals</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-purple-600 group-hover:scale-110 transition-transform">5%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Processing Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-secondary rounded-full"></div>
                Payment Processing
              </h4>
              <div className="space-y-3">
                {/* TODO: Backend - Fetch payment thresholds from API */}
                <div className="group p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:shadow-card transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="font-medium text-green-700">Ready for Payment</p>
                      <p className="text-sm text-muted-foreground">≥ KSh 1,000: Automatically processed</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                
                <div className="group p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:shadow-card transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="font-medium text-yellow-700">Accumulating</p>
                      <p className="text-sm text-muted-foreground">&lt; KSh 1,000: Held until threshold met</p>
                    </div>
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="bg-gradient-primary h-px" />
          
          {/* Payment Method Configuration */}
          {/* TODO: Backend - API endpoint: GET/PUT /api/moderator/payment-method */}
          <div className="p-6 bg-gradient-subtle rounded-xl border border-primary/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-lg">Payment Method</p>
                </div>
                <div className="space-y-1">
                  {/* TODO: Backend - Display actual payment method from database */}
                  {paymentInfo?.method === 'bank' && (
                    <p className="text-muted-foreground">
                      🏦 Bank Transfer - {paymentInfo.details.accountNumber}
                    </p>
                  )}
                  {paymentInfo?.method === 'mpesa' && (
                    <p className="text-muted-foreground">
                      📱 M-Pesa - {paymentInfo.details.phone}
                    </p>
                  )}
                  {paymentInfo?.method === 'paypal' && (
                    <p className="text-muted-foreground">
                      💳 PayPal - {paymentInfo.details.email}
                    </p>
                  )}
                  {!paymentInfo && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <p className="text-red-600 font-medium">Not configured - payments will be held</p>
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={() => setIsPaymentModalOpen(true)}
                className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
                size="lg"
              >
                <Settings className="mr-2 h-4 w-4" />
                {paymentInfo ? 'Update Payment Info' : 'Set Up Payment Method'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <EarningsFilters 
        filters={filters}
        onFiltersChange={handleFilterChange}
        onExport={handleExport}
        onRefresh={handleRefresh}
        loading={loading}
        totalCount={totalCount}
      />

      {/* Earnings Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Earnings Transactions</CardTitle>
            <CardDescription>
              All commission earnings and payment processing status
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={loading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={loading}
            >
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EarningsList
            earnings={earnings}
            loading={loading}
            onApprove={approvePayment}
            onHold={holdPayment}
            onReject={rejectPayment}
            onBulkApprove={bulkApprovePayments}
            canManagePayments={canManageCredits()}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      <EarningsPagination
        filters={filters}
        totalPages={totalPages}
        totalCount={totalCount}
        onFiltersChange={handleFilterChange}
        loading={loading}
      />

      {/* Payment Info Modal */}
      <PaymentInfoModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        currentPaymentInfo={paymentInfo || undefined}
      />
    </div>
  );
};

export default ModeratorEarnings;