import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, Users, Target, Award, CreditCard, Pause } from 'lucide-react';
import { EarningsStats as EarningsStatsType } from '@/hooks/useModeratorEarnings';

interface EarningsStatsProps {
  stats: EarningsStatsType | null;
  loading: boolean;
}

const EarningsStats: React.FC<EarningsStatsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-muted animate-pulse rounded w-24 mb-1"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Earnings',
      value: `KSh ${stats.totalEarnings.toLocaleString()}`,
      subtitle: 'All time earnings',
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'This Month',
      value: `KSh ${stats.monthlyEarnings.toLocaleString()}`,
      subtitle: `${stats.assignedUsersCount} assigned users`,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Credit Commission',
      value: `KSh ${stats.creditCommission.toLocaleString()}`,
      subtitle: `30% of KSh ${stats.thisMonthCreditSales.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      title: 'Referral Commission',
      value: `KSh ${stats.referralCommission.toLocaleString()}`,
      subtitle: `5% from ${stats.thisMonthReferrals} referrals`,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Pending Payment',
      value: `KSh ${stats.pendingPayouts.toLocaleString()}`,
      subtitle: 'Ready for payout (≥ KSh 1,000)',
      icon: Calendar,
      color: 'text-orange-600'
    },
    {
      title: 'On Hold',
      value: `KSh ${stats.onHoldAmount.toLocaleString()}`,
      subtitle: 'Accumulating (< KSh 1,000)',
      icon: Pause,
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-3 w-3 lg:h-4 lg:w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-lg lg:text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EarningsStats;