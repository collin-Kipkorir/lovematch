import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  CreditCard, 
  MessageSquare, 
  Bot, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  UserPlus
} from 'lucide-react';
import { adminStats } from '@/data/adminData';

const SuperAdminDashboard: React.FC = () => {
  const stats = adminStats;

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend,
    color = "default" 
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    color?: "default" | "success" | "warning" | "destructive";
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your LoveMatch platform
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          description="Registered users"
          icon={Users}
          trend="+12 today"
        />
        <StatCard
          title="Dummy Profiles"
          value={stats.totalDummyProfiles}
          description="Active fake profiles"
          icon={Bot}
        />
        <StatCard
          title="Total Credits"
          value={stats.totalCredits.toLocaleString()}
          description="Credits in circulation"
          icon={CreditCard}
          trend="+234 today"
        />
        <StatCard
          title="Active Chats"
          value={stats.activeChats}
          description="Ongoing conversations"
          icon={MessageSquare}
        />
      </div>

      {/* Revenue Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Earnings"
          value={`Ksh. ${(587500).toLocaleString()}`}
          description="From credit sales"
          icon={DollarSign}
          trend="+12.5% this month"
          color="success"
        />
        <StatCard
          title="Today's Revenue"
          value={`Ksh. ${(23400).toLocaleString()}`}
          description="Credit purchases today"
          icon={CreditCard}
          trend="+15% vs yesterday"
          color="success"
        />
        <StatCard
          title="Monthly Target"
          value="78%"
          description="Ksh. 750,000 target"
          icon={TrendingUp}
          trend="On track"
          color="default"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>
              Today's key metrics and trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">New Users Today</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.newUsersToday}</div>
                <div className="text-xs text-muted-foreground">+15% vs yesterday</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Credits Spent Today</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.creditsSpentToday}</div>
                <div className="text-xs text-muted-foreground">Ksh. 234,000 revenue</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Messages Today</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">1,247</div>
                <div className="text-xs text-muted-foreground">+8% vs yesterday</div>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Chat Response Rate</span>
                <span className="text-sm text-muted-foreground">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Admins */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Admins</CardTitle>
            <CardDescription>
              Most active admins this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topAdmins.map((admin, index) => (
                <div key={admin.id} className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="text-sm font-medium text-primary">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {admin.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {admin.messagesHandled} messages handled
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {admin.messagesHandled}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderator Applications Section */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Recent Moderator Applications</span>
          </CardTitle>
          <CardDescription>
            Latest applications for moderator positions - quick review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* TODO: Backend Integration - Replace with real applications data */}
            {[
              { name: 'Sarah Johnson', email: 'sarah.j@email.com', experience: '2-3 years', status: 'pending', time: '2h ago' },
              { name: 'Michael Ochieng', email: 'michael.o@email.com', experience: '1-2 years', status: 'approved', time: '5h ago' },
              { name: 'Grace Wanjiku', email: 'grace.w@email.com', experience: '3-5 years', status: 'interview_scheduled', time: '1d ago' },
            ].map((app, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:bg-card/80 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{app.name}</p>
                    <p className="text-sm text-muted-foreground">{app.email} • {app.experience} experience</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={app.status === 'approved' ? 'default' : app.status === 'pending' ? 'secondary' : 'outline'}
                    className={
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }
                  >
                    {app.status === 'approved' ? 'Approved' : 
                     app.status === 'pending' ? 'Pending' : 'Interview Scheduled'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{app.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Applications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Flags */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Flagged Conversations</span>
            </CardTitle>
            <CardDescription>
              Conversations requiring admin attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.flaggedChats}
            </div>
            <p className="text-sm text-muted-foreground">
              Require immediate review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Platform status and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Server Status</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment Gateway</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Chat System</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Online
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;