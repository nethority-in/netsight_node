import { Request, Response } from 'express';

/**
 * Twilio WhatsApp Incoming Message Webhook
 * Twilio sends POST with application/x-www-form-urlencoded.
 * Params: MessageSid, AccountSid, From, To, Body, NumMedia, etc.
 * Response: TwiML (text/xml) - use <Response></Response> or <Response><Message>...</Message></Response>
 */

export interface TwilioIncomingPayload {
  MessageSid?: string;
  AccountSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  NumMedia?: string;
  ProfileName?: string;
  [key: string]: string | undefined;
}

function sendTwiML(res: Response, twiml: string): void {
  res.type('text/xml');
  res.status(200).send(twiml);
}

/**
 * POST /webhook/twilio/whatsapp
 * Handles incoming WhatsApp messages from Twilio.
 * Logs the message and responds with empty TwiML (no auto-reply).
 * You can extend this to send auto-reply or forward to your bot/CRM.
 */
export function handleTwilioWhatsAppWebhook(req: Request, res: Response): void {
  const body = req.body as TwilioIncomingPayload;
  const from = body.From ?? '';
  const to = body.To ?? '';
  const messageBody = body.Body ?? '';
  const messageSid = body.MessageSid ?? '';
  const profileName = body.ProfileName ?? '';
  const numMedia = body.NumMedia ?? '0';

  console.log('📩 Twilio WhatsApp incoming:', {
    from,
    to,
    messageSid,
    profileName,
    body: messageBody?.substring(0, 100),
    numMedia
  });

  // Optional: add business logic here (e.g. save to DB, trigger bot, CRM sync)
  // For now we respond with empty TwiML so Twilio does not send any reply.
  const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  sendTwiML(res, twiml);
}
