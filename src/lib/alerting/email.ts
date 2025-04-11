import nodemailer from 'nodemailer';
import { logger } from '../logger';
import { CustomError } from '../error';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'alerts@cloudoptimization.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { to: options.to, subject: options.subject });
  } catch (error) {
    logger.error('Failed to send email', { error, options });
    throw new CustomError('Failed to send email', 'EMAIL_ERROR');
  }
} 