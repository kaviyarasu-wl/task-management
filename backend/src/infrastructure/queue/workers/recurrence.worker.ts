import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { RecurrenceJobData } from '../queues';
import { createLogger } from '@infrastructure/logger';
import { queueJobTotal, queueJobDuration } from '@infrastructure/metrics';

const log = createLogger('RecurrenceWorker');

export function createRecurrenceWorker(
  processor: Processor<RecurrenceJobData>
): Worker<RecurrenceJobData> {
  const worker = new Worker<RecurrenceJobData>('recurrence', processor, {
    connection: getBullMQConnection(),
    concurrency: 1, // Process one check at a time to avoid race conditions
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.id }, 'Job completed');
    queueJobTotal.inc({ queue: 'recurrence', status: 'completed' });
    if (job.processedOn && job.finishedOn) {
      queueJobDuration.observe({ queue: 'recurrence' }, (job.finishedOn - job.processedOn) / 1000);
    }
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'Job failed');
    queueJobTotal.inc({ queue: 'recurrence', status: 'failed' });
  });

  worker.on('error', (err) => {
    log.error({ err }, 'Worker error');
  });

  return worker;
}
