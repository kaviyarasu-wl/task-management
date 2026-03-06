import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type { Upload, UploadEntityType } from '../types/upload.types';

export interface UploadFileParams {
  file: File;
  entityType: UploadEntityType;
  entityId: string;
  onProgress?: (progress: number) => void;
}

export interface ListUploadsParams {
  entityType: UploadEntityType;
  entityId: string;
}

export const uploadApi = {
  upload: async ({
    file,
    entityType,
    entityId,
    onProgress,
  }: UploadFileParams): Promise<ApiResponse<Upload>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    const { data } = await api.post<ApiResponse<Upload>>('/uploads', formData, {
      timeout: 60000,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
    });

    return data;
  },

  list: async ({
    entityType,
    entityId,
  }: ListUploadsParams): Promise<ApiResponse<Upload[]>> => {
    const params = new URLSearchParams({ entityType, entityId });
    const { data } = await api.get<ApiResponse<Upload[]>>(
      `/uploads?${params.toString()}`
    );
    return data;
  },

  delete: async (uploadId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/uploads/${uploadId}`);
    return data;
  },

  getDownloadUrl: async (
    uploadId: string
  ): Promise<ApiResponse<{ url: string }>> => {
    const { data } = await api.get<ApiResponse<{ url: string }>>(
      `/uploads/${uploadId}/download`
    );
    return data;
  },
};
