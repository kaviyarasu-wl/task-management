import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { ExportJobData } from '../queues';
import { createLogger } from '@infrastructure/logger';
import { queueJobTotal, queueJobDuration } from '@infrastructure/metrics';

const log = createLogger('ExportWorker');

/**
 * Infrastructure worker for export jobs — intentionally dumb.
 * It knows HOW to run jobs but not WHAT the business logic is.
 * Business logic is injected as a processor from the modules layer.
 */
export function createExportWorker(
  processor: Processor<ExportJobData>
): Worker<ExportJobData> {
  const worker = new Worker<ExportJobData>('exports', processor, {
    connection: getBullMQConnection(),
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.id }, 'Job completed');
    queueJobTotal.inc({ queue: 'exports', status: 'completed' });
    if (job.processedOn && job.finishedOn) {
      queueJobDuration.observe(
        { queue: 'exports' },
        (job.finishedOn - job.processedOn) / 1000
      );
    }
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'Job failed');
    queueJobTotal.inc({ queue: 'exports', status: 'failed' });
  });

  worker.on('error', (err) => {
    log.error({ err }, 'Worker error');
  });

  return worker;
}
