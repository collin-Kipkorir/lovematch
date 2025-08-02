import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Plus, Minus, DollarSign, Clock, User, Smartphone, Wallet } from 'lucide-react';
import { dummyCreditTransactions } from '@/data/adminData';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Simulated payment logs
const initialPaymentLogs = [
  {
    id: 'pay-1',
    userId: '1',
    userEmail: 'john@example.com',
    amount: 799,
    credits: 10,
    method: 'mpesa',
    status: 'completed',
    transactionId: 'MP001234567',
    timestamp: '2024-07-30T10:30:00Z',
    description: 'M-Pesa credit purchase'
  },
  {
    id: 'pay-2',
    userId: '2',
    userEmail: 'sarah@example.com',
    amount: 1599,
    credits: 25,
    method: 'paypal',
    status: 'completed',
    transactionId: 'PP789123456',
    timestamp: '2024-07-30T09:15:00Z',
    description: 'PayPal credit purchase'
  },
  {
    id: 'pay-3',
    userId: '3',
    userEmail: 'mike@example.com',
    amount: 500,
    credits: 5,
    method: 'manual',
    status: 'pending',
    transactionId: 'MAN001',
    timestamp: '2024-07-30T08:45:00Z',
    description: 'Manual credit addition by admin'
  }
];

const CreditManager: React.FC = () => {
  const { currentAdmin, isSuperAdmin } = useAdminAuth();
  const [transactions, setTransactions] = useState(dummyCreditTransactions);
  const [paymentLogs, setPaymentLogs] = useState(initialPaymentLogs);
  const [selectedUser, setSelectedUser] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [description, setDescription] = useState('');

  const handleManualAdjustment = () => {
    if (!selectedUser || !creditAmount || !description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const newTransaction = {
      id: `tx-${Date.now()}`,
      userId: selectedUser,
      amount: adjustmentType === 'add' ? parseInt(creditAmount) : -parseInt(creditAmount),
      type: (adjustmentType === 'add' ? 'admin_add' : 'admin_remove') as 'admin_add' | 'admin_remove',
      adminId: 'current-admin',
      description: description,
      timestamp: new Date().toISOString()
    };

    setTransactions(prev => [newTransaction, ...prev]);

    toast({
      title: "Credits Adjusted",
      description: `${adjustmentType === 'add' ? 'Added' : 'Subtracted'} ${creditAmount} credits`,
    });

    // Reset form
    setSelectedUser('');
    setCreditAmount('');
    setDescription('');
  };

  const handlePaymentApproval = (paymentId: string) => {
    setPaymentLogs(prev => prev.map(payment => {
      if (payment.id === paymentId) {
        return { ...payment, status: 'completed' };
      }
      return payment;
    }));

    toast({
      title: "Payment Approved",
      description: "Manual payment has been approved and credits added",
    });
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa': return <Smartphone className="h-4 w-4" />;
      case 'paypal': return <Wallet className="h-4 w-4" />;
      case 'manual': return <User className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-green-100 text-green-800';
      case 'admin_add': return 'bg-blue-100 text-blue-800';
      case 'deduction': return 'bg-red-100 text-red-800';
      case 'admin_remove': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalCreditsInCirculation = transactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const todaysRevenue = paymentLogs
    .filter(log => {
      const today = new Date().toDateString();
      return new Date(log.timestamp).toDateString() === today && log.status === 'completed';
    })
    .reduce((sum, log) => sum + log.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Credit Manager</h2>
          <p className="text-muted-foreground">
            Manage user credits, view transactions, and payment logs
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Manual Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Credit Adjustment</DialogTitle>
              <DialogDescription>
                Add or subtract credits for a specific user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">John Smith (john@example.com)</SelectItem>
                    <SelectItem value="2">Sarah Wilson (sarah@example.com)</SelectItem>
                    <SelectItem value="3">Mike Johnson (mike@example.com)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="type">Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={(value: 'add' | 'subtract') => setAdjustmentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Credits</SelectItem>
                    <SelectItem value="subtract">Subtract Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount">Credit Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reason for adjustment"
                />
              </div>
              
              <Button onClick={handleManualAdjustment} className="w-full">
                {adjustmentType === 'add' ? 'Add Credits' : 'Subtract Credits'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className={`grid gap-4 ${isSuperAdmin() ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreditsInCirculation.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Credits in circulation</p>
          </CardContent>
        </Card>
        
        {isSuperAdmin() && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSh {(todaysRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From credit purchases</p>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentLogs.filter(log => log.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Credit Transactions</TabsTrigger>
          <TabsTrigger value="payments">Payment Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>All credit-related transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.amount > 0 ? (
                          <Plus className="h-5 w-5 text-green-600" />
                        ) : (
                          <Minus className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          User ID: {transaction.userId}
                        </p>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(transaction.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge className={getTransactionTypeColor(transaction.type)}>
                        {transaction.type.replace('_', ' ')}
                      </Badge>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">credits</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Logs</CardTitle>
              <CardDescription>M-Pesa, PayPal, and manual payment records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentLogs.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getPaymentMethodIcon(payment.method)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {payment.userEmail}
                        </p>
                        <p className="text-sm text-muted-foreground">{payment.description}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {payment.transactionId} • {formatDateTime(payment.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">KSh {(payment.amount / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{payment.credits} credits</p>
                      </div>
                      
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      
                      <Badge variant="outline" className="capitalize">
                        {payment.method}
                      </Badge>
                      
                      {payment.status === 'pending' && payment.method === 'manual' && (
                        <Button
                          size="sm"
                          onClick={() => handlePaymentApproval(payment.id)}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreditManager;