import { Request, Response } from 'express';
import { sendSandboxTemplate } from '../services/twilioSandboxService.js';
import { ErrorHandler } from '../utils/errorHandler.js';


  // POST /sandbox/twilio/send-template
  // Send a business-initiated WhatsApp template message (Twilio sandbox).
  // Body: { to, from?, contentSid, contentVariables }

export async function sendTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { to, from, contentSid, contentVariables } = req.body;

    if (to == null || String(to).trim() === '') {
      ErrorHandler.sendValidationError(res, 'Missing or empty required field: "to" (e.g. whatsapp:+919876543210 or +919876543210)');
      return;
    }
    if (contentSid == null || String(contentSid).trim() === '') {
      ErrorHandler.sendValidationError(res, 'Missing or empty required field: "contentSid" (Twilio template SID, e.g. HX...)');
      return;
    }

    const result = await sendSandboxTemplate({
      to: String(to).trim(),
      from: from != null ? String(from).trim() : undefined,
      contentSid: String(contentSid).trim(),
      contentVariables: contentVariables ?? {}
    });

    if (result.ok) {
      res.status(200).json(result);
    } else {
      res.status(result.error?.status ?? 500).json(result);
    }
  } catch (error) {
    ErrorHandler.sendErrorResponse(res, error, 'Sandbox sendTemplate failed', 500);
  }
}


  // GET /sandbox/twilio/config
  // Returns sandbox config status (no secrets). Useful to verify sandbox is reachable.

export async function getConfig(_req: Request, res: Response): Promise<void> {
  const hasSid = Boolean(process.env.TWILIO_ACCOUNT_SID?.trim());
  const hasToken = Boolean(process.env.TWILIO_AUTH_TOKEN?.trim());
  const from = process.env.TWILIO_SANDBOX_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_FROM || '+14155238886';
  res.status(200).json({
    ok: true,
    sandbox: true,
    configured: hasSid && hasToken,
    from: `whatsapp:${from}`,
    hint: 'POST /sandbox/twilio/send-template with body: { to, contentSid, contentVariables }'
  });
}
