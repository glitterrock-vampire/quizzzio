import express from 'express';
import { UserModel } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create user (in real app, hash password)
    const user = await UserModel.create({
      email,
      password, // TODO: Hash this with bcrypt
      full_name,
      total_points: 0,
      current_streak: 0,
      best_streak: 0,
      quizzes_completed: 0,
      correct_answers: 0,
      total_answers: 0,
      achievements: []
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // TODO: Compare hashed password with bcrypt
    // For now, simple comparison (NOT SECURE)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        total_points: user.total_points,
        achievements: user.achievements
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({ message: 'Logout successful' });
});

// Verify token
router.get('/verify', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;