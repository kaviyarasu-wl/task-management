import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { WebhookJobData } from '../queues';
import { createLogger } from '@infrastructure/logger';
import { queueJobTotal, queueJobDuration } from '@infrastructure/metrics';

const log = createLogger('WebhookWorker');

/**
 * Webhook worker — processes webhook delivery jobs.
 * Business logic is injected as a processor from the modules layer.
 *
 * Concurrency is set to 5 for parallel webhook deliveries
 * since order doesn't matter and we want fast delivery.
 */
export function createWebhookWorker(processor: Processor<WebhookJobData>): Worker<WebhookJobData> {
  const worker = new Worker<WebhookJobData>('webhooks', processor, {
    connection: getBullMQConnection(),
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.id }, 'Job completed');
    queueJobTotal.inc({ queue: 'webhooks', status: 'completed' });
    if (job.processedOn && job.finishedOn) {
      queueJobDuration.observe({ queue: 'webhooks' }, (job.finishedOn - job.processedOn) / 1000);
    }
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'Job failed');
    queueJobTotal.inc({ queue: 'webhooks', status: 'failed' });
  });

  worker.on('error', (err) => {
    log.error({ err }, 'Worker error');
  });

  return worker;
}
