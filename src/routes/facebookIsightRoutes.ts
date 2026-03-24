import { Router } from 'express';
import * as facebookIsightController from '../controllers/facebookIsightController.js';

const router = Router();

router.get('/connect', facebookIsightController.connect);
router.get('/callback', facebookIsightController.callback);

export default router;
