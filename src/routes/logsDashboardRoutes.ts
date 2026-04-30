import { Router } from 'express';
import { LogsDashboardController } from '../controllers/logsDashboardController.js';
import {
  dashboardAuthStatus,
  dashboardLogin,
  dashboardLogout,
  hasValidDashboardSession,
  requireDashboardSession,
} from '../middleware/dashboardAuth.js';

const router = Router();

router.get('/signin', (_req, res) => {
  res.redirect('/signin');
});
router.get('/', (req, res) => {
  if (!hasValidDashboardSession(req)) {
    res.redirect('/signin');
    return;
  }
  LogsDashboardController.serveUi(req, res);
});
router.get('/auth/status', dashboardAuthStatus);
router.post('/auth/login', dashboardLogin);
router.post('/auth/logout', dashboardLogout);
router.use(requireDashboardSession);

router.get('/meta', (req, res) => {
  void LogsDashboardController.meta(req, res);
});
router.get('/data/email', (req, res) => {
  void LogsDashboardController.emailLogs(req, res);
});
router.get('/data/email-html', (req, res) => {
  void LogsDashboardController.emailHtmlPreview(req, res);
});
router.get('/data/whatsapp', (req, res) => {
  void LogsDashboardController.whatsappLogs(req, res);
});

export default router;
