import { api } from '@/shared/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api.types';
import type { Notification, NotificationPreferences, NotificationPreferencesUpdate } from '../types/notification.types';

export const notificationApi = {
  list: async (cursor?: string, limit = 20): Promise<PaginatedResponse<Notification>> => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const { data } = await api.get<PaginatedResponse<Notification>>(
      `/notifications?${params.toString()}`
    );
    return data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const { data } = await api.get<ApiResponse<{ count: number }>>(
      '/notifications/unread-count'
    );
    return data;
  },

  markRead: async (notificationId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.patch<ApiResponse<null>>(
      `/notifications/${notificationId}/read`
    );
    return data;
  },

  markAllRead: async (): Promise<ApiResponse<null>> => {
    const { data } = await api.patch<ApiResponse<null>>(
      '/notifications/read-all'
    );
    return data;
  },

  delete: async (notificationId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(
      `/notifications/${notificationId}`
    );
    return data;
  },

  getPreferences: async (): Promise<ApiResponse<NotificationPreferences>> => {
    const { data } = await api.get<ApiResponse<NotificationPreferences>>(
      '/notifications/preferences'
    );
    return data;
  },

  updatePreferences: async (
    update: NotificationPreferencesUpdate
  ): Promise<ApiResponse<NotificationPreferences>> => {
    const { data } = await api.put<ApiResponse<NotificationPreferences>>(
      '/notifications/preferences',
      update
    );
    return data;
  },
};
