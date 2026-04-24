/**
 * /api/whatsapp — WhatsApp Cloud API (Meta) only.
 * - Send: WhatsAppController → whatsappService (Graph messages).
 * - Templates: WhatsAppTemplateController → WhatsAppTemplateService (WABA message_templates).
 * Twilio-backed paths: /api-twilio (see twiliowhatsappRoutes.ts).
 *
 * /api/whatsapp/webhook — Twilio incoming WhatsApp Q&A webhook (no rate-limit; Twilio calls this).
 */
import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsappController.js';
import { WhatsAppTemplateController } from '../controllers/whatsappTemplateController.js';
import { notificationRateLimiter } from '../middleware/rateLimit.js';
import { duplicateMessageMiddleware } from '../middleware/duplicateMessage.js';
import { webhookHandler } from '../controllers/whatsappQAWebhookController.js';

const router = Router();

// ── Twilio incoming WhatsApp Q&A webhook (registered before rate-limiting) ───
// Twilio URL: https://isight.netsights.ai/api/whatsapp/webhook
router.get('/webhook', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'WhatsApp webhook is live. Use POST for incoming Twilio messages.'
  });
});
router.post('/webhook', webhookHandler);

// Rate limiting & idempotency for send endpoints (abuse protection, duplicate send protection)
router.use(notificationRateLimiter);
router.use(duplicateMessageMiddleware);

// WhatsApp API routes
router.post('/send-text', WhatsAppController.sendTextMessage);
router.post('/send-reaction', WhatsAppController.sendReaction);
router.post('/send-image', WhatsAppController.sendImage);
router.post('/send-interactive', WhatsAppController.sendInteractiveButtons);
router.post('/send-message', WhatsAppController.sendTemplate);
router.post('/send-dynamic', WhatsAppController.sendDynamic);

// From Numbers: list from Meta (GET), add in Meta (POST). Use fromNumberId (Meta phone_number_id) in send-dynamic/send-template/send-text to send from that number.
router.get('/from-numbers', WhatsAppController.listFromNumbers);
router.post('/from-numbers', WhatsAppController.addFromNumberInMeta);

// WhatsApp Template Management routes
router.post('/templates/create', WhatsAppTemplateController.createTemplate);
router.post('/templates/create-custom', WhatsAppTemplateController.createCustomTemplate);
router.put('/templates/create-custom-edit', WhatsAppTemplateController.editTemplate);
router.delete('/templates/create-custom-delete', WhatsAppTemplateController.deleteTemplate);
router.get('/templates', WhatsAppTemplateController.getTemplates);
router.get('/templates/Meta', WhatsAppTemplateController.getTemplatesFromMeta);
router.get('/templates/:templateName', WhatsAppTemplateController.getTemplate);
router.post('/templates/register', WhatsAppTemplateController.registerTemplate);

export default router;
