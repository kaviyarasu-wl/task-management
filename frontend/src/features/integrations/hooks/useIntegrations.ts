import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { integrationApi } from '../services/integrationApi';

export const integrationKeys = {
  all: ['integrations'] as const,
  providers: () => [...integrationKeys.all, 'providers'] as const,
  connections: () => [...integrationKeys.all, 'connections'] as const,
  events: (connectionId: string) =>
    [...integrationKeys.all, 'events', connectionId] as const,
};

export function useIntegrationProviders() {
  return useQuery({
    queryKey: integrationKeys.providers(),
    queryFn: () => integrationApi.listProviders(),
    select: (data) => data.data,
    staleTime: 1000 * 60 * 10,
  });
}

export function useIntegrationConnections() {
  return useQuery({
    queryKey: integrationKeys.connections(),
    queryFn: () => integrationApi.listConnections(),
    select: (data) => data.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useIntegrationEvents(connectionId: string | null) {
  return useInfiniteQuery({
    queryKey: integrationKeys.events(connectionId!),
    queryFn: ({ pageParam }) =>
      integrationApi.getEvents(connectionId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!connectionId,
    staleTime: 1000 * 60,
  });
}
