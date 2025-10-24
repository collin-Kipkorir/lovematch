import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface WithdrawalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface WithdrawalRequest {
  amount: number;
  paymentMethod: 'mpesa' | 'bank';
  paymentDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

const WithdrawalHistoryModal: React.FC<WithdrawalHistoryModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const withdrawalsRef = ref(database, 'withdrawalRequests');
    const userWithdrawalsQuery = query(
      withdrawalsRef,
      orderByChild('userId'),
      equalTo(userId)
    );

    const withdrawalListener = onValue(userWithdrawalsQuery, (snapshot) => {
      const withdrawalsList: WithdrawalRequest[] = [];
      snapshot.forEach((child) => {
        withdrawalsList.push(child.val() as WithdrawalRequest);
      });

      // Sort by timestamp descending (most recent first)
      withdrawalsList.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setWithdrawals(withdrawalsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching withdrawal history:', error);
      setLoading(false);
    });

    return () => {
      off(userWithdrawalsQuery);
    };
  }, [userId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            🟡 Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            🟢 Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            🔴 Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdrawal History</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No withdrawal history found
            </div>
          ) : (
            withdrawals.map((withdrawal, index) => (
              <div
                key={index}
                className="p-4 bg-muted/50 rounded-lg space-y-3 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    KSH {Math.floor(withdrawal.amount / 2).toLocaleString()}
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>

                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Payment Method:</span>
                    <span className="font-medium capitalize">{withdrawal.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Date:</span>
                    <span className="font-medium">
                      {format(new Date(withdrawal.timestamp), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalHistoryModal;