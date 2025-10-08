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

      if (result.rows.length === 0) return null;

      return result.rows[0];
    } catch (error) {
      console.error('Error finding quiz session by ID:', error);
      return null;
    }
  },

  // Find by user
  async findByUser(userId, limit = 10) {
    if (!dbPool) {
      return [];
    }

    try {
      const result = await dbPool.query(`
        SELECT * FROM quiz_sessions
        WHERE user_id = $1
        ORDER BY created_date DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows;
    } catch (error) {
      console.error('Error finding quiz sessions by user:', error);
      return [];
    }
  },

  // Create session
  async create(data) {
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const result = await dbPool.query(`
        INSERT INTO quiz_sessions (user_id, subject, difficulty, total_questions, correct_answers, score, status, answers, started_at, created_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [data.user_id, data.subject, data.difficulty, data.total_questions, data.correct_answers || 0, data.score || 0, data.status || 'in_progress', JSON.stringify(data.answers || [])]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating quiz session:', error);
      throw error;
    }
  },

  // Get user statistics
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

  // Get leaderboard
  async getLeaderboard(limit = 10) {
    if (!dbPool) {
      return [];
    }

    try {
      const result = await dbPool.query(`
        SELECT
          user_id,
          SUM(score) as total_score,
          COUNT(*) as sessions_count
        FROM quiz_sessions
        GROUP BY user_id
        HAVING SUM(score) > 0
        ORDER BY total_score DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => ({
        user_id: row.user_id,
        total_score: parseInt(row.total_score),
        sessions_count: parseInt(row.sessions_count)
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
};

// Initialize table when module is imported
initializeQuizSessionTable();