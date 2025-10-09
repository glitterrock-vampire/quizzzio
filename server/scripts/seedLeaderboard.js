import { dbPool } from '../config.js';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with test data...');

    // 1. Create test users
    const users = [
      { email: 'alice@example.com', name: 'Alice Johnson' },
      { email: 'bob@example.com', name: 'Bob Smith' },
      { email: 'charlie@example.com', name: 'Charlie Brown' },
      { email: 'diana@example.com', name: 'Diana Prince' },
      { email: 'edward@example.com', name: 'Edward Norton' }
    ];

    console.log('👥 Creating test users...');
    const userIds = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const result = await dbPool.query(
        `INSERT INTO users (email, password, full_name, correct_answers, total_answers)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [user.email, hashedPassword, user.name, 0, 0]
      );
      userIds.push(result.rows[0].id);
    }

    // 2. Create quiz sessions
    console.log('🎯 Creating quiz sessions...');
    const subjects = ['JavaScript', 'Python', 'History', 'Science', 'Geography'];
    const difficulties = ['easy', 'medium', 'hard'];
    
    for (let i = 0; i < 50; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const score = Math.floor(Math.random() * 100);
      const correct = Math.floor(score / 10);
      const total = 10; // 10 questions per quiz
      
      await dbPool.query(
        `INSERT INTO quiz_sessions 
         (user_id, subject, difficulty, total_questions, correct_answers, score, status, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW() - (random() * INTERVAL '30 days'))`,
        [
          userId,
          subjects[Math.floor(Math.random() * subjects.length)],
          difficulties[Math.floor(Math.random() * difficulties.length)],
          total,
          correct,
          score
        ]
      );

      // Update user's correct_answers and total_answers
      await dbPool.query(
        `UPDATE users 
         SET correct_answers = correct_answers + $1,
             total_answers = total_answers + $2,
             quizzes_completed = quizzes_completed + 1,
             total_points = COALESCE(total_points, 0) + $3
         WHERE id = $4`,
        [correct, total, score, userId]
      );
    }

    console.log('✅ Test data seeded successfully!');
    console.log('🔍 You can now check the leaderboard at: http://localhost:3000/api/quiz-sessions/leaderboard/top');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
