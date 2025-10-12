import express from 'express';
import { UserModel } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all users (for leaderboard)
router.get('/', async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    // Return users with public information only
    const publicUsers = users.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      total_points: user.total_points || 0,
      best_streak: user.best_streak || 0,
      accuracy: user.accuracy || 0,
      quizzes_completed: user.quizzes_completed || 0,
      role: user.role
    }));
    
    res.json(publicUsers);
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

// Debug endpoint to check in-memory users
router.get('/debug', async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    res.json({
      userCount: users.length,
      users: users.map(u => ({ id: u.id, email: u.email, role: u.role, full_name: u.full_name })),
      tokenUserId: 6
    });
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

// Helper function to generate achievement activities
function generateAchievementActivities(userId, achievements) {
  if (!achievements || achievements.length === 0) return [];
  
  const achievementTitles = {
    'first_quiz': 'First Quiz Completed!',
    'perfect_score': 'Perfect Score!',
    'streak_5': '5-Day Streak!',
    'streak_10': '10-Day Streak!',
    'subject_master': 'Subject Master!',
    'quick_learner': 'Quick Learner!',
    'quiz_enthusiast': 'Quiz Enthusiast!',
    'accuracy_90': 'Accuracy Master! (90%+)',
    'night_owl': 'Night Owl!',
    'early_bird': 'Early Bird!'
  };

  return achievements.map(achievement => ({
    id: `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'achievement_unlocked',
    title: achievementTitles[achievement] || 'New Achievement Unlocked!',
    achievement_id: achievement,
    timestamp: new Date().toISOString()
  }));
}

// Helper function to generate level up activities
function generateLevelUpActivities(user) {
  const activities = [];
  
  // Check for level up (assuming 100 points per level)
  const level = Math.floor((user.total_points || 0) / 100);
  if (level > 0) {
    activities.push({
      id: `lvl_${Date.now()}`,
      type: 'level_up',
      title: `Reached Level ${level}!`,
      level: level,
      timestamp: new Date().toISOString()
    });
  }
  
  return activities;
}

// Get user's recent activities with pagination
router.get('/:id/activities', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      type, 
      page = 1, 
      limit = 10,
      start_date,
      end_date
    } = req.query;

    // Get activities from the activity log
    const { activities, ...pagination } = await ActivityLog.getUserActivities(id, {
      types: type ? [type] : [],
      page: parseInt(page),
      limit: parseInt(limit),
      startDate: start_date,
      endDate: end_date
    });
    
    res.json({
      user_id: id,
      activities,
      pagination
    });
  } catch (error) {
    next(error);
  }
});

// Get user's streak information
router.get('/:id/streak', async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user_id: req.params.id,
      current_streak: user.current_streak || 0,
      best_streak: user.best_streak || 0,
      last_activity: user.last_activity
    });
  } catch (error) {
    next(error);
  }
});

// Log a new activity (for testing or internal use)
router.post('/:id/activities', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, data } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Activity type is required' });
    }
    
    const activity = await ActivityLog.logActivity(id, type, data || {});
    
    if (!activity) {
      return res.status(500).json({ error: 'Failed to log activity' });
    }
    
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
});

// Get user's achievements
router.get('/:id/achievements', async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Format achievements with more details
    const achievementDetails = {
      'first_quiz': 'Complete your first quiz',
      'quiz_enthusiast': 'Complete 5 quizzes',
      'quiz_master': 'Complete 25 quizzes',
      'streak_3': '3-day streak',
      'streak_7': '7-day streak',
      'streak_30': '30-day streak',
      'accuracy_90': 'Achieve 90%+ accuracy'
    };
    
    const achievements = (user.achievements || []).map(achievementId => ({
      id: achievementId,
      title: achievementId.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: achievementDetails[achievementId] || 'Achievement unlocked!',
      unlocked: true,
      unlocked_at: new Date().toISOString()
    }));
    
    // Add locked achievements
    const allAchievements = Object.entries(achievementDetails).map(([id, description]) => {
      const unlocked = user.achievements?.includes(id) || false;
      return {
        id,
        title: id.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description,
        unlocked,
        unlocked_at: unlocked ? new Date().toISOString() : null
      };
    });
    
    res.json({
      user_id: req.params.id,
      unlocked: achievements.length,
      total: allAchievements.length,
      achievements: allAchievements
    });
  } catch (error) {
    next(error);
  }
});
export default router;