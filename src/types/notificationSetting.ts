/**
 * Notification Setting entity interface
 */
export interface NotificationSetting {
  id: number;
  merchant_id: number | null;
  notification_type: string | null;
  is_active: boolean | null;
  email_enabled: boolean | null;
  whatsapp_enabled: boolean | null;
  last_sent_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  frequencies: string | null; // JSON string or comma-separated values
}
