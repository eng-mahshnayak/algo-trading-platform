import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Broker = sequelize.define(
    
  'Broker',
  {
brokerName: {
  type: DataTypes.STRING,
  allowNull: true,
  defaultValue: "",
  set(value) {
    const clean = value ? value.toString().trim().toLowerCase() : "";
    this.setDataValue("brokerName", clean);
  }
},
     brokerLink: {
      type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
    },
    tag:{
       type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
    }
  },
  {
    tableName: 'broker',  // ✅ dedicated table

    timestamps: true,
  }
);

export default Broker;
