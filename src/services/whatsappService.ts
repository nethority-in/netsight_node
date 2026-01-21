import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// WhatsApp API Configuration
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_VERSION = process.env.META_GRAPH_VERSION;
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

// Token Configuration
// System_User_TOKEN: Production, automated messaging, business-initiated messages, long-term operations
// WHATSAPP_ACCESS_TOKEN: Development, testing, prototyping
const SYSTEM_USER_TOKEN = process.env.SYSTEM_USER_TOKEN;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

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
   * Get the appropriate access token based on environment
   * Production: System_User_TOKEN (preferred) -> WHATSAPP_ACCESS_TOKEN (fallback)
   * Development: WHATSAPP_ACCESS_TOKEN (preferred) -> System_User_TOKEN (fallback)
   * @returns {string | null} The access token to use, or null if none available
   */
  private static getAccessToken(): string | null {
    if (IS_PRODUCTION) {
      // Production: Prefer System User Token (long-lived, stable)
      if (SYSTEM_USER_TOKEN) {
        console.log('🔑 Using System_User_TOKEN for production');
        return SYSTEM_USER_TOKEN;
      }
      // Fallback to regular access token if system user token not available
      if (WHATSAPP_ACCESS_TOKEN) {
        console.warn('⚠️  System_User_TOKEN not found. Using WHATSAPP_ACCESS_TOKEN as fallback (may expire in 24h)');
        return WHATSAPP_ACCESS_TOKEN;
      }
    } else {
      // Development/Testing: Prefer regular access token (for testing)
      if (WHATSAPP_ACCESS_TOKEN) {
        console.log('🔑 Using WHATSAPP_ACCESS_TOKEN for development/testing');
        return WHATSAPP_ACCESS_TOKEN;
      }
      // Fallback to system user token if regular token not available
      if (SYSTEM_USER_TOKEN) {
        console.warn('⚠️  WHATSAPP_ACCESS_TOKEN not found. Using System_User_TOKEN as fallback');
        return SYSTEM_USER_TOKEN;
      }
    }
    
    return null;
  }

  /**
   * Validate that an access token is configured
   * @returns {string | null} The access token if available, null otherwise
   */
  private static validateAccessToken(): string | null {
    const token = this.getAccessToken();
    
    if (!token) {
      const envMessage = IS_PRODUCTION 
        ? 'Set System_User_TOKEN (preferred) or WHATSAPP_ACCESS_TOKEN in .env'
        : 'Set WHATSAPP_ACCESS_TOKEN (preferred) or System_User_TOKEN in .env';
      
      console.error(`❌ WhatsApp access token not configured. ${envMessage}`);
    }
    
    return token;
  }
  
    // Validate phone number format
    // Must be digits only, no +, no spaces
  
  static validatePhoneNumber(phone: string): boolean {
    // Remove any whitespace
    const cleaned = phone.trim();
    // Check if it's digits only and has reasonable length (10-15 digits)
    return /^\d{10,15}$/.test(cleaned);
  }

    // Send template message via WhatsApp Cloud API
  
  static async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en_US',
    parameters?: Array<{ type: string; text?: string }>
  ): Promise<WhatsAppServiceResponse> {
    try {
      // Clean and validate phone number
      const cleanedPhone = to.trim();
      if (!this.validatePhoneNumber(cleanedPhone)) {
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
      const accessToken = this.validateAccessToken();
      if (!accessToken) {
        const envMessage = IS_PRODUCTION 
          ? 'Set System_User_TOKEN (preferred) or WHATSAPP_ACCESS_TOKEN in .env'
          : 'Set WHATSAPP_ACCESS_TOKEN (preferred) or System_User_TOKEN in .env';
        
        return {
          ok: false,
          error: {
            message: `WhatsApp access token not configured. ${envMessage}`,
            status: 500,
            code: 500
          }
        };
      }

      // Prepare template object
      const template: {
        name: string;
        language: { code: string };
        components?: Array<{
          type: string;
          parameters: Array<{ type: string; text?: string }>;
        }>;
      } = {
        name: templateName,
        language: {
          code: languageCode
        }
      };

      // Add parameters if provided
      if (parameters && parameters.length > 0) {
        template.components = [
          {
            type: 'body',
            parameters: parameters
          }
        ];
      }

      // Prepare Meta Graph API payload
      const payload = {
        messaging_product: 'whatsapp',
        to: cleanedPhone,
        type: 'template',
        template: template
      };

      // Log request details for debugging (without exposing full token)
      const tokenType = IS_PRODUCTION && SYSTEM_USER_TOKEN ? 'System_User_TOKEN' : 'WHATSAPP_ACCESS_TOKEN';
      console.log('📤 Sending WhatsApp template message:', {
        to: cleanedPhone,
        templateName,
        languageCode,
        parametersCount: parameters?.length || 0,
        url: GRAPH_BASE_URL,
        tokenType,
        tokenPrefix: accessToken.substring(0, 10) + '...'
      });

      // Send request to Meta Graph API
      const response = await axios.post<MetaGraphResponse>(GRAPH_BASE_URL, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

  // Send daily KPI snapshot template
  static async sendDailyKpiSnapshot(
    to: string,
    storeName: string,
    date: string,
    businessOverview: string,
    marketingProfitability: string,
    operationsCash: string,
    keySignals: string
  ): Promise<WhatsAppServiceResponse> {
    // Prepare parameters for the template
    const parameters = [
      { type: 'text', text: storeName },
      { type: 'text', text: date },
      { type: 'text', text: businessOverview },
      { type: 'text', text: marketingProfitability },
      { type: 'text', text: operationsCash },
      { type: 'text', text: keySignals }
    ];

    return this.sendTemplate(to, 'daily_kpi_snapshot', 'en', parameters);
  }

    // Send text message via WhatsApp Cloud API
  
  static async sendText(to: string, text: string): Promise<WhatsAppServiceResponse> {
    try {
      // Clean and validate phone number
      const cleanedPhone = to.trim();
      if (!this.validatePhoneNumber(cleanedPhone)) {
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
      const accessToken = this.validateAccessToken();
      if (!accessToken) {
        const envMessage = IS_PRODUCTION 
          ? 'Set System_User_TOKEN (preferred) or WHATSAPP_ACCESS_TOKEN in .env'
          : 'Set WHATSAPP_ACCESS_TOKEN (preferred) or System_User_TOKEN in .env';
        
        return {
          ok: false,
          error: {
            message: `WhatsApp access token not configured. ${envMessage}`,
            status: 500,
            code: 500
          }
        };
      }

      // Prepare Meta Graph API payload
      const payload = {
        messaging_product: 'whatsapp',
        to: cleanedPhone,
        type: 'text',
        text: {
          body: text
        }
      };

      // Log request details for debugging (without exposing full token)
      const tokenType = IS_PRODUCTION && SYSTEM_USER_TOKEN ? 'System_User_TOKEN' : 'WHATSAPP_ACCESS_TOKEN';
      console.log('📤 Sending WhatsApp text message:', {
        to: cleanedPhone,
        textLength: text.length,
        url: GRAPH_BASE_URL,
        tokenType,
        tokenPrefix: accessToken.substring(0, 10) + '...'
      });

      // Send request to Meta Graph API
      const response = await axios.post<MetaGraphResponse>(GRAPH_BASE_URL, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

    // Handle Meta Graph API errors
  
  private static handleError(error: unknown): WhatsAppServiceResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<MetaGraphError>;
      
      if (axiosError.response) {
        // Meta API returned an error response
        const metaError = axiosError.response.data;
        const status = axiosError.response.status;
        const errorCode = metaError?.error?.code;

        console.error('❌ WhatsApp API error:', metaError);

        // Provide helpful messages for common errors
        let errorMessage = metaError?.error?.message || 'Unknown error from Meta Graph API';
        
        if (errorCode === 131030) {
          errorMessage = 'Recipient phone number not in allowed list. Please add the phone number to your Meta Business Manager recipient list. Go to: Meta Business Manager > WhatsApp > API Setup > Manage phone number list';
        } else if (errorCode === 131026) {
          errorMessage = 'Template name not found or not approved. Please use an approved template name from your Meta Business Manager.';
        } else if (errorCode === 132000) {
          errorMessage = 'Number of parameters does not match the expected number of params. Please check that you are providing the correct number of template parameters.';
        } else if (errorCode === 190) {
          const tokenMessage = IS_PRODUCTION 
            ? 'Invalid or expired access token. Please update System_User_TOKEN (preferred) or WHATSAPP_ACCESS_TOKEN in your .env file.'
            : 'Invalid or expired access token. Please update WHATSAPP_ACCESS_TOKEN (preferred) or System_User_TOKEN in your .env file.';
          errorMessage = tokenMessage;
        }

        return {
          ok: false,
          error: {
            message: errorMessage,
            status: status,
            code: errorCode || status,
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
