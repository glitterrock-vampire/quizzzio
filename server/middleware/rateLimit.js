import rateLimit from 'express-rate-limit';

// Development environment settings
const isDevelopment = process.env.NODE_ENV === 'development';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 15 * 60 * 1000, // 1 min in dev, 15 min in prod
  max: isDevelopment ? 1000 : 100, // Higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment // Skip rate limiting in development
});

// Stricter rate limiting for authentication routes
export const authLimiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 15 * 60 * 1000, // 1 min in dev, 15 min in prod
  max: isDevelopment ? 100 : 5, // Higher limit in development
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment // Skip rate limiting in development
});

// Rate limiting for AI quiz generation (expensive operation)
export const aiLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 60 * 60 * 1000, // 5 min in dev, 1 hour in prod
  max: isDevelopment ? 50 : 10, // Higher limit in development
  message: {
    error: 'AI quiz generation limit reached, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment // Skip rate limiting in development
});
