import { api } from '@/shared/lib/axios';
import type { ApiResponse, PaginatedResponse, TaskStatus, TaskPriority } from '@/shared/types/api.types';
import type { Task } from '@/shared/types/entities.types';

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  cursor?: string;
  limit?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  tags?: string[];
  assigneeId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  tags?: string[];
  assigneeId?: string;
}

export const taskApi = {
  // Get tasks with filters
  getTasks: async (filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> => {
    const params = new URLSearchParams();
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Task>>(`/tasks?${params.toString()}`);
    return response.data;
  },

  // Get single task
  getTask: async (taskId: string): Promise<ApiResponse<Task>> => {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${taskId}`);
    return response.data;
  },

  // Create task
  createTask: async (data: CreateTaskData): Promise<ApiResponse<Task>> => {
    const response = await api.post<ApiResponse<Task>>('/tasks', data);
    return response.data;
  },

  // Update task
  updateTask: async (taskId: string, data: UpdateTaskData): Promise<ApiResponse<Task>> => {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}`, data);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/tasks/${taskId}`);
    return response.data;
  },
};
