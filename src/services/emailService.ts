import Mailjet from 'node-mailjet';
import dotenv from 'dotenv';

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
      // Validate credentials
      if (!this.validateCredentials()) {
        return {
          ok: false,
          error: {
            message: 'Mailjet credentials not configured. Set MAILJET_API_KEY and MAILJET_SECRET_KEY in .env',
            status: 500,
            code: 500
          }
        };
      }

      // Normalize recipients to array
      const toArray = Array.isArray(to) ? to : [to];
      
      // Validate all email addresses
      const invalidEmails: string[] = [];
      toArray.forEach(email => {
        if (!this.validateEmail(email)) {
          invalidEmails.push(email);
        }
      });
      
      if (cc) {
        cc.forEach(email => {
          if (!this.validateEmail(email)) {
            invalidEmails.push(email);
          }
        });
      }
      
      if (bcc) {
        bcc.forEach(email => {
          if (!this.validateEmail(email)) {
            invalidEmails.push(email);
          }
        });
      }

      if (invalidEmails.length > 0) {
        return {
          ok: false,
          error: {
            message: `Invalid email address(es): ${invalidEmails.join(', ')}`,
            status: 400,
            code: 400
          }
        };
      }

      // Prepare recipients
      const recipients = toArray.map(email => ({ Email: email.trim() }));
      const ccRecipients = cc ? cc.map(email => ({ Email: email.trim() })) : undefined;
      const bccRecipients = bcc ? bcc.map(email => ({ Email: email.trim() })) : undefined;

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

      // Send email via Mailjet
      const result = await mailjetClient!.post('send', { version: 'v3.1' }).request(emailData);

      console.log('✅ Email sent successfully:', result.body);

      return {
        ok: true,
        data: result.body as EmailServiceResponse['data']
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
      // Validate credentials
      if (!this.validateCredentials()) {
        return {
          ok: false,
          error: {
            message: 'Mailjet credentials not configured. Set MAILJET_API_KEY and MAILJET_SECRET_KEY in .env',
            status: 500,
            code: 500
          }
        };
      }

      // Import template
      const { getEmailTemplate } = await import('../templates/emailTemplates.js');
      const template = getEmailTemplate(templateName);

      if (!template) {
        return {
          ok: false,
          error: {
            message: `Email template "${templateName}" not found`,
            status: 404,
            code: 404
          }
        };
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
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const mailjetError = error as { statusCode: number; message?: string; ErrorMessage?: string };
      const status = mailjetError.statusCode || 500;
      const message = mailjetError.ErrorMessage || mailjetError.message || 'Unknown error from Mailjet API';

      console.error('❌ Mailjet API error:', error);

      return {
        ok: false,
        error: {
          message,
          status,
          code: status,
          details: error
        }
      };
    }

    // Unknown error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Email service error:', errorMessage);
    return {
      ok: false,
      error: {
        message: errorMessage,
        status: 500,
        code: 500
      }
    };
  }
}

export default EmailService;
