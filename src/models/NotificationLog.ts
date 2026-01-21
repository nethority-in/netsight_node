import type { NotificationLog as PrismaNotificationLog } from '@prisma/client'; //PrismaNotificationLog → database / Prisma layer and NotificationLog → application / domain layer
// Re-export Prisma types
export type NotificationLog = PrismaNotificationLog;
export type NotificationLogAttributes = PrismaNotificationLog;
export type NotificationLogCreationAttributes = Omit<PrismaNotificationLog, 'id' | 'created_at' | 'updated_at'>;

// For backward compatibility, export a default
export default NotificationLog;
