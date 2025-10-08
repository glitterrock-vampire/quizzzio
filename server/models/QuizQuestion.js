import { dbPool } from '../config.js';

// Initialize database table
export const initializeQuizQuestionTable = async () => {
  if (!dbPool) {
    console.log('⚠️  Using in-memory storage for quiz questions');
    return;
  }

  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(100) NOT NULL,
        question TEXT NOT NULL,
        options TEXT[] NOT NULL,
        correct_answer TEXT NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        explanation TEXT,
        points INTEGER DEFAULT 10,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Quiz questions table initialized');
  } catch (error) {
    console.error('❌ Error initializing quiz questions table:', error);
  }
};

export const QuizQuestionModel = {
  // Find all with filters
  async find(filters = {}, options = {}) {
    if (!dbPool) {
      return [];
    }

    try {
      let whereClause = '';
      let params = [];
      let paramCount = 1;

      if (filters.subject) {
        whereClause += ` WHERE subject = $${paramCount}`;
        params.push(filters.subject);
        paramCount++;
      }

      if (filters.difficulty) {
        if (whereClause) {
          whereClause += ` AND difficulty = $${paramCount}`;
        } else {
          whereClause += ` WHERE difficulty = $${paramCount}`;
        }
        params.push(filters.difficulty);
        paramCount++;
      }

      let orderClause = '';
      if (options.orderBy) {
        const field = options.orderBy.replace('-', '');
        const desc = options.orderBy.startsWith('-');
        orderClause = ` ORDER BY ${field} ${desc ? 'DESC' : 'ASC'}`;
      }

      let limitClause = '';
      if (options.limit) {
        limitClause = ` LIMIT $${paramCount}`;
        params.push(options.limit);
      }

      const query = `SELECT * FROM quiz_questions${whereClause}${orderClause}${limitClause}`;
      const result = await dbPool.query(query, params);

      return result.rows;
    } catch (error) {
      console.error('Error finding quiz questions:', error);
      return [];
    }
  },

  // Find by ID
  async findById(id) {
    if (!dbPool) {
      return null;
    }

    try {
      const result = await dbPool.query('SELECT * FROM quiz_questions WHERE id = $1', [id]);

      if (result.rows.length === 0) return null;

      return result.rows[0];
    } catch (error) {
      console.error('Error finding quiz question by ID:', error);
      return null;
    }
  },

  // Create single question
  async create(data) {
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const result = await dbPool.query(`
        INSERT INTO quiz_questions (subject, question, options, correct_answer, difficulty, explanation, points, created_date, updated_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [data.subject, data.question, data.options, data.correct_answer, data.difficulty, data.explanation, data.points]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating quiz question:', error);
      throw error;
    }
  },

  // Bulk create
  async bulkCreate(data) {
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const values = data.map(q => `('${q.subject}', '${q.question.replace(/'/g, "''")}', ARRAY[${q.options.map(opt => `'${opt.replace(/'/g, "''")}'`).join(',')}], '${q.correct_answer.replace(/'/g, "''")}', '${q.difficulty}', '${(q.explanation || '').replace(/'/g, "''")}', ${q.points || 10}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).join(', ');

      const query = `
        INSERT INTO quiz_questions (subject, question, options, correct_answer, difficulty, explanation, points, created_date, updated_date)
        VALUES ${values}
        RETURNING *
      `;

      const result = await dbPool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error bulk creating quiz questions:', error);
      throw error;
    }
  },

  // Update question
  async update(id, data) {
    if (!dbPool) {
      throw new Error('Database not available');
    }

    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (data.subject !== undefined) {
        fields.push(`subject = $${paramCount}`);
        values.push(data.subject);
        paramCount++;
      }

      if (data.question !== undefined) {
        fields.push(`question = $${paramCount}`);
        values.push(data.question);
        paramCount++;
      }

      if (data.options !== undefined) {
        fields.push(`options = $${paramCount}`);
        values.push(data.options);
        paramCount++;
      }

      if (data.correct_answer !== undefined) {
        fields.push(`correct_answer = $${paramCount}`);
        values.push(data.correct_answer);
        paramCount++;
      }

      if (data.difficulty !== undefined) {
        fields.push(`difficulty = $${paramCount}`);
        values.push(data.difficulty);
        paramCount++;
      }

      if (data.explanation !== undefined) {
        fields.push(`explanation = $${paramCount}`);
        values.push(data.explanation);
        paramCount++;
      }

      if (data.points !== undefined) {
        fields.push(`points = $${paramCount}`);
        values.push(data.points);
        paramCount++;
      }

      fields.push(`updated_date = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await dbPool.query(`
        UPDATE quiz_questions SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);

      if (result.rows.length === 0) return null;

      return result.rows[0];
    } catch (error) {
      console.error('Error updating quiz question:', error);
      throw error;
    }
  },

  // Delete question
  async delete(id) {
    if (!dbPool) {
      return false;
    }

    try {
      const result = await dbPool.query('DELETE FROM quiz_questions WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting quiz question:', error);
      return false;
    }
  },

  // Get random questions
  async random(filters = {}, count = 10) {
    if (!dbPool) {
      return [];
    }

    try {
      const filtered = await this.find(filters);

      // Randomly shuffle and return requested count
      const shuffled = filtered.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error getting random quiz questions:', error);
      return [];
    }
  },

  // Get count
  async count(filters = {}) {
    if (!dbPool) {
      return 0;
    }

    try {
      const result = await this.find(filters);
      return result.length;
    } catch (error) {
      console.error('Error counting quiz questions:', error);
      return 0;
    }
  }
};

// Initialize table when module is imported
initializeQuizQuestionTable();