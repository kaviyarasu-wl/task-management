import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  Status,
  CreateStatusInput,
  UpdateStatusInput,
  ReorderStatusesInput,
  UpdateTransitionsInput,
  TransitionMatrix,
} from '../types/status.types';

const BASE_URL = '/status';

export const statusApi = {
  // List all statuses (sorted by order)
  getAll: async (): Promise<ApiResponse<Status[]>> => {
    const response = await api.get<ApiResponse<Status[]>>(BASE_URL);
    return response.data;
  },

  // Get single status by ID
  getById: async (id: string): Promise<ApiResponse<Status>> => {
    const response = await api.get<ApiResponse<Status>>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Get default status for new tasks
  getDefault: async (): Promise<ApiResponse<Status>> => {
    const response = await api.get<ApiResponse<Status>>(`${BASE_URL}/default`);
    return response.data;
  },

  // Create new status
  create: async (input: CreateStatusInput): Promise<ApiResponse<Status>> => {
    const response = await api.post<ApiResponse<Status>>(BASE_URL, input);
    return response.data;
  },

  // Update existing status
  update: async (id: string, input: UpdateStatusInput): Promise<ApiResponse<Status>> => {
    const response = await api.patch<ApiResponse<Status>>(`${BASE_URL}/${id}`, input);
    return response.data;
  },

  // Delete status
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Reorder statuses
  reorder: async (input: ReorderStatusesInput): Promise<ApiResponse<Status[]>> => {
    const response = await api.put<ApiResponse<Status[]>>(`${BASE_URL}/reorder`, input);
    return response.data;
  },

  // Set default status
  setDefault: async (id: string): Promise<ApiResponse<Status>> => {
    const response = await api.patch<ApiResponse<Status>>(`${BASE_URL}/${id}/default`);
    return response.data;
  },

  // Get available transitions for a status
  getTransitions: async (id: string): Promise<ApiResponse<Status[]>> => {
    const response = await api.get<ApiResponse<Status[]>>(`${BASE_URL}/${id}/transitions`);
    return response.data;
  },

  // Update transitions for a status
  updateTransitions: async (
    id: string,
    input: UpdateTransitionsInput
  ): Promise<ApiResponse<Status>> => {
    const response = await api.put<ApiResponse<Status>>(
      `${BASE_URL}/${id}/transitions`,
      input
    );
    return response.data;
  },

  // Get full transition matrix
  getTransitionMatrix: async (): Promise<ApiResponse<TransitionMatrix>> => {
    const response = await api.get<ApiResponse<TransitionMatrix>>(`${BASE_URL}/matrix`);
    return response.data;
  },
};
