import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  CreditCard, 
  UserPlus, 
  Settings, 
  LogOut,
  Shield,
  UserCog,
  Bot,
  DollarSign,
  Share2,
  Receipt
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminSidebarProps {
  onClose?: () => void;
}

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiresSuperAdmin?: boolean;
  excludeSuperAdmin?: boolean; // Items to exclude for super admins
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Chat Inbox',
    href: '/admin/chat-inbox',
    icon: MessageSquare,
    badge: '5',
    excludeSuperAdmin: true, // Super admin doesn't handle chats directly
  },
  {
    title: 'Payment Requests',
    href: '/admin/payment-requests',
    icon: Receipt,
    badge: '3',
    requiresSuperAdmin: true,
  },
  {
    title: 'Earnings',
    href: '/admin/earnings',
    icon: DollarSign,
    requiresSuperAdmin: false, // Only show for moderators, not super admins
    excludeSuperAdmin: true,
  },
  {
    title: 'Refer & Earn',
    href: '/admin/referrals',
    icon: Share2,
    requiresSuperAdmin: false, // Only show for moderators, not super admins
    excludeSuperAdmin: true,
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    requiresSuperAdmin: true,
  },
  {
    title: 'Credit Manager',
    href: '/admin/credits',
    icon: CreditCard,
    requiresSuperAdmin: true,
  },
  {
    title: 'Dummy Profiles',
    href: '/admin/dummy-profiles',
    icon: Bot,
    requiresSuperAdmin: true,
  },
  {
    title: 'Chat Monitor',
    href: '/admin/chat-monitor',
    icon: MessageSquare,
    requiresSuperAdmin: true,
  },
  {
    title: 'Moderators Management',
    href: '/admin/admin-management',
    icon: UserCog,
    requiresSuperAdmin: true,
  },
  {
    title: 'Manage Earnings',
    href: '/admin/super-earnings',
    icon: Shield,
    requiresSuperAdmin: true,
  },
  {
    title: 'Moderator Applications',
    href: '/admin/moderator-applications',
    icon: UserPlus,
    requiresSuperAdmin: true,
    badge: '5', // TODO: Backend - Dynamic count of pending applications
  },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose }) => {
  const { currentAdmin, logout, isSuperAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const filteredItems = sidebarItems.filter(item => {
    // Exclude items marked for super admin exclusion if user is super admin
    if (item.excludeSuperAdmin && isSuperAdmin()) {
      return false;
    }
    // Include items that don't require super admin, or user is super admin
    return !item.requiresSuperAdmin || isSuperAdmin();
  });

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">

      {/* Moderator Info */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-lg font-semibold text-primary-foreground">
              {currentAdmin?.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground truncate">
              {currentAdmin?.name}
            </p>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={currentAdmin?.role === 'super_admin' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {currentAdmin?.role === 'super_admin' ? 'Super Admin' : 'Moderator'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;