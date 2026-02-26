import { api } from '@/shared/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api.types';
import type { Project } from '@/shared/types/entities.types';
import type { CreateProjectData, UpdateProjectData, ProjectFilters } from '../types/project.types';

export const projectApi = {
  getAll: async (filters: ProjectFilters = {}): Promise<PaginatedResponse<Project>> => {
    const params = new URLSearchParams();
    if (filters.includeArchived) params.append('includeArchived', 'true');
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get<PaginatedResponse<Project>>(
      `/projects?${params.toString()}`
    );
    return data;
  },

  getById: async (projectId: string): Promise<ApiResponse<Project>> => {
    const { data } = await api.get<ApiResponse<Project>>(`/projects/${projectId}`);
    return data;
  },

  create: async (projectData: CreateProjectData): Promise<ApiResponse<Project>> => {
    const { data } = await api.post<ApiResponse<Project>>('/projects', projectData);
    return data;
  },

  update: async (
    projectId: string,
    projectData: UpdateProjectData
  ): Promise<ApiResponse<Project>> => {
    const { data } = await api.patch<ApiResponse<Project>>(
      `/projects/${projectId}`,
      projectData
    );
    return data;
  },

  delete: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },
};
