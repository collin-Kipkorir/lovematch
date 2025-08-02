import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  date: string;
  moderatorName: string;
  moderatorId: string;
  amount: number;
  paymentCycle: 'half' | 'full' | 'custom';
  paymentMethod: string;
  paymentReference: string;
  paymentNotes?: string;
  status: 'completed' | 'partial_payment' | 'failed';
  remainingBalance: number;
  processedBy: string;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  moderatorId?: string;
  moderatorName?: string;
}

// Mock payment history data
const paymentHistory: PaymentRecord[] = [
  {
    id: '1',
    date: '2024-08-01',
    moderatorName: 'Alice Johnson',
    moderatorId: 'MOD001',
    amount: 16695,
    paymentCycle: 'full',
    paymentMethod: 'mpesa',
    paymentReference: 'MPX789123456',
    paymentNotes: 'Full monthly payment processed',
    status: 'completed',
    remainingBalance: 0,
    processedBy: 'Super Admin'
  },
  {
    id: '2',
    date: '2024-07-31',
    moderatorName: 'Bob Smith',
    moderatorId: 'MOD002',
    amount: 15000,
    paymentCycle: 'half',
    paymentMethod: 'bank',
    paymentReference: 'BNK456789123',
    paymentNotes: 'Half month payment - remaining to be processed next cycle',
    status: 'partial_payment',
    remainingBalance: 12900,
    processedBy: 'Super Admin'
  },
  {
    id: '3',
    date: '2024-07-30',
    moderatorName: 'Eva Martinez',
    moderatorId: 'MOD005',
    amount: 7115,
    paymentCycle: 'full',
    paymentMethod: 'bank',
    paymentReference: 'BNK789456123',
    status: 'completed',
    remainingBalance: 0,
    processedBy: 'Super Admin'
  },
  {
    id: '4',
    date: '2024-07-29',
    moderatorName: 'David Wilson',
    moderatorId: 'MOD004',
    amount: 11485,
    paymentCycle: 'half',
    paymentMethod: 'mpesa',
    paymentReference: 'MPX456123789',
    paymentNotes: 'Half month payment as requested by moderator',
    status: 'partial_payment',
    remainingBalance: 11485,
    processedBy: 'Super Admin'
  },
  {
    id: '5',
    date: '2024-07-28',
    moderatorName: 'Carol Davis',
    moderatorId: 'MOD003',
    amount: 905,
    paymentCycle: 'custom',
    paymentMethod: 'paypal',
    paymentReference: 'PP123789456',
    paymentNotes: 'Emergency payment - below threshold',
    status: 'completed',
    remainingBalance: 0,
    processedBy: 'Super Admin'
  }
];

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  moderatorId,
  moderatorName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentCycleFilter, setPaymentCycleFilter] = useState('all');

  const filteredHistory = paymentHistory.filter(record => {
    const matchesSearch = record.moderatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.moderatorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.paymentReference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesCycle = paymentCycleFilter === 'all' || record.paymentCycle === paymentCycleFilter;
    const matchesModerator = !moderatorId || record.moderatorId === moderatorId;
    
    return matchesSearch && matchesStatus && matchesCycle && matchesModerator;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial_payment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'partial_payment': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getCycleColor = (cycle: string) => {
    switch (cycle) {
      case 'full': return 'bg-blue-100 text-blue-800';
      case 'half': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPaid = filteredHistory.reduce((sum, record) => sum + record.amount, 0);
  const totalRemaining = filteredHistory.reduce((sum, record) => sum + record.remainingBalance, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment History {moderatorName ? `- ${moderatorName}` : ''}
          </DialogTitle>
          <DialogDescription>
            View and manage payment records for moderator earnings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-bold text-green-600">KSh {totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Balance</p>
                    <p className="text-lg font-bold text-yellow-600">KSh {totalRemaining.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-lg font-bold text-blue-600">{filteredHistory.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by moderator, ID, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="partial_payment">Partial Payment</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentCycleFilter} onValueChange={setPaymentCycleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cycles</SelectItem>
                <SelectItem value="full">Full Month</SelectItem>
                <SelectItem value="half">Half Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Payment Records */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payment records found</p>
                </CardContent>
              </Card>
            ) : (
              filteredHistory.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{record.moderatorName}</h4>
                          <Badge variant="outline" className="text-xs">{record.moderatorId}</Badge>
                          <Badge className={getStatusColor(record.status)}>
                            {getStatusIcon(record.status)}
                            <span className="ml-1 capitalize">{record.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={getCycleColor(record.paymentCycle)}>
                            {record.paymentCycle === 'full' ? 'Full Month' : 
                             record.paymentCycle === 'half' ? 'Half Month' : 'Custom'}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {record.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              {record.paymentMethod.toUpperCase()}
                            </span>
                            <span>Ref: {record.paymentReference}</span>
                          </div>
                          {record.paymentNotes && (
                            <p className="text-xs italic">{record.paymentNotes}</p>
                          )}
                          <p className="text-xs">Processed by: {record.processedBy}</p>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-green-600">
                          KSh {record.amount.toLocaleString()}
                        </div>
                        {record.remainingBalance > 0 && (
                          <div className="text-sm text-yellow-600">
                            Remaining: KSh {record.remainingBalance.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHistoryModal;