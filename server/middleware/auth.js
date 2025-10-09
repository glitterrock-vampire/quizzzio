import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth.js';

/**
 * Authentication middleware that verifies JWT token
 * and attaches user information to the request object
 */
export const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No authentication token, authorization denied' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user info to request
    req.user = decoded.user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token, authorization denied' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired, please log in again' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server authentication error' 
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't fail if no token is provided
 */
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.user;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error.message);
    // Continue to next middleware even if token is invalid
    next();
  }
};

/**
 * Role-based access control middleware
 * @param {Array} roles - Array of allowed roles
 */
export const roleMiddleware = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
};