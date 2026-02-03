import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const WEB_HOOK_TOKEN = process.env.WEB_HOOK_TOKEN;


  // GET /webhook/whatsapp - Meta webhook verification.
  // Meta sends hub.mode, hub.verify_token, hub.challenge. Match verify_token to WEB_HOOK_TOKEN and return challenge.

export function verifyWebhook(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WEB_HOOK_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    res.status(200).send(challenge);
    return;
  }
  console.warn('⚠️  WhatsApp webhook verification failed: mode or token mismatch');
  res.status(403).send('Forbidden');
}

  // POST /webhook/whatsapp - Meta webhook events (incoming messages, status updates).
  // Respond 200 immediately; process payload async. Meta expects response within ~20 seconds.
export function handleWebhookEvent(req: Request, res: Response): void {
  res.status(200).send('OK');

  const body = req.body as { object?: string; entry?: Array<{ id: string; changes?: Array<{ value: unknown; field: string }> }> };
  if (body?.object !== 'whatsapp_business_account' || !Array.isArray(body?.entry)) {
    return;
  }

  for (const entry of body.entry) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      if (change.field !== 'messages') continue;
      const value = change.value as {
        messaging_product?: string;
        metadata?: { phone_number_id: string; display_phone_number?: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<{ from: string; id: string; timestamp: string; type: string; text?: { body: string } }>;
        statuses?: Array<unknown>;
        errors?: Array<unknown>;
      };
      if (value.messages) {
        for (const msg of value.messages) {
          const text = msg.type === 'text' ? msg.text?.body : `[${msg.type}]`;
          console.log('📩 WhatsApp incoming:', { from: msg.from, id: msg.id, type: msg.type, text: text?.substring(0, 80) });
        }
      }
      if (value.statuses) {
        for (const s of value.statuses) {
          console.log('📊 WhatsApp status update:', s);
        }
      }
    }
  }
}
