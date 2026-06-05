import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const UserStrategy = sequelize.define(
  'UserStrategy',
  {
    strategyName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      unique: true, // ✅ Add unique constraint
      set(value) {
        const v = value ? value.trim().toLowerCase() : "";
        this.setDataValue("strategyName", v);
      }
    },
    strategyDis: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },
    maxLotSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue:0
    },
  },
  {
    tableName: 'user_strategy',
    timestamps: true,
  }
);

export default UserStrategy;