import twilio from 'twilio';
import dotenv from 'dotenv';
import { parsePhoneNumberWithError, ParseError } from 'libphonenumber-js/max';
import type { CountryCode } from 'libphonenumber-js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { getTwilioTemplateId } from '../config/twilioTemplateConfig.js';

dotenv.config();

// Optional: default country when number is entered without country code (e.g. 9876543210 → India).
const DEFAULT_PHONE_COUNTRY = (process.env.DEFAULT_PHONE_COUNTRY?.trim().toUpperCase() || 'IN') as CountryCode;

// Twilio WhatsApp API Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '+19785889593'; // Default Twilio WhatsApp number

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

// Twilio API Response Types
export interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body?: string;
  dateCreated?: Date;
  dateUpdated?: Date;
}

export interface WhatsAppServiceResponse {
  ok: boolean;
  meta?: TwilioMessageResponse;
  error?: {
    message: string;
    status: number;
    code: number;
    details?: unknown;
  };
}

export class WhatsAppService {
  private static validateTwilioConfig(): { valid: boolean; message?: string } {
    if (!TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID === 'undefined') {
      return { valid: false, message: 'TWILIO_ACCOUNT_SID is not set in .env. Required for Twilio WhatsApp API.' };
    }
    if (!TWILIO_AUTH_TOKEN || TWILIO_AUTH_TOKEN === 'undefined') {
      return { valid: false, message: 'TWILIO_AUTH_TOKEN is not set in .env. Required for Twilio WhatsApp API.' };
    }
    if (!TWILIO_WHATSAPP_FROM || TWILIO_WHATSAPP_FROM === 'undefined') {
      return { valid: false, message: 'TWILIO_WHATSAPP_FROM is not set in .env. Required for Twilio WhatsApp API.' };
    }
    return { valid: true };
  }
  // Accepts E.164 (+44...), with country code (447700...), or national format with default country (e.g. 9876543210 + DEFAULT_PHONE_COUNTRY=IN).
  // Returns E.164 with '+' for Twilio API; rejects invalid or non-mobile/fixed-line-or-mobile numbers.
   
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
      // Twilio WhatsApp API expects E.164 with '+' (e.g. +919876543210)
      const e164 = parsed.format('E.164');
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

    // Send template message via Twilio WhatsApp API
  // static async sendTemplate(
  //   to: string,
  //   templateName: string,
  //   _languageCode: string = 'en_US',
  //   components?: Array<{
  //     type: string;
  //     parameters?: Array<{ type: string; text?: string; payload?: string; parameter_name?: string }>;
  //     sub_type?: string;
  //     index?: number;
  //   }>,
  //   fromCredentials?: { phoneNumberId: string; accessToken: string }
  // ): Promise<WhatsAppServiceResponse> {
  //   try {
  //     const phoneResult = this.normalizePhoneForWhatsApp(to);
  //     if (!phoneResult.ok) {
  //       return ErrorHandler.toServiceError(phoneResult.message, 400) as WhatsAppServiceResponse;
  //     }
  //     const cleanedPhone = phoneResult.e164;

  //     if (!templateName || typeof templateName !== 'string' || !templateName.trim()) {
  //       return ErrorHandler.toServiceError('Template name is required and must be a non-empty string.', 400) as WhatsAppServiceResponse;
  //     }

  //     // Validate Twilio configuration
  //     const apiConfig = this.validateTwilioConfig();
  //     if (!apiConfig.valid) {
  //       return ErrorHandler.toServiceError(apiConfig.message!, 500) as WhatsAppServiceResponse;
  //     }

  //     // Get Twilio template ID from mapping
  //     const twilioTemplateId = getTwilioTemplateId(templateName);
  //     if (!twilioTemplateId) {
  //       return ErrorHandler.toServiceError(`Template "${templateName}" not found in Twilio template mappings. Please check twilioTemplateConfig.ts`, 400) as WhatsAppServiceResponse;
  //     }

  //     // Determine from number (use fromCredentials if provided, otherwise use env)
  //     const fromNumber = fromCredentials?.phoneNumberId || TWILIO_WHATSAPP_FROM;

  //     // Extract template parameters from components.
  //     // Twilio Content API expects numeric keys "1","2","3" in the same order as placeholders in the template.
  //     // We use the order of parameters as received (body first, then header) so values from Postman/API are sent as-is.
  //     const contentVariables: Record<string, string> = {};

  //     function sanitizeContentVariable(value: string): string {
  //       if (value == null || typeof value !== 'string') return ' ';
  //       let s = value
  //         .replace(/\r\n|\r|\n/g, ' ')
  //         .replace(/\t/g, ' ')
  //         .replace(/\s{5,}/g, '    '); // max 4 consecutive spaces
  //       return s.trim() === '' ? ' ' : s;
  //     }

  //     if (components && components.length > 0) {
  //       const bodyComponent = components.find(c => c.type === 'body');
  //       if (bodyComponent && bodyComponent.parameters) {
  //         bodyComponent.parameters.forEach((param, index) => {
  //           if (param.type === 'text') {
  //             contentVariables[String(index + 1)] = sanitizeContentVariable(param.text ?? '');
  //           }
  //         });
  //       }

  //       const headerComponent = components.find(c => c.type === 'header');
  //       if (headerComponent && headerComponent.parameters) {
  //         const bodyParamCount = bodyComponent?.parameters?.length ?? 0;
  //         headerComponent.parameters.forEach((param, index) => {
  //           if (param.type === 'text') {
  //             contentVariables[String(bodyParamCount + index + 1)] = sanitizeContentVariable(param.text ?? '');
  //           }
  //         });
  //       }
  //     }

  //     // Build Twilio message payload
  //     const messagePayload: any = {
  //       from: `whatsapp:${fromNumber}`,
  //       to: `whatsapp:${cleanedPhone}`,
  //       contentSid: twilioTemplateId
  //     };

  //     if (Object.keys(contentVariables).length > 0) {
  //       messagePayload.contentVariables = JSON.stringify(contentVariables);
  //     }

  //     console.log('📤 Sending WhatsApp template message via Twilio:', {
  //       to: cleanedPhone,
  //       from: fromNumber,
  //       templateName,
  //       twilioTemplateId,
  //       hasParameters: Object.keys(contentVariables).length > 0
  //     });

  //     // Send via Twilio
  //     const client = getTwilioClient();
  //     const message = await client.messages.create(messagePayload);

  //     console.log('✅ WhatsApp template message sent successfully via Twilio:', {
  //       sid: message.sid,
  //       status: message.status
  //     });

  //     return {
  //       ok: true,
  //       meta: {
  //         sid: message.sid,
  //         status: message.status,
  //         to: message.to || cleanedPhone,
  //         from: message.from || fromNumber,
  //         dateCreated: message.dateCreated,
  //         dateUpdated: message.dateUpdated
  //       }
  //     };
  //   } catch (error) {
  //     return this.handleError(error);
  //   }
  // }
// Send template message via Twilio WhatsApp API
// static async sendTemplate(
//   to: string,
//   templateName: string,
//   _languageCode: string = 'en',
//   components?:
//     | Array<{
//         type: string;
//         parameters?: Array<{
//           type: string;
//           text?: string;
//           payload?: string;
//           parameter_name?: string;
//         }>;
//         sub_type?: string;
//         index?: number;
//       }>
//     | {
//         bodyNamed?: Record<string, unknown>;
//         headerNamed?: Record<string, unknown>;
//         body?: Record<string, unknown>;
//         header?: Record<string, unknown>;
//       },
//   fromCredentials?: { phoneNumberId: string; accessToken: string }
// ): Promise<WhatsAppServiceResponse> {
//   try {
//     const phoneResult = this.normalizePhoneForWhatsApp(to);
//     if (!phoneResult.ok) {
//       return ErrorHandler.toServiceError(phoneResult.message, 400) as WhatsAppServiceResponse;
//     }
//     const cleanedPhone = phoneResult.e164;

//     if (!templateName || typeof templateName !== 'string' || !templateName.trim()) {
//       return ErrorHandler.toServiceError(
//         'Template name is required and must be a non-empty string.',
//         400
//       ) as WhatsAppServiceResponse;
//     }

//     const apiConfig = this.validateTwilioConfig();
//     if (!apiConfig.valid) {
//       return ErrorHandler.toServiceError(apiConfig.message!, 500) as WhatsAppServiceResponse;
//     }

//     const twilioTemplateId = getTwilioTemplateId(templateName);
//     if (!twilioTemplateId) {
//       return ErrorHandler.toServiceError(
//         `Template "${templateName}" not found in Twilio template mappings. Please check twilioTemplateConfig.ts`,
//         400
//       ) as WhatsAppServiceResponse;
//     }

//     const fromNumber = fromCredentials?.phoneNumberId || TWILIO_WHATSAPP_FROM;

//     // Twilio expects ContentVariables as a JSON STRING. :contentReference[oaicite:1]{index=1}
//     const contentVariables: Record<string, string> = {};

//     function sanitizeContentVariable(value: unknown): string | null {
//       if (value === null || value === undefined) return null;
//       const s = String(value)
//         .replace(/\r\n|\r|\n/g, ' ')
//         .replace(/\t/g, ' ')
//         .replace(/\s{5,}/g, '    ') // max 4 consecutive spaces
//         .trim();
//       return s === '' ? null : s;
//     }

//     function setVar(key: string, value: unknown) {
//       const v = sanitizeContentVariable(value);
//       if (v != null) contentVariables[key] = v;
//     }

//     /**
//      * KEY POINT:
//      * Your template variables are literally:
//      *  - {{Store Name}}
//      *  - {{Previous Date}}
//      *  - {{Revenue % Change}}
//      *  - {{Orders % Change}}
//      *
//      * So we map your API keys to those EXACT names to attempt substitution.
//      */
//     const keyMapExactToTemplate: Record<string, string> = {
//       // from your Postman payload
//       Store_Name: 'Store Name',
//       Previous_Date: 'Previous Date',
//       Revenue_Percent_Change: 'Revenue % Change',
//       Orders_Percent_Change: 'Orders % Change',

//       // if you ever send safe keys already
//       StoreName: 'Store Name',
//       PrevDate: 'Previous Date',
//       RevChgPct: 'Revenue % Change',
//       OrdChgPct: 'Orders % Change',

//       // these already match your template variables
//       Revenue: 'Revenue',
//       Orders: 'Orders',
//       AOV: 'AOV',
//       Fb_ROAS: 'Fb_ROAS',
//       GoogleAds_ROAS: 'GoogleAds_ROAS'
//     };

//     // Helper: set both mapped key AND original key (for maximum compatibility)
//     function setWithFallbackKeys(originalKey: string, value: unknown) {
//       const mapped = keyMapExactToTemplate[originalKey];
//       if (mapped) setVar(mapped, value);
//       setVar(originalKey, value);
//     }

//     // 1) ARRAY format (Meta-like)
//     if (Array.isArray(components) && components.length > 0) {
//       const bodyComponent = components.find(c => (c.type ?? '').toLowerCase() === 'body');
//       const headerComponent = components.find(c => (c.type ?? '').toLowerCase() === 'header');

//       const applyParams = (params: any[] | undefined, startIndex: number) => {
//         if (!params?.length) return startIndex;

//         params.forEach((param, idx) => {
//           if ((param.type ?? '').toLowerCase() !== 'text') return;

//           // use parameter_name if provided; else numeric
//           const rawKey = (param.parameter_name ?? '').trim();
//           const key = rawKey || String(startIndex + idx);

//           // If parameter_name is present, map it; else numeric won't map
//           if (rawKey) setWithFallbackKeys(rawKey, param.text ?? '');
//           else setVar(key, param.text ?? '');
//         });

//         return startIndex + params.length;
//       };

//       let nextIndex = 1;
//       nextIndex = applyParams(bodyComponent?.parameters, nextIndex);
//       applyParams(headerComponent?.parameters, nextIndex);
//     }
//     // 2) OBJECT format (your Postman payload)
//     else if (components && typeof components === 'object') {
//       const c: any = components;
//       const bodyNamed = c.bodyNamed ?? c.body;
//       const headerNamed = c.headerNamed ?? c.header;

//       const applyNamed = (obj: any) => {
//         if (!obj || typeof obj !== 'object') return;
//         for (const [k, v] of Object.entries(obj)) {
//           setWithFallbackKeys(k, v);
//         }
//       };

//       applyNamed(bodyNamed);
//       applyNamed(headerNamed);
//     }

//     const messagePayload: any = {
//       from: `whatsapp:${fromNumber}`,
//       to: `whatsapp:${cleanedPhone}`,
//       contentSid: twilioTemplateId,
//       contentVariables: JSON.stringify(contentVariables)
//     };

//     console.log('📤 Twilio send payload (debug):', {
//       to: cleanedPhone,
//       from: fromNumber,
//       templateName,
//       contentSid: twilioTemplateId,
//       contentVariables
//     });

//     const client = getTwilioClient();
//     const message = await client.messages.create(messagePayload);

//     return {
//       ok: true,
//       meta: {
//         sid: message.sid,
//         status: message.status,
//         to: message.to || cleanedPhone,
//         from: message.from || fromNumber,
//         dateCreated: message.dateCreated,
//         dateUpdated: message.dateUpdated
//       }
//     };
//   } catch (error) {
//     return this.handleError(error);
//   }
// }
// static async sendTemplate(
//   to: string,
//   templateName: string,
//   _languageCode: string = 'en',
//   components?:
//     | Array<{
//         type: string;
//         parameters?: Array<{
//           type: string;
//           text?: string;
//           payload?: string;
//           parameter_name?: string;
//         }>;
//         sub_type?: string;
//         index?: number;
//       }>
//     | {
//         bodyNamed?: Record<string, unknown>;
//         headerNamed?: Record<string, unknown>;
//         body?: Record<string, unknown>;
//         header?: Record<string, unknown>;
//       },
//   fromCredentials?: { phoneNumberId: string; accessToken: string }
// ): Promise<WhatsAppServiceResponse> {
//   try {
//     const phoneResult = this.normalizePhoneForWhatsApp(to);
//     if (!phoneResult.ok) {
//       return ErrorHandler.toServiceError(phoneResult.message, 400) as WhatsAppServiceResponse;
//     }
//     const cleanedPhone = phoneResult.e164;

//     if (!templateName || typeof templateName !== 'string' || !templateName.trim()) {
//       return ErrorHandler.toServiceError(
//         'Template name is required and must be a non-empty string.',
//         400
//       ) as WhatsAppServiceResponse;
//     }

//     const apiConfig = this.validateTwilioConfig();
//     if (!apiConfig.valid) {
//       return ErrorHandler.toServiceError(apiConfig.message!, 500) as WhatsAppServiceResponse;
//     }

//     const twilioTemplateId = getTwilioTemplateId(templateName);
//     if (!twilioTemplateId) {
//       return ErrorHandler.toServiceError(
//         `Template "${templateName}" not found in Twilio template mappings. Please check twilioTemplateConfig.ts`,
//         400
//       ) as WhatsAppServiceResponse;
//     }

//     const fromNumber = fromCredentials?.phoneNumberId || TWILIO_WHATSAPP_FROM;

//     // Twilio expects ContentVariables as a JSON STRING:
//     // contentVariables: JSON.stringify({ ... })
//     const contentVariables: Record<string, string> = {};

//     function sanitizeContentVariable(value: unknown): string | null {
//       if (value === null || value === undefined) return null;
//       const s = String(value)
//         .replace(/\r\n|\r|\n/g, ' ')
//         .replace(/\t/g, ' ')
//         .replace(/\s{5,}/g, '    ') // max 4 consecutive spaces
//         .trim();
//       return s === '' ? null : s;
//     }

//     function setVar(key: string, value: unknown) {
//       const v = sanitizeContentVariable(value);
//       if (v != null) contentVariables[key] = v;
//     }

//     /**
//      * NEW TEMPLATE VARIABLES (Twilio placeholders):
//      *  {{StoreName}}, {{PrevDate}}, {{Revenue}}, {{Orders}}, {{AOV}},
//      *  {{RevChgPct}}, {{OrdChgPct}}, {{FbROAS}}, {{GoogleAdsROAS}}
//      *
//      * Map old incoming keys (underscored) -> new template keys.
//      */
//     const keyMap: Record<string, string> = {
//       // Old payload keys -> New template keys
//       Store_Name: 'StoreName',
//       Previous_Date: 'PrevDate',
//       Revenue_Percent_Change: 'RevChgPct',
//       Orders_Percent_Change: 'OrdChgPct',
//       Fb_ROAS: 'FbROAS',
//       GoogleAds_ROAS: 'GoogleAdsROAS',

//       // If you send new keys directly, keep them
//       StoreName: 'StoreName',
//       PrevDate: 'PrevDate',
//       RevChgPct: 'RevChgPct',
//       OrdChgPct: 'OrdChgPct',
//       FbROAS: 'FbROAS',
//       GoogleAdsROAS: 'GoogleAdsROAS',

//       // Same in both
//       Revenue: 'Revenue',
//       Orders: 'Orders',
//       AOV: 'AOV'
//     };

//     // Helper: map key and set
//     function setMapped(originalKey: string, value: unknown) {
//       const mappedKey = keyMap[originalKey] ?? originalKey;
//       setVar(mappedKey, value);
//     }

//     // 1) ARRAY format (Meta-like)
//     if (Array.isArray(components) && components.length > 0) {
//       const bodyComponent = components.find(c => (c.type ?? '').toLowerCase() === 'body');
//       const headerComponent = components.find(c => (c.type ?? '').toLowerCase() === 'header');

//       const applyParams = (params: any[] | undefined, startIndex: number) => {
//         if (!params?.length) return startIndex;

//         params.forEach((param, idx) => {
//           if ((param.type ?? '').toLowerCase() !== 'text') return;

//           // Prefer parameter_name (best), else fall back to numeric
//           const rawKey = (param.parameter_name ?? '').trim();

//           if (rawKey) {
//             setMapped(rawKey, param.text ?? '');
//           } else {
//             // numeric fallback (only useful if your Twilio template is numeric-based)
//             setVar(String(startIndex + idx), param.text ?? '');
//           }
//         });

//         return startIndex + params.length;
//       };

//       let nextIndex = 1;
//       nextIndex = applyParams(bodyComponent?.parameters, nextIndex);
//       applyParams(headerComponent?.parameters, nextIndex);
//     }
//     // 2) OBJECT format (your Postman payload)
//     else if (components && typeof components === 'object') {
//       const c: any = components;
//       const bodyNamed = c.bodyNamed ?? c.body;
//       const headerNamed = c.headerNamed ?? c.header;

//       const applyNamed = (obj: any) => {
//         if (!obj || typeof obj !== 'object') return;
//         for (const [k, v] of Object.entries(obj)) {
//           setMapped(k, v);
//         }
//       };

//       applyNamed(bodyNamed);
//       applyNamed(headerNamed);
//     }

//     const messagePayload: any = {
//       from: `whatsapp:${fromNumber}`,
//       to: `whatsapp:${cleanedPhone}`,
//       contentSid: twilioTemplateId,
//       contentVariables: JSON.stringify(contentVariables)
//     };

//     console.log('📤 Twilio send payload (debug):', {
//       to: cleanedPhone,
//       from: fromNumber,
//       templateName,
//       contentSid: twilioTemplateId,
//       contentVariables
//     });

//     const client = getTwilioClient();
//     const message = await client.messages.create(messagePayload);

//     return {
//       ok: true,
//       meta: {
//         sid: message.sid,
//         status: message.status,
//         to: message.to || cleanedPhone,
//         from: message.from || fromNumber,
//         dateCreated: message.dateCreated,
//         dateUpdated: message.dateUpdated
//       }
//     };
//   } catch (error) {
//     return this.handleError(error);
//   }
// }

static async sendTemplate(
  to: string,
  templateName: string,
  _languageCode: string = 'en',
  components?:
    | Array<{
        type: string;
        parameters?: Array<{
          type: string;
          text?: string;
          payload?: string;
          parameter_name?: string;
        }>;
        sub_type?: string;
        index?: number;
      }>
    | {
        bodyNamed?: Record<string, unknown>;
        headerNamed?: Record<string, unknown>;
        body?: Record<string, unknown>;
        header?: Record<string, unknown>;
      },
  fromCredentials?: { phoneNumberId: string; accessToken: string }
): Promise<WhatsAppServiceResponse> {
  try {
    const phoneResult = this.normalizePhoneForWhatsApp(to);
    if (!phoneResult.ok) {
      return ErrorHandler.toServiceError(phoneResult.message, 400) as WhatsAppServiceResponse;
    }
    const cleanedPhone = phoneResult.e164;

    if (!templateName || typeof templateName !== 'string' || !templateName.trim()) {
      return ErrorHandler.toServiceError(
        'Template name is required and must be a non-empty string.',
        400
      ) as WhatsAppServiceResponse;
    }

    const apiConfig = this.validateTwilioConfig();
    if (!apiConfig.valid) {
      return ErrorHandler.toServiceError(apiConfig.message!, 500) as WhatsAppServiceResponse;
    }

    const twilioTemplateId = getTwilioTemplateId(templateName);
    if (!twilioTemplateId) {
      return ErrorHandler.toServiceError(
        `Template "${templateName}" not found in Twilio template mappings. Please check twilioTemplateConfig.ts`,
        400
      ) as WhatsAppServiceResponse;
    }

    const fromNumber = fromCredentials?.phoneNumberId || TWILIO_WHATSAPP_FROM;

    // Twilio expects ContentVariables as a JSON string
    const contentVariables: Record<string, string> = {};

    function sanitizeContentVariable(value: unknown): string | null {
      if (value === null || value === undefined) return null;
      const s = String(value)
        .replace(/\r\n|\r|\n/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/\s{5,}/g, '    ') // max 4 consecutive spaces
        .trim();
      return s === '' ? null : s;
    }

    function setVar(key: string, value: unknown) {
      const v = sanitizeContentVariable(value);
      if (v != null) contentVariables[key] = v;
    }

    /**
     * OLD TEMPLATE VARIABLES (exactly as in Twilio):
     *  {{Store Name}}, {{Previous Date}}, {{Revenue}}, {{Orders}}, {{AOV}},
     *  {{Revenue % Change}}, {{Orders % Change}}, {{Fb_ROAS}}, {{GoogleAds_ROAS}}
     */
    const keyMap: Record<string, string> = {
      // Your Postman keys -> EXACT template keys
      Store_Name: 'Store Name',
      Previous_Date: 'Previous Date',
      Revenue_Percent_Change: 'Revenue % Change',
      Orders_Percent_Change: 'Orders % Change',

      // Keep these same
      Revenue: 'Revenue',
      Orders: 'Orders',
      AOV: 'AOV',
      Fb_ROAS: 'Fb_ROAS',
      GoogleAds_ROAS: 'GoogleAds_ROAS',

      // If you ever send safe keys directly, map them too
      StoreName: 'Store Name',
      PrevDate: 'Previous Date',
      RevChgPct: 'Revenue % Change',
      OrdChgPct: 'Orders % Change'
    };

    function setMapped(originalKey: string, value: unknown) {
      const mappedKey = keyMap[originalKey] ?? originalKey;
      setVar(mappedKey, value);
    }

    // ARRAY format (if used)
    if (Array.isArray(components) && components.length > 0) {
      const bodyComponent = components.find(c => (c.type ?? '').toLowerCase() === 'body');
      const headerComponent = components.find(c => (c.type ?? '').toLowerCase() === 'header');

      const applyParams = (params: any[] | undefined, startIndex: number) => {
        if (!params?.length) return startIndex;

        params.forEach((param, idx) => {
          if ((param.type ?? '').toLowerCase() !== 'text') return;

          const rawKey = (param.parameter_name ?? '').trim();
          if (rawKey) {
            setMapped(rawKey, param.text ?? '');
          } else {
            // numeric fallback (only useful if template uses {{1}}, {{2}} etc)
            setVar(String(startIndex + idx), param.text ?? '');
          }
        });

        return startIndex + params.length;
      };

      let nextIndex = 1;
      nextIndex = applyParams(bodyComponent?.parameters, nextIndex);
      applyParams(headerComponent?.parameters, nextIndex);
    }
    // OBJECT format (your Postman payload)
    else if (components && typeof components === 'object') {
      const c: any = components;
      const bodyNamed = c.bodyNamed ?? c.body;
      const headerNamed = c.headerNamed ?? c.header;

      const applyNamed = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const [k, v] of Object.entries(obj)) {
          setMapped(k, v);
        }
      };

      applyNamed(bodyNamed);
      applyNamed(headerNamed);
    }

    const messagePayload: any = {
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${cleanedPhone}`,
      contentSid: twilioTemplateId,
      contentVariables: JSON.stringify(contentVariables)
    };

    console.log('📤 Twilio send payload (debug):', {
      to: cleanedPhone,
      from: fromNumber,
      templateName,
      contentSid: twilioTemplateId,
      contentVariables
    });

    const client = getTwilioClient();
    const message = await client.messages.create(messagePayload);

    return {
      ok: true,
      meta: {
        sid: message.sid,
        status: message.status,
        to: message.to || cleanedPhone,
        from: message.from || fromNumber,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated
      }
    };
  } catch (error) {
    return this.handleError(error);
  }
}

    // Send text message via Twilio WhatsApp API
  
  static async sendText(
    to: string,
    text: string,
    fromCredentials?: { phoneNumberId: string; accessToken: string }
  ): Promise<WhatsAppServiceResponse> {
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

      // Validate Twilio configuration
      const apiConfig = this.validateTwilioConfig();
      if (!apiConfig.valid) {
        return ErrorHandler.toServiceError(apiConfig.message!, 500) as WhatsAppServiceResponse;
      }

      // Determine from number (use fromCredentials if provided, otherwise use env)
      const fromNumber = fromCredentials?.phoneNumberId || TWILIO_WHATSAPP_FROM;

      console.log('📤 Sending WhatsApp text message via Twilio:', {
        to: cleanedPhone,
        from: fromNumber,
        textLength: trimmedText.length
      });

      // Send via Twilio
      const client = getTwilioClient();
      const message = await client.messages.create({
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${cleanedPhone}`,
        body: trimmedText
      });

      console.log('✅ WhatsApp text message sent successfully via Twilio:', {
        sid: message.sid,
        status: message.status
      });

      return {
        ok: true,
        meta: {
          sid: message.sid,
          status: message.status,
          to: message.to || cleanedPhone,
          from: message.from || fromNumber,
          body: message.body,
          dateCreated: message.dateCreated,
          dateUpdated: message.dateUpdated
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

    // Handle Twilio API errors
  
  private static handleError(error: unknown): WhatsAppServiceResponse {
    // Handle Twilio-specific errors
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const twilioError = error as { code: number; message: string; status?: number; moreInfo?: string };
      const status = twilioError.status || 500;
      const errorCode = twilioError.code;

      console.error('❌ Twilio WhatsApp API error:', {
        code: errorCode,
        message: twilioError.message,
        moreInfo: twilioError.moreInfo
      });

      // Provide helpful messages for common Twilio errors
      let errorMessage = twilioError.message || 'Unknown error from Twilio API';
      
      if (errorCode === 21211) {
        errorMessage = 'Invalid "To" phone number. Please provide a valid WhatsApp-enabled phone number in E.164 format (e.g., +919876543210).';
      } else if (errorCode === 21212) {
        errorMessage = 'Invalid "From" phone number. Please check TWILIO_WHATSAPP_FROM in your .env file.';
      } else if (errorCode === 21608) {
        errorMessage = 'The "From" number is not a valid WhatsApp-enabled number. Please verify your Twilio WhatsApp number.';
      } else if (errorCode === 21614) {
        errorMessage = 'WhatsApp template not found or not approved. Please check the template ID in twilioTemplateConfig.ts.';
      } else if (errorCode === 20003) {
        errorMessage = 'Twilio authentication failed. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.';
      } else if (errorCode === 20429) {
        errorMessage = 'Too many requests. Please retry after a few seconds.';
      } else if (errorCode === 63049) {
        errorMessage = 'Meta (WhatsApp) chose not to deliver this message: template may be classified as MARKETING. Use UTILITY category for order/transactional templates in Meta/Twilio, or recipient may be temporarily limited for marketing messages. See Twilio Console message log for details.';
      } else if (errorCode === 63033) {
        errorMessage = 'Recipient has opted out of receiving messages from your business.';
      }

      return ErrorHandler.toServiceError(errorMessage, status, errorCode, twilioError) as WhatsAppServiceResponse;
    }

    // Handle network/connection errors
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code) {
        const code = nodeError.code;
        if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
          const msg = code === 'ECONNRESET' ? 'Connection reset. Please retry.'
            : code === 'ETIMEDOUT' ? 'Request timed out. Please retry.'
            : 'Could not resolve host. Check network.';
          console.error('❌ Network error:', msg);
          return ErrorHandler.toServiceError(msg, 503) as WhatsAppServiceResponse;
        }
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ WhatsApp service error:', errorMessage);
    return ErrorHandler.toServiceError(errorMessage, 500) as WhatsAppServiceResponse;
  }

  /** Get From numbers from Twilio (WhatsApp-enabled phone numbers). */
  static async getFromNumbersFromMeta(): Promise<{ ok: boolean; data?: Array<{ id: string; display_phone_number?: string; verified_name?: string }>; error?: { message: string; status: number; code: number } }> {
    try {
      const apiConfig = this.validateTwilioConfig();
      if (!apiConfig.valid) {
        return { ok: false, error: { message: apiConfig.message!, status: 500, code: 500 } };
      }

      const client = getTwilioClient();
      // Fetch incoming phone numbers from Twilio
      const incomingNumbers = await client.incomingPhoneNumbers.list();
      
      // Filter for WhatsApp-enabled numbers and format response
      // Note: Twilio capabilities may vary, so we'll include all numbers and let user configure WhatsApp in Twilio Console
      const whatsappNumbers = incomingNumbers
        .map(num => ({
          id: num.phoneNumber || '',
          display_phone_number: num.phoneNumber || '',
          verified_name: num.friendlyName || undefined
        }));

      // Also include the configured WhatsApp number if it's not in the list
      if (TWILIO_WHATSAPP_FROM && !whatsappNumbers.find(n => n.id === TWILIO_WHATSAPP_FROM)) {
        whatsappNumbers.unshift({
          id: TWILIO_WHATSAPP_FROM,
          display_phone_number: TWILIO_WHATSAPP_FROM,
          verified_name: 'Default WhatsApp Number'
        });
      }

      return { ok: true, data: whatsappNumbers };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, error: { message, status: 500, code: 500 } };
    }
  }

  /** Return credentials to send from a given phone number. For Twilio, this just returns the phone number. */
  static getCredentialsForPhoneNumberId(phoneNumberId: string): { phoneNumberId: string; accessToken: string } | null {
    // For Twilio, we don't need separate credentials per number
    // Just return the phone number as phoneNumberId
    if (!phoneNumberId || String(phoneNumberId).trim() === '') return null;
    return { phoneNumberId: String(phoneNumberId).trim(), accessToken: 'twilio' };
  }

  /** Add a From number in Twilio. Note: Phone numbers must be purchased/configured in Twilio Console. */
  static async addFromNumberInMeta(cc: string, phone_number: string, verified_name?: string): Promise<{ ok: boolean; data?: { id: string }; error?: { message: string; status: number; code: number; details?: unknown } }> {
    try {
      const apiConfig = this.validateTwilioConfig();
      if (!apiConfig.valid) {
        return { ok: false, error: { message: apiConfig.message!, status: 500, code: 500 } };
      }

      // Note: Twilio phone numbers must be purchased through Twilio Console or API
      // This method is kept for compatibility but phone numbers should be configured in Twilio Console
      return {
        ok: false,
        error: {
          message: 'Phone numbers must be purchased and configured through Twilio Console. Use Twilio Console to add WhatsApp-enabled phone numbers.',
          status: 400,
          code: 400,
          details: { phone_number, cc, verified_name }
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, error: { message, status: 500, code: 500 } };
    }
  }
}

export default WhatsAppService;
