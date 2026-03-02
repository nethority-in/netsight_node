import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';
import { notificationRateLimiter } from '../middleware/rateLimit.js';
import { duplicateMessageMiddleware } from '../middleware/duplicateMessage.js';

const router = Router();

// Rate limiting & idempotency for send endpoints (abuse protection, duplicate send protection)
router.use(notificationRateLimiter);
router.use(duplicateMessageMiddleware);

// Email API routes
router.post("preview", EmailController.previewTemplate);        // JSON
router.post("preview/html", EmailController.previewTemplateHtml); // optional (Postman body)


router.post('/send-template', EmailController.sendTemplate);
router.post('/send', EmailController.sendEmail);
router.post('/send-daily-kpi-snapshot', EmailController.sendDailyKpiSnapshot);
router.post('/send-dynamic', EmailController.sendDynamic);  // use 
router.get('/templates', EmailController.getTemplates);

export default router;
