import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL connection pool
let pool: Pool | null = null;

export const connectDatabase = async (): Promise<Pool | null> => {
  // Check if database credentials are provided
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbDatabase = process.env.DB_DATABASE;

  // If no credentials provided, skip connection
  if (!dbHost && !dbUser && !dbDatabase) {
    console.log('ℹ️  No database credentials found - skipping database connection');
    return null;
  }

  try {
    const poolConfig: PoolOptions = {
      host: dbHost || 'localhost',
      user: dbUser || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbDatabase || 'netsight',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    };

    pool = mysql.createPool(poolConfig);

    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
    
    return pool;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database connection error:', errorMessage);
    pool = null;
    return null;
  }
};

export const getDatabase = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Please check your database connection and ensure the database exists.');
  }
  return pool;
};

export default { connectDatabase, getDatabase };
