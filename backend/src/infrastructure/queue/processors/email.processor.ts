import { Job } from 'bullmq';
import { EmailJobData } from '../queues';
import { sendEmail, EmailAttachment } from '../../email/email.client';
import { renderTemplate, EmailTemplate } from '../../email/templates';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('EmailProcessor');

/**
 * Email processor — processes email jobs from the queue.
 * Renders HTML templates and sends via configured SMTP transport.
 */
export async function emailProcessor(job: Job<EmailJobData>): Promise<void> {
  const { to, subject, templateId, variables, attachment } = job.data;

  log.info({ jobId: job.id, templateId, to }, 'Processing email job');

  // Validate template ID
  const validTemplates: EmailTemplate[] = [
    'task-assigned',
    'task-completed',
    'user-invite',
    'reminder',
    'daily-digest',
    'scheduled-report',
  ];

  if (!validTemplates.includes(templateId as EmailTemplate)) {
    throw new Error(`Invalid email template: ${templateId}`);
  }

  // Render the HTML template
  const html = renderTemplate(templateId as EmailTemplate, variables);

  // Prepare attachments if provided
  const attachments: EmailAttachment[] | undefined = attachment
    ? [
        {
          filename: attachment.filename,
          content: Buffer.from(attachment.content, (attachment.encoding as BufferEncoding) || 'base64'),
          contentType: attachment.contentType,
        },
      ]
    : undefined;

  // Send the email
  await sendEmail({
    to,
    subject,
    html,
    attachments,
  });

  log.info({ jobId: job.id, templateId, to, hasAttachment: !!attachment }, 'Email sent');
}
