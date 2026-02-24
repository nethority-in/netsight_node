import twilio from 'twilio';
import dotenv from 'dotenv';
import { parsePhoneNumberWithError, ParseError } from 'libphonenumber-js/max';
import type { CountryCode } from 'libphonenumber-js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { getTwilioTemplateId } from '../config/twilioTemplateConfig.js';
import { appendWhatsAppLog } from '../utils/logApiResponse.js';

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




  

static async sendTemplate(
  to: string,
  templateName: string,
  _languageCode: string = 'en_US',
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

    // ----------------------------
    // Build contentVariables (dynamic)
    // ----------------------------
    const contentVariables: Record<string, string> = {};

    function sanitizeContentVariable(value: unknown): string | null {
      if (value === null || value === undefined) return null;

      // Preserve line breaks (WhatsApp supports newlines in text)
      const s = String(value)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/[ ]{5,}/g, '    ') // max 4 consecutive spaces
        .trim();

      return s === '' ? null : s;
    }

    function setVar(key: string, value: unknown) {
      const v = sanitizeContentVariable(value);
      if (v != null) contentVariables[key] = v;
    }

    // Normalize incoming keys (Store_Name -> StoreName etc.)
    function normalizeKey(k: string): string {
      const key = String(k ?? '').trim();
      const lower = key.toLowerCase();

      // ---- Highly-used mappings (fixes your exact issue) ----
      if (lower === 'store_name' || lower === 'store name') return 'StoreName';
      if (lower === 'previous_date' || lower === 'previous date') return 'PrevDate';

      if (
        lower === 'revenue_percent_change' ||
        lower === 'revenue % change' ||
        lower === 'revenue%change'
      )
        return 'RevChgPct';

      if (
        lower === 'orders_percent_change' ||
        lower === 'orders % change' ||
        lower === 'orders%change'
      )
        return 'OrdChgPct';

      // Templates sometimes use "MetaSummary"/"GoogleSummary" instead of Fb_ROAS/GoogleAds_ROAS
      if (lower === 'fb_roas' || lower === 'fbroas') return 'MetaSummary';
      if (lower === 'googleads_roas' || lower === 'googleadsroas') return 'GoogleSummary';

      // ---- General snake_case -> CamelCase fallback ----
      // Example: meta_summary -> MetaSummary
      if (key.includes('_')) {
        const parts = key.split('_').filter(Boolean);
        if (parts.length === 0) return key;
        const camel =
          parts[0].charAt(0).toUpperCase() + parts[0].slice(1) +
          parts
            .slice(1)
            .map(p => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ''))
            .join('');
        return camel;
      }

      return key;
    }

    // Apply named object variables (recommended)
    function applyNamed(obj: any) {
      if (!obj || typeof obj !== 'object') return;

      for (const [k, v] of Object.entries(obj)) {
        // 1) Always send the original key (in case it already matches the template)
        setVar(k, v);

        // 2) Also send the normalized key (fixes Store_Name -> StoreName, Fb_ROAS -> MetaSummary, etc.)
        const nk = normalizeKey(k);
        if (nk && nk !== k) setVar(nk, v);
      }
    }

    // ----------------------------
    // 1) ARRAY format
    // ----------------------------
    if (Array.isArray(components) && components.length > 0) {
      const bodyComponent = components.find(c => (c.type ?? '').toLowerCase() === 'body');
      const headerComponent = components.find(c => (c.type ?? '').toLowerCase() === 'header');

      const applyParams = (params: any[] | undefined, startIndex: number) => {
        if (!params?.length) return startIndex;

        params.forEach((param, idx) => {
          const t = String(param.type ?? '').toLowerCase();
          if (t !== 'text') return;

          const rawKey = String(param.parameter_name ?? '').trim();

          if (rawKey) {
            // send as named + normalized
            setVar(rawKey, param.text ?? '');
            const nk = normalizeKey(rawKey);
            if (nk !== rawKey) setVar(nk, param.text ?? '');
          } else {
            // numeric fallback for {{1}}, {{2}} templates
            setVar(String(startIndex + idx), param.text ?? '');
          }
        });

        return startIndex + params.length;
      };

      let nextIndex = 1;
      nextIndex = applyParams(bodyComponent?.parameters, nextIndex);
      applyParams(headerComponent?.parameters, nextIndex);
    }

    // ----------------------------
    // 2) OBJECT format (Postman/Laravel)
    // ----------------------------
    else if (components && typeof components === 'object') {
      const c: any = components;
      const bodyNamed = c.bodyNamed ?? c.body;
      const headerNamed = c.headerNamed ?? c.header;

      applyNamed(bodyNamed);
      applyNamed(headerNamed);

      // OPTIONAL:
      // If your template uses numeric placeholders {{1}}, {{2}} but you send bodyNamed,
      // you can auto-number based on insertion order. Uncomment if needed:
      //
      // if (bodyNamed && typeof bodyNamed === 'object') {
      //   Object.values(bodyNamed).forEach((val, i) => setVar(String(i + 1), val));
      // }
    }
// console.log(variable);
// process.exit();

    // ----------------------------
    // Build Twilio payload
    // ----------------------------
    const messagePayload: any = {
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${cleanedPhone}`,
      contentSid: twilioTemplateId
    };

    if (Object.keys(contentVariables).length > 0) {
      messagePayload.contentVariables = JSON.stringify(contentVariables);
    }

    console.log('📤 Twilio send payload (debug):', {
      to: cleanedPhone,
      from: fromNumber,
      templateName,
      contentSid: twilioTemplateId,
      contentVariables
    });

    const client = getTwilioClient();
    const message = await client.messages.create(messagePayload);

    try {
      appendWhatsAppLog(messagePayload, message);
    } catch (e) {
      console.error('appendWhatsAppLog failed:', e);
    }

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







// http://localhost:3002/api/whatsapp/send-message?renderHtml=1
static async sendTemplatePreview(
  to: string,
  templateName: string,
  _languageCode: string = 'en_US',
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

    // ----------------------------
    // Build contentVariables (dynamic)
    // ----------------------------
    const contentVariables: Record<string, string> = {};

    function sanitizeContentVariable(value: unknown): string | null {
      if (value === null || value === undefined) return null;

      const s = String(value)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/[ ]{5,}/g, '    ') // max 4 consecutive spaces
        .trim();

      return s === '' ? null : s;
    }

    function setVar(key: string, value: unknown) {
      const v = sanitizeContentVariable(value);
      if (v != null) contentVariables[key] = v;
    }

    // Normalize incoming keys (Store_Name -> StoreName etc.)
    function normalizeKey(k: string): string {
      const key = String(k ?? '').trim();
      const lower = key.toLowerCase();

      // ---- Highly-used mappings ----
      if (lower === 'store_name' || lower === 'store name') return 'StoreName';
      if (lower === 'previous_date' || lower === 'previous date') return 'PrevDate';

      if (
        lower === 'revenue_percent_change' ||
        lower === 'revenue % change' ||
        lower === 'revenue%change'
      )
        return 'RevChgPct';

      if (
        lower === 'orders_percent_change' ||
        lower === 'orders % change' ||
        lower === 'orders%change'
      )
        return 'OrdChgPct';

      if (lower === 'fb_roas' || lower === 'fbroas') return 'MetaSummary';
      if (lower === 'googleads_roas' || lower === 'googleadsroas') return 'GoogleSummary';

      // ---- snake_case -> CamelCase fallback ----
      if (key.includes('_')) {
        const parts = key.split('_').filter(Boolean);
        if (parts.length === 0) return key;
        const camel =
          parts[0].charAt(0).toUpperCase() +
          parts[0].slice(1) +
          parts
            .slice(1)
            .map(p => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ''))
            .join('');
        return camel;
      }

      return key;
    }

    function applyNamed(obj: any) {
      if (!obj || typeof obj !== 'object') return;

      for (const [k, v] of Object.entries(obj)) {
        setVar(k, v);
        const nk = normalizeKey(k);
        if (nk && nk !== k) setVar(nk, v);
      }
    }

    // ----------------------------
    // 1) ARRAY format
    // ----------------------------
    if (Array.isArray(components) && components.length > 0) {
      const bodyComponent = components.find(c => (c.type ?? '').toLowerCase() === 'body');
      const headerComponent = components.find(c => (c.type ?? '').toLowerCase() === 'header');

      const applyParams = (params: any[] | undefined, startIndex: number) => {
        if (!params?.length) return startIndex;

        params.forEach((param, idx) => {
          const t = String(param.type ?? '').toLowerCase();
          if (t !== 'text') return;

          const rawKey = String(param.parameter_name ?? '').trim();

          if (rawKey) {
            setVar(rawKey, param.text ?? '');
            const nk = normalizeKey(rawKey);
            if (nk !== rawKey) setVar(nk, param.text ?? '');
          } else {
            setVar(String(startIndex + idx), param.text ?? '');
          }
        });

        return startIndex + params.length;
      };

      let nextIndex = 1;
      nextIndex = applyParams(bodyComponent?.parameters, nextIndex);
      applyParams(headerComponent?.parameters, nextIndex);
    }

    // ----------------------------
    // 2) OBJECT format (Postman/Laravel)
    // ----------------------------
    else if (components && typeof components === 'object') {
      const c: any = components;
      const bodyNamed = c.bodyNamed ?? c.body;
      const headerNamed = c.headerNamed ?? c.header;

      applyNamed(bodyNamed);
      applyNamed(headerNamed);
    }

    // ----------------------------
    // Build Twilio payload (what we would send)
    // ----------------------------
    const messagePayload: any = {
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${cleanedPhone}`,
      contentSid: twilioTemplateId
    };

    if (Object.keys(contentVariables).length > 0) {
      messagePayload.contentVariables = JSON.stringify(contentVariables);
    }

    // ----------------------------
    // HTML preview (WhatsApp-like layout for Postman)
    // ----------------------------
    const getVar = (key: string): string =>
      contentVariables[key] ?? contentVariables[normalizeKey(key)] ?? '';

    const renderBulletList = (text: string): string => {
      if (!text || !String(text).trim()) return '';
      const items = String(text)
        .split(/\n+/)
        .map(line => line.replace(/^[\s•\-*]+\s*/, '').trim())
        .filter(Boolean);
      if (items.length === 0) return `<p>${escapeHtml(text)}</p>`;
      return `<ul class="bullet-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    };

    function escapeHtml(s: string): string {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    const storeName = getVar('StoreName');
    const prevDate = getVar('PrevDate');
    const revenue = getVar('Revenue');
    const orders = getVar('Orders');
    const aov = getVar('AOV');
    const revChgPct = getVar('RevChgPct');
    const ordChgPct = getVar('OrdChgPct');
    const metaSummary = getVar('MetaSummary');
    const metaCac = getVar('MetaCAC');
    const googleSummary = getVar('GoogleSummary');
    const googleCac = getVar('GoogleCAC');
    const day = getVar('day');
    const positiveChanges = getVar('PositiveChanges');
    const requiresReviews = getVar('RequiresReviews');

    const htmlPreview = `<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Business Performance Summary</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f5f5f5;
      margin: 0;
      padding: 24px;
      max-width: 460px;
      margin-left: auto;
      margin-right: auto;
    }

    .message-card {
      background: #ffffff;
      border-radius: 8px;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    p { margin: 0 0 12px 0; }
    p:last-child { margin-bottom: 0; }

    .greeting { margin-bottom: 14px; }
    .intro { margin-bottom: 18px; }

    .section { margin: 0 0 18px 0; }
    .section:last-of-type { margin-bottom: 0; }

    .section-title {
      font-weight: 700;
      font-size: 15px;
      margin: 0 0 10px 0;
      color: #1a1a1a;
    }

    /* Keep spacing clean when some lines are empty */
    .block { display: block; margin: 0 0 10px 0; white-space: pre-wrap; }
    .block:empty { display: none; }

    .bullet-list {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }
    .bullet-list li { margin-bottom: 6px; }

    .footer-note {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid #eee;
    }

    .disclaimer {
      margin: 0 0 14px 0;
      color: #333;
    }

    .regards { font-weight: 700; margin: 8px 0 4px 0; }
    .signature { font-weight: 700; margin: 0; }
  </style>
</head>

<body>
  <div class="message-card">
    <p class="greeting">Good day,</p>

    <p class="intro">
      This is an automated performance summary for
      ${escapeHtml(storeName)}’s business performance for ${escapeHtml(prevDate)}.
    </p>

    <section class="section">
      <p class="section-title">𝗕𝘂𝘀𝗶𝗻𝗲𝘀𝘀 𝗢𝘃𝗲𝗿𝘃𝗶𝗲𝘄</p>
      <p>
        Total revenue of ${escapeHtml(revenue)} was generated from ${escapeHtml(orders)} orders,
        resulting in an Average Order Value (AOV) of ${escapeHtml(aov)}.
      </p>
      <p>
        Compared to the previous day, revenue ${escapeHtml(revChgPct)} and order volume ${escapeHtml(ordChgPct)}.
      </p>
    </section>

    <section class="section">
      <p class="section-title">𝗖𝗵𝗮𝗻𝗻𝗲𝗹 𝗣𝗲𝗿𝗳𝗼𝗿𝗺𝗮𝗻𝗰𝗲</p>

      <p class="block">${escapeHtml(metaSummary)}</p>
      <p class="block">${escapeHtml(metaCac)}</p>

      <p class="block">${escapeHtml(googleSummary)}</p>
      <p class="block">${escapeHtml(googleCac)}</p>
    </section>

    <section class="section">
      <p class="section-title">𝗣𝗿𝗲𝘃𝗶𝗼𝘂𝘀 ${escapeHtml(day)} 𝗰𝗼𝗺𝗽𝗮𝗿𝗶𝘀𝗼𝗻</p>

      <p class="section-title">𝗣𝗲𝗿𝗳𝗼𝗿𝗺𝗮𝗻𝗰𝗲 𝗛𝗶𝗴𝗵𝗹𝗶𝗴𝗵𝘁𝘀</p>
      ${positiveChanges ? renderBulletList(positiveChanges) : ''}

      <p class="section-title" style="margin-top: 14px;">𝗥𝗲𝘃𝗶𝗲𝘄 𝗥𝗲𝗾𝘂𝗶𝗿𝗲𝗱</p>
      ${requiresReviews ? renderBulletList(requiresReviews) : ''}
    </section>

    <div class="footer-note">
      <p class="disclaimer">
        This message contains automatically generated factual account data for reference purposes only.
      </p>

      <p class="regards">𝗥𝗲𝗴𝗮𝗿𝗱𝘀,</p>
      <p class="signature">𝗡𝗲𝘁𝘀𝗶𝗴𝗵𝘁𝘀.𝗮𝗶</p>
    </div>
  </div>
</body>
</html>`;

    // ----------------------------
    // TESTING: do NOT send, just log + return preview in JSON
    // ----------------------------
    const envLabel = process.env.NODE_ENV === 'production' ? 'SERVER' : 'LOCAL';

    const logRequest = {
      env: envLabel,
      templateName,
      to: cleanedPhone,
      from: fromNumber,
      contentSid: twilioTemplateId,
      contentVariables
      // payload: messagePayload, // enable if you want
    };
    const logResponse = { message: 'Message NOT sent' };

    try {
      appendWhatsAppLog(logRequest, logResponse);
    } catch (e) {
      console.error('appendWhatsAppLog failed:', e);
    }

    console.log(`🧪 [${envLabel}] WHATSAPP TESTING — message NOT sent, returning preview`);
    console.log('contentVariables:', contentVariables);

    return {
      ok: true,
      meta: {
        dryRun: true,
        templateName,
        to: cleanedPhone,
        from: fromNumber,
        contentSid: twilioTemplateId,
        contentVariables,
        htmlPreview
      }
    } as unknown as WhatsAppServiceResponse;

    // ----------------------------
    // PRODUCTION: Uncomment below when ready to send real messages
    // ----------------------------
    // const client = getTwilioClient();
    // const message = await client.messages.create(messagePayload);
    // return {
    //   ok: true,
    //   meta: {
    //     sid: message.sid,
    //     status: message.status,
    //     to: message.to || cleanedPhone,
    //     from: message.from || fromNumber,
    //     dateCreated: message.dateCreated,
    //     dateUpdated: message.dateUpdated
    //   }
    // };
  } catch (error: any) {
    console.error('sendTemplate error:', error?.message);
    console.error(error?.stack);
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
