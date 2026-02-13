import { Router } from 'express';
import * as TwilioSandboxController from '../controllers/twilioSandboxController.js';
import { authenticateJWTOrApiSecret } from '../middleware/jwtAuth.js';

const router = Router();

router.get('/config', TwilioSandboxController.getConfig);
router.post('/send-sandbox-message', authenticateJWTOrApiSecret, TwilioSandboxController.sendTemplate);

export default router;
