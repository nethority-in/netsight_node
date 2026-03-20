import { Router } from 'express';
import * as AuthController from '../controllers/twilioauthController.js';

const router = Router();

router.post('/register-twilio', AuthController.register);
router.post('/login-twilio', AuthController.login);

export default router;
