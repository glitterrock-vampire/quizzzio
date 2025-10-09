import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'quizzio',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

// Create a new pool instance
const dbPool = new Pool(dbConfig);

// Test the connection
dbPool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to the database:', err);
    return;
  }
  console.log('✅ Successfully connected to PostgreSQL database');
  release();
});

// Handle pool errors
dbPool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export { dbPool };
