import type { AuditLogEntry } from '../types/audit-log.types';
import { AuditLogRow } from './AuditLogRow';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { Button } from '@/shared/components/ui/Button';

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  isLoading: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  isFetchingNextPage: boolean;
}

export function AuditLogTable({
  entries,
  isLoading,
  hasNextPage,
  onLoadMore,
  isFetchingNextPage,
}: AuditLogTableProps) {
  if (isLoading) {
    return <SkeletonTable rows={8} columns={7} />;
  }

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No audit log entries found matching your filters.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left" role="table">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-8 pl-4 py-3" aria-label="Expand row" />
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Timestamp</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Entity</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Name / ID</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <AuditLogRow key={entry._id} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            isLoading={isFetchingNextPage}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
