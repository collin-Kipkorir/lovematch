import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User, Plus, Minus, Eye, MessageSquare, CreditCard, Search } from 'lucide-react';

/**
 * USER MANAGEMENT - BACKEND INTEGRATION GUIDE
 * 
 * TODO: Connect to real user data and admin functionality
 * 
 * CORE USER DATA STRUCTURE:
 * Table: profiles
 * - id (uuid, primary key)
 * - user_id (uuid, foreign key to auth.users)
 * - name (text)
 * - email (text)
 * - age (integer)
 * - gender (text)
 * - location (text)
 * - bio (text)
 * - profile_picture (text, URL to storage)
 * - interests (text array)
 * - looking_for (text)
 * - verification_status ('pending', 'verified', 'rejected')
 * - is_active (boolean)
 * - last_active_at (timestamp)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 * 
 * USER CREDITS SYSTEM:
 * Table: user_credits
 * - user_id (uuid, foreign key)
 * - message_credits (integer, default 0)
 * - video_credits (integer, default 0)
 * - bonus_credits (integer, default 0)
 * - total_spent (decimal)
 * - updated_at (timestamp)
 * 
 * CREDIT TRANSACTIONS:
 * Table: credit_transactions
 * - id (uuid, primary key)
 * - user_id (uuid, foreign key)
 * - transaction_type ('purchase', 'usage', 'bonus', 'admin_adjustment', 'refund')
 * - credit_type ('message', 'video')
 * - amount (integer)
 * - previous_balance (integer)
 * - new_balance (integer)
 * - description (text)
 * - admin_id (uuid, nullable - for admin adjustments)
 * - payment_intent_id (text, nullable)
 * - created_at (timestamp)
 * 
 * USER ACTIVITY TRACKING:
 * Table: user_activity
 * - id (uuid, primary key)
 * - user_id (uuid, foreign key)
 * - activity_type ('login', 'message_sent', 'profile_view', 'chat_started')
 * - metadata (jsonb, additional data)
 * - ip_address (inet)
 * - user_agent (text)
 * - created_at (timestamp)
 * 
 * ADMIN ACTIONS LOG:
 * Table: admin_actions
 * - id (uuid, primary key)
 * - admin_id (uuid, foreign key)
 * - action_type ('credit_adjustment', 'user_suspend', 'user_activate', 'profile_edit')
 * - target_user_id (uuid, foreign key)
 * - details (jsonb)
 * - created_at (timestamp)
 * 
 * USER MESSAGING STATS:
 * View: user_message_stats
 * - user_id (uuid)
 * - total_messages_sent (integer)
 * - total_messages_received (integer)
 * - total_conversations (integer)
 * - avg_response_time (interval)
 * - last_message_at (timestamp)
 * 
 * SUPABASE FUNCTIONS TO IMPLEMENT:
 * 
 * 1. get_users_with_stats(limit, offset, search_term, status_filter)
 * 2. adjust_user_credits(user_id, amount, credit_type, admin_id, reason)
 * 3. get_user_chat_history(user_id, limit, offset)
 * 4. suspend_user(user_id, admin_id, reason)
 * 5. activate_user(user_id, admin_id)
 * 6. get_user_activity_log(user_id, limit)
 * 7. export_user_data(user_id) - GDPR compliance
 * 
 * REAL-TIME SUBSCRIPTIONS:
 * - Subscribe to profile changes
 * - Subscribe to credit balance updates
 * - Subscribe to user activity status
 * - Subscribe to new user registrations
 * 
 * SEARCH & FILTERING:
 * - Full-text search on name, email
 * - Filter by status (active/inactive)
 * - Filter by registration date range
 * - Filter by credit balance range
 * - Sort by last active, registration date, total messages
 * 
 * BULK OPERATIONS:
 * - Bulk credit adjustments
 * - Bulk user status changes
 * - Bulk email notifications
 * 
 * ANALYTICS INTEGRATION:
 * - User engagement metrics
 * - Credit usage patterns
 * - Chat activity heatmaps
 * - User retention analytics
 */

// Simulated real users data
const initialRealUsers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    credits: 15,
    joinDate: '2024-01-15',
    status: 'active',
    totalMessages: 45,
    lastActive: '2024-07-30T14:30:00Z'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    credits: 3,
    joinDate: '2024-02-20',
    status: 'active',
    totalMessages: 12,
    lastActive: '2024-07-30T10:15:00Z'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    credits: 0,
    joinDate: '2024-03-10',
    status: 'inactive',
    totalMessages: 8,
    lastActive: '2024-07-28T16:45:00Z'
  }
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState(initialRealUsers);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreditAdjustment = (userId: string, amount: number, type: 'add' | 'subtract') => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const newCredits = type === 'add' ? user.credits + amount : Math.max(0, user.credits - amount);
        return { ...user, credits: newCredits };
      }
      return user;
    }));

    toast({
      title: "Credits Updated",
      description: `${type === 'add' ? 'Added' : 'Subtracted'} ${amount} credits`,
    });
    setCreditAmount('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          Manage real users, credits, and view chat history
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-200"
        />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="active">Active Users</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Users</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real Users</CardTitle>
              <CardDescription>Manage registered users and their credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="group flex flex-col lg:flex-row lg:items-center justify-between p-6 rounded-xl bg-gradient-to-r from-card via-card to-card/50 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                          <User className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${user.status === 'active' ? 'bg-green-500' : 'bg-muted'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-lg truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Joined {formatDate(user.joinDate)}
                          </span>
                          <span className="hidden sm:inline text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            Active {formatDateTime(user.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                      <div className="flex items-center gap-4">
                        <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="mb-2">
                            {user.status}
                          </Badge>
                          <p className="text-sm text-foreground font-medium">💬 {user.totalMessages}</p>
                          <p className="text-xs text-muted-foreground">messages</p>
                        </div>
                        
                        <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-2xl font-bold text-primary">{user.credits}</p>
                          <p className="text-xs text-muted-foreground font-medium">credits</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="hover:bg-primary/10 hover:border-primary/30 transition-colors" onClick={() => setSelectedUser(user)}>
                              <CreditCard className="h-4 w-4 mr-1" />
                              Credits
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl">Manage Credits</DialogTitle>
                              <DialogDescription className="text-base">
                                Adjusting credits for <span className="font-semibold text-foreground">{user.name}</span>
                                <br />
                                Current balance: <span className="font-semibold text-primary">{user.credits} credits</span>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div>
                                <Label htmlFor="creditAmount" className="text-sm font-medium">Amount</Label>
                                <Input
                                  id="creditAmount"
                                  type="number"
                                  value={creditAmount}
                                  onChange={(e) => setCreditAmount(e.target.value)}
                                  placeholder="Enter amount"
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex space-x-3">
                                <Button
                                  onClick={() => handleCreditAdjustment(user.id, parseInt(creditAmount) || 0, 'add')}
                                  className="flex-1"
                                  disabled={!creditAmount}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Credits
                                </Button>
                                <Button
                                  onClick={() => handleCreditAdjustment(user.id, parseInt(creditAmount) || 0, 'subtract')}
                                  variant="outline"
                                  className="flex-1"
                                  disabled={!creditAmount}
                                >
                                  <Minus className="h-4 w-4 mr-2" />
                                  Subtract
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button size="sm" variant="outline" className="hover:bg-secondary/80 transition-colors">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chats
                        </Button>
                        
                        <Button size="sm" variant="outline" className="hover:bg-secondary/80 transition-colors">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>Users who have been active recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.filter(user => user.status === 'active').map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">Last active: {formatDateTime(user.lastActive)}</p>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Users</CardTitle>
              <CardDescription>Users who haven't been active recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.filter(user => user.status === 'inactive').map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">Last active: {formatDateTime(user.lastActive)}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Inactive</Badge>
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

export default UserManagement;