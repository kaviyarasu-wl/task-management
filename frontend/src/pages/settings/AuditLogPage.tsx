import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { pageVariants } from '@/shared/lib/motion';
import { useAuditLogs } from '@/features/audit-log/hooks/useAuditLogs';
import { AuditLogFilters } from '@/features/audit-log/components/AuditLogFilters';
import { AuditLogTable } from '@/features/audit-log/components/AuditLogTable';
import { AuditLogExportButton } from '@/features/audit-log/components/AuditLogExportButton';
import { useMembers } from '@/features/users/hooks/useUsers';
import type { AuditLogFilterParams } from '@/features/audit-log/types/audit-log.types';

export function AuditLogPage() {
  const [filters, setFilters] = useState<Omit<AuditLogFilterParams, 'cursor' | 'limit'>>({});
  const { data: membersData } = useMembers();
  const members = membersData?.data ?? [];

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAuditLogs(filters);

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
            <p className="text-sm text-muted-foreground">
              Track all user actions across your organization
            </p>
          </div>
        </div>
        <AuditLogExportButton filters={filters} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <AuditLogFilters
          filters={filters}
          onFiltersChange={setFilters}
          users={members}
        />
      </div>

      <div className="mt-6">
        <AuditLogTable
          entries={entries}
          isLoading={isLoading}
          hasNextPage={hasNextPage ?? false}
          onLoadMore={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      </div>
    </motion.div>
  );
}
