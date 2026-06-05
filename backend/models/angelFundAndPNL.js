import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const FundPNL = sequelize.define('FundPNL', {
 
fund: {
      type: DataTypes.DECIMAL(18, 2),   // only 2 decimal digits stored
      allowNull: false,
      
}, 
pnl: {
      type: DataTypes.DECIMAL(18, 2),   // only 2 decimal digits stored
      allowNull: false,
}, 
userId: {
      type: DataTypes.INTEGER,  
      allowNull: false,
}, 
authToken: {
  type: DataTypes.TEXT,
  allowNull: true,
},
feedToken: {
  type: DataTypes.TEXT,
  allowNull: true,
},
refreshToken: {
  type: DataTypes.TEXT,
  allowNull: true,
},
}, {
  tableName: 'fundpnl',
  timestamps: true,
});

export default FundPNL;
