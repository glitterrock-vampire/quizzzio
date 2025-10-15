import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
dotenv.config();

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'quizzio',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Sample questions (truncated for brevity - will be replaced with actual import)
const sampleQuestions = [
  {
    "subject": "science",
    "question": "What is the center of an atom called?",
    "options": ["Electron", "Nucleus", "Proton", "Neutron"],
    "correct_answer": "Nucleus",
    "difficulty": "easy",
    "explanation": "The nucleus is the central core of an atom containing protons and neutrons.",
    "points": 10
  },
  {
    "subject": "science",
    "question": "What planet is known as the Red Planet?",
    "options": ["Venus", "Jupiter", "Mars", "Saturn"],
    "correct_answer": "Mars",
    "difficulty": "easy",
    "explanation": "Mars appears red due to iron oxide on its surface.",
    "points": 10
  }
  // ... rest of your questions would go here
];

async function importQuestions() {
  const client = await pool.connect();
  
  try {
    console.log('Starting question import...');
    
    // Read questions from the provided JSON file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const questionsPath = path.join(__dirname, '../../questions.json');
    
    let questions = [];
    
    try {
      const data = fs.readFileSync(questionsPath, 'utf8');
      questions = JSON.parse(data);
      console.log(`Found ${questions.length} questions to import`);
    } catch (err) {
      console.warn('Could not read questions.json, using sample questions');
      console.warn(`Error: ${err.message}`);
      questions = sampleQuestions;
    }
    
    await client.query('BEGIN');
    
    // Clear existing questions from all subject tables
    console.log('Clearing existing questions...');
    const subjectTables = [
      'caribbean_history_questions',
      'geography_questions',
      'french_caribbean_questions',
      'science_questions',
      'history_questions',
      'general_knowledge_questions',
      'literature_questions',
      'mathematics_questions'
    ];
    for (const table of subjectTables) {
      await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    }
    
    // Insert new questions into appropriate tables
    console.log('Importing questions...');
    const bySubject = {};
    for (const q of questions) {
      const subject = q.subject || 'general';
      if (!bySubject[subject]) {
        bySubject[subject] = [];
      }
      bySubject[subject].push(q);
    }

    const subjectTableMap = {
      'Caribbean History': 'caribbean_history_questions',
      'Geography': 'geography_questions',
      'French Caribbean': 'french_caribbean_questions',
      'Science': 'science_questions',
      'History': 'history_questions',
      'General Knowledge': 'general_knowledge_questions',
      'Literature': 'literature_questions',
      'Mathematics': 'mathematics_questions'
    };

    for (const [subject, qList] of Object.entries(bySubject)) {
      const table = subjectTableMap[subject] || 'general_knowledge_questions';
      for (const q of qList) {
        await client.query(
          `INSERT INTO ${table} 
           (subject, question, options, correct_answer, difficulty, explanation, points)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            subject,
            q.question,
            JSON.stringify(q.options), // ✅ Convert array to JSON string
            q.correct_answer,
            (q.difficulty || 'easy').toLowerCase(),
            q.explanation || null,
            q.points || 10
          ]
        );
      }
    }

    console.log(`
✅ Successfully imported all questions into subject-specific tables!`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error importing questions:', error);
  } finally {
    client.release();
    await pool.end();
    process.exit();
  }
}

// Run the import
importQuestions().catch(console.error);
