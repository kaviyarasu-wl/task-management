import { AuditLogRepository, AuditLogFilters } from './audit.repository';
import { AuditChange, AuditEntityType, IAuditLog } from './audit.model';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError } from '@core/errors/AppError';
import { config } from '../../config';
import { createLogger } from '@infrastructure/logger';
import { PaginatedResult } from '../../types';

const log = createLogger('AuditLogService');

export class AuditLogService {
  private repo: AuditLogRepository;

  constructor() {
    this.repo = new AuditLogRepository();
  }

  async list(filters: AuditLogFilters): Promise<PaginatedResult<IAuditLog>> {
    const { tenantId } = RequestContext.get();
    return this.repo.findWithFilters(tenantId, filters);
  }

  async getById(auditId: string): Promise<IAuditLog> {
    const { tenantId } = RequestContext.get();
    const entry = await this.repo.findById(tenantId, auditId);
    if (!entry) throw new NotFoundError('Audit log entry');
    return entry;
  }

  async getStats(): Promise<ReturnType<AuditLogRepository['getStats']>> {
    const { tenantId } = RequestContext.get();
    return this.repo.getStats(tenantId);
  }

  /**
   * Create an audit log entry. Called by audit middleware or event listeners.
   * Fire-and-forget: audit logging should never block the request.
   */
  async logAction(data: {
    tenantId: string;
    userId: string;
    userEmail: string;
    action: string;
    entityType: AuditEntityType;
    entityId: string;
    changes?: AuditChange[];
    ipAddress: string;
    userAgent: string;
    method: string;
    path: string;
    statusCode: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (!config.AUDIT_LOG_ENABLED) return;

    this.repo.create(data).catch((err) => {
      log.error({ err }, 'Failed to create audit entry');
    });
  }

  /**
   * Export audit logs as CSV.
   */
  async exportCsv(filters: AuditLogFilters): Promise<string> {
    const { tenantId } = RequestContext.get();

    // Fetch all matching records (up to 10,000 for export)
    const exportFilters = { ...filters, limit: 10000, cursor: undefined };
    const result = await this.repo.findWithFilters(tenantId, exportFilters);

    const header = 'timestamp,user_email,action,entity_type,entity_id,changes,ip_address,method,path,status_code';
    const rows = result.data.map((entry) => {
      const changes = entry.changes
        .map((c) => `${c.field}: ${String(c.from ?? 'null')} -> ${String(c.to ?? 'null')}`)
        .join('; ');

      return [
        entry.createdAt.toISOString(),
        this.escapeCsvField(entry.userEmail),
        entry.action,
        entry.entityType,
        entry.entityId,
        this.escapeCsvField(changes),
        entry.ipAddress,
        entry.method,
        entry.path,
        entry.statusCode,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Delete audit logs older than retention period.
   * Called by the cleanup cron job.
   */
  async cleanupOldLogs(): Promise<number> {
    const retentionDays = config.AUDIT_LOG_RETENTION_DAYS ?? 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deletedCount = await this.repo.deleteOlderThan(cutoffDate);
    log.info({ deletedCount, retentionDays }, 'Cleaned up old audit entries');
    return deletedCount;
  }

  /**
   * Compute field-level diffs between two objects.
   */
  static computeChanges(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    trackedFields: string[]
  ): AuditChange[] {
    const changes: AuditChange[] = [];

    for (const field of trackedFields) {
      const fromVal = before[field];
      const toVal = after[field];

      if (JSON.stringify(fromVal) !== JSON.stringify(toVal)) {
        changes.push({ field, from: fromVal ?? null, to: toVal ?? null });
      }
    }

    return changes;
  }

  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
