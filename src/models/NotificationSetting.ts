/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// NotificationSetting attributes interface
export interface NotificationSettingAttributes {
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

// NotificationSetting creation attributes (created_at and updated_at are auto-managed by Sequelize)
export interface NotificationSettingCreationAttributes extends Optional<NotificationSettingAttributes, 'id' | 'created_at' | 'updated_at'> {}

// NotificationSetting model class
export class NotificationSetting extends Model<NotificationSettingAttributes, NotificationSettingCreationAttributes> implements NotificationSettingAttributes {
  public id!: number;
  public merchant_id!: number | null;
  public notification_type!: string | null;
  public is_active!: boolean | null;
  public email_enabled!: boolean | null;
  public whatsapp_enabled!: boolean | null;
  public last_sent_at!: Date | null;
  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
  public frequencies!: string | null;
}

// Initialize NotificationSetting model
NotificationSetting.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    merchant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    notification_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    email_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    whatsapp_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    last_sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    frequencies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // created_at and updated_at are automatically handled by Sequelize with timestamps: true
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'notification_settings',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default NotificationSetting;
