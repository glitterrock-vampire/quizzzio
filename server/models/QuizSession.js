import { dbPool } from '../config.js';

// Initialize database table
export const initializeQuizSessionTable = async () => {
  if (!dbPool) {
    console.log('⚠️  Using in-memory storage for quiz sessions');
    return;
  }

  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject VARCHAR(100),
        difficulty VARCHAR(20),
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'in_progress',
        answers JSONB DEFAULT '[]',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Quiz sessions table initialized');
  } catch (error) {
    console.error('❌ Error initializing quiz sessions table:', error);
  }
};

export const QuizSessionModel = {
  // Find all sessions
  async findAll() {
    if (!dbPool) {
      return [];
    }

    try {
      const result = await dbPool.query(`
        SELECT * FROM quiz_sessions
        ORDER BY created_date DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error finding quiz sessions:', error);
      return [];
    }
  },

  // Find by ID
  async findById(id) {
    if (!dbPool) {
      return null;
    }

    try {
      const result = await dbPool.query('SELECT * FROM quiz_sessions WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding quiz session by ID:', error);
      return null;
    }
  },

  // Find by user with pagination
  async findByUserWithPagination(userId, limit = 10, offset = 0) {
    if (!dbPool) {
      return { rows: [], count: 0 };
    }

    try {
      // Get total count
      const countResult = await dbPool.query(
        'SELECT COUNT(*) FROM quiz_sessions WHERE user_id = $1',
        [userId]
      );
      
      // Get paginated results
      const result = await dbPool.query(
        `SELECT * FROM quiz_sessions 
         WHERE user_id = $1 
         ORDER BY COALESCE(completed_at, created_date) DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return {
        rows: result.rows,
        count: parseInt(countResult.rows[0].count, 10)
      };
    } catch (error) {
      console.error('Error finding quiz sessions by user with pagination:', error);
      return { rows: [], count: 0 };
    }
  },

  // Find by user (backward compatibility)
  async findByUser(userId, limit = 10) {
    const { rows } = await this.findByUserWithPagination(userId, limit, 0);
    return rows;
  },

  // Create session
  async create(data) {
    if (!dbPool) {
    }

    try {
      const result = await dbPool.query(`
        INSERT INTO quiz_sessions (user_id, subject, difficulty, total_questions, correct_answers, score, status, answers, started_at, created_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [data.user_id, data.subject, data.difficulty || null, data.total_questions, data.correct_answers || 0, data.score || 0, data.status || 'in_progress', JSON.stringify(data.answers || [])]);

      const session = result.rows[0];

      // Update user statistics after creating session
      await this.updateUserStats(data.user_id);

      // Check for session-based achievements
      await this.checkSessionBasedAchievements(data);

      return session;
    } catch (error) {
      console.error('Error creating quiz session:', error);
      throw error;
    }
  },

  // Update user statistics after creating a session
  async updateUserStats(userId) {
    if (!dbPool) return;

    try {
      console.log(`🔄 Updating stats for user ${userId}`);

      // Get all user's quiz sessions to calculate cumulative stats
      const sessionsResult = await dbPool.query(`
        SELECT total_questions, correct_answers, score
        FROM quiz_sessions
        WHERE user_id = $1
      `, [userId]);

      const sessions = sessionsResult.rows;
      const totalSessions = sessions.length;

      if (totalSessions === 0) {
        console.log('⚠️ No sessions found for user');
        return;
      }

      // Calculate cumulative stats
      const totalQuestions = sessions.reduce((sum, session) => sum + (session.total_questions || 0), 0);
      const totalCorrectAnswers = sessions.reduce((sum, session) => sum + (session.correct_answers || 0), 0);
      const totalScore = sessions.reduce((sum, session) => sum + (session.score || 0), 0);

      // Calculate streak and other stats
      const maxScore = Math.max(...sessions.map(s => s.score || 0));
      const avgAccuracy = totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0;

      console.log(`📊 Stats calculated:`, {
        totalSessions,
        totalScore,
        totalQuestions,
        totalCorrectAnswers,
        avgAccuracy: Math.round(avgAccuracy)
      });

      // Update user record with cumulative stats
      await dbPool.query(`
        UPDATE users
        SET
          total_points = $1,
          correct_answers = $2,
          total_answers = $3,
          quizzes_completed = $4,
          best_streak = GREATEST(best_streak, $5),
          accuracy = $6,
          updated_date = CURRENT_TIMESTAMP
        WHERE id = $7
      `, [totalScore, totalCorrectAnswers, totalQuestions, totalSessions, maxScore, Math.round(avgAccuracy), userId]);

      console.log(`✅ User ${userId} stats updated successfully`);

      // Check and unlock achievements after updating stats
      await this.checkAndUnlockAchievements(userId);
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
    }
  },
  async getUserStats(userId) {
    if (!dbPool) {
      return {
        total_sessions: 0,
        total_score: 0,
        average_score: 0,
        total_questions: 0,
        correct_answers: 0,
        accuracy: 0
      };
    }

    try {
      const result = await dbPool.query(`
        SELECT
          COUNT(*) as total_sessions,
          SUM(score) as total_score,
          SUM(total_questions) as total_questions,
          SUM(correct_answers) as correct_answers
        FROM quiz_sessions
        WHERE user_id = $1
      `, [userId]);

      const stats = result.rows[0];

      if (!stats.total_sessions || stats.total_sessions === '0') {
        return {
          total_sessions: 0,
          total_score: 0,
          average_score: 0,
          total_questions: 0,
          correct_answers: 0,
          accuracy: 0
        };
      }

      return {
        total_sessions: parseInt(stats.total_sessions),
        total_score: parseInt(stats.total_score || 0),
        average_score: Math.round(parseInt(stats.total_score || 0) / parseInt(stats.total_sessions)),
        total_questions: parseInt(stats.total_questions || 0),
        correct_answers: parseInt(stats.correct_answers || 0),
        accuracy: Math.round((parseInt(stats.correct_answers || 0) / parseInt(stats.total_questions || 1)) * 100)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total_sessions: 0,
        total_score: 0,
        average_score: 0,
        total_questions: 0,
        correct_answers: 0,
        accuracy: 0
      };
    }
  },

  // Update leaderboard for a user
  async updateLeaderboard(userId) {
    if (!dbPool) return;

    try {
      await dbPool.query(`
        INSERT INTO leaderboard (user_id, username, total_score, quizzes_completed, correct_answers, total_answers)
        SELECT 
          u.id as user_id,
          u.email as username,
          COALESCE(SUM(qs.score), 0) as total_score,
          COUNT(qs.id) as quizzes_completed,
          u.correct_answers,
          u.total_answers
        FROM users u
        LEFT JOIN quiz_sessions qs ON u.id = qs.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.email, u.correct_answers, u.total_answers
        ON CONFLICT (user_id) 
        DO UPDATE SET
          total_score = EXCLUDED.total_score,
          quizzes_completed = EXCLUDED.quizzes_completed,
          correct_answers = EXCLUDED.correct_answers,
          total_answers = EXCLUDED.total_answers,
          last_updated = CURRENT_TIMESTAMP
      `, [userId]);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  },

  // Get leaderboard
  async getLeaderboard(limit = 10) {
    if (!dbPool) {
      return [];
    }

    try {
      // First ensure leaderboard is up to date for all users
      await dbPool.query(`
        WITH user_stats AS (
          SELECT 
            u.id as user_id,
            u.email as username,
            COALESCE(SUM(qs.score), 0) as total_score,
            COUNT(qs.id) as quizzes_completed,
            u.correct_answers,
            u.total_answers
          FROM users u
          LEFT JOIN quiz_sessions qs ON u.id = qs.user_id
          GROUP BY u.id, u.email, u.correct_answers, u.total_answers
        )
        INSERT INTO leaderboard (user_id, username, total_score, quizzes_completed, correct_answers, total_answers)
        SELECT user_id, username, total_score, quizzes_completed, correct_answers, total_answers
        FROM user_stats
        ON CONFLICT (user_id) 
        DO UPDATE SET
          total_score = EXCLUDED.total_score,
          quizzes_completed = EXCLUDED.quizzes_completed,
          correct_answers = EXCLUDED.correct_answers,
          total_answers = EXCLUDED.total_answers,
          last_updated = CURRENT_TIMESTAMP
        WHERE leaderboard.last_updated < NOW() - INTERVAL '1 hour';
      `);

      // Now fetch the leaderboard
      const result = await dbPool.query(`
        SELECT 
          user_id,
          username,
          total_score,
          quizzes_completed,
          correct_answers,
          total_answers,
          ROUND((correct_answers::DECIMAL / NULLIF(total_answers, 0)) * 100, 0) as accuracy
        FROM leaderboard
        WHERE total_score > 0
        ORDER BY total_score DESC, accuracy DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map((row, index) => ({
        rank: index + 1,
        user_id: row.user_id,
        username: row.username,
        total_score: parseInt(row.total_score),
        quizzes_completed: parseInt(row.quizzes_completed),
        correct_answers: parseInt(row.correct_answers),
        total_answers: parseInt(row.total_answers),
        accuracy: row.accuracy ? parseInt(row.accuracy) : 0
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  },

  // Check for session-based achievements (speedster, perfectionist, etc.)
  async checkSessionBasedAchievements(sessionData) {
    if (!dbPool) return [];

    try {
      const { user_id, total_questions, correct_answers, time_taken } = sessionData;
      const accuracy = total_questions > 0 ? (correct_answers / total_questions) * 100 : 0;

      console.log(`🏃 Checking session-based achievements for session:`, {
        total_questions,
        correct_answers,
        accuracy: Math.round(accuracy),
        time_taken
      });

      // Get current user achievements
      const userResult = await dbPool.query(
        'SELECT achievements FROM users WHERE id = $1',
        [user_id]
      );

      if (userResult.rows.length === 0) {
        console.log('❌ User not found for session-based achievements');
        return [];
      }

      const currentAchievements = userResult.rows[0].achievements || [];
      const newAchievements = [];

      // Check for perfectionist (100% accuracy)
      if (accuracy === 100 && !currentAchievements.includes('perfectionist')) {
        console.log(`🏆 Unlocking perfectionist achievement`);
        newAchievements.push('perfectionist');
      }

      // Check for speedster (under 2 minutes)
      if (time_taken && time_taken < 120 && !currentAchievements.includes('speedster')) {
        console.log(`🏆 Unlocking speedster achievement (${time_taken}s < 120s)`);
        newAchievements.push('speedster');
      }

      // Unlock new achievements
      if (newAchievements.length > 0) {
        const updatedAchievements = [...currentAchievements, ...newAchievements];

        await dbPool.query(
          'UPDATE users SET achievements = $1, updated_date = CURRENT_TIMESTAMP WHERE id = $2',
          [updatedAchievements, user_id]
        );

        console.log(`✅ Unlocked ${newAchievements.length} session-based achievements:`, newAchievements);
      } else {
        console.log('ℹ️ No session-based achievements to unlock');
      }

      return newAchievements;
    } catch (error) {
      console.error('❌ Error checking session-based achievements:', error);
      return [];
    }
  },
  async checkAndUnlockAchievements(userId) {
    if (!dbPool) return [];

    try {
      console.log(`🔓 Checking achievements for user ${userId}`);

      // Get current user data with achievements
      const userResult = await dbPool.query(
        'SELECT total_points, quizzes_completed, correct_answers, total_answers, best_streak, achievements FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        console.log('❌ User not found');
        return [];
      }

      const user = userResult.rows[0];
      const currentAchievements = user.achievements || [];
      const newAchievements = [];

      console.log(`📊 Current user stats:`, {
        total_points: user.total_points,
        quizzes_completed: user.quizzes_completed,
        correct_answers: user.correct_answers,
        total_answers: user.total_answers,
        best_streak: user.best_streak,
        current_achievements: currentAchievements
      });

      // Define achievement criteria
      const achievementCriteria = {
        'first_quiz': { condition: () => user.quizzes_completed >= 1, description: 'Complete your first quiz' },
        'quiz_enthusiast': { condition: () => user.quizzes_completed >= 5, description: 'Complete 5 quizzes' },
        'quiz_master': { condition: () => user.quizzes_completed >= 25, description: 'Complete 25 quizzes' },
        'scholar': { condition: () => user.quizzes_completed >= 10, description: 'Complete 10 quizzes' },
        'century': { condition: () => user.total_points >= 100, description: 'Earn 100 points' },
        'speedster': { condition: () => false, description: 'Complete a quiz in under 2 minutes (session-based)' },
        'perfectionist': { condition: () => false, description: 'Complete a quiz with 100% accuracy (session-based)' },
        'accuracy_master': { condition: () => {
          const accuracy = user.total_answers > 0 ? (user.correct_answers / user.total_answers) * 100 : 0;
          return accuracy >= 90;
        }, description: 'Maintain 90%+ accuracy overall' },
        'streak_3': { condition: () => user.best_streak >= 3, description: 'Get a 3-quiz streak' },
        'streak_5': { condition: () => user.best_streak >= 5, description: 'Get a 5-quiz streak' },
        'streak_7': { condition: () => user.best_streak >= 7, description: 'Get a 7-quiz streak' },
        'streak_30': { condition: () => user.best_streak >= 30, description: 'Get a 30-quiz streak' }
      };

      // Check each achievement
      for (const [achievementId, criteria] of Object.entries(achievementCriteria)) {
        if (!currentAchievements.includes(achievementId) && criteria.condition()) {
          console.log(`🏆 Unlocking achievement: ${achievementId} - ${criteria.description}`);
          newAchievements.push(achievementId);
        }
      }

      // Unlock new achievements
      if (newAchievements.length > 0) {
        const updatedAchievements = [...currentAchievements, ...newAchievements];

        await dbPool.query(
          'UPDATE users SET achievements = $1, updated_date = CURRENT_TIMESTAMP WHERE id = $2',
          [updatedAchievements, userId]
        );

        console.log(`✅ Unlocked ${newAchievements.length} achievements:`, newAchievements);
      } else {
        console.log('ℹ️ No new achievements to unlock');
      }

      return newAchievements;
    } catch (error) {
      console.error('❌ Error checking achievements:', error);
      return [];
    }
  }
};

// Initialize table when module is imported
initializeQuizSessionTable();