import { dbPool } from './config.js';
import { initializeQuizQuestionTable } from './models/QuizQuestion.js';
import { initializeUserTable } from './models/User.js';
import { initializeQuizSessionTable } from './models/QuizSession.js';

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    if (!dbPool) {
      throw new Error('Database connection not established');
    }

    // Initialize all tables
    await initializeUserTable();
    await initializeQuizQuestionTable();
    await initializeQuizSessionTable();

    console.log('✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
