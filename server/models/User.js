import { dbPool } from '../config.js';
import bcrypt from 'bcrypt';

// Initialize database table
export const initializeUserTable = async () => {
  if (!dbPool) {
    console.log('⚠️  Using in-memory storage for users');
    return;
  }

  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        total_points INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        quizzes_completed INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_answers INTEGER DEFAULT 0,
        achievements TEXT[] DEFAULT '{}',
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert demo user if not exists
    await dbPool.query(`
      INSERT INTO users (id, email, password, full_name, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date)
      VALUES (1, 'demo@quizmaster.com', $1, 'Demo User', 0, 0, 0, 0, 0, 0, '{}', CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO NOTHING
    `, [await bcrypt.hash('demo123', 10)]);

    console.log('✅ Users table initialized');
  } catch (error) {
    console.error('❌ Error initializing users table:', error);
  }
};

export const UserModel = {
  // Find all users
  async findAll() {
    if (!dbPool) {
      // Fallback to in-memory if no database
      return [];
    }

    try {
      const result = await dbPool.query('SELECT id, email, full_name, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date FROM users');
      return result.rows;
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  },

  // Find by ID
  async findById(id) {
    if (!dbPool) {
      return null;
    }

    try {
      const result = await dbPool.query('SELECT id, email, full_name, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date FROM users WHERE id = $1', [id]);

      if (result.rows.length === 0) return null;

      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  },

  // Find by email
  async findByEmail(email) {
    if (!dbPool) {
      return null;
    }

    try {
      const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  },

  // Create user
  async create(data) {
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const result = await dbPool.query(`
        INSERT INTO users (email, password, full_name, created_date)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id, email, full_name, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date
      `, [data.email, hashedPassword, data.full_name]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  async update(id, data) {
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (data.full_name !== undefined) {
        fields.push(`full_name = $${paramCount}`);
        values.push(data.full_name);
        paramCount++;
      }

      if (data.total_points !== undefined) {
        fields.push(`total_points = $${paramCount}`);
        values.push(data.total_points);
        paramCount++;
      }

      if (data.current_streak !== undefined) {
        fields.push(`current_streak = $${paramCount}`);
        values.push(data.current_streak);
        paramCount++;
      }

      if (data.best_streak !== undefined) {
        fields.push(`best_streak = $${paramCount}`);
        values.push(data.best_streak);
        paramCount++;
      }

      if (data.quizzes_completed !== undefined) {
        fields.push(`quizzes_completed = $${paramCount}`);
        values.push(data.quizzes_completed);
        paramCount++;
      }

      if (data.correct_answers !== undefined) {
        fields.push(`correct_answers = $${paramCount}`);
        values.push(data.correct_answers);
        paramCount++;
      }

      if (data.total_answers !== undefined) {
        fields.push(`total_answers = $${paramCount}`);
        values.push(data.total_answers);
        paramCount++;
      }

      if (data.achievements !== undefined) {
        fields.push(`achievements = $${paramCount}`);
        values.push(data.achievements);
        paramCount++;
      }

      fields.push(`updated_date = CURRENT_TIMESTAMP`);

      values.push(id);

      const result = await dbPool.query(`
        UPDATE users SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, email, full_name, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date
      `, values);

      if (result.rows.length === 0) return null;

      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  async delete(id) {
    if (!dbPool) {
      return false;
    }

    try {
      const result = await dbPool.query('DELETE FROM users WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },

  // Get top users by points
  async getTopUsers(limit = 10) {
    if (!dbPool) {
      return [];
    }

    try {
      const result = await dbPool.query(`
        SELECT id, email, full_name, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date
        FROM users
        WHERE total_points > 0
        ORDER BY total_points DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      console.error('Error getting top users:', error);
      return [];
    }
  }
};

// Initialize table when module is imported
initializeUserTable();