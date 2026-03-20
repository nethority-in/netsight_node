import { Router } from 'express';
import { EmailController } from '../controllers/twilioemailController.js';
import { notificationRateLimiter } from '../middleware/rateLimit.js';
import { duplicateMessageMiddleware } from '../middleware/duplicateMessage.js';

const router = Router();

// Rate limiting & idempotency for send endpoints (abuse protection, duplicate send protection)
router.use(notificationRateLimiter);
router.use(duplicateMessageMiddleware);

// Email API routes (more specific path first)
router.post("/preview/html-twilio", EmailController.previewTemplateHtml); // POST body or query → HTML response
router.post("/preview-twilio", EmailController.previewTemplate);         // JSON body → JSON response


router.post('/send-template-twilio', EmailController.sendTemplate);
router.post('/send-email-twilio', EmailController.sendEmail);
router.post('/send-daily-kpi-snapshot-twilio', EmailController.sendDailyKpiSnapshot);
router.post('/send-dynamic-twilio', EmailController.sendDynamic);  // use 
router.get('/templates-twilio', EmailController.getTemplates);

export default router;
