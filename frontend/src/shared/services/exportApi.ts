import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  ExportFormat,
  ExportType,
  ExportGenerateResponse,
  ExportStatusResponse,
} from '@/shared/types/export.types';

export const exportApi = {
  generate: async (
    type: ExportType,
    format: ExportFormat,
    filters?: Record<string, string>
  ): Promise<ApiResponse<ExportGenerateResponse>> => {
    const { data } = await api.post<ApiResponse<ExportGenerateResponse>>(
      '/exports/generate',
      { type, format, filters }
    );
    return data;
  },

  status: async (jobId: string): Promise<ApiResponse<ExportStatusResponse>> => {
    const { data } = await api.get<ApiResponse<ExportStatusResponse>>(
      `/exports/status/${jobId}`
    );
    return data;
  },

  cancel: async (jobId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.post<ApiResponse<null>>(
      `/exports/cancel/${jobId}`
    );
    return data;
  },
};
