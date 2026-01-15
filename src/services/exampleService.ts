/**
 * Example service module
 * This demonstrates how to structure service modules
 */

import { getDatabase } from '../config/database.js';
import logger from '../utils/logger.js';

export class ExampleService {
  /**
   * Example method to fetch data from database
   */
  static async getData(): Promise<unknown[]> {
    try {
      const db = getDatabase();
      // Example query - replace with your actual queries
      const [rows] = await db.query('SELECT NOW() as current_time');
      logger.info('Data fetched successfully');
      return rows as unknown[];
    } catch (error) {
      logger.error('Error fetching data:', error);
      throw error;
    }
  }

  /**
   * Example method to process data
   */
  static async processData<T>(data: T): Promise<{ processed: boolean; data: T }> {
    try {
      // Add your business logic here
      logger.info('Processing data');
      return { processed: true, data };
    } catch (error) {
      logger.error('Error processing data:', error);
      throw error;
    }
  }
}

export default ExampleService;
