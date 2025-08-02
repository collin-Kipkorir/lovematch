import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import PaymentProcessingModal from './PaymentProcessingModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  Pause, 
  Play, 
  Check, 
  X, 
  Download, 
  Search,
  Filter,
  TrendingUp,
  Users,
  AlertTriangle,
  CreditCard,
  History,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

// Updated earnings data based on new payment system
const earningsOverview = {
  totalPendingPayments: 125450, // Earnings >= 1000 ready for manual processing
  totalOnHold: 3250, // Earnings < 1000 accumulating
  totalPaidThisMonth: 89325,
  moderatorsCount: 24,
  pendingCount: 8, // Moderators with earnings >= 1000
  onHoldCount: 6, // Moderators with earnings < 1000
  avgEarningsPerModerator: 15240
};

const moderatorEarnings = [
  {
    id: '1',
    moderatorName: 'Alice Johnson',
    moderatorId: 'MOD001',
    creditCommission: 15420, // 30% of KSh 51,400 credit purchases
    referralCommission: 1275, // 5% of KSh 25,500 referral earnings
    totalCurrentEarnings: 16695,
    status: 'pending_payment', // >= 1000, ready for manual payment
    paymentMethod: 'mpesa',
    paymentDetails: '+254712345678',
    lastPayment: 18525,
    lastPaymentDate: '2024-07-15',
    totalPaidToDate: 98750,
    assignedUsers: 23,
    referralsMade: 5,
    joinDate: '2024-03-15'
  },
  {
    id: '2',
    moderatorName: 'Bob Smith',
    moderatorId: 'MOD002',
    creditCommission: 24650, // 30% of KSh 82,170 credit purchases
    referralCommission: 3250, // 5% of KSh 65,000 referral earnings
    totalCurrentEarnings: 27900,
    status: 'pending_payment',
    paymentMethod: 'bank',
    paymentDetails: 'KCB Bank - *****1234',
    lastPayment: 29000,
    lastPaymentDate: '2024-07-15',
    totalPaidToDate: 156750,
    assignedUsers: 34,
    referralsMade: 12,
    joinDate: '2024-02-10'
  },
  {
    id: '3',
    moderatorName: 'Carol Davis',
    moderatorId: 'MOD003',
    creditCommission: 780, // 30% of KSh 2,600 credit purchases
    referralCommission: 125, // 5% of KSh 2,500 referral earnings
    totalCurrentEarnings: 905,
    status: 'on_hold', // < 1000, accumulating
    paymentMethod: 'paypal',
    paymentDetails: 'carol@example.com',
    lastPayment: 12050,
    lastPaymentDate: '2024-06-30',
    totalPaidToDate: 45750,
    assignedUsers: 8,
    referralsMade: 2,
    joinDate: '2024-04-20'
  },
  {
    id: '4',
    moderatorName: 'David Wilson',
    moderatorId: 'MOD004',
    creditCommission: 18720, // 30% of KSh 62,400 credit purchases
    referralCommission: 4250, // 5% of KSh 85,000 referral earnings
    totalCurrentEarnings: 22970,
    status: 'paid',
    paymentMethod: 'mpesa',
    paymentDetails: '+254722345678',
    lastPayment: 22970,
    lastPaymentDate: '2024-07-31',
    totalPaidToDate: 298750,
    assignedUsers: 45,
    referralsMade: 18,
    joinDate: '2024-01-05'
  },
  {
    id: '5',
    moderatorName: 'Eva Martinez',
    moderatorId: 'MOD005',
    creditCommission: 6240, // 30% of KSh 20,800 credit purchases
    referralCommission: 875, // 5% of KSh 17,500 referral earnings
    totalCurrentEarnings: 7115,
    status: 'pending_payment',
    paymentMethod: 'bank',
    paymentDetails: 'Equity Bank - *****5678',
    lastPayment: 8500,
    lastPaymentDate: '2024-07-15',
    totalPaidToDate: 67250,
    assignedUsers: 18,
    referralsMade: 4,
    joinDate: '2024-05-12'
  },
  {
    id: '6',
    moderatorName: 'Frank Thompson',
    moderatorId: 'MOD006',
    creditCommission: 450, // 30% of KSh 1,500 credit purchases
    referralCommission: 225, // 5% of KSh 4,500 referral earnings
    totalCurrentEarnings: 675,
    status: 'on_hold', // < 1000, accumulating
    paymentMethod: 'mpesa',
    paymentDetails: '+254733456789',
    lastPayment: 0,
    lastPaymentDate: null,
    totalPaidToDate: 0,
    assignedUsers: 5,
    referralsMade: 1,
    joinDate: '2024-07-01'
  }
];

// Remove automatic payment schedule since all payments are manual
const recentPayments = [
  {
    id: '1',
    date: '2024-07-31',
    moderatorName: 'David Wilson',
    amount: 22970,
    method: 'mpesa',
    reference: 'MPX789123456',
    status: 'completed',
    processedBy: 'Super Admin'
  },
  {
    id: '2',
    date: '2024-07-30',
    moderatorName: 'Sarah Connor',
    amount: 15240,
    method: 'bank',
    reference: 'BNK456789123',
    status: 'completed',
    processedBy: 'Super Admin'
  },
  {
    id: '3',
    date: '2024-07-29',
    moderatorName: 'Mike Ross',
    amount: 8750,
    method: 'paypal',
    reference: 'PP123456789',
    status: 'completed',
    processedBy: 'Super Admin'
  }
];

const SuperAdminEarnings: React.FC = () => {
  const [selectedModerators, setSelectedModerators] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedModeratorForPayment, setSelectedModeratorForPayment] = useState<any>(null);
  const [selectedModeratorForHistory, setSelectedModeratorForHistory] = useState<any>(null);

  const filteredModerators = moderatorEarnings.filter(moderator => {
    const matchesSearch = moderator.moderatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         moderator.moderatorId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || moderator.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectModerator = (moderatorId: string) => {
    setSelectedModerators(prev => 
      prev.includes(moderatorId) 
        ? prev.filter(id => id !== moderatorId)
        : [...prev, moderatorId]
    );
  };

  const handleSelectAll = () => {
    setSelectedModerators(
      selectedModerators.length === filteredModerators.length 
        ? [] 
        : filteredModerators.map(m => m.id)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Pending Payment';
      case 'paid': return 'Paid';
      case 'on_hold': return 'On Hold (< KSh 1,000)';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const handleProcessIndividualPayment = (moderator: any) => {
    setSelectedModeratorForPayment(moderator);
    setPaymentModalOpen(true);
  };

  const handleViewPaymentHistory = (moderator: any) => {
    setSelectedModeratorForHistory(moderator);
    setHistoryModalOpen(true);
  };

  const handlePaymentProcessed = (paymentData: any) => {
    // Update moderator status and balance
    toast.success('Payment processed successfully');
    // In a real app, this would update the backend
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-1">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Moderator Payment Management</h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          Manage manual payments to moderators based on commission earnings
        </p>
        <div className="mt-2 text-xs text-muted-foreground space-y-1">
          <p>• 30% commission on credits purchased by assigned users</p>
          <p>• 5% commission on monthly earnings from referrals</p>
          <p>• Earnings ≥ KSh 1,000 are ready for manual payment processing</p>
          <p>• Earnings &lt; KSh 1,000 are held until they accumulate to threshold</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Ready for Payment</CardTitle>
            <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-green-600">KSh {earningsOverview.totalPendingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{earningsOverview.pendingCount} moderators (≥ KSh 1,000)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">On Hold</CardTitle>
            <Pause className="h-3 w-3 lg:h-4 lg:w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-orange-600">KSh {earningsOverview.totalOnHold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{earningsOverview.onHoldCount} moderators (&lt; KSh 1,000)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Paid This Month</CardTitle>
            <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-blue-600">KSh {earningsOverview.totalPaidThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Manual payments processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Active Moderators</CardTitle>
            <Users className="h-3 w-3 lg:h-4 lg:w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-purple-600">{earningsOverview.moderatorsCount}</div>
            <p className="text-xs text-muted-foreground">Avg: KSh {earningsOverview.avgEarningsPerModerator.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="moderators" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="moderators">Payment Processing</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="moderators" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-2 lg:space-y-0">
                <div>
                  <CardTitle>Moderator Payment Processing</CardTitle>
                  <CardDescription>Process manual payments based on commission earnings</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button size="sm" disabled={selectedModerators.length === 0} className="bg-green-600 hover:bg-green-700">
                    Process Payment ({selectedModerators.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search moderators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_payment">Ready for Payment</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-lg space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedModerators.length === filteredModerators.length && filteredModerators.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedModerators.length > 0 ? `${selectedModerators.length} selected` : 'Select all'}
                  </span>
                </div>
                {selectedModerators.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                      <Check className="mr-2 h-4 w-4" />
                      Process Payment
                    </Button>
                    <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                      <Pause className="mr-2 h-4 w-4" />
                      Put on Hold
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              {/* Moderators List */}
              <div className="space-y-3">
                {filteredModerators.map((moderator) => (
                  <div key={moderator.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedModerators.includes(moderator.id)}
                        onCheckedChange={() => handleSelectModerator(moderator.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-2 lg:space-y-0">
                          <div>
                            <h4 className="font-semibold text-foreground">{moderator.moderatorName}</h4>
                            <p className="text-sm text-muted-foreground">{moderator.moderatorId}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={getStatusColor(moderator.status)}>
                              {getStatusLabel(moderator.status)}
                            </Badge>
                            {moderator.totalCurrentEarnings >= 1000 && moderator.status === 'pending_payment' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                ≥ KSh 1,000
                              </Badge>
                            )}
                            {moderator.totalCurrentEarnings < 1000 && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                &lt; KSh 1,000
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground">Total Current Earnings</p>
                            <p className="font-semibold text-foreground">KSh {moderator.totalCurrentEarnings.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Credit: KSh {moderator.creditCommission.toLocaleString()} | Referral: KSh {moderator.referralCommission.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Payment Method</p>
                            <p className="font-semibold text-foreground capitalize">{moderator.paymentMethod}</p>
                            <p className="text-xs text-muted-foreground">{moderator.paymentDetails}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Last Payment</p>
                            <p className="font-semibold text-foreground">
                              {moderator.lastPayment ? `KSh ${moderator.lastPayment.toLocaleString()}` : 'None'}
                            </p>
                            <p className="text-xs text-muted-foreground">{moderator.lastPaymentDate || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Performance</p>
                            <p className="font-semibold text-foreground">{moderator.assignedUsers} users | {moderator.referralsMade} referrals</p>
                            <p className="text-xs text-muted-foreground">Total paid: KSh {moderator.totalPaidToDate.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {moderator.status === 'pending_payment' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleProcessIndividualPayment(moderator)}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Process Payment
                            </Button>
                          )}
                          {moderator.status === 'on_hold' && (
                            <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                              <Play className="mr-2 h-4 w-4" />
                              Release Hold
                            </Button>
                          )}
                          {moderator.status !== 'paid' && (
                            <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                              <Pause className="mr-2 h-4 w-4" />
                              Put on Hold
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewPaymentHistory(moderator)}
                          >
                            <History className="mr-2 h-4 w-4" />
                            Payment History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-2 lg:space-y-0">
                <div>
                  <CardTitle>Recent Payment History</CardTitle>
                  <CardDescription>Manual payments processed to moderators</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export History
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border border-border rounded-lg space-y-3 lg:space-y-0">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-foreground">{payment.moderatorName}</h4>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.date} • {payment.method.toUpperCase()} • Ref: {payment.reference}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Processed by: {payment.processedBy}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        KSh {payment.amount.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {payment.method} payment
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedModeratorForPayment(null);
        }}
        moderator={selectedModeratorForPayment}
        onPaymentProcessed={handlePaymentProcessed}
      />

      {/* Payment History Modal */}
      <PaymentHistoryModal
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setSelectedModeratorForHistory(null);
        }}
        moderatorId={selectedModeratorForHistory?.moderatorId}
        moderatorName={selectedModeratorForHistory?.moderatorName}
      />
    </div>
  );
};

export default SuperAdminEarnings;