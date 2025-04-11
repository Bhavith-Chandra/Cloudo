import nodemailer from 'nodemailer'

interface EmailOptions {
  subject: string
  body: string
  to?: string
}

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const EMAIL_TO = process.env.EMAIL_TO || 'admin@example.com'

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

export async function sendEmailNotification(options: EmailOptions) {
  try {
    await transporter.sendMail({
      from: SMTP_USER,
      to: options.to || EMAIL_TO,
      subject: options.subject,
      text: options.body,
    })
  } catch (error) {
    console.error('Failed to send email notification:', error)
  }
} 