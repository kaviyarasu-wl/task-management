import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../services/projectApi';

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getById(projectId),
    enabled: !!projectId,
  });
}
