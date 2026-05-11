import { PrismaClient } from '@prisma/logs-client';

const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT job_id, job_type, status, attempts, max_attempts, created_at, processed_at, next_retry_at FROM notification_job_tracking ORDER BY id DESC LIMIT 10'
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await prisma.$disconnect();
}
