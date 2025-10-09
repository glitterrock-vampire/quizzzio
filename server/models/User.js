import { dbPool } from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, SALT_ROUNDS } from '../config/auth.js';

// In-memory storage fallback
let inMemoryUsers = [];
let isInitialized = false;

// Initialize database table and create demo admin user
export const initializeUserTable = async () => {
  if (isInitialized) return;
  isInitialized = true;

  console.log('🔧 Initializing user system...');
  console.log('🔧 Bcrypt available:', !!bcrypt);
  console.log('🔧 Database pool available:', !!dbPool);

  // Always ensure demo admin user exists in memory for development
  if (!dbPool) {
    console.log('⚠️  Using in-memory storage for users');

    // Check if demo user already exists
    if (!inMemoryUsers.find(user => user.email === 'demo@quizmaster.com')) {
      try {
        console.log('🔧 Attempting to hash password with bcrypt...');
        const hashedPassword = await bcrypt.hash('demo123', 10);
        console.log('🔧 Password hashed successfully');
        const demoAdminUser = {
          id: 6,
          email: 'demo@quizmaster.com',
          password: hashedPassword,
          full_name: 'Demo Admin',
          role: 'admin',
          total_points: 0,
          current_streak: 0,
          best_streak: 0,
          quizzes_completed: 0,
          correct_answers: 0,
          total_answers: 0,
          achievements: [],
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };

        inMemoryUsers.push(demoAdminUser);
        console.log('✅ Created demo admin user in memory');
      } catch (error) {
        console.error('❌ Error hashing password for demo user:', error);
        // Create user without bcrypt for fallback
        const demoAdminUser = {
          id: 6,
          email: 'demo@quizmaster.com',
          password: '$2b$10$rEuVt2qKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZq', // Pre-hashed demo123
          full_name: 'Demo Admin',
          role: 'admin',
          total_points: 0,
          current_streak: 0,
          best_streak: 0,
          quizzes_completed: 0,
          correct_answers: 0,
          total_answers: 0,
          achievements: [],
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };

        inMemoryUsers.push(demoAdminUser);
        console.log('✅ Created demo admin user in memory (bcrypt fallback)');
      }
    }
    return;
  }

  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
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

    // Check if demo admin user exists by email
    const demoUser = await dbPool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@quizmaster.com']
    );

    // Only insert demo admin user if it doesn't exist
    if (demoUser.rows.length === 0) {
      try {
        await dbPool.query(`
          INSERT INTO users (email, password, full_name, role, total_points, current_streak, best_streak,
                            quizzes_completed, correct_answers, total_answers, achievements, created_date)
          VALUES ($1, $2, 'Demo Admin', 'admin', 0, 0, 0, 0, 0, 0, '{}', CURRENT_TIMESTAMP)
        `, ['demo@quizmaster.com', await bcrypt.hash('demo123', 10)]);
        console.log('✅ Created demo admin user in database');
      } catch (hashError) {
        console.error('❌ Error hashing password for database demo user:', hashError);
        // Fallback to pre-hashed password
        await dbPool.query(`
          INSERT INTO users (email, password, full_name, role, total_points, current_streak, best_streak,
                            quizzes_completed, correct_answers, total_answers, achievements, created_date)
          VALUES ($1, $2, 'Demo Admin', 'admin', 0, 0, 0, 0, 0, 0, '{}', CURRENT_TIMESTAMP)
        `, ['demo@quizmaster.com', '$2b$10$rEuVt2qKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZq']);
        console.log('✅ Created demo admin user in database (bcrypt fallback)');
      }
    }

    console.log('✅ Users table initialized');
  } catch (error) {
    console.error('❌ Error initializing users table:', error);
    // Even if database fails, ensure demo user exists in memory
    if (!inMemoryUsers.find(user => user.email === 'demo@quizmaster.com')) {
      try {
        const hashedPassword = await bcrypt.hash('demo123', 10);
        const demoAdminUser = {
          id: 6,
          email: 'demo@quizmaster.com',
          password: hashedPassword,
          full_name: 'Demo Admin',
          role: 'admin',
          total_points: 0,
          current_streak: 0,
          best_streak: 0,
          quizzes_completed: 0,
          correct_answers: 0,
          total_answers: 0,
          achievements: [],
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };

        inMemoryUsers.push(demoAdminUser);
        console.log('✅ Created demo admin user in memory (fallback)');
      } catch (bcryptError) {
        console.error('❌ Error with bcrypt fallback:', bcryptError);
        // Final fallback - create user with simple password
        const demoAdminUser = {
          id: 6,
          email: 'demo@quizmaster.com',
          password: 'demo123', // Plain text fallback
          full_name: 'Demo Admin',
          role: 'admin',
          total_points: 0,
          current_streak: 0,
          best_streak: 0,
          quizzes_completed: 0,
          correct_answers: 0,
          total_answers: 0,
          achievements: [],
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };

        inMemoryUsers.push(demoAdminUser);
        console.log('✅ Created demo admin user in memory (plain text fallback)');
      }
    }
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
    if (!dbPool) {
      // Fallback to in-memory if no database
      return inMemoryUsers;
    }

    try {
      const result = await dbPool.query('SELECT id, email, full_name, role, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date FROM users');
      return result.rows;
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  },

  // Update user in memory storage
  async updateInMemoryUser(userId, updates) {
    if (!dbPool) {
      const userIndex = inMemoryUsers.findIndex(user => user.id === parseInt(userId));
      if (userIndex !== -1) {
        inMemoryUsers[userIndex] = { ...inMemoryUsers[userIndex], ...updates };
        return inMemoryUsers[userIndex];
      }
      return null;
    }
    return null;
  },

  // Find by ID
  async findById(id) {
    if (!dbPool) {
      return inMemoryUsers.find(user => user.id === parseInt(id)) || null;
    }

    try {
      const result = await dbPool.query('SELECT id, email, full_name, role, total_points, current_streak, best_streak, quizzes_completed, correct_answers, total_answers, achievements, created_date FROM users WHERE id = $1', [id]);

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

    if (!dbPool) {
      console.log('🔍 Using in-memory storage');
      // For demo user, ensure it exists in memory with correct ID and admin role
      if (email === 'demo@quizmaster.com') {
        console.log('🔍 Looking for demo user in memory');
        let demoUserIndex = inMemoryUsers.findIndex(user => user.email === email);
        console.log('🔍 Demo user index:', demoUserIndex);

        if (demoUserIndex === -1) {
          console.log('🔍 Demo user not found, creating...');
          // Create demo user if it doesn't exist
          try {
            console.log('🔧 Attempting to hash demo user password...');
            const demoUser = {
              id: 6,
              email: 'demo@quizmaster.com',
              password: await bcrypt.hash('demo123', 10),
              full_name: 'Demo Admin',
              role: 'admin',
              total_points: 0,
              current_streak: 0,
              best_streak: 0,
              quizzes_completed: 0,
              correct_answers: 0,
              total_answers: 0,
              achievements: [],
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString()
            };
            inMemoryUsers.push(demoUser);
            console.log('✅ Created demo admin user in memory');
            return demoUser;
          } catch (bcryptError) {
            console.error('❌ Error hashing demo user password:', bcryptError);
            // Fallback with pre-hashed password
            const demoUser = {
              id: 6,
              email: 'demo@quizmaster.com',
              password: '$2b$10$rEuVt2qKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZqKJ8gKZq',
              full_name: 'Demo Admin',
              role: 'admin',
              total_points: 0,
              current_streak: 0,
              best_streak: 0,
              quizzes_completed: 0,
              correct_answers: 0,
              total_answers: 0,
              achievements: [],
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString()
            };
            inMemoryUsers.push(demoUser);
            console.log('✅ Created demo admin user in memory (bcrypt fallback)');
            return demoUser;
          }
        } else {
          console.log('🔍 Found existing demo user');
          // Return existing demo user
          return inMemoryUsers[demoUserIndex];
        }
      }
      console.log('🔍 Looking for regular user in memory');
      return inMemoryUsers.find(user => user.email === email) || null;
    }

    console.log('🔍 Using database');
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

        // Update in-memory storage if using in-memory
        if (!dbPool) {
          await this.updateInMemoryUser(user.id, { role: 'admin', full_name: 'Demo Admin' });
        }
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
    try {
      const hashedPassword = await this.hashPassword(password);
      const result = await dbPool.query(
        `INSERT INTO users (email, password, full_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, full_name, created_date`,
        [email, hashedPassword, full_name]
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
  },

  // Update streak when user completes a quiz
  async updateStreak(userId) {
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
