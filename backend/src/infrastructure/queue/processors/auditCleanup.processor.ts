import { Job } from 'bullmq';
import { AuditLogService } from '@modules/audit/audit.service';
import { createLogger } from '@infrastructure/logger';
import { AuditCleanupJobData } from '../queues';

const log = createLogger('AuditCleanupProcessor');
const auditService = new AuditLogService();

export async function auditCleanupProcessor(_job: Job<AuditCleanupJobData>): Promise<void> {
  log.info('Starting audit log cleanup');
  const deleted = await auditService.cleanupOldLogs();
  log.info({ deleted }, 'Audit log cleanup complete');
}
