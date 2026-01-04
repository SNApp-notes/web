/**
 * @module email
 * @description Email service for sending transactional emails via SMTP using Handlebars templates.
 * Used for email verification, password reset, and account deletion confirmation.
 *
 * @dependencies
 * - nodemailer: SMTP client for sending emails
 * - handlebars: Template engine for email content
 * - fs/promises: File system operations to read templates
 *
 * @remarks
 * - Requires SMTP environment variables: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL
 * - Email templates are stored in src/emails/ directory as .hbs (HTML) and .txt (plain text) files
 * - Errors are logged to console but do not throw to prevent breaking auth flows
 * - Port 465 uses secure connection, other ports use STARTTLS
 *
 * @example
 * ```ts
 * await sendVerifyEmail({ to: 'user@example.com', name: 'John', url: 'https://...' });
 * await sendResetPasswordEmail({ to: 'user@example.com', name: 'John', url: 'https://...' });
 * await sendDeleteAccountEmail({ to: 'user@example.com', name: 'John', url: 'https://...' });
 * ```
 */

import 'server-only';

import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Email template types available in the system.
 *
 * @enum {string}
 * @property {string} VERIFY_EMAIL - Email verification template
 * @property {string} RESET_PASSWORD - Password reset template
 * @property {string} DELETE_ACCOUNT - Account deletion confirmation template
 */
export enum EmailTemplate {
  VERIFY_EMAIL = 'verify-email',
  RESET_PASSWORD = 'reset-password',
  DELETE_ACCOUNT = 'delete-account'
}

/**
 * Base template data shared across all email templates.
 *
 * @interface BaseEmailData
 * @property {string} to - Recipient email address
 * @property {string} name - Recipient name (or 'there' as fallback)
 * @property {string} url - Action URL (verification link, reset link, etc.)
 */
interface BaseEmailData {
  to: string;
  name: string;
  url: string;
}

/**
 * Email subjects mapped to template types.
 */
const EMAIL_SUBJECTS: Record<EmailTemplate, string> = {
  [EmailTemplate.VERIFY_EMAIL]: 'Verify your email address - SNApp',
  [EmailTemplate.RESET_PASSWORD]: 'Reset Your Password - SNApp',
  [EmailTemplate.DELETE_ACCOUNT]: 'Confirm Account Deletion - SNApp'
};

/**
 * Template cache to avoid repeated file system reads.
 */
const templateCache = new Map<
  string,
  { html: HandlebarsTemplateDelegate; text: HandlebarsTemplateDelegate }
>();

/**
 * Loads and compiles email templates from the file system.
 *
 * @async
 * @param {EmailTemplate} template - The template type to load
 * @returns {Promise<{ html: HandlebarsTemplateDelegate; text: HandlebarsTemplateDelegate }>} Compiled Handlebars templates
 * @throws {Error} If template files cannot be read or compiled
 *
 * @remarks
 * - Templates are cached after first load for performance
 * - Expects .html.hbs and .txt.hbs files in src/emails/ directory
 */
async function loadTemplate(
  template: EmailTemplate
): Promise<{ html: HandlebarsTemplateDelegate; text: HandlebarsTemplateDelegate }> {
  const cacheKey = template;

  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  const templatesDir = join(process.cwd(), 'src', 'emails');
  const htmlPath = join(templatesDir, `${template}.html.hbs`);
  const textPath = join(templatesDir, `${template}.txt.hbs`);

  const [htmlSource, textSource] = await Promise.all([
    readFile(htmlPath, 'utf-8'),
    readFile(textPath, 'utf-8')
  ]);

  const compiled = {
    html: Handlebars.compile(htmlSource),
    text: Handlebars.compile(textSource)
  };

  templateCache.set(cacheKey, compiled);
  return compiled;
}

/**
 * Internal function to send emails via SMTP.
 *
 * @async
 * @param {EmailTemplate} template - The email template to use
 * @param {BaseEmailData & Record<string, unknown>} data - Template data including recipient and variables
 * @returns {Promise<void>} Resolves when email is sent successfully
 *
 * @throws {Error} Does not throw - errors are caught and logged to console
 *
 * @remarks
 * - Uses environment variables for SMTP configuration
 * - Port 465 uses secure: true, other ports use STARTTLS
 * - Errors are logged but not thrown to prevent auth flow interruption
 * - From address is set via SMTP_FROM_EMAIL environment variable
 */
async function sendTemplateEmail(
  template: EmailTemplate,
  data: BaseEmailData
): Promise<void> {
  try {
    const { html, text } = await loadTemplate(template);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const templateData = { name: data.name || 'there', url: data.url };

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: data.to,
      subject: EMAIL_SUBJECTS[template],
      text: text(templateData),
      html: html(templateData)
    });
  } catch (error) {
    console.error(`[PROD] Failed to send ${template} email to ${data.to}:`, error);
  }
}

/**
 * Sends an email verification email to a user.
 *
 * @async
 * @param {object} data - Email data
 * @param {string} data.to - Recipient email address
 * @param {string} data.name - Recipient name
 * @param {string} data.url - Verification URL
 * @returns {Promise<void>} Resolves when email is sent
 *
 * @example
 * ```ts
 * await sendVerifyEmail({
 *   to: 'user@example.com',
 *   name: 'John Doe',
 *   url: 'https://app.com/verify?token=abc123'
 * });
 * ```
 */
export async function sendVerifyEmail(data: BaseEmailData): Promise<void> {
  return sendTemplateEmail(EmailTemplate.VERIFY_EMAIL, data);
}

/**
 * Sends a password reset email to a user.
 *
 * @async
 * @param {object} data - Email data
 * @param {string} data.to - Recipient email address
 * @param {string} data.name - Recipient name
 * @param {string} data.url - Password reset URL
 * @returns {Promise<void>} Resolves when email is sent
 *
 * @example
 * ```ts
 * await sendResetPasswordEmail({
 *   to: 'user@example.com',
 *   name: 'John Doe',
 *   url: 'https://app.com/reset?token=xyz789'
 * });
 * ```
 */
export async function sendResetPasswordEmail(data: BaseEmailData): Promise<void> {
  return sendTemplateEmail(EmailTemplate.RESET_PASSWORD, data);
}

/**
 * Sends an account deletion confirmation email to a user.
 *
 * @async
 * @param {object} data - Email data
 * @param {string} data.to - Recipient email address
 * @param {string} data.name - Recipient name
 * @param {string} data.url - Deletion confirmation URL
 * @returns {Promise<void>} Resolves when email is sent
 *
 * @example
 * ```ts
 * await sendDeleteAccountEmail({
 *   to: 'user@example.com',
 *   name: 'John Doe',
 *   url: 'https://app.com/delete?token=def456'
 * });
 * ```
 */
export async function sendDeleteAccountEmail(data: BaseEmailData): Promise<void> {
  return sendTemplateEmail(EmailTemplate.DELETE_ACCOUNT, data);
}
