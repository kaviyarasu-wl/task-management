import { useQuery } from '@tanstack/react-query';
import { plansApi } from '../services/plansApi';

export function usePlans() {
  return useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: plansApi.getAll,
  });
}

export function usePlan(planId: string) {
  return useQuery({
    queryKey: ['admin', 'plans', planId],
    queryFn: () => plansApi.getById(planId),
    enabled: Boolean(planId),
  });
}
