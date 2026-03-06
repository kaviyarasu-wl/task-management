import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  SavedView,
  CreateSavedViewData,
  UpdateSavedViewData,
} from '../types/savedView.types';

export const savedViewApi = {
  list: async (): Promise<ApiResponse<SavedView[]>> => {
    const { data } = await api.get<ApiResponse<SavedView[]>>('/saved-views');
    return data;
  },

  create: async (payload: CreateSavedViewData): Promise<ApiResponse<SavedView>> => {
    const { data } = await api.post<ApiResponse<SavedView>>('/saved-views', payload);
    return data;
  },

  update: async (
    viewId: string,
    payload: UpdateSavedViewData
  ): Promise<ApiResponse<SavedView>> => {
    const { data } = await api.patch<ApiResponse<SavedView>>(
      `/saved-views/${viewId}`,
      payload
    );
    return data;
  },

  delete: async (viewId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/saved-views/${viewId}`);
    return data;
  },

  setDefault: async (viewId: string | null): Promise<ApiResponse<null>> => {
    const { data } = await api.post<ApiResponse<null>>('/saved-views/default', {
      viewId,
    });
    return data;
  },
};
