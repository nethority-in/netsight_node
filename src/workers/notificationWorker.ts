import dotenv from 'dotenv';
import { isRabbitEnabled, startNotificationConsumer } from '../queue/rabbitNotifications.js';

dotenv.config();

async function main(): Promise<void> {
  if (!isRabbitEnabled()) {
    console.log('RabbitMQ disabled. Set RABBITMQ_ENABLED=true to run worker.');
    return;
  }

  await startNotificationConsumer();
  console.log('Notification worker is running...');
}

main().catch((error) => {
  console.error('Notification worker startup failed:', error);
  process.exit(1);
});
