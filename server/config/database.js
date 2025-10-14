import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Create SSL config that will be reused
const sslConfig = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true' 
  ? {
      rejectUnauthorized: false,
      require: true,
      sslmode: 'require'
    } 
  : false;

// Production-ready database connection configuration
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),

  // SSL configuration for production (Render PostgreSQL)
  ssl: sslConfig,

  // Production-ready connection settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds timeout for connection
  maxUses: 7500, // Close a connection after 7500 uses

  // Keep connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
  
  // Query timeout
  query_timeout: 30000,
  statement_timeout: 30000,
};

// Singleton pool instance
let poolInstance = null;

// Function to get or create the pool
export const getPool = () => {
  if (!poolInstance) {
    if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD) {
      poolInstance = new Pool(dbConfig);
      console.log('🗄️  Database configuration found, connecting to PostgreSQL');
      console.log('📍 Database host:', process.env.DB_HOST);
      console.log('🔒 SSL enabled:', process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true');
      
      // Set up event listeners
      setupPoolListeners(poolInstance);
    } else {
      console.log('⚠️  Database credentials not found, using in-memory storage');
      console.log('📋 Required environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
    }
  }
  return poolInstance;
};

// Setup pool event listeners
const setupPoolListeners = (pool) => {
  pool.on('connect', (client) => {
    if (client.processID) {
      console.log('✅ New client connected to PostgreSQL database');
    }
  });

  pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle PostgreSQL client:', err.message);
    // Don't exit the process, just log the error
  });

  pool.on('remove', (client) => {
    console.log('♻️  PostgreSQL client removed from pool');
  });
};

// Initialize pool immediately
const pool = getPool();

// Test connection function for startup
export const testDatabaseConnection = async () => {
  const currentPool = getPool();
  
  if (!currentPool) {
    console.log('⚠️  No database connection available, using in-memory storage');
    return false;
  }

  let client;
  try {
    client = await currentPool.connect();
    await client.query('SELECT NOW()');
    console.log('✅ Successfully connected to PostgreSQL database');
    return true;
  } catch (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err.message);
    console.error('❌ SSL Error Details:', {
      ssl: dbConfig.ssl,
      host: process.env.DB_HOST,
      nodeEnv: process.env.NODE_ENV
    });
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Graceful shutdown handling
export const closeDatabaseConnection = async () => {
  const currentPool = getPool();
  
  if (!currentPool) {
    console.log('✅ No database connection to close');
    return;
  }

  try {
    await currentPool.end();
    poolInstance = null; // Reset singleton
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

// Export both named exports and default
export { pool };
export default pool;