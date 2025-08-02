import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Package,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// TODO: Backend Integration - Replace with actual API types
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
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

// TODO: Backend Integration - Replace with actual API data
const mockContactRequests: ContactRequest[] = [
  {
    id: 'req_001',
    userId: 'user_123',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    phoneNumber: '0712345678',
    packageType: 'Message Credits',
    amount: 250,
    message: 'M-Pesa payment failed. Please help me complete the payment manually.',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'pending'
  },
  {
    id: 'req_002',
    userId: 'user_456',
    userName: 'Jane Smith',
    userEmail: 'jane@example.com',
    phoneNumber: '0798765432',
    packageType: 'Premium Bundle',
    amount: 2000,
    message: 'I want to pay via bank transfer instead of M-Pesa. Can you help?',
    timestamp: '2024-01-15T09:15:00Z',
    status: 'contacted',
    adminNotes: 'Contacted via WhatsApp. Waiting for bank transfer confirmation.'
  },
  {
    id: 'req_003',
    userId: 'user_789',
    userName: 'Mike Johnson',
    userEmail: 'mike@example.com',
    phoneNumber: '0723456789',
    packageType: 'Video Credits',
    amount: 500,
    message: 'Payment went through but credits not added to account.',
    timestamp: '2024-01-14T16:45:00Z',
    status: 'resolved',
    adminNotes: 'Credits manually added. Payment confirmed via M-Pesa statement.',
    resolvedBy: 'admin_001',
    resolvedAt: '2024-01-14T17:00:00Z'
  }
];

const PaymentRequests: React.FC = () => {
  const [requests, setRequests] = useState<ContactRequest[]>(mockContactRequests);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [creditsToAdd, setCreditsToAdd] = useState<number>(0);
  const [videoCreditsToAdd, setVideoCreditsToAdd] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // TODO: Backend Integration - Replace with actual API call
  const updateRequestStatus = async (requestId: string, status: ContactRequest['status'], notes?: string) => {
    /*
    try {
      await fetch(`/api/admin/contact-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status,
          adminNotes: notes,
          resolvedBy: currentAdminId,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : undefined
        })
      });
    } catch (error) {
      console.error('Failed to update request status:', error);
      throw error;
    }
    */

    // Simulate API call
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId
          ? {
              ...req,
              status,
              adminNotes: notes,
              resolvedBy: status === 'resolved' ? 'current_admin' : req.resolvedBy,
              resolvedAt: status === 'resolved' ? new Date().toISOString() : req.resolvedAt
            }
          : req
      )
    );
  };

  // TODO: Backend Integration - Replace with actual credit addition API
  const addCreditsToUser = async (userId: string, messageCredits: number, videoCredits: number) => {
    /*
    try {
      await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          messageCredits,
          videoCredits,
          reason: 'Manual payment processing',
          adminId: currentAdminId
        })
      });
      
      // Log the transaction for audit purposes
      await logCreditTransaction({
        userId,
        messageCredits,
        videoCredits,
        type: 'manual_addition',
        adminId: currentAdminId,
        reference: selectedRequest?.id
      });
      
    } catch (error) {
      console.error('Failed to add credits:', error);
      throw error;
    }
    */

    // Simulate credit addition
    console.log('Adding credits to user:', {
      userId,
      messageCredits,
      videoCredits,
      timestamp: new Date().toISOString()
    });
  };

  const handleMarkAsContacted = async (request: ContactRequest) => {
    try {
      await updateRequestStatus(request.id, 'contacted', adminNotes);
      toast({
        title: "Status Updated",
        description: "Request marked as contacted"
      });
      setIsDialogOpen(false);
      setAdminNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const handleResolveRequest = async (request: ContactRequest) => {
    if (creditsToAdd <= 0 && videoCreditsToAdd <= 0) {
      toast({
        title: "Error",
        description: "Please specify credits to add",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add credits to user account
      await addCreditsToUser(request.userId, creditsToAdd, videoCreditsToAdd);
      
      // Update request status
      const notes = `${adminNotes}\n\nCredits added: ${creditsToAdd} message credits, ${videoCreditsToAdd} video credits`;
      await updateRequestStatus(request.id, 'resolved', notes);
      
      toast({
        title: "Request Resolved",
        description: `Added ${creditsToAdd} message credits and ${videoCreditsToAdd} video credits to ${request.userName}'s account`
      });
      
      setIsDialogOpen(false);
      setAdminNotes('');
      setCreditsToAdd(0);
      setVideoCreditsToAdd(0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve request",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: ContactRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'contacted':
        return <Badge variant="secondary"><MessageCircle className="h-3 w-3 mr-1" />Contacted</Badge>;
      case 'resolved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const contactedRequests = requests.filter(req => req.status === 'contacted');
  const resolvedRequests = requests.filter(req => req.status === 'resolved');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Requests</h2>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Badge variant="destructive">{pendingRequests.length}</Badge>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{contactedRequests.length}</Badge>
            <span>Contacted</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="default">{resolvedRequests.length}</Badge>
            <span>Resolved</span>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-red-600">🚨 Pending Requests</h3>
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No pending requests</p>
            </CardContent>
          </Card>
        ) : (
          pendingRequests.map((request) => (
            <Card key={request.id} className="border-red-200 bg-red-50/50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{request.userName}</span>
                      {getStatusBadge(request.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{formatTimestamp(request.timestamp)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{request.phoneNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span className="text-sm">{request.packageType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Ksh {request.amount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-lg mb-4">
                  <p className="text-sm"><strong>User Message:</strong></p>
                  <p className="text-sm mt-1">{request.message}</p>
                </div>

                <Dialog open={isDialogOpen && selectedRequest?.id === request.id} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDialogOpen(true);
                      }}
                      className="w-full"
                    >
                      Handle Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Handle Payment Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Request Details:</h4>
                        <div className="text-sm space-y-1 bg-muted p-3 rounded">
                          <p><strong>User:</strong> {request.userName}</p>
                          <p><strong>Phone:</strong> {request.phoneNumber}</p>
                          <p><strong>Package:</strong> {request.packageType}</p>
                          <p><strong>Amount:</strong> Ksh {request.amount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-notes">Admin Notes</Label>
                        <Textarea
                          id="admin-notes"
                          placeholder="Add notes about how you contacted the user or payment details..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="message-credits">Message Credits</Label>
                          <Input
                            id="message-credits"
                            type="number"
                            value={creditsToAdd}
                            onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="video-credits">Video Credits</Label>
                          <Input
                            id="video-credits"
                            type="number"
                            value={videoCreditsToAdd}
                            onChange={(e) => setVideoCreditsToAdd(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleMarkAsContacted(request)}
                          variant="outline"
                          className="flex-1"
                        >
                          Mark as Contacted
                        </Button>
                        <Button
                          onClick={() => handleResolveRequest(request)}
                          className="flex-1"
                        >
                          Resolve & Add Credits
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Contacted Requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-yellow-600">⏳ Contacted Requests</h3>
        {contactedRequests.map((request) => (
          <Card key={request.id} className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{request.userName}</span>
                    {getStatusBadge(request.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{formatTimestamp(request.timestamp)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{request.phoneNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">{request.packageType}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Ksh {request.amount.toLocaleString()}</span>
                </div>
              </div>

              {request.adminNotes && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm"><strong>Admin Notes:</strong></p>
                  <p className="text-sm mt-1">{request.adminNotes}</p>
                </div>
              )}

              <Button
                onClick={() => {
                  setSelectedRequest(request);
                  setIsDialogOpen(true);
                }}
                variant="outline"
                className="w-full"
              >
                Resolve Request
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resolved Requests (Last 10) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-600">✅ Recently Resolved</h3>
        {resolvedRequests.slice(-10).map((request) => (
          <Card key={request.id} className="border-green-200 bg-green-50/50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{request.userName}</span>
                    {getStatusBadge(request.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Resolved: {request.resolvedAt ? formatTimestamp(request.resolvedAt) : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{request.phoneNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">{request.packageType}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Ksh {request.amount.toLocaleString()}</span>
                </div>
              </div>

              {request.adminNotes && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm"><strong>Resolution Notes:</strong></p>
                  <p className="text-sm mt-1">{request.adminNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PaymentRequests;