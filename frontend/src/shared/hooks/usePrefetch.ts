import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type PrefetchFn = () => Promise<unknown>;

export function usePrefetch(
  queryKey: readonly unknown[],
  queryFn: PrefetchFn,
  staleTime = 1000 * 60 * 5
) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime,
    });
  }, [queryClient, queryKey, queryFn, staleTime]);
}
