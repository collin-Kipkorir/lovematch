import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Menu, MessageCircle, Plus, LogOut, Gift, CreditCard, History } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import GiftWithdrawalModal from '@/components/GiftWithdrawalModal';
import WithdrawalHistoryModal from '@/components/WithdrawalHistoryModal';

interface UserGift {
  type?: 'gift' | 'withdrawal';
  amount?: number;
  cost?: number;
  quantity?: number;
  name?: string;
  emoji?: string;
  timestamp?: string;
  toUserId?: string;
  status?: string;
  withdrawalId?: string;
}

// Helper function to calculate KSH value from gifts
const calculateKshValue = (gifts: number): number => {
  return Math.floor(gifts / 2);
};

const formatCurrency = (amount: number): string => {
  return `KSH ${amount.toLocaleString()}`;
};

const MobileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [totalGifts, setTotalGifts] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Fetch total gifts received
  React.useEffect(() => {
    if (!user?.id) {
      console.log('[MobileMenu] No user ID available');
      setTotalGifts(0);
      return;
    }

    console.log('[MobileMenu] Setting up listener for user:', user.id);
    
    const giftsRef = ref(database, 'userGifts');
    const userGiftsQuery = query(
      giftsRef,
      orderByChild('toUserId'),
      equalTo(user.id)
    );
    
    let isMounted = true;
    
    const giftListener = onValue(userGiftsQuery, (snapshot) => {
      if (!isMounted) return;

      try {
        let totalValue = 0;
        let totalWithdrawals = 0;
        
        const data = snapshot.val();
        console.log('[MobileMenu] Raw Gift Data:', data);
        
        if (!data) {
          console.log('[MobileMenu] No gift data found');
          setTotalGifts(0);
          return;
        }
        
        Object.entries(data).forEach(([key, gift]: [string, UserGift]) => {
          if (!gift || !gift.toUserId || gift.toUserId !== user.id) {
            console.log('[MobileMenu] Skipping invalid gift:', key);
            return;
          }

          console.log(`[MobileMenu] Processing gift ${key}:`, gift);

          // Handle withdrawals
          if (gift.type === 'withdrawal') {
            const withdrawalAmount = Math.abs(gift.amount || 0);
            totalWithdrawals += withdrawalAmount;
            console.log(`[MobileMenu] Added withdrawal: ${withdrawalAmount}`);
            return;
          }

          // Regular gifts
          if (gift.cost && gift.quantity) {
            const cost = Number(gift.cost);
            const quantity = Number(gift.quantity);
            if (cost > 0 && quantity > 0) {
              const giftValue = cost * quantity;
              console.log(`[MobileMenu] Adding gift value: ${giftValue} (${cost} × ${quantity})`);
              totalValue += giftValue;
            }
          } else if (gift.amount) {
            const amount = Number(gift.amount);
            if (amount > 0) {
              console.log(`[MobileMenu] Adding direct amount: ${amount}`);
              totalValue += amount;
            }
          } else {
            console.log('[MobileMenu] Skipping gift with no valid amount:', gift);
          }
        });

        const finalBalance = Math.max(0, totalValue - totalWithdrawals);
        console.log(`[MobileMenu] Final calculation:
          Total Value: ${totalValue}
          Total Withdrawals: ${totalWithdrawals}
          Final Balance: ${finalBalance}
        `);
        
        setTotalGifts(finalBalance);
      } catch (error) {
        console.error('[MobileMenu] Error processing gifts:', error);
        setTotalGifts(0);
      }
    }, (error) => {
      if (!isMounted) return;
      console.error('[MobileMenu] Error fetching gifts:', error);
      setTotalGifts(0);
    });

    // Cleanup on unmount
    return () => {
      isMounted = false;
      console.log('[MobileMenu] Cleaning up listener for user:', user.id);
      off(userGiftsQuery);
    };
  }, [user?.id]); // Only depend on user.id instead of entire user object

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTopUp = () => {
    setIsPaymentModalOpen(true);
  };

  if (!user) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/20 md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left text-base sm:text-lg">{user.name}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4 mt-4">
          {/* User Info */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Credits Section - Only for regular users */}
          {user.id !== 'admin' && (
            <>
             

              {/* Actions */}
              <div className="space-y-3">
                
 <div className="space-y-3">
                <h4 className="font-medium text-sm sm:text-base">Credits</h4>
                <div className="flex items-center justify-between p-2.5 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="text-xs sm:text-sm">Credits Balance</span>
                  </div>
                  <span className="font-semibold text-sm sm:text-base">{user.credits}</span>
                </div>
<Button 
                  onClick={handleTopUp}
                  className="w-full bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Top Up Credits
                </Button>
                <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Gift className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs sm:text-sm font-medium">Gift Balance</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary text-base sm:text-lg">{totalGifts.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                      <span className="text-muted-foreground">Total Gifts Earnings:</span>
                      <span className="font-semibold text-primary">{formatCurrency(calculateKshValue(totalGifts))}</span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: `${Math.min((totalGifts / 1000) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {totalGifts >= 1000 
                          ? "✨ Eligible for withdrawal" 
                          : `${1000 - totalGifts} more gifts needed to withdraw`}
                      </p>
                    </div>
                </div>
              </div>
                <div className="space-y-1.5">
                  {totalGifts >= 1000 && (
                    <Button 
                      onClick={() => setIsWithdrawalModalOpen(true)}
                      className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Withdraw Cash
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Withdrawal History
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Logout Action */}
          <div className="space-y-3">
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          type="message"
        />

        <GiftWithdrawalModal
          isOpen={isWithdrawalModalOpen}
          onClose={() => setIsWithdrawalModalOpen(false)}
          totalGifts={totalGifts}
          userId={user.id}
        />

        <WithdrawalHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          userId={user.id}
        />

        {/* Admin Contact */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-muted-foreground">
            Need help? Contact admin at<br />
            <a href="mailto:metacodesolutionsltd@gmail.com" className="text-primary hover:underline">
              metacodesolutionsltd@gmail.com
            </a>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;