import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedViewApi } from '../services/savedViewApi';
import type { CreateSavedViewData, UpdateSavedViewData } from '../types/savedView.types';
import { toast } from '@/shared/stores/toastStore';

const SAVED_VIEWS_KEY = ['saved-views'] as const;

export function useSavedViews() {
  return useQuery({
    queryKey: SAVED_VIEWS_KEY,
    queryFn: () => savedViewApi.list(),
    staleTime: 1000 * 60 * 5,
    select: (response) => response.data,
  });
}

export function useCreateSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSavedViewData) => savedViewApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_VIEWS_KEY });
      toast({ type: 'success', title: 'View saved' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Failed to save view' });
    },
  });
}

export function useUpdateSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ viewId, data }: { viewId: string; data: UpdateSavedViewData }) =>
      savedViewApi.update(viewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_VIEWS_KEY });
      toast({ type: 'success', title: 'View updated' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Failed to update view' });
    },
  });
}

export function useDeleteSavedView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewId: string) => savedViewApi.delete(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_VIEWS_KEY });
      toast({ type: 'success', title: 'View deleted' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Failed to delete view' });
    },
  });
}

export function useSetDefaultView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewId: string | null) => savedViewApi.setDefault(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_VIEWS_KEY });
    },
    onError: () => {
      toast({ type: 'error', title: 'Failed to update default view' });
    },
  });
}
