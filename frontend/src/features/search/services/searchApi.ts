import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type { SearchResponse, SearchParams } from '../types/search.types';

export const searchApi = {
  search: async (params: SearchParams): Promise<ApiResponse<SearchResponse>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.query);
    if (params.type && params.type !== 'all') {
      queryParams.append('type', params.type);
    }
    if (params.projectId) {
      queryParams.append('projectId', params.projectId);
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const { data } = await api.get<ApiResponse<SearchResponse>>(
      `/search?${queryParams.toString()}`
    );
    return data;
  },
};
