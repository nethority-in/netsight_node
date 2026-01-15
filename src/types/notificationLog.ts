/**
 * Notification Log entity interface
 */
export interface NotificationLog {
  id: number;
  merchant_id: number | null;
  notification_setting_id: number | null;
  notification_type: string | null;
  channel: string | null;
  recipient: string | null;
  status: string | null;
  message: string | null;
  error_message: string | null;
  sent_at: Date | null;
  data: string | null; // JSON string
  created_at: Date | null;
  updated_at: Date | null;
}
