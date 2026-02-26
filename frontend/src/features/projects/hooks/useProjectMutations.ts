import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../services/projectApi';
import type { CreateProjectData, UpdateProjectData } from '../types/project.types';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => projectApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: UpdateProjectData }) =>
      projectApi.update(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
