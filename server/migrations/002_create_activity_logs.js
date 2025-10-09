import { dbPool } from '../config.js';

async function createActivityLogsTable() {
  try {
    console.log('🚀 Creating activity_logs table...');
    
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        activity_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
      
      -- Add last_activity to users table if it doesn't exist
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP;
        EXCEPTION
          WHEN duplicate_column THEN 
            -- Column already exists, do nothing
            RAISE NOTICE 'column last_activity already exists in users';
        END;
      END $$;
    `);

    console.log('✅ Activity logs table created successfully!');
  } catch (error) {
    console.error('❌ Error creating activity logs table:', error);
    throw error;
  }
}

// Run the migration
createActivityLogsTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
