/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectSequelize } from './config/sequelize.js';
// Import models to ensure they're loaded (NotificationLog, NotificationSetting, Widget)
import './models/index.js';
import apiRoutes from './routes/api.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection (non-blocking, optional)
// Only attempt connection if database credentials are provided
// if (process.env.DB_HOST || process.env.DB_USER || process.env.DB_DATABASE) {
//   connectDatabase().catch((_error) => {
//     console.warn('⚠️  MySQL2 database connection failed, but server will continue running');
//     console.warn('   You can configure the database later or create it if needed');
//   });
// } else {
//   console.log('ℹ️  Database credentials not provided - running without database');
//   console.log('   Set DB_HOST, DB_USER, DB_PASSWORD, and DB_DATABASE to enable database features');
// }

// Sequelize connection and model sync
const initializeSequelize = async (): Promise<void> => {
  try {
    if (process.env.DB_HOST || process.env.DB_USER || process.env.DB_DATABASE) {
      await connectSequelize();
      
      // Import models for notification_logs, notification_settings, and widgets
      const { NotificationLog, NotificationSetting, Widget } = await import('./models/index.js');
      
      const syncOptions = process.env.NODE_ENV === 'development' 
        ? { alter: false, force: false }
        : { alter: false, force: false };
      
      // Sync NotificationLog model
      try {
        await NotificationLog.sync(syncOptions);
        console.log('✅ NotificationLogs table synced');
      } catch (error) {
        console.warn('⚠️  NotificationLogs table sync skipped (table may already exist)');
      }
      
      // Sync NotificationSetting model
      try {
        await NotificationSetting.sync(syncOptions);
        console.log('✅ NotificationSettings table synced');
      } catch (error) {
        console.warn('⚠️  NotificationSettings table sync skipped (table may already exist)');
      }
      
      // Sync Widget model
      try {
        await Widget.sync(syncOptions);
        console.log('✅ Widgets table synced');
      } catch (error) {
        console.warn('⚠️  Widgets table sync skipped (table may already exist)');
      }
      
      // COMMENTED OUT: User and Post models (not needed for now)
      // const { User, Post } = await import('./models/index.js');
      // await User.sync(syncOptions);
      // await Post.sync(syncOptions);
      
      console.log('✅ Sequelize models synced with database');
    } else {
      console.log('ℹ️  Skipping Sequelize initialization - no database credentials');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Sequelize initialization error:', errorMessage);
    console.warn('⚠️  Server will continue running, but Sequelize features may not work');
  }
};

// Initialize Sequelize
initializeSequelize();

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Node.js server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Node.js server is running on port ${PORT}`);
});

export default app;
