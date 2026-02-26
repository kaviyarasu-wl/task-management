import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { statusApi } from '../services/statusApi';
import { useStatusStore } from '../stores/statusStore';

export const statusKeys = {
  all: ['statuses'] as const,
  list: () => [...statusKeys.all, 'list'] as const,
  detail: (id: string) => [...statusKeys.all, 'detail', id] as const,
  default: () => [...statusKeys.all, 'default'] as const,
  transitions: (id: string) => [...statusKeys.all, 'transitions', id] as const,
  matrix: () => [...statusKeys.all, 'matrix'] as const,
};

export function useStatusesQuery() {
  const { setStatuses, setLoading } = useStatusStore();

  const query = useQuery({
    queryKey: statusKeys.list(),
    queryFn: async () => {
      const response = await statusApi.getAll();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync to Zustand store
  useEffect(() => {
    if (query.data) {
      setStatuses(query.data);
    }
  }, [query.data, setStatuses]);

  useEffect(() => {
    setLoading(query.isLoading);
  }, [query.isLoading, setLoading]);

  return query;
}

export function useStatusQuery(id: string) {
  return useQuery({
    queryKey: statusKeys.detail(id),
    queryFn: async () => {
      const response = await statusApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useDefaultStatusQuery() {
  return useQuery({
    queryKey: statusKeys.default(),
    queryFn: async () => {
      const response = await statusApi.getDefault();
      return response.data;
    },
  });
}

export function useStatusTransitionsQuery(id: string) {
  return useQuery({
    queryKey: statusKeys.transitions(id),
    queryFn: async () => {
      const response = await statusApi.getTransitions(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useTransitionMatrixQuery() {
  const { setTransitionMatrix } = useStatusStore();

  const query = useQuery({
    queryKey: statusKeys.matrix(),
    queryFn: async () => {
      const response = await statusApi.getTransitionMatrix();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.data) {
      setTransitionMatrix(query.data);
    }
  }, [query.data, setTransitionMatrix]);

  return query;
}
