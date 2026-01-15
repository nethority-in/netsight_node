import express, { Request, Response, Router } from 'express';
import { getDatabase } from '../config/database.js';
import { NotificationLog } from '../types/notificationLog.js';
import { NotificationSetting } from '../types/notificationSetting.js';
import { Weidgets } from '../types/weidgets.js';

const router: Router = express.Router();

// Example API route
router.get('/test', async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const [rows] = await db.query('SELECT 1 as test');
    res.json({ 
      success: true, 
      message: 'Node.js API is working',
      database: rows 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a database not initialized error
    if (errorMessage.includes('Database not initialized')) {
      res.status(503).json({ 
        success: false, 
        error: 'Database is not configured. Please set up database credentials.',
        message: 'Server is running but database connection is not available'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }
});

//http://localhost:3001/api/notification-logs
// Get all notification logs
router.get('/notification-logs', async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const [rows] = await db.query(
      `SELECT 
        id,
        merchant_id,
        notification_setting_id,
        notification_type,
        channel,
        recipient,
        status,
        message,
        error_message,
        sent_at,
        data,
        created_at,
        updated_at
      FROM notification_logs
      ORDER BY created_at DESC`
    ) as [NotificationLog[], unknown];

    const notificationLogs = rows as NotificationLog[];

    res.json({
      success: true,
      message: 'Notification logs retrieved successfully',
      count: notificationLogs.length,
      data: notificationLogs
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a database not initialized error
    if (errorMessage.includes('Database not initialized')) {
      res.status(503).json({ 
        success: false, 
        error: 'Database is not configured. Please set up database credentials.',
        message: 'Server is running but database connection is not available'
      });
    } else {
      console.error('Error fetching notification logs:', error);
      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        message: 'Failed to retrieve notification logs'
      });
    }
  }
});

//http://localhost:3001/api/notification-settings
// Get all notification settings
router.get('/notification-settings', async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const [rows] = await db.query(
      `SELECT 
        id,
        merchant_id,
        notification_type,
        is_active,
        email_enabled,
        whatsapp_enabled,
        last_sent_at,
        created_at,
        updated_at,
        frequencies
      FROM notification_settings
      ORDER BY created_at DESC`
    ) as [NotificationSetting[], unknown];

    const notificationSettings = rows as NotificationSetting[];

    res.json({
      success: true,
      message: 'Notification settings retrieved successfully',
      count: notificationSettings.length,
      data: notificationSettings
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a database not initialized error
    if (errorMessage.includes('Database not initialized')) {
      res.status(503).json({ 
        success: false, 
        error: 'Database is not configured. Please set up database credentials.',
        message: 'Server is running but database connection is not available'
      });
    } else {
      console.error('Error fetching notification settings:', error);
      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        message: 'Failed to retrieve notification settings'
      });
    }
  }
});

//http://localhost:3001/api/widgets
// Get all widgets
router.get('/widgets', async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const [rows] = await db.query('SELECT * FROM widgets');
    const widgets = rows as Weidgets[];
    res.json({ success: true, message: 'Widgets retrieved successfully', data: widgets });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage, message: 'Failed to retrieve widgets' });
  }
});
export default router;
