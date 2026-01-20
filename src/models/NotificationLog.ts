import { NotificationLog as PrismaNotificationLog } from '@prisma/client';

// Re-export Prisma types
export type NotificationLog = PrismaNotificationLog;
export type NotificationLogAttributes = PrismaNotificationLog;
export type NotificationLogCreationAttributes = Omit<PrismaNotificationLog, 'id' | 'created_at' | 'updated_at'>;

// For backward compatibility, export a default
export default NotificationLog;
