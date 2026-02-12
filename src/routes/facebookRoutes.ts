import { Router } from 'express';
// import { authenticateToken } from '../middleware/auth.js';
import * as facebookController from '../controllers/facebookController.js';

const router = Router();

//  Initiate Facebook OAuth – returns { oauth_url }. Requires Authorization: Bearer <CUSTOM_TOKEN>. 
// router.get('/connect', authenticateToken, facebookController.connect);
router.get('/connect', facebookController.connect);

export default router;
