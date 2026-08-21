import dotenv from 'dotenv';
import { isRabbitEnabled, startNotificationConsumer, validateRabbitConfig } from '../queue/rabbitNotifications.js';

dotenv.config();

async function main(): Promise<void> {
  // Fail fast if config is invalid
  validateRabbitConfig();

  if (!isRabbitEnabled()) {
    console.log('RabbitMQ disabled. Set RABBITMQ_ENABLED=true to run worker.');
    return;
  }

  await startNotificationConsumer();
  console.log('Notification worker is running...');
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Worker shutting down (SIGINT)...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Worker shutting down (SIGTERM)...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Notification worker startup failed:', error);
  process.exit(1);
});
