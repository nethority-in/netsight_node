import express, { Request, Response, Router } from 'express';
import { prisma, isDatabaseConnected } from '../config/prisma.js';
import whatsappRoutes from './whatsappRoutes.js';
import emailRoutes from './emailRoutes.js';
import { authenticateToken } from '../middleware/auth.js';

const router: Router = express.Router();

// Apply authentication middleware to ALL routes
router.use(authenticateToken);

// Example API route - Test Prisma connection
router.get('/test', async (_req: Request, res: Response) => {
  try {
    // Test Prisma connection
    await isDatabaseConnected();
    res.json({ 
      success: true, 
      message: 'Node.js API is working - Prisma ODM connected successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

//http://localhost:3002/api/notification-logs
router.get('/notification-logs', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check if database is connected
    const connected = await isDatabaseConnected();
    if (!connected) {
      res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Database connection is not available. Please check your database configuration.'
      });
      return;
    }

    const notificationLogs = await prisma.notificationLog.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      success: true,
      message: 'Notification logs retrieved successfully',
      count: notificationLogs.length,
      data: notificationLogs
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching notification logs:', error);
    
    // Check if it's a database connection error
    if (errorMessage.includes('Access denied') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('P1001')) {
      res.status(503).json({ 
        success: false, 
        error: 'Database connection error',
        message: 'Cannot connect to database. Please check your database credentials and ensure MySQL is running.'
      });
      return;
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      message: 'Failed to retrieve notification logs'
    });
  }
});

//http://localhost:3002/api/notification-settings
router.get('/notification-settings', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check if database is connected
    const connected = await isDatabaseConnected();
    if (!connected) {
      res.status(503).json({ 
        success: false,
        error: 'Database not connected',
        message: 'Database connection is not available. Please check your database configuration.'
      });
      return;
    }

    const notificationSettings = await prisma.notificationSetting.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      success: true,
      message: 'Notification settings retrieved successfully',
      count: notificationSettings.length,
      data: notificationSettings
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching notification settings:', error);
    
    // Check if it's a database connection error
    if (errorMessage.includes('Access denied') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('P1001')) {
      res.status(503).json({ 
        success: false, 
        error: 'Database connection error',
        message: 'Cannot connect to database. Please check your database credentials and ensure MySQL is running.'
      });
      return;
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      message: 'Failed to retrieve notification settings'
    });
  }
});

//http://localhost:3002/api/widgets
router.get('/widgets', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check if database is connected
    const connected = await isDatabaseConnected();
    if (!connected) {
      res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Database connection is not available. Please check your database configuration.'
      });
      return;
    }

    const widgets = await prisma.widget.findMany({
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'desc' }
      ]
    });
    
    res.json({ 
      success: true, 
      message: 'Widgets retrieved successfully',
      count: widgets.length,
      data: widgets 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching widgets:', error);
    
    // Check if it's a database connection error
    if (errorMessage.includes('Access denied') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('P1001')) {
      res.status(503).json({ 
        success: false, 
        error: 'Database connection error',
        message: 'Cannot connect to database. Please check your database credentials and ensure MySQL is running.'
      });
      return;
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage, 
      message: 'Failed to retrieve widgets' 
    });
  }
});

// WhatsApp routes
router.use('/whatsapp', whatsappRoutes);

// Email routes
router.use('/email', emailRoutes);

export default router;