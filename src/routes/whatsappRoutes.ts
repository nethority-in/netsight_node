import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsappController.js';
import { WhatsAppTemplateController } from '../controllers/whatsappTemplateController.js';
import { notificationRateLimiter } from '../middleware/rateLimit.js';
import { duplicateMessageMiddleware } from '../middleware/duplicateMessage.js';

const router = Router();

// Rate limiting & idempotency for send endpoints (abuse protection, duplicate send protection)
router.use(notificationRateLimiter);
router.use(duplicateMessageMiddleware);

// WhatsApp API routes
router.post('/send-template', WhatsAppController.sendTemplate);
router.post('/send-text', WhatsAppController.sendText);
router.post('/send-daily-kpi-snapshot', WhatsAppController.sendDailyKpiSnapshot);
router.post('/send-dynamic', WhatsAppController.sendDynamic);

// WhatsApp Template Management routes
router.post('/templates/create', WhatsAppTemplateController.createTemplate);
router.post('/templates/create-custom', WhatsAppTemplateController.createCustomTemplate);
router.put('/templates/create-custom-edit', WhatsAppTemplateController.editTemplate);
router.delete('/templates/create-custom-delete', WhatsAppTemplateController.deleteTemplate);
router.get('/templates', WhatsAppTemplateController.getTemplates);
router.get('/templates/meta', WhatsAppTemplateController.getTemplatesFromMeta);
router.get('/templates/:templateName', WhatsAppTemplateController.getTemplate);
router.post('/templates/register', WhatsAppTemplateController.registerTemplate);

export default router;
