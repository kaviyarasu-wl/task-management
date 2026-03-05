import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/axios';

interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalPlans: number;
  recentTenants: any[];
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ success: true; data: AdminStats }>(
        '/admin/dashboard/stats'
      );
      return data.data;
    },
  });
}
