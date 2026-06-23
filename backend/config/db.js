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






// import { Sequelize } from 'sequelize';
// import dotenv from 'dotenv';

// dotenv.config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: 'postgres',
//     logging: false,
//     pool: {
//       max: 10,      // kitne max connections allow karne hai from THIS app
//       min: 0,
//       acquire: 30000, // 30s tak wait karega connection milne ka
//       idle: 10000,    // 10s idle rahe to connection close
//     },
//   }
// );

// export default sequelize;
