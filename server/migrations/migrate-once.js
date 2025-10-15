// ============================================
// FILE: server/migrations/migrate-once.js
// Run this once to apply all migrations
// ============================================

import { pool } from '../config/database.js';

async function runAllMigrations() {
  if (!pool) {
    console.error('❌ Database pool not available');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    console.log('🚀 Starting database migrations...\n');

    await client.query('BEGIN');

    // Migration 1: Add role to users
    console.log('📝 Migration 1: Adding role to users table...');
    try {
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
          ) THEN
            ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
            RAISE NOTICE 'Added role column to users table';
          ELSE
            RAISE NOTICE 'Role column already exists';
          END IF;
        END $$;
      `);

      // Make demo user an admin
      await client.query(`
        UPDATE users
        SET role = 'admin', full_name = 'Demo Admin'
        WHERE email = 'demo@quizmaster.com'
      `);

      console.log('✅ Migration 1 completed\n');
    } catch (error) {
      console.error('❌ Migration 1 failed:', error.message);
      throw error;
    }

    // Migration 2: Create activity_logs table
    console.log('📝 Migration 2: Creating activity_logs table...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          activity_type VARCHAR(50) NOT NULL,
          activity_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
      `);

      // Add last_activity to users
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'last_activity'
          ) THEN
            ALTER TABLE users ADD COLUMN last_activity TIMESTAMP;
            RAISE NOTICE 'Added last_activity column to users table';
          ELSE
            RAISE NOTICE 'last_activity column already exists';
          END IF;
        END $$;
      `);

      console.log('✅ Migration 2 completed\n');
    } catch (error) {
      console.error('❌ Migration 2 failed:', error.message);
      throw error;
    }

    // Migration 3: Create leaderboard table
    console.log('📝 Migration 3: Creating leaderboard table...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS leaderboard (
          user_id INTEGER PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          total_score INTEGER DEFAULT 0,
          quizzes_completed INTEGER DEFAULT 0,
          correct_answers INTEGER DEFAULT 0,
          total_answers INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      console.log('✅ Migration 3 completed\n');
    } catch (error) {
      console.error('❌ Migration 3 failed:', error.message);
      throw error;
    }

    await client.query('COMMIT');
    console.log('🎉 All migrations completed successfully!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed, rolled back all changes');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runAllMigrations()
  .then(() => {
    console.log('✅ Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });


// ============================================
// HOW TO USE:
// ============================================
// 
// 1. Save this file as: server/migrations/migrate-once.js
// 
// 2. Run locally:
//    node server/migrations/migrate-once.js
// 
// 3. Or add to package.json:
//    "scripts": {
//      "migrate": "node server/migrations/migrate-once.js"
//    }
//    
//    Then run: npm run migrate
//
// 4. The script is safe to run multiple times - it checks
//    if columns/tables exist before creating them
//