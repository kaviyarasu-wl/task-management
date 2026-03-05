import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type { Plan, CreatePlanData, UpdatePlanData } from '../types/plan.types';

export const plansApi = {
  getAll: async (): Promise<Plan[]> => {
    const { data } = await api.get<ApiResponse<Plan[]>>('/admin/plans');
    return data.data;
  },

  getById: async (planId: string): Promise<Plan> => {
    const { data } = await api.get<ApiResponse<Plan>>(`/admin/plans/${planId}`);
    return data.data;
  },

  create: async (planData: CreatePlanData): Promise<Plan> => {
    const { data } = await api.post<ApiResponse<Plan>>('/admin/plans', planData);
    return data.data;
  },

  update: async (planId: string, planData: UpdatePlanData): Promise<Plan> => {
    const { data } = await api.patch<ApiResponse<Plan>>(
      `/admin/plans/${planId}`,
      planData
    );
    return data.data;
  },

  delete: async (planId: string): Promise<void> => {
    await api.delete(`/admin/plans/${planId}`);
  },

  setDefault: async (planId: string): Promise<Plan> => {
    const { data } = await api.post<ApiResponse<Plan>>(
      `/admin/plans/${planId}/set-default`
    );
    return data.data;
  },
};
