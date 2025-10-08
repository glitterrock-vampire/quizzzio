import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // For demo purposes, allow requests without auth
      // In production, you'd return 401 here
      req.userId = '1'; // Demo user
      return next();
    }
    
    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Add user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
    }
    
    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};