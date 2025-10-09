import { dbPool } from '../config/database.js';

/**
 * Migration: Add role field to users table
 */
export const up = async () => {
  if (!dbPool) {
    console.log('⚠️  Using in-memory storage - skipping migration');
    return;
  }

  try {
    // Add role column to users table
    await dbPool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'
    `);

    // Update the demo user to be an admin
    await dbPool.query(`
      UPDATE users
      SET role = 'admin', full_name = 'Demo Admin'
      WHERE email = $1
    `, ['demo@quizmaster.com']);

    console.log('✅ Added role field to users table and made demo user an admin');
  } catch (error) {
    console.error('❌ Error in migration:', error);
    throw error;
  }
};

export const down = async () => {
  if (!dbPool) {
    console.log('⚠️  Using in-memory storage - skipping rollback');
    return;
  }

  try {
    // Remove role column
    await dbPool.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS role
    `);

    console.log('✅ Removed role field from users table');
  } catch (error) {
    console.error('❌ Error in rollback:', error);
    throw error;
  }
};
