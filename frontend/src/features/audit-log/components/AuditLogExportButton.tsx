import { Download } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useExportAuditLogs } from '../hooks/useAuditLogs';
import type { AuditLogFilterParams } from '../types/audit-log.types';

interface AuditLogExportButtonProps {
  filters: Omit<AuditLogFilterParams, 'cursor' | 'limit'>;
}

export function AuditLogExportButton({ filters }: AuditLogExportButtonProps) {
  const exportMutation = useExportAuditLogs();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportMutation.mutate(filters)}
      isLoading={exportMutation.isPending}
      aria-label="Export audit logs as CSV"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Export CSV
    </Button>
  );
}
