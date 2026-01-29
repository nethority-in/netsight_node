import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { parsePhoneNumberWithError, ParseError } from 'libphonenumber-js/max';
import type { CountryCode } from 'libphonenumber-js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { retryWithBackoff } from '../utils/retry.js';

dotenv.config();

// Optional: default country when number is entered without country code (e.g. 9876543210 → India). Use ISO 3166-1 alpha-2: IN, US, GB, etc.
const DEFAULT_PHONE_COUNTRY = (process.env.DEFAULT_PHONE_COUNTRY?.trim().toUpperCase() || 'IN') as CountryCode;

// WhatsApp API Configuration
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_VERSION = process.env.META_GRAPH_VERSION;
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

// Token Configuration
// System_User_TOKEN: Production, automated messaging, business-initiated messages, long-term operations
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
  
  /**
   * Validates and normalizes a phone number for WhatsApp (international).
   * Accepts E.164 (+44...), with country code (447700...), or national format with default country (e.g. 9876543210 + DEFAULT_PHONE_COUNTRY=IN).
   * Returns E.164 without '+' for Meta API; rejects invalid or non-mobile/fixed-line-or-mobile numbers.
   */
  static normalizePhoneForWhatsApp(phone: string): { ok: true; e164: string } | { ok: false; message: string } {
    const trimmed = phone.trim();
    if (!trimmed) {
      return { ok: false, message: 'Phone number is required and cannot be empty.' };
    }
    try {
      const parsed = parsePhoneNumberWithError(trimmed, DEFAULT_PHONE_COUNTRY);
      if (!parsed.isValid()) {
        return { ok: false, message: 'Invalid phone number. Please provide a valid number (e.g. +919876543210, +447700900123, or national number with correct country).' };
      }
      const type = parsed.getType();
      const allowedTypes: Array<string | undefined> = ['MOBILE', 'FIXED_LINE_OR_MOBILE'];
      if (type && !allowedTypes.includes(type)) {
        return { ok: false, message: `This number type (${type}) is not supported for WhatsApp. Please use a mobile number.` };
      }
      // Meta WhatsApp API expects E.164 without '+' (digits only)
      const e164 = parsed.format('E.164').replace(/^\+/, '');
      return { ok: true, e164 };
    } catch (e) {
      if (e instanceof ParseError) {
        const msg = e.message || 'Invalid phone number.';
        if (msg.includes('INVALID_COUNTRY') || msg.includes('NOT_A_NUMBER')) {
          return { ok: false, message: 'Invalid phone number or country. Use international format (e.g. +919876543210 for India, +447700900123 for UK).' };
        }
        if (msg.includes('TOO_SHORT') || msg.includes('TOO_LONG') || msg.includes('INVALID_LENGTH')) {
          return { ok: false, message: 'Phone number has invalid length. Use full number with country code (e.g. +919876543210).' };
        }
        return { ok: false, message: msg };
      }
      const fallback = e instanceof Error ? e.message : 'Invalid phone number.';
      return { ok: false, message: fallback };
    }
  }

    /** Validates that WhatsApp API URL can be built (env vars set). */
    private static validateApiConfig(): { valid: boolean; message?: string } {
      if (!PHONE_NUMBER_ID || PHONE_NUMBER_ID === 'undefined') {
        return { valid: false, message: 'WHATSAPP_PHONE_NUMBER_ID is not set in .env. Required for WhatsApp API.' };
      }
      if (!GRAPH_VERSION || GRAPH_VERSION === 'undefined') {
        return { valid: false, message: 'META_GRAPH_VERSION is not set in .env. Required for WhatsApp API.' };
      }
      return { valid: true };
    }

    // Send template message via WhatsApp Cloud API
  
  static async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en_US',
    components?: Array<{
      type: string;
      parameters?: Array<{ type: string; text?: string; payload?: string }>;
      sub_type?: string;
      index?: number;
    }>
  ): Promise<WhatsAppServiceResponse> {
    try {
      const phoneResult = this.normalizePhoneForWhatsApp(to);
      if (!phoneResult.ok) {
        return ErrorHandler.toServiceError(phoneResult.message, 400) as WhatsAppServiceResponse;
      }
      const cleanedPhone = phoneResult.e164;

      const apiConfig = this.validateApiConfig();
      if (!apiConfig.valid) {
        return ErrorHandler.toServiceError(apiConfig.message!, 500) as WhatsAppServiceResponse;
      }

      if (!templateName || typeof templateName !== 'string' || !templateName.trim()) {
        return ErrorHandler.toServiceError('Template name is required and must be a non-empty string.', 400) as WhatsAppServiceResponse;
      }

      const accessToken = this.validateAccessToken();
      if (!accessToken) {
        const envMessage = IS_PRODUCTION
          ? 'Set System_User_TOKEN (preferred) or WHATSAPP_ACCESS_TOKEN in .env'
          : 'Set WHATSAPP_ACCESS_TOKEN (preferred) or System_User_TOKEN in .env';
        return ErrorHandler.toServiceError(`WhatsApp access token not configured. ${envMessage}`, 500) as WhatsAppServiceResponse;
      }

      // Prepare template object
      const template: {
        name: string;
        language: { code: string };
        components?: Array<{
          type: string;
          parameters?: Array<{ type: string; text?: string; payload?: string }>;
          sub_type?: string;
          index?: number;
        }>;
      } = {
        name: templateName,
        language: {
          code: languageCode
        }
      };

      // Add components if provided (header, body, buttons)
      if (components && components.length > 0) {
        template.components = components;
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
        componentsCount: components?.length || 0,
        components: components?.map(c => ({ type: c.type, paramsCount: c.parameters?.length || 0 })),
        url: GRAPH_BASE_URL,
        tokenType,
        tokenPrefix: accessToken.substring(0, 10) + '...'
      });

      // Send request to Meta Graph API
      const response = await retryWithBackoff(
        () =>
          axios.post<MetaGraphResponse>(GRAPH_BASE_URL, payload, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }),
        { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000 }
      );

      console.log('✅ WhatsApp template message sent successfully:', response.data);

      return {
        ok: true,
        meta: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }


    // Send text message via WhatsApp Cloud API
  
  static async sendText(to: string, text: string): Promise<WhatsAppServiceResponse> {
    try {
      const phoneResult = this.normalizePhoneForWhatsApp(to);
      if (!phoneResult.ok) {
        return ErrorHandler.toServiceError(phoneResult.message, 400) as WhatsAppServiceResponse;
      }
      const cleanedPhone = phoneResult.e164;

      if (text == null || typeof text !== 'string') {
        return ErrorHandler.toServiceError('Message text is required and must be a string.', 400) as WhatsAppServiceResponse;
      }
      const trimmedText = text.trim();
      if (trimmedText.length === 0) {
        return ErrorHandler.toServiceError('Message text cannot be empty or whitespace only.', 400) as WhatsAppServiceResponse;
      }
      const WHATSAPP_TEXT_MAX_LENGTH = 4096;
      if (trimmedText.length > WHATSAPP_TEXT_MAX_LENGTH) {
        return ErrorHandler.toServiceError(`Message text must not exceed ${WHATSAPP_TEXT_MAX_LENGTH} characters. Current length: ${trimmedText.length}.`, 400) as WhatsAppServiceResponse;
      }

      const apiConfig = this.validateApiConfig();
      if (!apiConfig.valid) {
        return ErrorHandler.toServiceError(apiConfig.message!, 500) as WhatsAppServiceResponse;
      }

      const accessToken = this.validateAccessToken();
      if (!accessToken) {
        const envMessage = IS_PRODUCTION
          ? 'Set System_User_TOKEN (preferred) or WHATSAPP_ACCESS_TOKEN in .env'
          : 'Set WHATSAPP_ACCESS_TOKEN (preferred) or System_User_TOKEN in .env';
        return ErrorHandler.toServiceError(`WhatsApp access token not configured. ${envMessage}`, 500) as WhatsAppServiceResponse;
      }

      // Prepare Meta Graph API payload
      const payload = {
        messaging_product: 'whatsapp',
        to: cleanedPhone,
        type: 'text',
        text: {
          body: trimmedText
        }
      };

      // Log request details for debugging (without exposing full token)
      const tokenType = IS_PRODUCTION && SYSTEM_USER_TOKEN ? 'System_User_TOKEN' : 'WHATSAPP_ACCESS_TOKEN';
      console.log('📤 Sending WhatsApp text message:', {
        to: cleanedPhone,
        textLength: trimmedText.length,
        url: GRAPH_BASE_URL,
        tokenType,
        tokenPrefix: accessToken.substring(0, 10) + '...'
      });

      // Send request to Meta Graph API with retry on transient failures
      const response = await retryWithBackoff(
        () =>
          axios.post<MetaGraphResponse>(GRAPH_BASE_URL, payload, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }),
        { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000 }
      );

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

        return ErrorHandler.toServiceError(errorMessage, status, errorCode || status, metaError?.error) as WhatsAppServiceResponse;
      } else if (axiosError.request) {
        // Request was made but no response received (timeout, network, etc.)
        const code = (axiosError as NodeJS.ErrnoException).code;
        let msg = 'No response from Meta Graph API. Check your internet connection.';
        if (code === 'ECONNRESET') msg = 'Connection reset by Meta Graph API. Please retry.';
        if (code === 'ETIMEDOUT') msg = 'Request to Meta Graph API timed out. Please retry.';
        if (code === 'ENOTFOUND') msg = 'Could not resolve Meta Graph API host. Check DNS or network.';
        console.error('❌ WhatsApp API request failed - no response:', axiosError.message);
        return ErrorHandler.toServiceError(msg, 503) as WhatsAppServiceResponse;
      }
    }

    if (error instanceof Error && (error as NodeJS.ErrnoException).code) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
        const msg = code === 'ECONNRESET' ? 'Connection reset. Please retry.'
          : code === 'ETIMEDOUT' ? 'Request timed out. Please retry.'
          : 'Could not resolve host. Check network.';
        return ErrorHandler.toServiceError(msg, 503) as WhatsAppServiceResponse;
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ WhatsApp service error:', errorMessage);
    return ErrorHandler.toServiceError(errorMessage, 500) as WhatsAppServiceResponse;
  }
}

export default WhatsAppService;
