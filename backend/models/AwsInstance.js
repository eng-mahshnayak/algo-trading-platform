// models/AwsInstance.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AwsInstance = sequelize.define('AwsInstance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  instanceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'instance_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  userName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'user_name'
  },
  userEmail: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'user_email'
  },
  publicIp: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'public_ip'
  },
  elasticIp: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'elastic_ip'
  },
  privateIp: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'private_ip'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'RUNNING', 'STOPPING', 'STOPPED', 'TERMINATING', 'TERMINATED', 'FAILED'),
    defaultValue: 'PENDING',
    field: 'status'
  },
  instanceType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'instance_type'
  },
  amiId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'ami_id'
  },
  lastStateChange: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_state_change'
  },
  terminatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'terminated_at'
  }
}, {
  tableName: 'aws_instances',
  timestamps: true,
  underscored: true
});

export default AwsInstance;