import { Job } from 'bullmq';
import { EmailJobData } from '../queues';

/**
 * Email processor — business logic that the dumb email worker runs.
 * Lives in infrastructure because it's generic enough, but could live
 * in modules/notification if it needed domain knowledge.
 *
 * In production, swap console.log for actual nodemailer calls.
 */
export async function emailProcessor(job: Job<EmailJobData>): Promise<void> {
  const { to, subject, templateId, variables } = job.data;

  console.log(`[EmailProcessor] Sending "${templateId}" to ${to || variables['assigneeId']}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Variables:`, variables);

  // TODO S10: Wire in nodemailer here
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from: config.EMAIL_FROM, to, subject, html: renderTemplate(templateId, variables) });

  // Simulate async work
  await new Promise((resolve) => setTimeout(resolve, 100));
}
