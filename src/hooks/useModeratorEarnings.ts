import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// TODO: Backend Integration - Define interfaces based on API response format
export interface EarningTransaction {
  id: string;
  date: string;
  type: 'credit_commission' | 'referral_commission' | 'bonus' | 'adjustment';
  amount: number;
  status: 'pending_payment' | 'on_hold' | 'paid' | 'rejected';
  moderatorId: string;
  moderatorName: string;
  approvedBy?: string;
  approvedAt?: string;
  paymentMethod?: 'mpesa' | 'bank' | 'paypal';
  description: string;
  submittedAt?: string;
  holdReason?: string;
  heldBy?: string;
  heldAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
  transactionReference?: string;
  creditsPurchased?: number; // For credit commission tracking
  referralEarnings?: number; // For referral commission tracking
  minimumThreshold?: number; // For payment threshold logic
}

export interface EarningsStats {
  totalEarnings: number;
  monthlyEarnings: number;
  creditCommission: number; // 30% of credit purchases
  referralCommission: number; // 5% of referral earnings
  pendingPayouts: number; // Earnings >= 1000
  onHoldAmount: number; // Earnings < 1000
  lastPayout: string | null;
  nextPayout: string | null;
  totalTransactions: number;
  averageMonthlyEarnings: number;
  assignedUsersCount: number; // Number of users assigned to moderator
  thisMonthCreditSales: number; // Total credit purchases by assigned users
  thisMonthReferrals: number; // Number of new referrals this month
}

export interface EarningsFilters {
  status?: string[];
  type?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  moderatorId?: string;
  page: number;
  limit: number;
  sortBy: 'date' | 'amount' | 'status' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface PaymentInfo {
  method: 'bank' | 'mpesa' | 'paypal';
  details: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    swiftCode?: string;
    phone?: string;
    email?: string;
    paypalEmail?: string;
  };
  isVerified: boolean;
  verifiedAt?: string;
}

export const useModeratorEarnings = () => {
  const [earnings, setEarnings] = useState<EarningTransaction[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [filters, setFilters] = useState<EarningsFilters>({
    page: 1,
    limit: 10,
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  // TODO: Backend Integration - Replace with API call
  // Expected API endpoint: GET /api/admin/earnings/stats
  // Headers: { 'Authorization': `Bearer ${token}` }
  const fetchEarningsStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/earnings/stats', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      
      const mockStats: EarningsStats = {
        totalEarnings: 125050,
        monthlyEarnings: 32575,
        creditCommission: 24650, // 30% of credit purchases
        referralCommission: 7925, // 5% of referral earnings
        pendingPayouts: 18000, // Earnings >= 1000
        onHoldAmount: 750, // Earnings < 1000 waiting to accumulate
        lastPayout: '2024-07-15',
        nextPayout: '2024-08-01',
        totalTransactions: 156,
        averageMonthlyEarnings: 28500,
        assignedUsersCount: 45,
        thisMonthCreditSales: 82150, // Total credits purchased by assigned users
        thisMonthReferrals: 8 // New referrals this month
      };
      
      setStats(mockStats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch earnings statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // TODO: Backend Integration - Replace with API call
  // Expected API endpoint: GET /api/admin/earnings
  // Query params: page, limit, status[], type[], dateFrom, dateTo, search, sortBy, sortOrder
  // Headers: { 'Authorization': `Bearer ${token}` }
  const fetchEarnings = useCallback(async (newFilters?: Partial<EarningsFilters>) => {
    try {
      setLoading(true);
      const currentFilters = { ...filters, ...newFilters };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // TODO: Replace with actual API call
      // const queryParams = new URLSearchParams({
      //   page: currentFilters.page.toString(),
      //   limit: currentFilters.limit.toString(),
      //   sortBy: currentFilters.sortBy,
      //   sortOrder: currentFilters.sortOrder,
      //   ...(currentFilters.search && { search: currentFilters.search }),
      //   ...(currentFilters.dateFrom && { dateFrom: currentFilters.dateFrom }),
      //   ...(currentFilters.dateTo && { dateTo: currentFilters.dateTo })
      // });
      // 
      // if (currentFilters.status?.length) {
      //   currentFilters.status.forEach(status => queryParams.append('status', status));
      // }
      // if (currentFilters.type?.length) {
      //   currentFilters.type.forEach(type => queryParams.append('type', type));
      // }
      // 
      // const response = await fetch(`/api/admin/earnings?${queryParams}`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();

      // Mock data - replace with API response
      const mockEarnings: EarningTransaction[] = [
        {
          id: '1',
          date: '2024-07-28',
          type: 'credit_commission',
          amount: 15420, // 30% of KSh 51,400 in credit purchases
          status: 'pending_payment',
          moderatorId: 'admin-2',
          moderatorName: 'Sarah Johnson',
          paymentMethod: 'mpesa',
          description: 'Commission from assigned users credit purchases (30%)',
          submittedAt: '2024-07-28T09:00:00Z',
          creditsPurchased: 51400,
          minimumThreshold: 1000
        },
        {
          id: '2',
          date: '2024-07-27',
          type: 'referral_commission',
          amount: 1275, // 5% of KSh 25,500 in referral earnings
          status: 'pending_payment',
          moderatorId: 'admin-3',
          moderatorName: 'Mike Chen',
          paymentMethod: 'bank',
          description: 'Commission from referral earnings (5%)',
          submittedAt: '2024-07-27T09:00:00Z',
          referralEarnings: 25500,
          minimumThreshold: 1000
        },
        {
          id: '3',
          date: '2024-07-26',
          type: 'credit_commission',
          amount: 780, // Below 1000 threshold
          status: 'on_hold',
          moderatorId: 'admin-4',
          moderatorName: 'Jane Smith',
          paymentMethod: 'paypal',
          description: 'Commission below minimum threshold - accumulating',
          submittedAt: '2024-07-26T09:00:00Z',
          creditsPurchased: 2600,
          holdReason: 'Amount below KSh 1,000 threshold',
          minimumThreshold: 1000
        },
        {
          id: '4',
          date: '2024-07-25',
          type: 'credit_commission',
          amount: 4200,
          status: 'paid',
          moderatorId: 'admin-2',
          moderatorName: 'Sarah Johnson',
          approvedBy: 'Super Admin',
          approvedAt: '2024-07-25T14:00:00Z',
          paymentMethod: 'mpesa',
          description: 'Commission payment processed',
          paidAt: '2024-07-25T16:30:00Z',
          transactionReference: 'MPX987654321',
          creditsPurchased: 14000
        }
      ];

      setEarnings(mockEarnings);
      setTotalPages(Math.ceil(156 / currentFilters.limit));
      setTotalCount(156);
      setFilters(currentFilters);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch earnings data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // TODO: Backend Integration - Replace with API call
  // Expected API endpoint: GET /api/admin/payment-info
  // Headers: { 'Authorization': `Bearer ${token}` }
  const fetchPaymentInfo = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/payment-info', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      
      const mockPaymentInfo: PaymentInfo = {
        method: 'bank',
        details: {
          bankName: 'KCB Bank',
          accountNumber: '****1234',
          accountName: 'John Moderator',
          phone: '+254700000000',
          email: 'user@example.com'
        },
        isVerified: true,
        verifiedAt: '2024-06-15T10:00:00Z'
      };
      
      setPaymentInfo(mockPaymentInfo);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch payment information",
        variant: "destructive"
      });
    }
  }, [toast]);

  // TODO: Backend Integration - Replace with API call
  // Expected API endpoint: PUT /api/admin/earnings/:id/approve
  // Headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  // Body: { adminComment?: string }
  const approvePayment = useCallback(async (earningId: string, adminComment?: string) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/earnings/${earningId}/approve`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ adminComment })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to approve payment');
      // }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEarnings(prev => prev.map(earning => 
        earning.id === earningId 
          ? { 
              ...earning, 
              status: 'paid' as const, 
              approvedAt: new Date().toISOString(),
              approvedBy: 'Current Admin', // TODO: Get from auth context
              paidAt: new Date().toISOString(),
              transactionReference: `PAY${Date.now()}`
            } 
          : earning
      ));
      
      toast({
        title: "Payment Processed",
        description: "The payment has been successfully processed and marked as paid."
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // TODO: Backend Integration - Replace with API call
  // Expected API endpoint: PUT /api/admin/earnings/:id/hold
  // Headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  // Body: { reason: string, adminComment?: string }
  const holdPayment = useCallback(async (earningId: string, reason: string, adminComment?: string) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/earnings/${earningId}/hold`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ reason, adminComment })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEarnings(prev => prev.map(earning => 
        earning.id === earningId 
          ? { 
              ...earning, 
              status: 'on_hold', 
              holdReason: reason,
              heldAt: new Date().toISOString(),
              heldBy: 'Current Admin' // TODO: Get from auth context
            } 
          : earning
      ));
      
      toast({
        title: "Payment Held",
        description: "The payment has been put on hold with the specified reason."
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to hold payment. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // TODO: Backend Integration - Replace with API call
  // Expected API endpoint: PUT /api/admin/earnings/:id/reject
  // Headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  // Body: { reason: string, adminComment?: string }
  const rejectPayment = useCallback(async (earningId: string, reason: string, adminComment?: string) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEarnings(prev => prev.map(earning => 
        earning.id === earningId 
          ? { 
              ...earning, 
              status: 'rejected', 
              rejectionReason: reason,
              rejectedAt: new Date().toISOString(),
              rejectedBy: 'Current Admin'
            } 
          : earning
      ));
      
      toast({
        title: "Payment Rejected",
        description: "The payment has been rejected with the specified reason."
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject payment. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // TODO: Backend Integration - Replace with API call
  // Expected API endpoint: PUT /api/admin/payment-info
  // Headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  // Body: PaymentInfo object
  const updatePaymentInfo = useCallback(async (newPaymentInfo: PaymentInfo) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/payment-info', {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(newPaymentInfo)
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentInfo(newPaymentInfo);
      
      toast({
        title: "Payment Info Updated",
        description: "Your payment information has been successfully updated."
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment information. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // TODO: Backend Integration - Replace with API call
  // Expected API endpoint: POST /api/admin/earnings/export
  // Headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  // Body: { filters: EarningsFilters, format: 'csv' | 'excel' | 'pdf' }
  // Response: File download or pre-signed URL
  const exportEarnings = useCallback(async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/earnings/export', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ filters, format })
      // });
      // 
      // if (response.headers.get('content-type')?.includes('application/json')) {
      //   const data = await response.json();
      //   // If API returns pre-signed URL
      //   window.open(data.downloadUrl, '_blank');
      // } else {
      //   // If API returns file directly
      //   const blob = await response.blob();
      //   const url = window.URL.createObjectURL(blob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = `earnings_export_${new Date().toISOString().split('T')[0]}.${format}`;
      //   document.body.appendChild(a);
      //   a.click();
      //   window.URL.revokeObjectURL(url);
      //   document.body.removeChild(a);
      // }
      
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Export Successful",
        description: `Earnings data has been exported to ${format.toUpperCase()} format.`
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export earnings data. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Bulk operations
  // TODO: Backend Integration - Replace with API call
  // Expected API endpoint: POST /api/admin/earnings/bulk-approve
  // Headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  // Body: { earningIds: string[], adminComment?: string }
  const bulkApprovePayments = useCallback(async (earningIds: string[], adminComment?: string) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEarnings(prev => prev.map(earning => 
        earningIds.includes(earning.id)
          ? { 
              ...earning, 
              status: 'paid' as const, 
              approvedAt: new Date().toISOString(),
              approvedBy: 'Current Admin',
              paidAt: new Date().toISOString(),
              transactionReference: `PAY${Date.now()}`
            } 
          : earning
      ));
      
      toast({
        title: "Bulk Approval Successful",
        description: `${earningIds.length} payments have been approved.`
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Bulk Approval Failed",
        description: "Failed to approve selected payments. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initialize data on mount
  useEffect(() => {
    fetchEarningsStats();
    fetchEarnings();
    fetchPaymentInfo();
  }, []);

  return {
    // Data
    earnings,
    stats,
    paymentInfo,
    filters,
    loading,
    totalPages,
    totalCount,
    
    // Actions
    fetchEarnings,
    approvePayment,
    holdPayment,
    rejectPayment,
    updatePaymentInfo,
    exportEarnings,
    bulkApprovePayments,
    setFilters,
    
    // Utilities
    refreshData: () => {
      fetchEarningsStats();
      fetchEarnings();
      fetchPaymentInfo();
    }
  };
};