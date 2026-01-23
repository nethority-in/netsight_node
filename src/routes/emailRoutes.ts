import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';

const router = Router();

// Email API routes
router.post('/send-template', EmailController.sendTemplate);
router.post('/send', EmailController.sendEmail);
router.post('/send-daily-kpi-snapshot', EmailController.sendDailyKpiSnapshot);
router.post('/send-dynamic', EmailController.sendDynamic);
router.get('/templates', EmailController.getTemplates);

export default router;
