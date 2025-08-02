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
import { Menu, MessageCircle, Plus, LogOut } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

const MobileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
                    <span className="text-sm">Message Credits</span>
                  </div>
                  <span className="font-semibold">{user.credits}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">📹</span>
                    <span className="text-sm">Video Credits</span>
                  </div>
                  <span className="font-semibold">{user.videoCredits}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button 
                  onClick={handleTopUp}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Top Up Credits
                </Button>
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
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;