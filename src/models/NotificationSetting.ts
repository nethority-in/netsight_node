import type { NotificationSetting as PrismaNotificationSetting } from '@prisma/client';

// Re-export Prisma types for NotificationSetting
export type NotificationSetting = PrismaNotificationSetting;
export type NotificationSettingAttributes = PrismaNotificationSetting;
export type NotificationSettingCreationAttributes = Omit<PrismaNotificationSetting, 'id' | 'created_at' | 'updated_at'>;

// For backward compatibility, export a default
export default NotificationSetting;
