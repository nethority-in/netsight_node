import type { Widget as PrismaWidget } from '@prisma/client';

// Re-export Prisma types for Widget
export type Widget = PrismaWidget;
export type WidgetAttributes = PrismaWidget;
export type WidgetCreationAttributes = Omit<PrismaWidget, 'id' | 'created_at' | 'updated_at'>;

// For backward compatibility, export a default
export default Widget;
