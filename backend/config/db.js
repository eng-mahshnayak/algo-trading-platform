import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Use External Database URL for local development
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for Render PostgreSQL
    },
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully to Render');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    console.error('💡 Make sure you are using EXTERNAL Database URL');
  }
};

testConnection();

export default sequelize;