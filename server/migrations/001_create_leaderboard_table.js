import { dbPool } from '../config.js';

async function createLeaderboardTable() {
  try {
    console.log('🚀 Creating leaderboard table...');
    
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        user_id INTEGER PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        total_score INTEGER DEFAULT 0,
        quizzes_completed INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_answers INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Leaderboard table created successfully!');
  } catch (error) {
    console.error('❌ Error creating leaderboard table:', error);
    throw error;
  }
}

// Run the migration
createLeaderboardTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
