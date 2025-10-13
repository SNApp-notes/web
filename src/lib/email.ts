import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // In development, just log - no verification emails needed
    console.log(`[DEV] Email skipped in development mode`);
    console.log(`[DEV] Would send to: ${options.to} | Subject: ${options.subject}`);
    return;
  }

  // Production: Send actual email via SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html
    });

    console.log(`[PROD] Email sent successfully to: ${options.to}`);
  } catch (error) {
    console.error(`[PROD] Failed to send email to ${options.to}:`, error);
    throw new Error(`Failed to send email: ${error}`);
  }
}
