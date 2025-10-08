import express from 'express';
import { QuizQuestionModel } from '../models/QuizQuestion.js';

const router = express.Router();

// Get all questions with filters
router.get('/', async (req, res, next) => {
  try {
    const { subject, difficulty, orderBy, limit } = req.query;
    
    const filters = {};
    if (subject) filters.subject = subject;
    if (difficulty) filters.difficulty = difficulty;
    
    const questions = await QuizQuestionModel.find(filters, {
      orderBy,
      limit: limit ? parseInt(limit) : 100
    });
    
    res.json(questions);
  } catch (error) {
    next(error);
  }
});

// Get question by ID
router.get('/:id', async (req, res, next) => {
  try {
    const question = await QuizQuestionModel.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    next(error);
  }
});

// Create single question
router.post('/', async (req, res, next) => {
  try {
    const question = await QuizQuestionModel.create(req.body);
    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
});

// Bulk create questions
router.post('/bulk', async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be an array of questions' });
    }
    
    const questions = await QuizQuestionModel.bulkCreate(req.body);
    res.status(201).json({
      message: `Successfully created ${questions.length} questions`,
      questions
    });
  } catch (error) {
    next(error);
  }
});

// Update question
router.patch('/:id', async (req, res, next) => {
  try {
    const question = await QuizQuestionModel.update(req.params.id, req.body);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    next(error);
  }
});

// Delete question
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await QuizQuestionModel.delete(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get random questions for quiz
router.post('/random', async (req, res, next) => {
  try {
    const { subject, difficulty, count = 10 } = req.body;
    
    const filters = {};
    if (subject) filters.subject = subject;
    if (difficulty && difficulty !== 'mixed') filters.difficulty = difficulty;
    
    const questions = await QuizQuestionModel.random(filters, parseInt(count));
    res.json(questions);
  } catch (error) {
    next(error);
  }
});

export default router;