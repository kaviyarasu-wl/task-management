import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { auditLogApi } from '../services/auditLogApi';
import type { AuditLogFilterParams } from '../types/audit-log.types';
import { toast } from '@/shared/stores/toastStore';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (filters: Omit<AuditLogFilterParams, 'cursor'>) =>
    [...auditLogKeys.all, 'list', filters] as const,
};

export function useAuditLogs(filters: Omit<AuditLogFilterParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: ({ pageParam }) =>
      auditLogApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
  });
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (filters: Omit<AuditLogFilterParams, 'cursor' | 'limit'>) =>
      auditLogApi.export(filters),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ type: 'success', title: 'Export Complete', message: 'Audit log CSV downloaded.' });
    },
    onError: () => {
      toast({ type: 'error', title: 'Export Failed', message: 'Could not export audit logs.' });
    },
  });
}
