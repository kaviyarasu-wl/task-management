import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { EmailJobData } from '../queues';
import { createLogger } from '@infrastructure/logger';
import { queueJobTotal, queueJobDuration } from '@infrastructure/metrics';

const log = createLogger('EmailWorker');

/**
 * Infrastructure worker — intentionally dumb.
 * It knows HOW to run jobs but not WHAT the business logic is.
 * Business logic is injected as a processor from the modules layer.
 *
 * This enforces Rule 2: Infrastructure never imports from modules.
 */
export function createEmailWorker(processor: Processor<EmailJobData>): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>('email', processor, {
    connection: getBullMQConnection(),
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.id }, 'Job completed');
    queueJobTotal.inc({ queue: 'email', status: 'completed' });
    if (job.processedOn && job.finishedOn) {
      queueJobDuration.observe({ queue: 'email' }, (job.finishedOn - job.processedOn) / 1000);
    }
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'Job failed');
    queueJobTotal.inc({ queue: 'email', status: 'failed' });
  });

  worker.on('error', (err) => {
    log.error({ err }, 'Worker error');
  });

  return worker;
}
