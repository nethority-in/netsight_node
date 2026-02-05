import twilio from 'twilio';
import dotenv from 'dotenv';
import { ErrorHandler } from '../utils/errorHandler.js';

dotenv.config();

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Initialize Twilio client
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    }
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export interface TwilioTemplateServiceResponse {
  ok: boolean;
  data?: any;
  error?: {
    message: string;
    status: number;
    code: number;
    details?: unknown;
  };
}

export class TwilioTemplateService {
  private static validateConfig(): { valid: boolean; message?: string } {
    if (!TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID === 'undefined') {
      return { valid: false, message: 'TWILIO_ACCOUNT_SID is not set in .env' };
    }
    if (!TWILIO_AUTH_TOKEN || TWILIO_AUTH_TOKEN === 'undefined') {
      return { valid: false, message: 'TWILIO_AUTH_TOKEN is not set in .env' };
    }
    return { valid: true };
  }

  
    //Create a WhatsApp Content Template in Twilio

  static async createTemplate(template: {
    friendlyName: string;
    language: string;
    body: string;
    category?: string;
  }): Promise<TwilioTemplateServiceResponse> {
    try {
      const config = this.validateConfig();
      if (!config.valid) {
        return ErrorHandler.toServiceError(config.message!, 500) as TwilioTemplateServiceResponse;
      }

      const client = getTwilioClient();

      // Create Content Template
      const contentTemplate = {
        friendlyName: template.friendlyName,
        language: template.language || 'en',
        types: {
          'twilio/text': {
            body: template.body
          }
        }
      };

      console.log('📤 Creating Twilio WhatsApp Content Template:', {
        friendlyName: template.friendlyName,
        language: template.language
      });

      const content = await client.content.v1.contents.create(contentTemplate as any);

      console.log('✅ Twilio Content Template created successfully:', {
        sid: content.sid,
        friendlyName: content.friendlyName
      });

      return {
        ok: true,
        data: {
          sid: content.sid,
          friendlyName: content.friendlyName,
          language: content.language,
          types: content.types,
          dateCreated: content.dateCreated,
          dateUpdated: content.dateUpdated
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

   //Get all WhatsApp Content Templates from Twilio

  static async getTemplatesFromTwilio(): Promise<TwilioTemplateServiceResponse> {
    try {
      const config = this.validateConfig();
      if (!config.valid) {
        return ErrorHandler.toServiceError(config.message!, 500) as TwilioTemplateServiceResponse;
      }

      const client = getTwilioClient();

      console.log('📤 Fetching Twilio WhatsApp Content Templates...');

      const contents = await client.content.v1.contents.list();

      // Filter for WhatsApp templates (content with twilio/text type)
      const whatsappTemplates = contents
        .filter(content => content.types && 'twilio/text' in content.types)
        .map(content => ({
          sid: content.sid,
          friendlyName: content.friendlyName,
          language: content.language,
          types: content.types,
          dateCreated: content.dateCreated,
          dateUpdated: content.dateUpdated
        }));

      console.log(`✅ Found ${whatsappTemplates.length} WhatsApp Content Templates`);

      return {
        ok: true,
        data: {
          templates: whatsappTemplates,
          count: whatsappTemplates.length
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

   //Get a specific Content Template by SID

  static async getTemplateBySid(contentSid: string): Promise<TwilioTemplateServiceResponse> {
    try {
      const config = this.validateConfig();
      if (!config.valid) {
        return ErrorHandler.toServiceError(config.message!, 500) as TwilioTemplateServiceResponse;
      }

      const client = getTwilioClient();

      console.log('📤 Fetching Twilio Content Template:', contentSid);

      const content = await client.content.v1.contents(contentSid).fetch();

      return {
        ok: true,
        data: {
          sid: content.sid,
          friendlyName: content.friendlyName,
          language: content.language,
          types: content.types,
          dateCreated: content.dateCreated,
          dateUpdated: content.dateUpdated
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }


   //Update a Content Template

  static async updateTemplate(contentSid: string, template: {
    friendlyName?: string;
    body?: string;
  }): Promise<TwilioTemplateServiceResponse> {
    try {
      const config = this.validateConfig();
      if (!config.valid) {
        return ErrorHandler.toServiceError(config.message!, 500) as TwilioTemplateServiceResponse;
      }

      const client = getTwilioClient();

      // First fetch the existing template
      const existingContent = await client.content.v1.contents(contentSid).fetch();

      const updatedTemplate = {
        friendlyName: template.friendlyName || existingContent.friendlyName || '',
        language: existingContent.language || 'en',
        types: {
          'twilio/text': {
            body: template.body || (existingContent.types?.['twilio/text'] as any)?.body || ''
          }
        }
      };

      console.log('📤 Updating Twilio Content Template:', contentSid);

      const content = await client.content.v1.contents(contentSid).update(updatedTemplate as any);

      return {
        ok: true,
        data: {
          sid: content.sid,
          friendlyName: content.friendlyName,
          language: content.language,
          types: content.types,
          dateUpdated: content.dateUpdated
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }


   //Delete a Content Template

  static async deleteTemplate(contentSid: string): Promise<TwilioTemplateServiceResponse> {
    try {
      const config = this.validateConfig();
      if (!config.valid) {
        return ErrorHandler.toServiceError(config.message!, 500) as TwilioTemplateServiceResponse;
      }

      const client = getTwilioClient();

      console.log('📤 Deleting Twilio Content Template:', contentSid);

      await client.content.v1.contents(contentSid).remove();

      return {
        ok: true,
        data: {
          message: `Template ${contentSid} deleted successfully`
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private static handleError(error: unknown): TwilioTemplateServiceResponse {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const twilioError = error as { code: number; message: string; status?: number; moreInfo?: string };
      const status = twilioError.status || 500;
      const errorCode = twilioError.code;

      console.error('❌ Twilio Template API error:', {
        code: errorCode,
        message: twilioError.message,
        moreInfo: twilioError.moreInfo
      });

      let errorMessage = twilioError.message || 'Unknown error from Twilio API';

      if (errorCode === 20003) {
        errorMessage = 'Twilio authentication failed. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.';
      } else if (errorCode === 20404) {
        errorMessage = 'Template not found. Please check the template SID.';
      }

      return ErrorHandler.toServiceError(errorMessage, status, errorCode, twilioError) as TwilioTemplateServiceResponse;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Twilio Template service error:', errorMessage);
    return ErrorHandler.toServiceError(errorMessage, 500) as TwilioTemplateServiceResponse;
  }
}



