import { dbPool } from '../config.js';

// In-memory storage for development
let inMemoryQuestions = [];
let nextId = 1;

// Mapping of subject to table name
const SUBJECT_TABLES = {
  'Caribbean History': 'caribbean_history_questions',
  'Geography': 'geography_questions',
  'French Caribbean': 'french_caribbean_questions',
  'Science': 'science_questions',
  'History': 'history_questions',
  'General Knowledge': 'general_knowledge_questions',
  'Literature': 'literature_questions',
  'Mathematics': 'mathematics_questions'
};

// Normalize subject to match keys in SUBJECT_TABLES
function normalizeSubject(subject) {
  const lower = subject.toLowerCase();
  const mappings = {
    'mathematics': 'Mathematics',
    'math': 'Mathematics',
    'science': 'Science',
    'history': 'History',
    'geography': 'Geography',
    'literature': 'Literature',
    'general knowledge': 'General Knowledge',
    'general_knowledge': 'General Knowledge',
    'caribbean history': 'Caribbean History',
    'french caribbean': 'French Caribbean'
  };
  return mappings[lower] || subject;
}

// Get table name for subject
function getTableName(subject) {
  const normalized = normalizeSubject(subject);
  return SUBJECT_TABLES[normalized] || 'quiz_questions';
}

// Initialize database table
export const initializeQuizQuestionTable = async () => {
  // Tables are already created, no need to initialize here
  console.log('✅ Subject-specific question tables are ready');
};

export const QuizQuestionModel = {
  // Find all with filters
  async find(filters = {}, options = {}) {
    if (dbPool) {
      // Database implementation
      try {
        let queries = [];
        let allParams = [];
        let paramOffset = 0;

        if (filters.subject) {
          // Single subject
          const tableName = getTableName(filters.subject);
          let whereClause = '';
          let params = [];
          let paramCount = 1;

          if (filters.difficulty) {
            whereClause = ` WHERE difficulty = $${paramCount}`;
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

          const query = `SELECT * FROM ${tableName}${whereClause}${orderClause}${limitClause}`;
          queries.push({ query, params: allParams.concat(params) });
        } else {
          // All subjects - use UNION to combine all tables
          const tableQueries = [];
          let paramCount = 1;
          let allParams = [];

          for (const subject of Object.keys(SUBJECT_TABLES)) {
            const tableName = SUBJECT_TABLES[subject];
            let whereClause = '';
            let params = [];

            if (filters.difficulty) {
              whereClause = ` WHERE difficulty = $${paramCount}`;
              params.push(filters.difficulty);
              paramCount++;
            }

            const query = `SELECT * FROM ${tableName}${whereClause}`;
            tableQueries.push(query);
            allParams.push(...params);
          }

          // Combine all tables with UNION
          const combinedQuery = tableQueries.join(' UNION ALL ');

          let orderClause = '';
          if (options.orderBy) {
            const field = options.orderBy.replace('-', '');
            const desc = options.orderBy.startsWith('-');
            orderClause = ` ORDER BY ${field} ${desc ? 'DESC' : 'ASC'}`;
          }

          let limitClause = '';
          if (options.limit) {
            limitClause = ` LIMIT $${paramCount}`;
            allParams.push(options.limit);
          }

          const finalQuery = `SELECT * FROM (${combinedQuery}) AS combined${orderClause}${limitClause}`;
          queries.push({ query: finalQuery, params: allParams });
        }

        const results = [];
        for (const { query, params } of queries) {
          const result = await dbPool.query(query, params);
          results.push(...result.rows);
        }

        return results;
      } catch (error) {
        console.error('Error finding quiz questions:', error);
        return [];
      }
    } else {
      // In-memory implementation
      let results = [...inMemoryQuestions];

      if (filters.subject) {
        results = results.filter(q => q.subject === filters.subject);
      }

      if (filters.difficulty) {
        results = results.filter(q => q.difficulty === filters.difficulty);
      }

      if (options.orderBy) {
        const field = options.orderBy.replace('-', '');
        const desc = options.orderBy.startsWith('-');
        results.sort((a, b) => {
          if (desc) {
            return a[field] < b[field] ? 1 : -1;
          } else {
            return a[field] > b[field] ? 1 : -1;
          }
        });
      }

      if (options.limit) {
        results = results.slice(0, options.limit);
      }

      return results;
    }
  },

  // Find by ID
  async findById(id) {
    if (dbPool) {
      // Database implementation
      try {
        // Since IDs are unique across tables, but to find, we need to search all tables
        for (const tableName of Object.values(SUBJECT_TABLES)) {
          const result = await dbPool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
          if (result.rows.length > 0) {
            return result.rows[0];
          }
        }
        return null;
      } catch (error) {
        console.error('Error finding quiz question by ID:', error);
        return null;
      }
    } else {
      // In-memory implementation
      return inMemoryQuestions.find(q => q.id === parseInt(id)) || null;
    }
  },

  // Create single question
  async create(data) {
    if (dbPool) {
      // Database implementation
      try {
        const tableName = getTableName(data.subject);
        const result = await dbPool.query(`
          INSERT INTO ${tableName} (subject, question, options, correct_answer, difficulty, explanation, points, created_date, updated_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [data.subject, data.question, data.options, data.correct_answer, data.difficulty, data.explanation, data.points]);

        return result.rows[0];
      } catch (error) {
        console.error('Error creating quiz question:', error);
        throw error;
      }
    } else {
      // In-memory implementation
      const question = {
        id: nextId++,
        subject: data.subject,
        question: data.question,
        options: data.options,
        correct_answer: data.correct_answer,
        difficulty: data.difficulty || 'medium',
        explanation: data.explanation || '',
        points: data.points || 10,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      inMemoryQuestions.push(question);
      return question;
    }
  },

  // Bulk create
  async bulkCreate(data) {
    if (dbPool) {
      // Database implementation - using parameterized queries for safety
      try {
        const results = [];

        // Group by subject
        const bySubject = {};
        for (const question of data) {
          if (!bySubject[question.subject]) {
            bySubject[question.subject] = [];
          }
          bySubject[question.subject].push(question);
        }

        // Insert into appropriate tables
        for (const subject of Object.keys(bySubject)) {
          const tableName = getTableName(subject);
          for (const question of bySubject[subject]) {
            const result = await dbPool.query(`
              INSERT INTO ${tableName} (subject, question, options, correct_answer, difficulty, explanation, points, created_date, updated_date)
              VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              RETURNING *
            `, [
              question.subject,
              question.question,
              question.options,
              question.correct_answer,
              question.difficulty,
              question.explanation || '',
              question.points || 10
            ]);

            results.push(result.rows[0]);
          }
        }

        return results;
      } catch (error) {
        console.error('Error bulk creating quiz questions:', error);
        throw error;
      }
    } else {
      // In-memory implementation
      const questions = data.map(q => ({
        id: nextId++,
        subject: q.subject,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || '',
        points: q.points || 10,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      }));

      inMemoryQuestions.push(...questions);
      return questions;
    }
  },

  // Update question
  async update(id, data) {
    if (dbPool) {
      // Database implementation
      try {
        // Find which table the question is in
        for (const tableName of Object.values(SUBJECT_TABLES)) {
          const check = await dbPool.query(`SELECT id FROM ${tableName} WHERE id = $1`, [id]);
          if (check.rows.length > 0) {
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
              UPDATE ${tableName} SET ${fields.join(', ')}
              WHERE id = $${paramCount}
              RETURNING *
            `, values);

            if (result.rows.length === 0) return null;
            return result.rows[0];
          }
        }
        return null;
      } catch (error) {
        console.error('Error updating quiz question:', error);
        throw error;
      }
    } else {
      // In-memory implementation
      const index = inMemoryQuestions.findIndex(q => q.id === parseInt(id));
      if (index === -1) return null;

      const updatedQuestion = {
        ...inMemoryQuestions[index],
        ...data,
        updated_date: new Date().toISOString()
      };

      inMemoryQuestions[index] = updatedQuestion;
      return updatedQuestion;
    }
  },

  // Delete question
  async delete(id) {
    if (dbPool) {
      // Database implementation
      try {
        // Find and delete from the appropriate table
        for (const tableName of Object.values(SUBJECT_TABLES)) {
          const result = await dbPool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
          if (result.rowCount > 0) {
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Error deleting quiz question:', error);
        return false;
      }
    } else {
      // In-memory implementation
      const index = inMemoryQuestions.findIndex(q => q.id === parseInt(id));
      if (index === -1) return false;

      inMemoryQuestions.splice(index, 1);
      return true;
    }
  },

  // Get random questions
  async random(filters = {}, count = 10) {
    if (dbPool) {
      // Database implementation
      try {
        const filtered = await this.find(filters);
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
      } catch (error) {
        console.error('Error getting random quiz questions:', error);
        return [];
      }
    } else {
      // In-memory implementation
      let results = [...inMemoryQuestions];

      if (filters.subject) {
        results = results.filter(q => q.subject === filters.subject);
      }

      if (filters.difficulty && filters.difficulty !== 'mixed') {
        results = results.filter(q => q.difficulty === filters.difficulty);
      }

      // Randomly shuffle and return requested count
      const shuffled = results.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
  },

  // Get count
  async count(filters = {}) {
    if (dbPool) {
      // Database implementation
      try {
        const result = await this.find(filters);
        return result.length;
      } catch (error) {
        console.error('Error counting quiz questions:', error);
        return 0;
      }
    } else {
      // In-memory implementation
      let results = [...inMemoryQuestions];

      if (filters.subject) {
        results = results.filter(q => q.subject === filters.subject);
      }

      if (filters.difficulty) {
        results = results.filter(q => q.difficulty === filters.difficulty);
      }

      return results.length;
    }
  }
};

// Initialize table when module is imported
initializeQuizQuestionTable();