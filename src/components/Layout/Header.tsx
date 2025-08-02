import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileMenu from '@/components/Navigation/MobileMenu';

/**
 * HEADER COMPONENT - BACKEND INTEGRATION GUIDE
 * 
 * TODO: Connect real-time credit updates and user data
 * 
 * REAL-TIME CREDIT DISPLAY:
 * - Subscribe to credit changes via Supabase Realtime
 * - Update credits instantly when used/purchased
 * - Show credit purchase modal when credits low
 * 
 * USER SESSION MANAGEMENT:
 * - Handle session expiration gracefully
 * - Refresh tokens automatically
 * - Logout on security issues
 * 
 * NOTIFICATION SYSTEM:
 * - Unread message count in navigation
 * - New match notifications
 * - System announcements
 * - Push notification registration
 * 
 * ADMIN ACCESS CONTROL:
 * - Replace hardcoded admin check with role-based access
 * - Implement proper admin permissions
 * - Secure admin routes with middleware
 * 
 * FEATURES TO ADD:
 * - Profile completion indicator
 * - Premium membership badge
 * - Location-based features toggle
 * - Dark/light mode preference
 */

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-primary/95 backdrop-blur-md shadow-romantic sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between w-full">
            <MobileMenu />
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <Heart className="h-6 w-6 text-primary-foreground animate-pulse-glow" />
              <h1 className="text-lg font-bold text-primary-foreground">LoveMatch</h1>
            </div>
            <div className="w-10"></div> {/* Spacer for balance */}
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <Heart className="h-8 w-8 text-primary-foreground animate-pulse-glow" />
              <h1 className="text-2xl font-bold text-primary-foreground">LoveMatch</h1>
            </div>
            
            {user && (
              <div className="flex items-center space-x-6">
                {/* Navigation Menu */}
                <nav className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="text-primary-foreground hover:bg-white/20 transition-all duration-200"
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    Discover
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/favorites')}
                    className="text-primary-foreground hover:bg-white/20 transition-all duration-200"
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    Favorites
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/chats')}
                    className="text-primary-foreground hover:bg-white/20 transition-all duration-200"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chats
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="text-primary-foreground hover:bg-white/20 transition-all duration-200"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                  {user.email === 'admin@lovematch.com' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="text-primary-foreground hover:bg-white/20 transition-all duration-200 border border-white/30"
                    >
                      ⚙️ Admin
                    </Button>
                  )}
                </nav>

                {/* Credits Display - Only for regular users */}
                {user.id !== 'admin' && (
                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-primary-foreground" />
                      <span className="text-primary-foreground text-sm font-medium">{user.credits}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-primary-foreground text-xs">📹</span>
                      <span className="text-primary-foreground text-sm font-medium">{user.videoCredits}</span>
                    </div>
                  </div>
                )}
                
                {/* User Info */}
                <div className="flex items-center space-x-2 text-primary-foreground bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                  <User className="h-4 w-4" />
                  <span className="font-medium text-sm">{user.name}</span>
                </div>
                
                {/* Logout */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-primary-foreground hover:bg-white/20 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;