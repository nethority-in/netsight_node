import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsappController.js';

const router = Router();

// WhatsApp API routes
router.post('/send-template', WhatsAppController.sendTemplate);
router.post('/send-text', WhatsAppController.sendText);

export default router;
