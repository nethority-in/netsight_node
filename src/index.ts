import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
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
if (process.env.DB_HOST || process.env.DB_USER || process.env.DB_DATABASE) {
  connectDatabase().catch((_error) => {
    console.warn('⚠️  Database connection failed, but server will continue running');
    console.warn('   You can configure the database later or create it if needed');
  });
} else {
  console.log('ℹ️  Database credentials not provided - running without database');
  console.log('   Set DB_HOST, DB_USER, DB_PASSWORD, and DB_DATABASE to enable database features');
}

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
