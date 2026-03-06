import { Worker, Processor, Job } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { ScheduledReportJobData } from '../queues';
import { createLogger } from '@infrastructure/logger';
import { queueJobTotal, queueJobDuration } from '@infrastructure/metrics';

const log = createLogger('ScheduledReportWorker');

export function createScheduledReportWorker(
  processor: Processor<ScheduledReportJobData>
): Worker<ScheduledReportJobData> {
  const worker = new Worker<ScheduledReportJobData>('scheduled-reports', processor, {
    connection: getBullMQConnection(),
    concurrency: 1, // Process one check at a time
  });

  worker.on('completed', (job: Job) => {
    log.info({ jobId: job.id }, 'Job completed');
    queueJobTotal.inc({ queue: 'scheduled-reports', status: 'completed' });
    if (job.processedOn && job.finishedOn) {
      queueJobDuration.observe({ queue: 'scheduled-reports' }, (job.finishedOn - job.processedOn) / 1000);
    }
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    log.error({ jobId: job?.id, err }, 'Job failed');
    queueJobTotal.inc({ queue: 'scheduled-reports', status: 'failed' });
  });

  worker.on('error', (err: Error) => {
    log.error({ err }, 'Worker error');
  });

  return worker;
}
