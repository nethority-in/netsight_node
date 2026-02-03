import { Router } from 'express';
import { verifyWebhook, handleWebhookEvent } from '../controllers/whatsappWebhookController.js';

const router = Router();

// No auth - Meta calls these. Verify token is checked inside controller.
router.get('/', verifyWebhook);
router.post('/', handleWebhookEvent);

export default router;
