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
import { Menu, MessageCircle, Plus, LogOut, Gift, CreditCard } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import GiftWithdrawalModal from '@/components/GiftWithdrawalModal';

const MobileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [totalGifts, setTotalGifts] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch total gifts received
  React.useEffect(() => {
    if (!user) return;

    const giftsRef = ref(database, 'userGifts');
    const userGiftsQuery = query(giftsRef, orderByChild('toUserId'), equalTo(user.id));
    
    const giftListener = onValue(userGiftsQuery, (snapshot) => {
      let totalValue = 0;
      
      snapshot.forEach((childSnapshot) => {
        const gift = childSnapshot.val();
        if (gift && gift.cost && gift.quantity) {
          totalValue += (gift.cost * gift.quantity);
        }
      });
      
      setTotalGifts(totalValue);
    }, (error) => {
      console.error('Error fetching gifts:', error);
    });

    return () => {
      off(userGiftsQuery);
    };
  }, [user]);

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
          <SheetTitle className="text-left">{user.name}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* User Info */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Credits Section - Only for regular users */}
          {user.id !== 'admin' && (
            <>
              <div className="space-y-3">
                <h4 className="font-medium">Credits</h4>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">Credits Balance</span>
                  </div>
                  <span className="font-semibold">{user.credits}</span>
                </div>

                <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Gift Balance</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary text-lg">{totalGifts}</span>
                      <span className="text-xs text-muted-foreground ml-1">gifts</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Earnings:</span>
                    <span className="font-semibold text-primary">KSH {Math.floor(totalGifts / 2).toLocaleString()}</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ 
                          width: `${Math.min((totalGifts / 1000) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {totalGifts >= 1000 
                        ? "✨ Eligible for withdrawal" 
                        : `${1000 - totalGifts} more needed to withdraw`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button 
                  onClick={handleTopUp}
                  className="w-full bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Top Up Credits
                </Button>

                {totalGifts >= 1000 && (
                  <Button 
                    onClick={() => setIsWithdrawalModalOpen(true)}
                    className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Withdraw KSH {Math.floor(totalGifts / 2).toLocaleString()}
                  </Button>
                )}
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
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;