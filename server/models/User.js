import { getPool } from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, SALT_ROUNDS } from '../config/auth.js';

// Production-ready User model - database only, no in-memory fallback
let isInitialized = false;

// Initialize database table and create demo admin user
export const initializeUserTable = async () => {
  if (isInitialized) return;
  isInitialized = true;

  console.log('🔧 Initializing user system...');

  const dbPool = getPool();

  // Check if database is available
  if (!dbPool) {
    console.error('❌ Database pool not available');
    throw new Error('Database connection not available');
  }

  try {
    // Create users table if it doesn't exist
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        total_points INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        quizzes_completed INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_answers INTEGER DEFAULT 0,
        achievements TEXT[] DEFAULT '{}',
        google_id VARCHAR(255),
        facebook_id VARCHAR(255),
        accuracy DECIMAL(5,2) DEFAULT 0,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if demo admin user exists by email
    const demoUser = await dbPool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@quizmaster.com']
    );

    // Only insert demo admin user if it doesn't exist
    if (demoUser.rows.length === 0) {
      try {
        const hashedPassword = await bcrypt.hash('demo123', 10);
        await dbPool.query(`
          INSERT INTO users (email, password, full_name, role, total_points, current_streak, best_streak,
                            quizzes_completed, correct_answers, total_answers, achievements, created_date)
          VALUES ($1, $2, 'Demo Admin', 'admin', 0, 0, 0, 0, 0, 0, '{}', CURRENT_TIMESTAMP)
        `, ['demo@quizmaster.com', hashedPassword]);
        console.log('✅ Created demo admin user in database');
      } catch (hashError) {
        console.error('❌ Error creating demo user:', hashError);
        throw hashError;
      }
    }

    console.log('✅ Users table initialized');
  } catch (error) {
    console.error('❌ Error initializing users table:', error);
    throw error;
  }
};

// Helper function to create an achievement object
function createAchievement(id, title, timestamp) {
  return {
    id: `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'achievement_unlocked',
    achievement_id: id,
    title: title,
    timestamp: timestamp || new Date().toISOString()
  };
}

export const UserModel = {
  // Find all users
  async findAll() {
    const dbPool = getPool();
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const result = await dbPool.query('SELECT id, email, full_name, role, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, accuracy, created_date FROM users');
      return result.rows;
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  },

  // Find by ID
  async findById(id) {
    const dbPool = getPool();
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const result = await dbPool.query('SELECT id, email, full_name, role, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, accuracy, created_date FROM users WHERE id = $1', [id]);

      if (result.rows.length === 0) return null;

      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  },

  // Find by email
  async findByEmail(email) {
    console.log('🔍 Finding user by email:', email);

    const dbPool = getPool();
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
      console.log('🔍 Database query result:', result.rows.length, 'rows');
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  },

  // Validate user credentials
  async validateCredentials(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) return null;

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return null;

      // Update demo user to admin if it's the demo user
      if (email === 'demo@quizmaster.com' && user.role !== 'admin') {
        user.role = 'admin';
        user.full_name = 'Demo Admin';
      }

      // Remove password from returned user object
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error validating credentials:', error);
      return null;
    }
  },

  // Generate JWT token for user
  generateToken(user) {
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'user' // Default role is 'user'
      }
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  },

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  // Create user with hashed password
  async register({ email, password, full_name }) {
    const dbPool = getPool();
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const hashedPassword = await this.hashPassword(password);
      const result = await dbPool.query(
        `INSERT INTO users (email, password, full_name, role, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, email, full_name, role, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date`,
        [email, hashedPassword, full_name, 'user', 0, 0, 0, 0, 0, 0, '{}']
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      // Handle duplicate email error
      if (error.code === '23505') {
        throw new Error('Email already in use');
      }
      throw error;
    }
  },

  // Update user password
  async updatePassword(userId, newPassword) {
    const dbPool = getPool();
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const hashedPassword = await this.hashPassword(newPassword);
      await dbPool.query(
        'UPDATE users SET password = $1, updated_date = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, userId]
      );
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  },

  // Get user by JWT token
  async getUserFromToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return await this.findById(decoded.user.id);
    } catch (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
  },

  // Create user (supports both regular and OAuth users)
  async create(data) {
    const dbPool = getPool();
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      let hashedPassword = null;
      
      // Only hash password if it's provided (not for OAuth users)
      if (data.password) {
        hashedPassword = await bcrypt.hash(data.password, 10);
      } else if (data.google_id || data.facebook_id) {
        // For OAuth users, provide a default password since they don't need it
        hashedPassword = await bcrypt.hash('oauth-user-default-password', 10);
      }

      const result = await dbPool.query(`
        INSERT INTO users (email, password, full_name, google_id, facebook_id, role, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
        RETURNING id, email, full_name, role, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, google_id, facebook_id, created_date
      `, [
        data.email, 
        hashedPassword, 
        data.full_name, 
        data.google_id || null, 
        data.facebook_id || null,
        data.role || 'user',
        data.total_points || 0,
        data.current_streak || 0,
        data.best_streak || 0,
        data.quizzes_completed || 0,
        data.correct_answers || 0,
        data.total_answers || 0,
        data.achievements || '{}'
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      // Handle duplicate email error
      if (error.code === '23505') {
        throw new Error('Email already in use');
      }
      throw error;
    }
  },

  // Update user
  async update(id, data) {
    const dbPool = getPool();
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
    const dbPool = getPool();
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
    const dbPool = getPool();
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
  },

  // Update streak when user completes a quiz
  async updateStreak(userId) {
    const dbPool = getPool();
    if (!dbPool) return;

    try {
      // Get user's last activity date
      const result = await dbPool.query(
        'SELECT last_activity, current_streak, best_streak FROM users WHERE id = $1',
        [userId]
      );

      if (!result.rows.length) return;

      const { last_activity, current_streak, best_streak } = result.rows[0];
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = 1;
      let newBestStreak = best_streak || 0;

      if (last_activity) {
        const lastDate = new Date(last_activity);
        const isSameDay = (date1, date2) =>
          date1.getDate() === date2.getDate() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getFullYear() === date2.getFullYear();

        const isConsecutiveDay =
          lastDate.getDate() === yesterday.getDate() &&
          lastDate.getMonth() === yesterday.getMonth() &&
          lastDate.getFullYear() === yesterday.getFullYear();

        if (isSameDay(lastDate, today)) {
          // Already logged today, don't update
          return;
        } else if (isConsecutiveDay) {
          // Increment streak
          newStreak = (current_streak || 0) + 1;
          newBestStreak = Math.max(newBestStreak, newStreak);
        }
      }

      // Update user's streak
      await dbPool.query(`
        UPDATE users
        SET
          current_streak = $1,
          best_streak = $2,
          last_activity = CURRENT_DATE
        WHERE id = $3
      `, [newStreak, newBestStreak, userId]);

      // Check for streak achievements
      await this.checkStreakAchievements(userId);

      return { current_streak: newStreak, best_streak: newBestStreak };
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  },

  // Check and award streak achievements
  async checkStreakAchievements(userId) {
    const dbPool = getPool();
    if (!dbPool) return [];

    try {
      const result = await dbPool.query(
        'SELECT current_streak, achievements FROM users WHERE id = $1',
        [userId]
      );

      if (!result.rows.length) return [];

      const { current_streak, achievements = [] } = result.rows[0];
      const newAchievements = [];
      const now = new Date().toISOString();

      // Streak achievements
      if (current_streak >= 3 && !achievements.includes('streak_3')) {
        newAchievements.push(createAchievement('streak_3', '3-Day Streak!', now));
      }
      if (current_streak >= 7 && !achievements.includes('streak_7')) {
        newAchievements.push(createAchievement('streak_7', '7-Day Streak!', now));
      }
      if (current_streak >= 30 && !achievements.includes('streak_30')) {
        newAchievements.push(createAchievement('streak_30', '30-Day Streak!', now));
      }

      // Update user's achievements if there are new ones
      if (newAchievements.length > 0) {
        const achievementIds = newAchievements.map(a => a.achievement_id);
        await dbPool.query(`
          UPDATE users
          SET achievements = array_cat(achievements, $1::text[])
          WHERE id = $2
        `, [achievementIds, userId]);
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking streak achievements:', error);
      return [];
    }
  },

  // Check and award all possible achievements
  async checkAllAchievements(userId) {
    const dbPool = getPool();
    if (!dbPool) return [];

    try {
      const user = await this.findById(userId);
      if (!user) return [];

      const now = new Date().toISOString();
      const newAchievements = [];

      // Quiz count achievements
      if (user.quizzes_completed >= 1 && !user.achievements?.includes('first_quiz')) {
        newAchievements.push(createAchievement('first_quiz', 'First Quiz Completed!', now));
      }
      if (user.quizzes_completed >= 5 && !user.achievements?.includes('quiz_enthusiast')) {
        newAchievements.push(createAchievement('quiz_enthusiast', 'Quiz Enthusiast!', now));
      }
      if (user.quizzes_completed >= 25 && !user.achievements?.includes('quiz_master')) {
        newAchievements.push(createAchievement('quiz_master', 'Quiz Master!', now));
      }

      // Accuracy achievements
      const accuracy = user.total_answers > 0
        ? (user.correct_answers / user.total_answers) * 100
        : 0;

      if (accuracy >= 90 && !user.achievements?.includes('accuracy_90')) {
        newAchievements.push(createAchievement('accuracy_90', 'Accuracy Master (90%+)', now));
      }

      // Update user's achievements if there are new ones
      if (newAchievements.length > 0) {
        const achievementIds = newAchievements.map(a => a.achievement_id);
        await dbPool.query(`
          UPDATE users
          SET achievements = array_cat(achievements, $1::text[])
          WHERE id = $2
        `, [achievementIds, userId]);
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking all achievements:', error);
      return [];
    }
  }
};

// Initialize table when module is imported
initializeUserTable();