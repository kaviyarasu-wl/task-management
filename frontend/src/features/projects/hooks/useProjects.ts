import { useInfiniteQuery } from '@tanstack/react-query';
import { projectApi } from '../services/projectApi';
import type { ProjectFilters } from '../types/project.types';

export function useProjects(filters: Omit<ProjectFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: ['projects', filters],
    queryFn: ({ pageParam }) =>
      projectApi.getAll({ ...filters, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}
