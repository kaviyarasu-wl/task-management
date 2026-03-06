import { Worker, Processor, Job } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { DigestJobData } from '../queues';
import { createLogger } from '@infrastructure/logger';
import { queueJobTotal, queueJobDuration } from '@infrastructure/metrics';

const log = createLogger('DigestWorker');

export function createDigestWorker(processor: Processor<DigestJobData>): Worker<DigestJobData> {
  const worker = new Worker<DigestJobData>('digest', processor, {
    connection: getBullMQConnection(),
    concurrency: 1, // Process one digest job at a time
  });

  worker.on('completed', (job: Job) => {
    log.info({ jobId: job.id }, 'Job completed');
    queueJobTotal.inc({ queue: 'digest', status: 'completed' });
    if (job.processedOn && job.finishedOn) {
      queueJobDuration.observe({ queue: 'digest' }, (job.finishedOn - job.processedOn) / 1000);
    }
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    log.error({ jobId: job?.id, err }, 'Job failed');
    queueJobTotal.inc({ queue: 'digest', status: 'failed' });
  });

  worker.on('error', (err: Error) => {
    log.error({ err }, 'Worker error');
  });

  return worker;
}
