import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AuditLogEntry } from '../types/audit-log.types';
import { ActionBadge } from './ActionBadge';
import { AuditLogDetail } from './AuditLogDetail';
import { formatDate, cn } from '@/shared/lib/utils';

interface AuditLogRowProps {
  entry: AuditLogEntry;
}

export function AuditLogRow({ entry }: AuditLogRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = entry.changes.length > 0 || Object.keys(entry.metadata).length > 0;

  return (
    <>
      <tr
        className={cn(
          'border-b border-border/50 transition-colors',
          hasDetails && 'cursor-pointer hover:bg-muted/30',
          isExpanded && 'bg-muted/20'
        )}
        onClick={() => hasDetails && setIsExpanded((prev) => !prev)}
        role={hasDetails ? 'button' : undefined}
        tabIndex={hasDetails ? 0 : undefined}
        aria-expanded={hasDetails ? isExpanded : undefined}
        onKeyDown={(e) => {
          if (hasDetails && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
      >
        <td className="w-8 pl-4 py-3">
          {hasDetails && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </td>

        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(entry.createdAt)}
        </td>

        <td className="px-4 py-3">
          <div className="text-sm font-medium text-foreground">{entry.userName}</div>
          <div className="text-xs text-muted-foreground">{entry.userEmail}</div>
        </td>

        <td className="px-4 py-3">
          <ActionBadge action={entry.action} />
        </td>

        <td className="px-4 py-3 text-sm capitalize text-foreground">
          {entry.entityType}
        </td>

        <td className="px-4 py-3">
          <div className="text-sm text-foreground">{entry.entityName ?? '-'}</div>
          <div className="font-mono text-xs text-muted-foreground">
            {entry.entityId.slice(0, 8)}...
          </div>
        </td>

        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
          {entry.ipAddress}
        </td>
      </tr>

      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={7}>
              <AuditLogDetail changes={entry.changes} metadata={entry.metadata} />
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
