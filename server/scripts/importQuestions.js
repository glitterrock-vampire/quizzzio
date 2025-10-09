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
    
    // Clear existing questions
    console.log('Clearing existing questions...');
    await client.query('TRUNCATE TABLE quiz_questions RESTART IDENTITY CASCADE');
    
    // Insert new questions
    console.log('Importing questions...');
    for (const [index, q] of questions.entries()) {
      await client.query(
        `INSERT INTO quiz_questions 
         (subject, question, options, correct_answer, difficulty, explanation, points)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          q.subject || 'general',
          q.question,
          q.options,
          q.correct_answer,
          (q.difficulty || 'easy').toLowerCase(),
          q.explanation || null,
          q.points || 10
        ]
      );
      
      // Show progress
      if ((index + 1) % 10 === 0 || index === questions.length - 1) {
        process.stdout.write(`\rImported ${index + 1} of ${questions.length} questions...`);
      }
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Successfully imported all questions!');
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
