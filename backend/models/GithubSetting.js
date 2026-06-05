import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const GithubSetting = sequelize.define(
  'github_setting',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    github_repo_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    github_branch: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'main',
    },
    github_token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    admin_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'github_settings',
    timestamps: true,
  }
);

export default GithubSetting;