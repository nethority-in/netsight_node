/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// NotificationLog attributes interface
export interface NotificationLogAttributes {
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

// NotificationLog creation attributes (created_at and updated_at are auto-managed by Sequelize)
export interface NotificationLogCreationAttributes extends Optional<NotificationLogAttributes, 'id' | 'created_at' | 'updated_at'> {}

// NotificationLog model class
export class NotificationLog extends Model<NotificationLogAttributes, NotificationLogCreationAttributes> implements NotificationLogAttributes {
  public id!: number;
  public merchant_id!: number | null;
  public notification_setting_id!: number | null;
  public notification_type!: string | null;
  public channel!: string | null;
  public recipient!: string | null;
  public status!: string | null;
  public message!: string | null;
  public error_message!: string | null;
  public sent_at!: Date | null;
  public data!: string | null;
  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

// Initialize NotificationLog model
NotificationLog.init(
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
    notification_setting_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    notification_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    channel: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    recipient: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    data: {
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
    tableName: 'notification_logs',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default NotificationLog;
