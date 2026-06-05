import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Platform_settings = sequelize.define(
    
  'platform_settings',
  {
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
       phone_support: {
        type: DataTypes.STRING,
        allowNull: true,
      },
       whatsapp_support: {
        type: DataTypes.STRING,
        allowNull: true,
      },
       website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
       software_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
       software_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
        isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue:false
      },
       software_logo: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
  },
  {
    tableName: 'platform_settings',  // ✅ dedicated table

    timestamps: true,
  }
);

export default Platform_settings;
