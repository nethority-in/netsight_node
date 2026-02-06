import express, { Request, Response, Router } from 'express';
import { prisma, isDatabaseConnected } from '../config/prisma.js';
import whatsappRoutes from './whatsappRoutes.js';
import emailRoutes from './emailRoutes.js';
import facebookRoutes from './facebookRoutes.js';
import { authenticateToken } from '../middleware/auth.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { appendNotificationLog, appendNotificationSettingLog, appendWidgetLog } from '../utils/logApiResponse.js';
const router: Router = express.Router();

// Apply authentication middleware to ALL routes
router.use(authenticateToken);

// Example API route - Test Prisma connection
router.get('/test', async (_req: Request, res: Response) => {
  try {
    await isDatabaseConnected();
    ErrorHandler.sendSuccess(res, {
      message: 'Node.js API is working - Prisma ODM connected successfully'
    });
  } catch (error) {
    ErrorHandler.sendErrorResponse(res, error, 'Database connection check failed', 500);
  }
});

//http://localhost:3002/api/notification-logs
router.get('/notification-logs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const connected = await isDatabaseConnected();
    if (!connected) {
      ErrorHandler.sendUnavailable(res, 'Database connection is not available. Please check your database configuration.');
      return;
    }

    const notificationLogs = await prisma.notificationLog.findMany({
      orderBy: { created_at: 'desc' }
    });
    appendNotificationLog(_req.body, notificationLogs);
    ErrorHandler.sendSuccess(res, {
      message: 'Notification logs retrieved successfully',
      count: notificationLogs.length,
      data: notificationLogs
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('Access denied') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('P1001')) {
      ErrorHandler.sendUnavailable(res, 'Cannot connect to database. Please check your database credentials and ensure MySQL is running.');
      return;
    }
    appendNotificationLog(_req.body, { error: error });
    ErrorHandler.sendErrorResponse(res, error, 'Failed to retrieve notification logs', 500);
  }
});

//http://localhost:3002/api/notification-settings
router.get('/notification-settings', async (_req: Request, res: Response): Promise<void> => {
  try {
    const connected = await isDatabaseConnected();
    if (!connected) {
      ErrorHandler.sendUnavailable(res, 'Database connection is not available. Please check your database configuration.');
      return;
    }

    const notificationSettings = await prisma.notificationSetting.findMany({
      orderBy: { created_at: 'desc' }
    });
    appendNotificationSettingLog(_req.body, notificationSettings);
    ErrorHandler.sendSuccess(res, {
      message: 'Notification settings retrieved successfully',
      count: notificationSettings.length,
      data: notificationSettings
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('Access denied') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('P1001')) {
      ErrorHandler.sendUnavailable(res, 'Cannot connect to database. Please check your database credentials and ensure MySQL is running.');
      return;
    }
    appendNotificationSettingLog(_req.body, { error: error });
    ErrorHandler.sendErrorResponse(res, error, 'Failed to retrieve notification settings', 500);
  }
});

//http://localhost:3002/api/widgets
router.get('/widgets', async (_req: Request, res: Response): Promise<void> => {
  try {
    const connected = await isDatabaseConnected();
    if (!connected) {
      ErrorHandler.sendUnavailable(res, 'Database connection is not available. Please check your database configuration.');
      return;
    }

    const widgets = await prisma.widget.findMany({
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'desc' }
      ]
    });
    appendWidgetLog(_req.body, widgets);
    ErrorHandler.sendSuccess(res, {
      message: 'Widgets retrieved successfully',
      count: widgets.length,
      data: widgets
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('Access denied') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('P1001')) {
      ErrorHandler.sendUnavailable(res, 'Cannot connect to database. Please check your database credentials and ensure MySQL is running.');
      return;
    }
    appendWidgetLog(_req.body, { error: error });
    ErrorHandler.sendErrorResponse(res, error, 'Failed to retrieve widgets', 500);
  }
});

// WhatsApp routes
router.use('/whatsapp', whatsappRoutes);

// Email routes
router.use('/email', emailRoutes);

// Facebook OAuth (connect requires auth; callback is mounted in index.ts without auth)
router.use('/facebook', facebookRoutes);

export default router;