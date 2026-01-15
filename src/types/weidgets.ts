export interface Weidgets {
  id: number;
  type: string;
  category: string;
  key: string;
  title: string;
  description: string | null;
  icon: string | null;
  config: string | null; // JSON string
  is_active: boolean;
  free_plan_allowed: boolean;
  notification_enabled: boolean;
  sort_order: number;
  created_at: Date | null;
  updated_at: Date | null;
}