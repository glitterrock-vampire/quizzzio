import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('full_name', 'Full name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { full_name, email, password } = req.body;

    try {
      console.log('🔐 Registration attempt for:', email);

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        console.log('❌ User already exists:', email);
        return res.status(400).json({
          success: false,
          error: 'User already exists'
        });
      }

      console.log('✅ Creating new user for:', email);
      // Create new user
      const user = await UserModel.register({
        email,
        password,
        full_name
      });

      console.log('✅ User created successfully:', user.id);

      // Generate JWT token
      const token = UserModel.generateToken(user);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role || 'user',
          total_points: user.total_points || 0,
          current_streak: user.current_streak || 0,
          best_streak: user.best_streak || 0,
          quizzes_completed: user.quizzes_completed || 0,
          correct_answers: user.correct_answers || 0,
          total_answers: user.total_answers || 0,
          achievements: user.achievements || [],
          accuracy: user.accuracy || 0,
          created_date: user.created_date
        }
      });
    } catch (error) {
      console.error('❌ Registration error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Server error during registration'
      });
    }
  }
);

/**
 * @route   POST api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    try {
      // Validate user credentials
      const user = await UserModel.validateCredentials(email, password);
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }

      // Generate JWT token with updated user data
      const token = UserModel.generateToken(user);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          total_points: user.total_points || 0,
          current_streak: user.current_streak || 0,
          best_streak: user.best_streak || 0,
          quizzes_completed: user.quizzes_completed || 0,
          correct_answers: user.correct_answers || 0,
          total_answers: user.total_answers || 0,
          achievements: user.achievements || [],
          accuracy: user.accuracy || 0
        }
      });
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ 
        success: false,
        error: 'Server error during login' 
      });
    }
  }
);

/**
 * @route   GET api/auth/user
 * @desc    Get current user's data
 * @access  Private
 */
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Remove sensitive data
    const { password, ...userData } = user;

    console.log('🔍 Returning user data:', {
      id: userData.id,
      total_points: userData.total_points,
      quizzes_completed: userData.quizzes_completed,
      correct_answers: userData.correct_answers,
      total_answers: userData.total_answers,
      best_streak: userData.best_streak
    });

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

/**
 * @route   POST api/auth/change-password
 * @desc    Change user's password
 * @access  Private
 */
router.post(
  '/change-password',
  [
    authMiddleware,
    body('currentPassword', 'Current password is required').exists(),
    body('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      // Get user
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false,
          error: 'Current password is incorrect' 
        });
      }

      // Update password
      const success = await UserModel.updatePassword(user.id, newPassword);
      
      if (!success) {
        throw new Error('Failed to update password');
      }

      res.json({ 
        success: true,
        message: 'Password updated successfully' 
      });
    } catch (error) {
      console.error('Change password error:', error.message);
      res.status(500).json({ 
        success: false,
        error: 'Server error while changing password' 
      });
    }
  }
);

// Logout is handled client-side by removing the token
router.post('/logout', (req, res) => {
  res.json({ 
    success: true,
    message: 'Logout successful' 
  });
});

export default router;