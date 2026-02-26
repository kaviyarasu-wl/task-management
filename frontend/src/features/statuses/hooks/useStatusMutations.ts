import { useMutation, useQueryClient } from '@tanstack/react-query';
import { statusApi } from '../services/statusApi';
import { statusKeys } from './useStatuses';
import { useStatusStore } from '../stores/statusStore';
import type {
  CreateStatusInput,
  UpdateStatusInput,
  ReorderStatusesInput,
  UpdateTransitionsInput,
  Status,
} from '../types/status.types';

export function useCreateStatus() {
  const queryClient = useQueryClient();
  const { addStatus } = useStatusStore();

  return useMutation({
    mutationFn: async (input: CreateStatusInput) => {
      const response = await statusApi.create(input);
      return response.data;
    },
    onSuccess: (newStatus) => {
      // Update Zustand store immediately
      addStatus(newStatus);
      // Invalidate queries for refetch
      queryClient.invalidateQueries({ queryKey: statusKeys.list() });
    },
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  const { updateStatus } = useStatusStore();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateStatusInput }) => {
      const response = await statusApi.update(id, input);
      return response.data;
    },
    onMutate: async ({ id, input }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: statusKeys.list() });

      // Snapshot previous value
      const previousStatuses = queryClient.getQueryData<Status[]>(statusKeys.list());

      // Optimistically update
      if (previousStatuses) {
        const updated = previousStatuses.map((s) =>
          s._id === id ? { ...s, ...input } : s
        );
        queryClient.setQueryData(statusKeys.list(), updated);
      }

      return { previousStatuses };
    },
    onSuccess: (updatedStatus) => {
      updateStatus(updatedStatus);
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousStatuses) {
        queryClient.setQueryData(statusKeys.list(), context.previousStatuses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.list() });
    },
  });
}

export function useDeleteStatus() {
  const queryClient = useQueryClient();
  const { removeStatus } = useStatusStore();

  return useMutation({
    mutationFn: async (id: string) => {
      await statusApi.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: statusKeys.list() });

      const previousStatuses = queryClient.getQueryData<Status[]>(statusKeys.list());

      // Optimistically remove
      if (previousStatuses) {
        queryClient.setQueryData(
          statusKeys.list(),
          previousStatuses.filter((s) => s._id !== id)
        );
      }

      return { previousStatuses };
    },
    onSuccess: (id) => {
      removeStatus(id);
    },
    onError: (_err, _id, context) => {
      if (context?.previousStatuses) {
        queryClient.setQueryData(statusKeys.list(), context.previousStatuses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.list() });
    },
  });
}

export function useReorderStatuses() {
  const queryClient = useQueryClient();
  const { reorderStatuses } = useStatusStore();

  return useMutation({
    mutationFn: async (input: ReorderStatusesInput) => {
      const response = await statusApi.reorder(input);
      return response.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: statusKeys.list() });

      const previousStatuses = queryClient.getQueryData<Status[]>(statusKeys.list());

      // Optimistically reorder based on input order
      if (previousStatuses) {
        const reordered = input.orderedIds.map((id, index) => {
          const status = previousStatuses.find((s) => s._id === id);
          return status ? { ...status, order: index } : null;
        }).filter((s): s is Status => s !== null);
        queryClient.setQueryData(statusKeys.list(), reordered);
      }

      return { previousStatuses };
    },
    onSuccess: (reorderedStatuses) => {
      reorderStatuses(reorderedStatuses);
    },
    onError: (_err, _vars, context) => {
      if (context?.previousStatuses) {
        queryClient.setQueryData(statusKeys.list(), context.previousStatuses);
        reorderStatuses(context.previousStatuses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.list() });
    },
  });
}

export function useSetDefaultStatus() {
  const queryClient = useQueryClient();
  const { updateStatus } = useStatusStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await statusApi.setDefault(id);
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: statusKeys.list() });

      const previousStatuses = queryClient.getQueryData<Status[]>(statusKeys.list());

      // Optimistically update default status
      if (previousStatuses) {
        const updated = previousStatuses.map((s) => ({
          ...s,
          isDefault: s._id === id,
        }));
        queryClient.setQueryData(statusKeys.list(), updated);
      }

      return { previousStatuses };
    },
    onSuccess: (updatedStatus) => {
      // Unset old default, set new - get current state at execution time
      const currentStatuses = useStatusStore.getState().statuses;
      currentStatuses.forEach((s) => {
        if (s.isDefault && s._id !== updatedStatus._id) {
          updateStatus({ ...s, isDefault: false });
        }
      });
      updateStatus(updatedStatus);
    },
    onError: (_err, _id, context) => {
      if (context?.previousStatuses) {
        queryClient.setQueryData(statusKeys.list(), context.previousStatuses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.list() });
    },
  });
}

export function useUpdateTransitions() {
  const queryClient = useQueryClient();
  const { updateStatus } = useStatusStore();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTransitionsInput }) => {
      const response = await statusApi.updateTransitions(id, input);
      return response.data;
    },
    onSuccess: (updatedStatus) => {
      updateStatus(updatedStatus);
      queryClient.invalidateQueries({ queryKey: statusKeys.matrix() });
      queryClient.invalidateQueries({ queryKey: statusKeys.list() });
      queryClient.invalidateQueries({ queryKey: statusKeys.transitions(updatedStatus._id) });
    },
  });
}
