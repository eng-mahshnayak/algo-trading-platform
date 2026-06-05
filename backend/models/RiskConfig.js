import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const RiskConfigSchema = sequelize.define(
  'RiskConfig',
  {
    maxLoss: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    strategyOne: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        fund: 50000,
        maxLoss: 15000
      }
    },

    strategyTwo: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        fund: 100000,
        maxLoss: 30000
      }
    },

    maxProfit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  },
  {
    tableName: 'RiskConfig',
    timestamps: true,
  }
);

export default RiskConfigSchema;