import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,      // kitne max connections allow karne hai from THIS app
      min: 0,
      acquire: 30000, // 30s tak wait karega connection milne ka
      idle: 10000,    // 10s idle rahe to connection close
    },
  }
);

export default sequelize;
