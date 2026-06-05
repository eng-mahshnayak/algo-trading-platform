import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AngelOneToken = sequelize.define(
  'AngelOneToken',
  {
     userId: {
      type: DataTypes.INTEGER,   // 🔁 changed from UUID
      allowNull: false,
      unique: true,
    },
    authToken: {
      type: DataTypes.TEXT, 
      allowNull: false,
    },
    status:{
        type: DataTypes.STRING,
    }
  },
  {
    tableName: 'AngelOneToken',  // ✅ dedicated table
    timestamps: true,
  }
);

export default AngelOneToken;
