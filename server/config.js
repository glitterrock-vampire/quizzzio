import dotenv from 'dotenv';
import pkg from 'pg';
import { getPool } from './config/database.js';

const { Pool } = pkg;

dotenv.config({ path: '.env.local' });

export const config = {
  port: process.env.PORT || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database (configure based on your choice)
  database: {
    type: process.env.DB_TYPE || 'memory', // memory, postgres, mysql, mongodb
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'quizzio',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

// PostgreSQL connection pool using the new database configuration
let dbPool = null;

if (config.database.type === 'postgres' && process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD) {
  // Use the new database configuration
  dbPool = getPool();

  console.log('🗄️  Database configuration found, using enhanced PostgreSQL connection');

  // Test the connection (only if dbPool exists)
  if (dbPool) {
    dbPool.on('connect', (client) => {
      if (client.processID) {
        console.log('✅ PostgreSQL connected successfully');
      }
    });

    dbPool.on('error', (err) => {
      console.error('❌ PostgreSQL connection error:', err);
    });
  }
} else {
  console.log('⚠️  Database credentials not found or not using PostgreSQL, using in-memory storage');
  console.log('📋 Required environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
}

export { dbPool };

export default config;