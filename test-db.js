import { Pool } from 'pg';
import { config } from './server/config.js';

const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.name,
  password: config.database.password,
  port: config.database.port,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    
    // List all tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nTables in the database:');
    console.table(res.rows);
    
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
}

testConnection();
