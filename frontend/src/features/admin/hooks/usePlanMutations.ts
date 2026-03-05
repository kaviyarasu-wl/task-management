import { useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../services/plansApi';
import { toast } from '@/shared/stores/toastStore';
import type { UpdatePlanData } from '../types/plan.types';

export function usePlanMutations() {
  const queryClient = useQueryClient();

  const createPlan = useMutation({
    mutationFn: plansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast({ type: 'success', title: 'Plan created successfully' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to create plan',
      });
    },
  });

  const updatePlan = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: UpdatePlanData }) =>
      plansApi.update(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast({ type: 'success', title: 'Plan updated successfully' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to update plan',
      });
    },
  });

  const deletePlan = useMutation({
    mutationFn: plansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast({ type: 'success', title: 'Plan deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        type: 'error',
        title: error.response?.data?.message || 'Failed to delete plan',
      });
    },
  });

  const setDefaultPlan = useMutation({
    mutationFn: plansApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast({ type: 'success', title: 'Default plan updated' });
    },
  });

  return { createPlan, updatePlan, deletePlan, setDefaultPlan };
}
