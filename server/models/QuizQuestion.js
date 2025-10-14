import { getPool } from '../config/database.js';

// In-memory storage for development
let inMemoryQuestions = [];
let nextId = 1;

// Mapping of subject to table name
const SUBJECT_TABLES = {
  'Geography': 'geography_questions',
  'Mathematics': 'mathematics_questions'
  // Temporarily removed other tables to focus on core functionality
  // 'Caribbean History': 'caribbean_history_questions',
  // 'French Caribbean': 'french_caribbean_questions',
  // 'Science': 'science_questions',
  // 'History': 'history_questions',
  // 'General Knowledge': 'general_knowledge_questions',
  // 'Literature': 'literature_questions'
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

// Initialize database table with robust error handling
export const initializeQuizQuestionTable = async (retryCount = 0) => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  const dbPool = getPool();
  if (!dbPool) {
    console.log('⚠️  No database connection for quiz questions');
    return;
  }

  try {
    console.log('🔧 Initializing quiz question tables...');

    // Create all subject-specific tables
    for (const [subject, tableName] of Object.entries(SUBJECT_TABLES)) {
      try {
        // First check if table already exists
        const checkResult = await dbPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          );
        `, [tableName]);

        const tableExists = checkResult.rows[0].exists;

        if (tableExists) {
          console.log(`✅ ${tableName} table already exists`);
          continue;
        }

        // Table doesn't exist, try to create it
        await dbPool.query(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id SERIAL PRIMARY KEY,
            subject VARCHAR(100) NOT NULL,
            question TEXT NOT NULL,
            options JSONB NOT NULL,
            correct_answer TEXT NOT NULL,
            difficulty VARCHAR(20) DEFAULT 'medium',
            explanation TEXT,
            points INTEGER DEFAULT 10,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log(`✅ ${tableName} table created successfully`);

      } catch (tableError) {
        console.error(`❌ Error with ${tableName} table:`, tableError.message);

        // If it's a permission/SSL error, log it but don't fail completely
        if (tableError.message.includes('SSL/TLS') || tableError.message.includes('permission denied')) {
          console.log(`⚠️  ${tableName} table creation blocked - will use in-memory fallback`);
          continue;
        }

        // For other errors, re-throw to trigger retry logic
        throw tableError;
      }
    }

    console.log('✅ Quiz question tables initialization completed');
  } catch (error) {
    if (retryCount < maxRetries && (error.message.includes('SSL/TLS') || error.message.includes('connection'))) {
      console.log(`🔄 Connection error during table creation, retrying (${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return initializeQuizQuestionTable(retryCount + 1);
    }
    console.error('❌ Error initializing quiz question tables:', error.message);
    console.error('💡 Tables may not be created - application will use in-memory fallback');
  }
};

export const QuizQuestionModel = {
  // Find all with filters
  async find(filters = {}, options = {}) {
    const dbPool = getPool();
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
    const dbPool = getPool();
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

  // Check for duplicate question
  async checkDuplicate(question, subject) {
    const dbPool = getPool();
    if (dbPool) {
      try {
        const tableName = getTableName(subject);
        const result = await dbPool.query(`
          SELECT id, question FROM ${tableName} 
          WHERE LOWER(TRIM(question)) = LOWER(TRIM($1))
        `, [question]);
        
        return result.rows.length > 0 ? result.rows[0] : null;
      } catch (error) {
        console.error('Error checking for duplicate:', error);
        return null;
      }
    } else {
      // In-memory implementation
      const existing = inMemoryQuestions.find(q => 
        q.subject === subject && 
        q.question.toLowerCase().trim() === question.toLowerCase().trim()
      );
      return existing || null;
    }
  },

  // Create single question with duplicate check
  async create(data) {
    const dbPool = getPool();
    if (dbPool) {
      // Database implementation
      try {
        // Check for duplicates first
        const duplicate = await this.checkDuplicate(data.question, data.subject);
        if (duplicate) {
          throw new Error(`Duplicate question found: "${data.question.substring(0, 50)}..." (ID: ${duplicate.id})`);
        }

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
      const duplicate = await this.checkDuplicate(data.question, data.subject);
      if (duplicate) {
        throw new Error(`Duplicate question found: "${data.question.substring(0, 50)}..." (ID: ${duplicate.id})`);
      }

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

  // Bulk create with duplicate checking
  async bulkCreate(data) {
    const dbPool = getPool();
    if (dbPool) {
      // Database implementation - using parameterized queries for safety
      try {
        const results = [];
        const duplicates = [];
        const skipped = [];

        // Group by subject
        const bySubject = {};
        for (const question of data) {
          if (!bySubject[question.subject]) {
            bySubject[question.subject] = [];
          }
          bySubject[question.subject].push(question);
        }

        // Check for duplicates and insert
        for (const subject of Object.keys(bySubject)) {
          const tableName = getTableName(subject);
          for (const question of bySubject[subject]) {
            try {
              // Check for duplicates first
              const duplicate = await this.checkDuplicate(question.question, question.subject);
              if (duplicate) {
                duplicates.push({
                  question: question.question,
                  existingId: duplicate.id,
                  subject: question.subject
                });
                skipped.push(question);
                continue;
              }

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
            } catch (error) {
              console.error(`Error inserting question: ${question.question.substring(0, 50)}...`, error);
              skipped.push(question);
            }
          }
        }

        // Return results with duplicate information
        return {
          created: results,
          duplicates: duplicates,
          skipped: skipped,
          summary: {
            total: data.length,
            created: results.length,
            duplicates: duplicates.length,
            skipped: skipped.length
          }
        };
      } catch (error) {
        console.error('Error bulk creating quiz questions:', error);
        throw error;
      }
    } else {
      // In-memory implementation
      const results = [];
      const duplicates = [];
      const skipped = [];

      for (const question of data) {
        const duplicate = await this.checkDuplicate(question.question, question.subject);
        if (duplicate) {
          duplicates.push({
            question: question.question,
            existingId: duplicate.id,
            subject: question.subject
          });
          skipped.push(question);
          continue;
        }

        const newQuestion = {
          id: nextId++,
          subject: question.subject,
          question: question.question,
          options: question.options,
          correct_answer: question.correct_answer,
          difficulty: question.difficulty || 'medium',
          explanation: question.explanation || '',
          points: question.points || 10,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };

        inMemoryQuestions.push(newQuestion);
        results.push(newQuestion);
      }

      return {
        created: results,
        duplicates: duplicates,
        skipped: skipped,
        summary: {
          total: data.length,
          created: results.length,
          duplicates: duplicates.length,
          skipped: skipped.length
        }
      };
    }
  },

  // Update question
  async update(id, data) {
    const dbPool = getPool();
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
    const dbPool = getPool();
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
    const dbPool = getPool();
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
    const dbPool = getPool();
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

// Initialize table when module is imported (will be handled by server startup)
// initializeQuizQuestionTable();