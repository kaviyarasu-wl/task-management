import type { AuditLogFilterParams } from '../types/audit-log.types';
import { AUDIT_ACTION_OPTIONS, AUDIT_ENTITY_OPTIONS } from '../types/audit-log.types';
import { cn } from '@/shared/lib/utils';

interface AuditLogFiltersProps {
  filters: Omit<AuditLogFilterParams, 'cursor' | 'limit'>;
  onFiltersChange: (filters: Omit<AuditLogFilterParams, 'cursor' | 'limit'>) => void;
  users: Array<{ _id: string; firstName: string; lastName: string }>;
}

export function AuditLogFilters({ filters, onFiltersChange, users }: AuditLogFiltersProps) {
  const handleChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const selectClasses = cn(
    'h-9 rounded-lg border border-border/50 bg-background/50 px-3 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary/50'
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="date"
        value={filters.startDate ?? ''}
        onChange={(e) => handleChange('startDate', e.target.value)}
        className={selectClasses}
        aria-label="Start date"
      />
      <span className="text-sm text-muted-foreground">to</span>
      <input
        type="date"
        value={filters.endDate ?? ''}
        onChange={(e) => handleChange('endDate', e.target.value)}
        className={selectClasses}
        aria-label="End date"
      />

      <select
        value={filters.userId ?? ''}
        onChange={(e) => handleChange('userId', e.target.value)}
        className={selectClasses}
        aria-label="Filter by user"
      >
        <option value="">All Users</option>
        {users.map((user) => (
          <option key={user._id} value={user._id}>
            {user.firstName} {user.lastName}
          </option>
        ))}
      </select>

      <select
        value={filters.action ?? ''}
        onChange={(e) => handleChange('action', e.target.value)}
        className={selectClasses}
        aria-label="Filter by action"
      >
        <option value="">All Actions</option>
        {AUDIT_ACTION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={filters.entityType ?? ''}
        onChange={(e) => handleChange('entityType', e.target.value)}
        className={selectClasses}
        aria-label="Filter by entity type"
      >
        <option value="">All Entities</option>
        {AUDIT_ENTITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
