import express from 'express';
import { QuizSessionModel } from '../models/QuizSession.js';
import { authMiddleware as authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all sessions
router.get('/', async (req, res, next) => {
  try {
    const sessions = await QuizSessionModel.findAll();
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// Get user's sessions
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const sessions = await QuizSessionModel.findByUser(userId, parseInt(limit));
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// Get session by ID
router.get('/:id', async (req, res, next) => {
  try {
    const session = await QuizSessionModel.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Create new session
router.post('/', async (req, res, next) => {
  try {
    const session = await QuizSessionModel.create(req.body);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/user/:userId/stats', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const stats = await QuizSessionModel.getUserStats(userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get leaderboard
router.get('/leaderboard/top', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = await QuizSessionModel.getLeaderboard(parseInt(limit));
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

export default router;