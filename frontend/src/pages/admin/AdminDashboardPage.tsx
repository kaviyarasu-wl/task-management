import { Building2, Users, CreditCard, Activity } from 'lucide-react';
import { useAdminStats } from '@/features/admin/hooks/useAdminStats';
import { Card } from '@/shared/components/ui/Card';
import { Skeleton } from '@/shared/components/ui/Skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, isLoading }: StatCardProps) {
  return (
    <Card variant="dark" className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-300">{title}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-20" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-white">
              {value}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-purple-500/30 p-3">
          <Icon className="h-6 w-6 text-purple-300" />
        </div>
      </div>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-1 text-gray-300">
          System overview and quick stats
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={stats?.totalTenants ?? 0}
          icon={Building2}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Tenants"
          value={stats?.activeTenants ?? 0}
          icon={Activity}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Plans"
          value={stats?.totalPlans ?? 0}
          icon={CreditCard}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Tenants */}
      <Card variant="dark" className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Recent Tenants
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {stats?.recentTenants?.map((tenant: any) => (
              <div
                key={tenant._id}
                className="flex items-center justify-between rounded-lg bg-slate-700/40 p-3"
              >
                <div>
                  <p className="font-medium text-white">{tenant.name}</p>
                  <p className="text-sm text-gray-300">{tenant.slug}</p>
                </div>
                <span className="rounded-full bg-purple-500/40 px-3 py-1 text-xs text-white">
                  {tenant.planId?.name ?? 'Free'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
