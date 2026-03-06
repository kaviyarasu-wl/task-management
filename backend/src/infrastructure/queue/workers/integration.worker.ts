import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { IntegrationJobData } from '../queues';
import { createLogger } from '@infrastructure/logger';
import { queueJobTotal, queueJobDuration } from '@infrastructure/metrics';

const log = createLogger('IntegrationWorker');

export function createIntegrationWorker(processor: Processor<IntegrationJobData>): Worker<IntegrationJobData> {
  const worker = new Worker<IntegrationJobData>('integrations', processor, {
    connection: getBullMQConnection(),
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.id }, 'Job completed');
    queueJobTotal.inc({ queue: 'integrations', status: 'completed' });
    if (job.processedOn && job.finishedOn) {
      queueJobDuration.observe({ queue: 'integrations' }, (job.finishedOn - job.processedOn) / 1000);
    }
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'Job failed');
    queueJobTotal.inc({ queue: 'integrations', status: 'failed' });
  });

  worker.on('error', (err) => {
    log.error({ err }, 'Worker error');
  });

  return worker;
}
