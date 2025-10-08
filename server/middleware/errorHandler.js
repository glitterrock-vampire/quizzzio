export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.message
      });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired'
      });
    }
    
    // Database errors
    if (err.code === '23505') { // Postgres unique violation
      return res.status(409).json({
        error: 'Duplicate entry',
        details: err.detail
      });
    }
    
    // OpenAI errors
    if (err.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to AI service'
      });
    }
    
    // Default error
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };
  