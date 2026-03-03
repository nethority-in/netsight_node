import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';
import { notificationRateLimiter } from '../middleware/rateLimit.js';
import { duplicateMessageMiddleware } from '../middleware/duplicateMessage.js';

const router = Router();

// Rate limiting & idempotency for send endpoints (abuse protection, duplicate send protection)
router.use(notificationRateLimiter);
router.use(duplicateMessageMiddleware);

// Email API routes (more specific path first)
router.post("/preview/html", EmailController.previewTemplateHtml); // POST body or query → HTML response
router.post("/preview", EmailController.previewTemplate);         // JSON body → JSON response


router.post('/send-template', EmailController.sendTemplate);
router.post('/send', EmailController.sendEmail);
router.post('/send-daily-kpi-snapshot', EmailController.sendDailyKpiSnapshot);
router.post('/send-dynamic', EmailController.sendDynamic);  // use 
router.get('/templates', EmailController.getTemplates);

export default router;
