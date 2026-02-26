import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { ReminderJobData } from '../queues';

export function createReminderWorker(processor: Processor<ReminderJobData>): Worker<ReminderJobData> {
  const worker = new Worker<ReminderJobData>('reminders', processor, {
    connection: getBullMQConnection(),
    concurrency: 3,
  });

  worker.on('completed', (job) => {
    console.log(`[ReminderWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[ReminderWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[ReminderWorker] Worker error:', err);
  });

  return worker;
}
