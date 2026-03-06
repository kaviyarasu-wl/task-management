import { api } from '@/shared/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api.types';
import type {
  IntegrationProvider,
  IntegrationConnection,
  IntegrationEvent,
  ConnectProviderResponse,
} from '../types/integration.types';

export const integrationApi = {
  listProviders: async (): Promise<ApiResponse<IntegrationProvider[]>> => {
    const response = await api.get<ApiResponse<IntegrationProvider[]>>('/integrations/providers');
    return response.data;
  },

  listConnections: async (): Promise<ApiResponse<IntegrationConnection[]>> => {
    const response = await api.get<ApiResponse<IntegrationConnection[]>>(
      '/integrations/connections'
    );
    return response.data;
  },

  connect: async (providerId: string): Promise<ApiResponse<ConnectProviderResponse>> => {
    const response = await api.post<ApiResponse<ConnectProviderResponse>>(
      `/integrations/${providerId}/connect`
    );
    return response.data;
  },

  completeOAuth: async (
    providerId: string,
    code: string,
    state: string
  ): Promise<ApiResponse<IntegrationConnection>> => {
    const response = await api.post<ApiResponse<IntegrationConnection>>(
      `/integrations/${providerId}/callback`,
      { code, state }
    );
    return response.data;
  },

  disconnect: async (connectionId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(
      `/integrations/connections/${connectionId}`
    );
    return response.data;
  },

  updateConfig: async (
    connectionId: string,
    config: Record<string, unknown>
  ): Promise<ApiResponse<IntegrationConnection>> => {
    const response = await api.patch<ApiResponse<IntegrationConnection>>(
      `/integrations/connections/${connectionId}`,
      { config }
    );
    return response.data;
  },

  getEvents: async (
    connectionId: string,
    cursor?: string,
    limit = 20
  ): Promise<PaginatedResponse<IntegrationEvent>> => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await api.get<PaginatedResponse<IntegrationEvent>>(
      `/integrations/connections/${connectionId}/events?${params.toString()}`
    );
    return response.data;
  },
};
