import express, { Request, Response, Router } from 'express';
import { NotificationLog } from '../models/NotificationLog.js';
import { NotificationSetting } from '../models/NotificationSetting.js';
import { Widget } from '../models/Widget.js';
// COMMENTED OUT: User and Post routes (not needed for now)
// import userRoutes from './userRoutes.js';
// import postRoutes from './postRoutes.js';

const router: Router = express.Router();

// Example API route - Test Sequelize connection
router.get('/test', async (_req: Request, res: Response) => {
  try {
    // Test Sequelize connection
    await NotificationLog.sequelize?.authenticate();
    res.json({ 
      success: true, 
      message: 'Node.js API is working - Sequelize ODM connected successfully'
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
// Get all notification logs using Sequelize ORM
router.get('/notification-logs', async (_req: Request, res: Response) => {
  try {
    const notificationLogs = await NotificationLog.findAll({
      order: [['created_at', 'DESC']]
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
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      message: 'Failed to retrieve notification logs'
    });
  }
});

//http://localhost:3002/api/notification-settings
// Get all notification settings using Sequelize ORM
router.get('/notification-settings', async (_req: Request, res: Response) => {
  try {
    const notificationSettings = await NotificationSetting.findAll({
      order: [['created_at', 'DESC']]
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
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      message: 'Failed to retrieve notification settings'
    });
  }
});

//http://localhost:3002/api/widgets
// Get all widgets using Sequelize ORM
router.get('/widgets', async (_req: Request, res: Response) => {
  try {
    const widgets = await Widget.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
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
    res.status(500).json({ 
      success: false, 
      error: errorMessage, 
      message: 'Failed to retrieve widgets' 
    });
  }
});

// COMMENTED OUT: User and Post routes (not needed for now)
// router.use('/users', userRoutes);
// router.use('/posts', postRoutes);

export default router;
