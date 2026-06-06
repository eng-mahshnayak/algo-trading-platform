import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  username: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
  set(value) {
    // Trim spaces + remove leading/trailing whitespace
    this.setDataValue("username", value.trim());
  }
},
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
     validate: {
    len: [10, 15], // ✅ min 10, max 15 characters
  },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'user','clone-user'),
    allowNull: false,
    defaultValue: 'user'
  },
  isChecked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  brokerName: {
  type: DataTypes.STRING,
  allowNull: true
},
brokerImageLink:{
  type: DataTypes.TEXT,
  allowNull: true,
},
angelLoginUser:{
  type: DataTypes.BOOLEAN,
  allowNull: true,
},
angelLoginExpiry: {
  type: DataTypes.DATE,
  allowNull: true,
  comment: "Expiry time for AngelOne login (auto logout after 10 hours)",
},
DematFund: {
  type: DataTypes.DECIMAL(10, 2), // 10 digits total, 2 decimals
  defaultValue: 0,
},
userToken:{
  type: DataTypes.TEXT,
  allowNull: true,
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
resetCode:{
  type: DataTypes.TEXT,
  allowNull: true,
},
resetCodeExpire:{
  type: DataTypes.TEXT,
  allowNull: true,
},
strategyName: {
  type: DataTypes.STRING,
  allowNull: true,
},
strategyDis:{
  type: DataTypes.TEXT,
  allowNull: true,
},
packageName:{
   type: DataTypes.STRING,
  allowNull: true,
},
packageDis:{
   type: DataTypes.TEXT,
  allowNull: true,
},
// to date for package
packageDate:{
   type: DataTypes.DATE,
      allowNull: true,
},
packageFromDate:{
   type: DataTypes.DATE,
      allowNull: true,
      
},
kite_key:{
   type: DataTypes.STRING,
    allowNull: true
},
kite_secret:{
   type: DataTypes.STRING,
    allowNull: true
},
kite_pin:{
   type: DataTypes.STRING,
    allowNull: true
},
kite_client_id:{
   type: DataTypes.STRING,
    allowNull: true
},
finavacia_vendor_code:{
 type: DataTypes.STRING,
    allowNull: true
},
finavacia_imei:{
    type: DataTypes.STRING,
    allowNull: true
},
source:{
    type: DataTypes.STRING,
    allowNull: true
},
assignEmp:{
    type: DataTypes.STRING,
    allowNull: true
},
instanceId:{
    type: DataTypes.STRING,
    allowNull: true
},
publicIp:{
    type: DataTypes.STRING,
    allowNull: true
},
status:{
    type: DataTypes.STRING,
    allowNull: true
},
CLIENT_PUBLIC_IP:{
   type: DataTypes.STRING,
    allowNull: true
},
CLIENT_LOCAL_IP:{
   type: DataTypes.STRING,
    allowNull: true
},
riskMngtActive: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},

riskLimit: {
  type: DataTypes.INTEGER,
  defaultValue: 0,
},

showPopup: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},
popupHtmlContent: {
  type: DataTypes.TEXT,
  allowNull: true,
},





// // Add these fields to your User model if not already present
// instanceState: {
//   type: String,
//   default: null
// },
// stoppedAt: {
//   type: Date,
//   default: null
// },
// startedAt: {
//   type: Date,
//   default: null
// },
// deletedAt: {
//   type: Date,
//   default: null
// }

}, {
  tableName: 'users',
  timestamps: true,
});

export default User;
