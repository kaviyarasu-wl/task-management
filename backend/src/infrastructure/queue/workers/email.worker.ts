import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { EmailJobData } from '../queues';

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
    console.log(`[EmailWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[EmailWorker] Worker error:', err);
  });

  return worker;
}
