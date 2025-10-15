import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './server/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read questions from JSON file
const questionsPath = path.join(__dirname, 'questions.json');
const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

async function importQuestions() {
  const pool = getPool();

  if (!pool) {
    console.error('❌ No database connection available');
    return;
  }

  console.log(`📥 Importing ${questionsData.length} questions from questions.json`);

  // Group questions by subject
  const questionsBySubject = {};
  questionsData.forEach(q => {
    const subject = q.subject.charAt(0).toUpperCase() + q.subject.slice(1); // Capitalize first letter
    if (!questionsBySubject[subject]) {
      questionsBySubject[subject] = [];
    }
    questionsBySubject[subject].push(q);
  });

  // Create tables for each subject
  for (const [subject, questions] of Object.entries(questionsBySubject)) {
    const tableName = `${subject.toLowerCase().replace(/[^a-z0-9]/g, '_')}_questions`;

    try {
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          subject VARCHAR(100) NOT NULL DEFAULT '${subject}',
          question TEXT NOT NULL,
          options JSONB NOT NULL,
          correct_answer TEXT NOT NULL,
          difficulty VARCHAR(20) NOT NULL,
          explanation TEXT,
          points INTEGER DEFAULT 10,
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log(`✅ Created/verified table: ${tableName}`);

      // Insert questions
      for (const question of questions) {
        try {
          await pool.query(
            `INSERT INTO ${tableName} (subject, question, options, correct_answer, difficulty, explanation, points)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              subject,
              question.question,
              question.options,
              question.correct_answer,
              question.difficulty,
              question.explanation,
              question.points || 10
            ]
          );
        } catch (insertError) {
          console.error(`❌ Error inserting question "${question.question}":`, insertError.message);
        }
      }

      console.log(`✅ Imported ${questions.length} ${subject} questions`);

    } catch (tableError) {
      console.error(`❌ Error creating table ${tableName}:`, tableError.message);
    }
  }

  console.log('🎉 Question import completed!');
}

// Run the import
importQuestions().catch(console.error);
