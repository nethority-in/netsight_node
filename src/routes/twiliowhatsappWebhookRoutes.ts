import { Router } from 'express';
import { verifyWebhook, handleWebhookEvent } from '../controllers/twiliowhatsappWebhookController.js';

const router = Router();

// No auth - Meta calls these. Verify token is checked inside controller.
router.get('/twilio', verifyWebhook);
router.post('/twilio', handleWebhookEvent);

export default router;
