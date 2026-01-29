import Mailjet from 'node-mailjet';
import dotenv from 'dotenv';
import { ErrorHandler } from '../utils/errorHandler.js';
import { retryWithBackoff } from '../utils/retry.js';

dotenv.config();

// Mailjet API Configuration
const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;
const MAIL_FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || 'netsightai@gmail.com';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'Netsight';

// Initialize Mailjet client
let mailjetClient: any = null;

if (MAILJET_API_KEY && MAILJET_SECRET_KEY) {
  mailjetClient = Mailjet.Client.apiConnect(MAILJET_API_KEY, MAILJET_SECRET_KEY);
}

// Email Service Response Types
export interface EmailServiceResponse {
  ok: boolean;
  data?: {
    Messages: Array<{
      Status: string;
      To: Array<{ Email: string; MessageID: number }>;
      Cc?: Array<{ Email: string; MessageID: number }>;
      Bcc?: Array<{ Email: string; MessageID: number }>;
    }>;
  };
  error?: {
    message: string;
    status: number;
    code: number;
    details?: unknown;
  };
}

export class EmailService {

  private static validateCredentials(): boolean {
    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error('❌ Mailjet credentials not configured. Set MAILJET_API_KEY and MAILJET_SECRET_KEY in .env');
      return false;
    }
    
    if (!mailjetClient) {
      console.error('❌ Mailjet client not initialized');
      return false;
    }
    
    return true;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  static async sendEmail(
    to: string | string[],
    subject: string,
    htmlContent: string,
    textContent?: string,
    cc?: string[],
    bcc?: string[]
  ): Promise<EmailServiceResponse> {
    try {
      if (!this.validateCredentials()) {
        return ErrorHandler.toServiceError('Mailjet credentials not configured. Set MAILJET_API_KEY and MAILJET_SECRET_KEY in .env', 500) as EmailServiceResponse;
      }

      // Normalize recipients to array
      const toArray = Array.isArray(to) ? to.map((e: unknown) => (e != null ? String(e).trim() : '')).filter(Boolean) : [String(to ?? '').trim()].filter(Boolean);
      if (toArray.length === 0) {
        return ErrorHandler.toServiceError('At least one recipient email address is required. "to" cannot be empty or invalid.', 400) as EmailServiceResponse;
      }

      if (subject == null || typeof subject !== 'string' || subject.trim().length === 0) {
        return ErrorHandler.toServiceError('Email subject is required and cannot be empty or whitespace only.', 400) as EmailServiceResponse;
      }
      if (htmlContent == null || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
        return ErrorHandler.toServiceError('HTML content is required and cannot be empty or whitespace only.', 400) as EmailServiceResponse;
      }

      if (!MAIL_FROM_ADDRESS || !this.validateEmail(MAIL_FROM_ADDRESS)) {
        return ErrorHandler.toServiceError('MAIL_FROM_ADDRESS in .env is missing or invalid. Set a valid sender email.', 500) as EmailServiceResponse;
      }

      // Validate all email addresses
      const invalidEmails: string[] = [];
      toArray.forEach(email => {
        if (!this.validateEmail(email)) {
          invalidEmails.push(email);
        }
      });
      
      const ccList = Array.isArray(cc) ? cc : (cc != null ? [cc] : []);
      const bccList = Array.isArray(bcc) ? bcc : (bcc != null ? [bcc] : []);
      ccList.forEach((email: unknown) => {
        const e = email != null ? String(email).trim() : '';
        if (e && !this.validateEmail(e)) invalidEmails.push(e);
      });
      bccList.forEach((email: unknown) => {
        const e = email != null ? String(email).trim() : '';
        if (e && !this.validateEmail(e)) invalidEmails.push(e);
      });

      if (invalidEmails.length > 0) {
        return ErrorHandler.toServiceError(`Invalid email address(es): ${invalidEmails.join(', ')}`, 400) as EmailServiceResponse;
      }

      // Prepare recipients
      const recipients = toArray.map((email: string) => ({ Email: email.trim() }));
      const ccRecipients = ccList.length > 0 ? ccList.map((email: unknown) => ({ Email: String(email).trim() })) : undefined;
      const bccRecipients = bccList.length > 0 ? bccList.map((email: unknown) => ({ Email: String(email).trim() })) : undefined;

      // Prepare email data
      const emailData = {
        Messages: [
          {
            From: {
              Email: MAIL_FROM_ADDRESS,
              Name: MAIL_FROM_NAME
            },
            To: recipients,
            ...(ccRecipients && ccRecipients.length > 0 && { Cc: ccRecipients }),
            ...(bccRecipients && bccRecipients.length > 0 && { Bcc: bccRecipients }),
            Subject: subject,
            HTMLPart: htmlContent,
            ...(textContent && { TextPart: textContent })
          }
        ]
      };

      console.log('📧 Sending email:', {
        to: toArray,
        subject,
        from: MAIL_FROM_ADDRESS,
        fromName: MAIL_FROM_NAME
      });

      // Send email via Mailjet with retry on transient failures
      const result = await retryWithBackoff(
        () => mailjetClient!.post('send', { version: 'v3.1' }).request(emailData),
        { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000 }
      ) as { body: EmailServiceResponse['data'] };

      console.log('✅ Email sent successfully:', result.body);

      return {
        ok: true,
        data: result.body
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async sendTemplate(
    to: string | string[],
    templateName: string,
    templateVariables: Record<string, any> = {},
    subject?: string,
    cc?: string[],
    bcc?: string[]
  ): Promise<EmailServiceResponse> {
    try {
      if (!this.validateCredentials()) {
        return ErrorHandler.toServiceError('Mailjet credentials not configured. Set MAILJET_API_KEY and MAILJET_SECRET_KEY in .env', 500) as EmailServiceResponse;
      }

      const { getEmailTemplate } = await import('../templates/emailTemplates.js');
      const template = getEmailTemplate(templateName);

      if (!template) {
        return ErrorHandler.toServiceError(`Email template "${templateName}" not found`, 404) as EmailServiceResponse;
      }

      // Replace template variables
      let htmlContent = template.html;
      let emailSubject = subject || template.subject || 'Message from Netsight';

      // Replace variables in HTML content
      Object.keys(templateVariables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, String(templateVariables[key]));
        emailSubject = emailSubject.replace(regex, String(templateVariables[key]));
      });

      // Replace variables in subject if it's in the template
      if (template.subject) {
        Object.keys(templateVariables).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          emailSubject = emailSubject.replace(regex, String(templateVariables[key]));
        });
      }

      // Send email with processed template
      return await this.sendEmail(to, emailSubject, htmlContent, template.text, cc, bcc);
    } catch (error) {
      return this.handleError(error);
    }
  }



  private static handleError(error: unknown): EmailServiceResponse {
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      const status = (err.statusCode ?? err.StatusCode) as number | undefined;
      if (typeof status === 'number') {
        let message = (err.ErrorMessage ?? err.message) as string | undefined;
        if (!message && Array.isArray(err.Errors)) {
          const first = (err.Errors as Array<{ ErrorMessage?: string }>)[0];
          message = first?.ErrorMessage;
        }
        message = message || 'Unknown error from Mailjet API';
        console.error('❌ Mailjet API error:', error);
        return ErrorHandler.toServiceError(String(message), status, status, error) as EmailServiceResponse;
      }
    }

    if (error instanceof Error && (error as NodeJS.ErrnoException).code) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
        const msg = code === 'ECONNRESET' ? 'Connection reset while sending email. Please retry.'
          : code === 'ETIMEDOUT' ? 'Request to Mailjet timed out. Please retry.'
          : 'Could not resolve Mailjet host. Check network.';
        console.error('❌ Email service network error:', error.message);
        return ErrorHandler.toServiceError(msg, 503) as EmailServiceResponse;
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Email service error:', errorMessage);
    return ErrorHandler.toServiceError(errorMessage, 500) as EmailServiceResponse;
  }
}

export default EmailService;
