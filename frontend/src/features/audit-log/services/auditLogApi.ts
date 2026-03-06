import { api } from '@/shared/lib/axios';
import type { PaginatedResponse } from '@/shared/types/api.types';
import type { AuditLogEntry, AuditLogFilterParams } from '../types/audit-log.types';

export const auditLogApi = {
  list: async (filters: AuditLogFilterParams = {}): Promise<PaginatedResponse<AuditLogEntry>> => {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<AuditLogEntry>>(
      `/audit-logs?${params.toString()}`
    );
    return response.data;
  },

  export: async (
    filters: Omit<AuditLogFilterParams, 'cursor' | 'limit'>,
    format: 'csv' = 'csv'
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('format', format);

    const response = await api.get(`/audit-logs/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
