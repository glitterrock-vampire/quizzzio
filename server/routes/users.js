import express from 'express';
import { UserModel } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all users (for leaderboard)
router.get('/', async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get current user (requires authentication)
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    // In a real app, req.userId would be set by authMiddleware
    const userId = req.userId || '1'; // Demo user
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    // In a real app, verify user owns this profile or is admin
    const user = await UserModel.update(req.params.id, req.body);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update current user
router.patch('/me/update', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId || '1';
    const user = await UserModel.update(userId, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user achievements
router.get('/:id/achievements', async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ achievements: user.achievements || [] });
  } catch (error) {
    next(error);
  }
});

export default router;