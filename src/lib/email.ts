/**
 * @module email
 * @description Email service for sending transactional emails via SMTP.
 * Used for email verification, password reset, and account deletion confirmation.
 *
 * @dependencies
 * - nodemailer: SMTP client for sending emails
 *
 * @remarks
 * - Requires SMTP environment variables: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL
 * - Errors are logged to console but do not throw to prevent breaking auth flows
 * - Port 465 uses secure connection, other ports use STARTTLS
 *
 * @example
 * ```ts
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<h1>Welcome to our app!</h1>',
 *   text: 'Welcome to our app!'
 * });
 * ```
 */

import nodemailer from 'nodemailer';

/**
 * Email options for sending transactional emails.
 *
 * @interface EmailOptions
 * @property {string} to - Recipient email address
 * @property {string} subject - Email subject line
 * @property {string} [text] - Plain text version of email body (optional but recommended for accessibility)
 * @property {string} html - HTML version of email body (required)
 */
interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

/**
 * Sends an email via SMTP using configured nodemailer transport.
 *
 * @async
 * @param {EmailOptions} options - Email configuration options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} [options.text] - Plain text version (optional but recommended)
 * @param {string} options.html - HTML formatted email body
 *
 * @returns {Promise<void>} Resolves when email is sent successfully
 *
 * @throws {Error} Does not throw - errors are caught and logged to console
 *
 * @example
 * ```ts
 * // Send verification email
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Verify your email',
 *   text: 'Click here to verify: https://app.com/verify?token=abc123',
 *   html: '<p>Click <a href="https://app.com/verify?token=abc123">here</a> to verify</p>'
 * });
 * ```
 *
 * @remarks
 * - Uses environment variables for SMTP configuration
 * - Port 465 uses secure: true, other ports use STARTTLS
 * - Errors are logged but not thrown to prevent auth flow interruption
 * - From address is set via SMTP_FROM_EMAIL environment variable
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
  } catch (error) {
    console.error(`[PROD] Failed to send email to ${options.to}:`, error);
  }
}
