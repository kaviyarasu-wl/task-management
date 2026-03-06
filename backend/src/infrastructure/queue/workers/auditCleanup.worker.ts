import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { AuditCleanupJobData } from '../queues';
import { createLogger } from '@infrastructure/logger';
import { queueJobTotal, queueJobDuration } from '@infrastructure/metrics';

const log = createLogger('AuditCleanupWorker');

/**
 * Infrastructure worker for audit log cleanup.
 * Follows the same dumb-worker pattern as other workers.
 */
export function createAuditCleanupWorker(
  processor: Processor<AuditCleanupJobData>
): Worker<AuditCleanupJobData> {
  const worker = new Worker<AuditCleanupJobData>('audit-cleanup', processor, {
    connection: getBullMQConnection(),
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.id }, 'Job completed');
    queueJobTotal.inc({ queue: 'audit-cleanup', status: 'completed' });
    if (job.processedOn && job.finishedOn) {
      queueJobDuration.observe({ queue: 'audit-cleanup' }, (job.finishedOn - job.processedOn) / 1000);
    }
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'Job failed');
    queueJobTotal.inc({ queue: 'audit-cleanup', status: 'failed' });
  });

  worker.on('error', (err) => {
    log.error({ err }, 'Worker error');
  });

  return worker;
}
