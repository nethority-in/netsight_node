import twilio from 'twilio';
import dotenv from 'dotenv';
import { ErrorHandler } from '../utils/errorHandler.js';

dotenv.config();

// Sandbox uses TWILIO_SANDBOX_* when set; otherwise falls back to main TWILIO_*
const TWILIO_ACCOUNT_SID = process.env.TWILIO_SANDBOX_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_SANDBOX_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SANDBOX_WHATSAPP_FROM = process.env.TWILIO_SANDBOX_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_FROM || '+14155238886';

let sandboxClient: twilio.Twilio | null = null;

function getSandboxClient(): twilio.Twilio {
  if (!sandboxClient) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio sandbox credentials not set. Set TWILIO_SANDBOX_* or TWILIO_ACCOUNT_SID/AUTH_TOKEN in .env');
    }
    sandboxClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return sandboxClient;
}

export interface SandboxSendResult {
  ok: boolean;
  meta?: {
    sid: string;
    status: string;
    to: string;
    from: string;
    dateCreated?: Date;
    dateUpdated?: Date;
  };
  error?: {
    message: string;
    status: number;
    code: number;
    details?: unknown;
  };
}

function normalizeToWhatsApp(to: string): string {
  const t = String(to).trim();
  if (!t) return '';
  if (t.startsWith('whatsapp:')) return t;
  return `whatsapp:${t}`;
}

function normalizeFrom(from: string): string {
  const f = String(from).trim();
  if (!f) return `whatsapp:${TWILIO_SANDBOX_WHATSAPP_FROM}`;
  if (f.startsWith('whatsapp:')) return f;
  return `whatsapp:${f}`;
}


  // Send a business-initiated WhatsApp template message (Twilio sandbox).
  // Uses contentSid (template SID) and contentVariables (JSON string or object).

export async function sendSandboxTemplate(params: {
  to: string;
  from?: string;
  contentSid: string;
  contentVariables: string | Record<string, string>;
}): Promise<SandboxSendResult> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return ErrorHandler.toServiceError(
        'Twilio sandbox not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env',
        500
      ) as SandboxSendResult;
    }

    const to = normalizeToWhatsApp(params.to);
    if (!to || to === 'whatsapp:') {
      return ErrorHandler.toServiceError('"to" is required (e.g. whatsapp:+919876543210 or +919876543210)', 400) as SandboxSendResult;
    }

    const contentSid = String(params.contentSid).trim();
    if (!contentSid) {
      return ErrorHandler.toServiceError('"contentSid" is required (Twilio template SID, e.g. HX...)', 400) as SandboxSendResult;
    }

    const from = normalizeFrom(params.from ?? '');

    let contentVariablesStr: string;
    if (typeof params.contentVariables === 'string') {
      contentVariablesStr = params.contentVariables.trim() || '{}';
    } else if (params.contentVariables && typeof params.contentVariables === 'object') {
      contentVariablesStr = JSON.stringify(params.contentVariables);
    } else {
      contentVariablesStr = '{}';
    }

    const client = getSandboxClient();
    const message = await client.messages.create({
      from,
      to,
      contentSid,
      contentVariables: contentVariablesStr
    });

    return {
      ok: true,
      meta: {
        sid: message.sid,
        status: message.status,
        to: message.to ?? params.to,
        from: message.from ?? from,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated
      }
    };
  } catch (err: unknown) {
    const twilioError = err as { code?: number; message?: string; status?: number; moreInfo?: string };
    const status = twilioError.status ?? 500;
    const code = twilioError.code ?? status;
    const message = twilioError.message ?? 'Twilio API error';
    return {
      ok: false,
      error: {
        message,
        status,
        code,
        details: twilioError.moreInfo
      }
    };
  }
}
