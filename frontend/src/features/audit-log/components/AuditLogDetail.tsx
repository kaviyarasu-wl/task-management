import { motion } from 'framer-motion';
import { expandVariants } from '@/shared/lib/motion';
import type { FieldChange } from '../types/audit-log.types';
import { cn } from '@/shared/lib/utils';

interface AuditLogDetailProps {
  changes: FieldChange[];
  metadata: Record<string, unknown>;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export function AuditLogDetail({ changes, metadata }: AuditLogDetailProps) {
  const hasChanges = changes.length > 0;
  const hasMetadata = Object.keys(metadata).length > 0;

  return (
    <motion.div
      variants={expandVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="overflow-hidden"
    >
      <div className="border-t border-border/30 bg-muted/20 px-6 py-4">
        {hasChanges && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-foreground">Field Changes</h4>
            <div className="space-y-2">
              {changes.map((change, index) => (
                <div
                  key={`${change.field}-${index}`}
                  className="grid grid-cols-3 gap-4 rounded-lg border border-border/20 bg-background/50 p-3 text-sm"
                >
                  <div className="font-medium text-foreground">{change.field}</div>
                  <div className={cn('text-muted-foreground', 'line-through decoration-destructive/50')}>
                    {formatValue(change.oldValue)}
                  </div>
                  <div className="text-foreground">
                    {formatValue(change.newValue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasMetadata && (
          <div className={cn(hasChanges && 'mt-4')}>
            <h4 className="mb-2 text-sm font-medium text-foreground">Additional Details</h4>
            <pre className="rounded-lg bg-background/50 border border-border/20 p-3 text-xs text-muted-foreground overflow-x-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        )}

        {!hasChanges && !hasMetadata && (
          <p className="text-sm text-muted-foreground">No additional details available.</p>
        )}
      </div>
    </motion.div>
  );
}
