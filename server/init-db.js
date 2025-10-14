import { dbPool } from './config.js';
import { initializeQuizQuestionTable } from './models/QuizQuestion.js';
import { initializeUserTable } from './models/User.js';
import { initializeQuizSessionTable } from './models/QuizSession.js';

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');

    if (!dbPool) {
      console.log('⚠️ Database connection not established - skipping table initialization');
      return;
    }

    // Initialize tables individually with error handling
    try {
      await initializeUserTable();
      console.log('✅ Users table initialized');
    } catch (error) {
      console.error('❌ Failed to initialize users table:', error.message);
    }

    try {
      await initializeQuizQuestionTable();
      console.log('✅ Quiz question tables initialized');
    } catch (error) {
      console.error('❌ Failed to initialize quiz question tables:', error.message);
      console.log('💡 Application will use in-memory fallback for questions');
    }

    try {
      await initializeQuizSessionTable();
      console.log('✅ Quiz session tables initialized');
    } catch (error) {
      console.error('❌ Failed to initialize quiz session tables:', error.message);
    }

    console.log('✅ Database initialization completed (some tables may have failed but application continues)');
    return true;
  } catch (error) {
    console.error('❌ Error during database initialization:', error.message);
    console.log('💡 Database initialization failed but application will continue');
    return false;
  }
}

// Run the initialization (but don't exit the application)
initializeDatabase();

export { initializeDatabase };
