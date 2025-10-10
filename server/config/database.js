import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Production-ready database connection configuration
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),

  // Production-ready connection settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times

  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // For cloud databases that use self-signed certificates
  } : false,

  // Keep connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
};

// Create a new pool instance
const dbPool = new Pool(dbConfig);

// Test the connection and handle errors properly
dbPool.on('connect', (client) => {
  if (client.processID) {
    console.log('✅ New client connected to PostgreSQL database');
  }
});

dbPool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err);
  // Don't exit the process, just log the error
  // The pool will create a new client for the next query
});

dbPool.on('remove', (client) => {
  console.log('✅ PostgreSQL client removed from pool');
});

// Test connection function for startup
export const testDatabaseConnection = async () => {
  let client;
  try {
    client = await dbPool.connect();
    await client.query('SELECT NOW()');
    console.log('✅ Successfully connected to PostgreSQL database');
    return true;
  } catch (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err.message);
    console.error('❌ Database connection failed. Please check your database configuration.');
    console.error('❌ Required environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Graceful shutdown handling
export const closeDatabaseConnection = async () => {
  try {
    await dbPool.end();
    console.log('✅ PostgreSQL connection pool closed');
  } catch (err) {
    console.error('❌ Error closing PostgreSQL connection pool:', err);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  await closeDatabaseConnection();
  process.exit(0);
});

export { dbPool };
