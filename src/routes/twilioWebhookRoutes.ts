import { Router } from 'express';
import { handleTwilioWhatsAppWebhook } from '../controllers/twilioWebhookController.js';

const router = Router();

// Twilio calls this when someone sends a WhatsApp message to your Twilio number.
// No auth - Twilio does not support custom headers; validate via Twilio signature if needed later.
router.post('/whatsapp', handleTwilioWhatsAppWebhook);

export default router;
