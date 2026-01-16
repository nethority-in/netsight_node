import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Get database configuration from environment variables
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
  }
});

// Test database connection
export const connectSequelize = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize database connection established successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Sequelize database connection error:', errorMessage);
    throw error;
  }
};

export default sequelize;
