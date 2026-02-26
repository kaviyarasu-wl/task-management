import nodemailer from 'nodemailer';
import { config } from '../../config';

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: config.SMTP_USER
      ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
      : undefined,
  });

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const t = getEmailTransporter();
  await t.sendMail({
    from: config.EMAIL_FROM,
    ...options,
  });
}
