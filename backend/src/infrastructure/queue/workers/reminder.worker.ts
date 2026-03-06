import { Worker, Processor, Job } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { createLogger } from '@infrastructure/logger';
import { queueJobTotal, queueJobDuration } from '@infrastructure/metrics';

const log = createLogger('ReminderWorker');

export type ReminderCheckJobData = {
  triggeredAt?: string;
};

export function createReminderWorker(processor: Processor<ReminderCheckJobData>): Worker<ReminderCheckJobData> {
  const worker = new Worker<ReminderCheckJobData>('reminders', processor, {
    connection: getBullMQConnection(),
    concurrency: 1, // Process one check at a time
  });

  worker.on('completed', (job: Job) => {
    log.info({ jobId: job.id }, 'Job completed');
    queueJobTotal.inc({ queue: 'reminders', status: 'completed' });
    if (job.processedOn && job.finishedOn) {
      queueJobDuration.observe({ queue: 'reminders' }, (job.finishedOn - job.processedOn) / 1000);
    }
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    log.error({ jobId: job?.id, err }, 'Job failed');
    queueJobTotal.inc({ queue: 'reminders', status: 'failed' });
  });

  worker.on('error', (err: Error) => {
    log.error({ err }, 'Worker error');
  });

  return worker;
}
