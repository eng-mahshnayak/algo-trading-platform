import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AngelOneCredential = sequelize.define(
  'AngelOneCredential',
  {
     userId: {
      type: DataTypes.INTEGER,   // 🔁 changed from UUID
      allowNull: false,
      unique: true,
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totpSecret: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'angelone_credentials',  // ✅ dedicated table
    timestamps: true,
  }
);

export default AngelOneCredential;
