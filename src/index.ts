/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectPrisma, disconnectPrisma } from './config/prisma.js';
// Import models to ensure they're loaded (NotificationLog, NotificationSetting, Widget)
import './models/index.js';
import apiRoutes from './routes/api.js';
import twilioEmailRoutes from './routes/twilioemailRoutes.js';
import twilioWhatsAppRoutes from './routes/twiliowhatsappRoutes.js';
import whatsappWebhookRoutes from './routes/twiliowhatsappWebhookRoutes.js';
import twilioWebhookRoutes from './routes/twilioWebhookRoutes.js';
import twilioSandboxRoutes from './routes/twilioSandboxRoutes.js';
import { callback as facebookCallback } from './controllers/facebookController.js';
import authRoutes from './routes/authRoutes.js';
import twilioAuthRoutes from './routes/twilioauthRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3002', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prisma connection and initialization
const initializePrisma = async (): Promise<void> => {
  try {
    if (process.env.DB_HOST || process.env.DB_USER || process.env.DB_DATABASE) {
      const isConnected = await connectPrisma();
      
      if (!isConnected) {
        console.warn('⚠️  Database connection failed. API endpoints requiring database will return errors.');
        return;
      }
      
      console.log('✅ Prisma models ready to use');
    } else {
      console.log('ℹ️  Skipping Prisma initialization - no database credentials');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Prisma initialization error:', errorMessage);
    console.warn('⚠️  Server will continue running, but Prisma features may not work');
  }
};

// Initialize Prisma
initializePrisma();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

// Routes (webhooks are public - no auth; Meta/Twilio call them)
app.use('/webhook/whatsapp-twilio', whatsappWebhookRoutes);
app.use('/webhook/twilio', twilioWebhookRoutes);
app.use('/auth-twilio', twilioAuthRoutes);
app.use('/sandbox-twilio', twilioSandboxRoutes);
app.use('/api-twilio', apiRoutes);

app.use('/webhook/whatsapp', whatsappWebhookRoutes);
// Facebook OAuth callback is public (browser redirect from Facebook)
app.use('/auth', authRoutes);
app.get('/api/facebook/callback', facebookCallback);
app.use('/api', apiRoutes);

// Twilio-only API routes (mounted separately because the base router `apiRoutes` does not include them)
app.use('/api-twilio/email', twilioEmailRoutes);
app.use('/api-twilio/whatsapp', twilioWhatsAppRoutes);

// Health check (before 404)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Node.js server is running' });
});

// 404 - must be after all routes
app.use(notFoundHandler);

// Centralized error handler - must be last
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Node.js server is running on port ${PORT}`);
});

export default app;
