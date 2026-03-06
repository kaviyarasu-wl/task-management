import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../services/searchApi';
import { useDebouncedValue } from './useDebouncedValue';
import type { SearchEntityType } from '../types/search.types';

interface UseSearchOptions {
  type?: SearchEntityType;
  projectId?: string;
  limit?: number;
  enabled?: boolean;
}

export function useSearch(query: string, options: UseSearchOptions = {}) {
  const { type = 'all', projectId, limit = 5, enabled = true } = options;

  const debouncedQuery = useDebouncedValue(query, 300);
  const hasQuery = debouncedQuery.trim().length >= 2;

  const queryResult = useQuery({
    queryKey: ['search', debouncedQuery, type, projectId, limit],
    queryFn: () =>
      searchApi.search({
        query: debouncedQuery.trim(),
        type,
        projectId,
        limit,
      }),
    enabled: enabled && hasQuery,
    staleTime: 1000 * 30,
    select: (response) => response.data,
  });

  return {
    ...queryResult,
    debouncedQuery,
    hasQuery,
  };
}
