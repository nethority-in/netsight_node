import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// WhatsApp API Configuration
// Support both old and new env variable names
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || 
                        process.env.User_Number_ID?.trim() || 
                        '942341315626645';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 
                    process.env['WhatsApp-Connection_string'] || 
                    '';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v22.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

// Meta Graph API Response Types
export interface MetaGraphResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface MetaGraphError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface WhatsAppServiceResponse {
  ok: boolean;
  meta?: MetaGraphResponse;
  error?: {
    message: string;
    status: number;
    code: number;
    details?: unknown;
  };
}

export class WhatsAppService {
  /**
   * Validate phone number format
   * Must be digits only, no +, no spaces
   */
  static validatePhoneNumber(phone: string): boolean {
    // Remove any whitespace
    const cleaned = phone.trim();
    // Check if it's digits only and has reasonable length (10-15 digits)
    return /^\d{10,15}$/.test(cleaned);
  }

  /**
   * Send template message via WhatsApp Cloud API
   */
  static async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en_US'
  ): Promise<WhatsAppServiceResponse> {
    try {
      // Validate phone number
      if (!this.validatePhoneNumber(to)) {
        return {
          ok: false,
          error: {
            message: 'Invalid phone number format. Must be digits only (10-15 digits), no + or spaces.',
            status: 400,
            code: 400
          }
        };
      }

      // Validate access token
      if (!ACCESS_TOKEN) {
        return {
          ok: false,
          error: {
            message: 'WhatsApp access token not configured. Set WHATSAPP_ACCESS_TOKEN in .env',
            status: 500,
            code: 500
          }
        };
      }

      // Prepare Meta Graph API payload
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      };

      // Send request to Meta Graph API
      const response = await axios.post<MetaGraphResponse>(GRAPH_BASE_URL, payload, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ WhatsApp template message sent successfully:', response.data);

      return {
        ok: true,
        meta: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send text message via WhatsApp Cloud API
   */
  static async sendText(to: string, text: string): Promise<WhatsAppServiceResponse> {
    try {
      // Validate phone number
      if (!this.validatePhoneNumber(to)) {
        return {
          ok: false,
          error: {
            message: 'Invalid phone number format. Must be digits only (10-15 digits), no + or spaces.',
            status: 400,
            code: 400
          }
        };
      }

      // Validate access token
      if (!ACCESS_TOKEN) {
        return {
          ok: false,
          error: {
            message: 'WhatsApp access token not configured. Set WHATSAPP_ACCESS_TOKEN in .env',
            status: 500,
            code: 500
          }
        };
      }

      // Prepare Meta Graph API payload
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: text
        }
      };

      // Send request to Meta Graph API
      const response = await axios.post<MetaGraphResponse>(GRAPH_BASE_URL, payload, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ WhatsApp text message sent successfully:', response.data);

      return {
        ok: true,
        meta: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle Meta Graph API errors
   */
  private static handleError(error: unknown): WhatsAppServiceResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<MetaGraphError>;
      
      if (axiosError.response) {
        // Meta API returned an error response
        const metaError = axiosError.response.data;
        const status = axiosError.response.status;

        console.error('❌ WhatsApp API error:', metaError);

        return {
          ok: false,
          error: {
            message: metaError?.error?.message || 'Unknown error from Meta Graph API',
            status: status,
            code: metaError?.error?.code || status,
            details: metaError?.error
          }
        };
      } else if (axiosError.request) {
        // Request was made but no response received
        console.error('❌ WhatsApp API request failed - no response:', axiosError.message);
        return {
          ok: false,
          error: {
            message: 'No response from Meta Graph API. Check your internet connection.',
            status: 503,
            code: 503
          }
        };
      }
    }

    // Unknown error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ WhatsApp service error:', errorMessage);
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

export default WhatsAppService;
