import { Job } from 'bullmq';
import { ReminderJobData } from '../queues';

export async function reminderProcessor(job: Job<ReminderJobData>): Promise<void> {
  const { taskId, assigneeEmail, taskTitle, dueDate } = job.data;

  console.log(`[ReminderProcessor] Sending reminder for task ${taskId}`);
  console.log(`  To: ${assigneeEmail}`);
  console.log(`  Task: "${taskTitle}" due ${dueDate}`);

  // TODO: wire in nodemailer
  await new Promise((resolve) => setTimeout(resolve, 100));
}
