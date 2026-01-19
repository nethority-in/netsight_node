import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Get database configuration from environment variables
// Support both local and server environments
const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbDatabase = process.env.DB_DATABASE || 'net-sight-local';

// Create Sequelize instance
export const sequelize = new Sequelize(dbDatabase, dbUser, dbPassword, {
  host: dbHost,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Handle special characters in password
  dialectOptions: {
    connectTimeout: 30000
  }
});

// Test database connection (non-blocking, returns boolean)
export const connectSequelize = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize database connection established successfully');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Sequelize database connection error:', errorMessage);
    console.warn('⚠️  Server will continue without database. Some features may not work.');
    return false;
  }
};

// Check if database is connected
export const isDatabaseConnected = (): boolean => {
  try {
    return sequelize.authenticate !== undefined;
  } catch {
    return false;
  }
};

export default sequelize;
