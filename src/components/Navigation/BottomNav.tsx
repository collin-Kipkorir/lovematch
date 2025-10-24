import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useUnreadChats } from '@/hooks/useUnreadChats';
import { useEffect, useState } from 'react';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Heart, label: 'Favorites', path: '/favorites' },
    { icon: MessageCircle, label: 'Chats', path: '/chats' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const { user } = useAuth();
  const { unreadCount } = useUnreadChats();
  const unread = Number(unreadCount ?? 0) || 0;

  const Badge: React.FC<{ count: number }> = ({ count }) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      // trigger entrance animation
      setVisible(false);
      const id = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(id);
    }, [count]);

    return (
      <span
        role="status"
        aria-label={`${count} unread conversations`}
        className={cn(
          "absolute top-0 right-0 -translate-x-1/4 -translate-y-1/4 inline-flex items-center justify-center min-w-[18px] h-4 px-1.5 text-[10px] font-semibold leading-none text-white bg-red-600 rounded-full shadow-md ring-2 ring-white transition-all duration-200 ease-out transform-gpu",
          visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  // Dev-only debug output to help troubleshoot why badge may be incorrect
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.debug('BottomNav debug', { userId: user?.id, unreadCount });
    } catch (e) {
      // ignore
    }
  }
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center py-2 px-4 text-xs transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-1", isActive && "fill-current")} />
                {item.path === '/chats' && unread > 0 && (
                  <Badge count={unread} />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;