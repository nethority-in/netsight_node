/* eslint-disable @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Widget attributes interface
export interface WidgetAttributes {
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

// Widget creation attributes (created_at and updated_at are auto-managed by Sequelize)
export interface WidgetCreationAttributes extends Optional<WidgetAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Widget model class
export class Widget extends Model<WidgetAttributes, WidgetCreationAttributes> implements WidgetAttributes {
  public id!: number;
  public type!: string;
  public category!: string;
  public key!: string;
  public title!: string;
  public description!: string | null;
  public icon!: string | null;
  public config!: string | null;
  public is_active!: boolean;
  public free_plan_allowed!: boolean;
  public notification_enabled!: boolean;
  public sort_order!: number;
  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

// Initialize Widget model
Widget.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    config: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    free_plan_allowed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    notification_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'widgets',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Widget;
