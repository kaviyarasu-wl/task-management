import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../services/settingsApi';
import type { UpdateTenantSettingsData } from '../types/settings.types';

export function useTenantSettings() {
  return useQuery({
    queryKey: ['tenant', 'settings'],
    queryFn: () => settingsApi.getTenant(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTenantSettingsData) => settingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
  });
}
