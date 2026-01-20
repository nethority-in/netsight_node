import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Construct DATABASE_URL from individual env vars if DATABASE_URL is not set
// This maintains backward compatibility with existing DB_HOST, DB_USER, etc. env vars
if (!process.env.DATABASE_URL) {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbDatabase = process.env.DB_DATABASE || 'net-sight-local';
  const dbPort = process.env.DB_PORT || '3306';
  
  // Construct MySQL connection URL
  // Format: mysql://user:password@host:port/database
  const passwordPart = dbPassword ? `:${encodeURIComponent(dbPassword)}` : '';
  process.env.DATABASE_URL = `mysql://${dbUser}${passwordPart}@${dbHost}:${dbPort}/${dbDatabase}`;
}

// Create Prisma Client instance
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test database connection (non-blocking, returns boolean)
export const connectPrisma = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma database connection established successfully');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Prisma database connection error:', errorMessage);
    console.warn('⚠️  Server will continue without database. Some features may not work.');
    return false;
  }
};

// Disconnect Prisma Client
export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma database connection closed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error disconnecting Prisma:', errorMessage);
  }
};

// Check if database is connected
export const isDatabaseConnected = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

export default prisma;
