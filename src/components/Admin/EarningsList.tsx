import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  Pause, 
  Eye, 
  X, 
  AlertTriangle, 
  Clock,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';
import { EarningTransaction } from '@/hooks/useModeratorEarnings';

interface EarningsListProps {
  earnings: EarningTransaction[];
  loading: boolean;
  onApprove: (id: string, comment?: string) => Promise<boolean>;
  onHold: (id: string, reason: string, comment?: string) => Promise<boolean>;
  onReject: (id: string, reason: string, comment?: string) => Promise<boolean>;
  onBulkApprove: (ids: string[], comment?: string) => Promise<boolean>;
  canManagePayments: boolean;
}

const EarningsList: React.FC<EarningsListProps> = ({
  earnings,
  loading,
  onApprove,
  onHold,
  onReject,
  onBulkApprove,
  canManagePayments
}) => {
  const [selectedEarning, setSelectedEarning] = useState<EarningTransaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'hold' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkComment, setBulkComment] = useState('');

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending_payment': return 'secondary';
      case 'on_hold': return 'destructive';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending_payment': return 'Pending Payment';
      case 'on_hold': return 'On Hold';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return Check;
      case 'pending_payment': return Clock;
      case 'on_hold': return Pause;
      case 'rejected': return X;
      default: return Clock;
    }
  };

  const openDetailsModal = (earning: EarningTransaction) => {
    setSelectedEarning(earning);
    setIsDetailsModalOpen(true);
  };

  const openActionModal = (earning: EarningTransaction, type: 'hold' | 'reject') => {
    setSelectedEarning(earning);
    setActionType(type);
    setActionReason('');
    setActionComment('');
    setIsActionModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedEarning || !actionType) return;

    let success = false;
    if (actionType === 'hold') {
      success = await onHold(selectedEarning.id, actionReason, actionComment);
    } else if (actionType === 'reject') {
      success = await onReject(selectedEarning.id, actionReason, actionComment);
    }

    if (success) {
      setIsActionModalOpen(false);
      setActionReason('');
      setActionComment('');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = earnings
        .filter(e => e.status === 'pending_payment')
        .map(e => e.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectEarning = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkApprove = async () => {
    const success = await onBulkApprove(selectedIds, bulkComment);
    if (success) {
      setSelectedIds([]);
      setBulkComment('');
      setIsBulkActionModalOpen(false);
    }
  };

  const pendingEarnings = earnings.filter(e => e.status === 'pending_payment');
  const allPendingSelected = pendingEarnings.length > 0 && pendingEarnings.every(e => selectedIds.includes(e.id));
  const somePendingSelected = pendingEarnings.some(e => selectedIds.includes(e.id));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading earnings...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-muted animate-pulse rounded w-20"></div>
                <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (earnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Earnings Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No earning transactions match your current filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Earnings Transactions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {earnings.length} transaction{earnings.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {canManagePayments && selectedIds.length > 0 && (
            <Button
              onClick={() => setIsBulkActionModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Approve Selected ({selectedIds.length})
            </Button>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Bulk Selection Header */}
          {canManagePayments && pendingEarnings.length > 0 && (
            <div className="flex items-center space-x-2 mb-4 p-3 bg-muted rounded-lg">
              <Checkbox
                checked={allPendingSelected}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">
                Select all pending payments ({pendingEarnings.length})
              </Label>
            </div>
          )}

          <div className="space-y-4">
            {earnings.map((earning) => {
              const StatusIcon = getStatusIcon(earning.status);
              const canSelect = canManagePayments && earning.status === 'pending_payment';
              const isSelected = selectedIds.includes(earning.id);

              return (
                <div key={earning.id} className="flex items-start space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  {/* Selection Checkbox */}
                  {canSelect && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectEarning(earning.id, checked as boolean)}
                      className="mt-1"
                    />
                  )}

                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-full ${
                      earning.status === 'paid' ? 'bg-green-100' :
                      earning.status === 'pending_payment' ? 'bg-yellow-100' :
                      earning.status === 'on_hold' ? 'bg-orange-100' :
                      'bg-red-100'
                    }`}>
                      <StatusIcon className={`h-4 w-4 ${
                        earning.status === 'paid' ? 'text-green-600' :
                        earning.status === 'pending_payment' ? 'text-yellow-600' :
                        earning.status === 'on_hold' ? 'text-orange-600' :
                        'text-red-600'
                      }`} />
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-foreground">{earning.type.replace('_', ' ').toUpperCase()}</h4>
                          <Badge variant={getStatusVariant(earning.status)}>
                            {getStatusLabel(earning.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{earning.moderatorName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{earning.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>KSh {earning.amount.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{earning.description}</p>
                        
                        {earning.paymentMethod && (
                          <div className="text-xs text-muted-foreground">
                            Payment Method: {earning.paymentMethod.replace('_', ' ').toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className="text-lg font-semibold text-foreground">
                          KSh {earning.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsModal(earning)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        
                        {canManagePayments && earning.status === 'pending_payment' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onApprove(earning.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionModal(earning, 'hold')}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Pause className="h-3 w-3 mr-1" />
                              Hold
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionModal(earning, 'reject')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Detailed information about this payment transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedEarning && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Moderator</Label>
                  <p className="text-sm font-semibold">{selectedEarning.moderatorName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Type</Label>
                  <p className="text-sm font-semibold">{selectedEarning.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="text-sm font-semibold">KSh {selectedEarning.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={getStatusVariant(selectedEarning.status)} className="mt-1">
                    {getStatusLabel(selectedEarning.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="text-sm font-semibold">{selectedEarning.date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <p className="text-sm font-semibold">
                    {selectedEarning.paymentMethod?.replace('_', ' ').toUpperCase() || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{selectedEarning.description}</p>
              </div>
              
              {/* Status-specific information */}
              {selectedEarning.status === 'paid' && selectedEarning.approvedBy && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Approved By</Label>
                      <p className="text-sm font-semibold">{selectedEarning.approvedBy}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Paid At</Label>
                      <p className="text-sm font-semibold">
                        {selectedEarning.paidAt ? new Date(selectedEarning.paidAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    {selectedEarning.transactionReference && (
                      <>
                        <div className="col-span-2">
                          <Label className="text-sm font-medium text-muted-foreground">Transaction Reference</Label>
                          <p className="text-sm font-semibold">{selectedEarning.transactionReference}</p>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
              
              {selectedEarning.status === 'on_hold' && selectedEarning.holdReason && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
                      Hold Reason
                    </Label>
                    <p className="text-sm bg-orange-50 p-3 rounded-lg border border-orange-200">
                      {selectedEarning.holdReason}
                    </p>
                    {selectedEarning.heldBy && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Held By</Label>
                          <p className="text-sm font-semibold">{selectedEarning.heldBy}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Held At</Label>
                          <p className="text-sm font-semibold">
                            {selectedEarning.heldAt ? new Date(selectedEarning.heldAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {selectedEarning.status === 'rejected' && selectedEarning.rejectionReason && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center">
                      <X className="h-4 w-4 mr-1 text-red-500" />
                      Rejection Reason
                    </Label>
                    <p className="text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                      {selectedEarning.rejectionReason}
                    </p>
                    {selectedEarning.rejectedBy && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Rejected By</Label>
                          <p className="text-sm font-semibold">{selectedEarning.rejectedBy}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Rejected At</Label>
                          <p className="text-sm font-semibold">
                            {selectedEarning.rejectedAt ? new Date(selectedEarning.rejectedAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Modal (Hold/Reject) */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'hold' ? 'Hold Payment' : 'Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for {actionType === 'hold' ? 'holding' : 'rejecting'} this payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="actionReason">Reason *</Label>
              <Textarea
                id="actionReason"
                placeholder={`Enter reason for ${actionType === 'hold' ? 'holding' : 'rejecting'} this payment...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="actionComment">Additional Comment (Optional)</Label>
              <Textarea
                id="actionComment"
                placeholder="Any additional notes or comments..."
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsActionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={!actionReason.trim()}
                variant={actionType === 'hold' ? 'default' : 'destructive'}
              >
                {actionType === 'hold' ? 'Hold Payment' : 'Reject Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Approval Modal */}
      <Dialog open={isBulkActionModalOpen} onOpenChange={setIsBulkActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Approve Payments</DialogTitle>
            <DialogDescription>
              You are about to approve {selectedIds.length} payment{selectedIds.length !== 1 ? 's' : ''}. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkComment">Comment (Optional)</Label>
              <Textarea
                id="bulkComment"
                placeholder="Add a comment for this bulk approval..."
                value={bulkComment}
                onChange={(e) => setBulkComment(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsBulkActionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve {selectedIds.length} Payment{selectedIds.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EarningsList;