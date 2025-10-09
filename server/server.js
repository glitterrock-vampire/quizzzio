import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import quizQuestionsRouter from './routes/quizQuestions.js';
import quizSessionsRouter from './routes/quizSessions.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import aiRouter from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter, aiLimiter } from './middleware/rateLimit.js';
import { config, dbPool } from './config.js';

dotenv.config();

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('tiny'));
}

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Apply rate limiting
app.use('/api/', generalLimiter); // General API rate limiting

// Routes with specific rate limiting
app.use('/api/auth', authLimiter); // Stricter rate limiting for auth
app.use('/api/ai', aiLimiter); // Rate limiting for expensive AI operations

// API Routes
app.use('/api/quiz-questions', quizQuestionsRouter);
app.use('/api/quiz-sessions', quizSessionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to the QuizApp API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        user: 'GET /api/auth/user',
        logout: 'POST /api/auth/logout'
      },
      users: 'GET /api/users',
      quizQuestions: 'GET /api/quiz-questions',
      quizSessions: 'GET /api/quiz-sessions',
      ai: 'POST /api/ai',
      health: 'GET /api/health'
    },
    documentation: 'https://github.com/yourusername/quizapp/docs/api.md'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: config.database.type === 'postgres' && dbPool ? 'connected' : 'memory',
    version: process.env.npm_package_version || '1.0.0'
  };

  // Database health check
  if (dbPool) {
    dbPool.query('SELECT 1')
      .then(() => {
        healthCheck.database_status = 'healthy';
        res.json(healthCheck);
      })
      .catch((err) => {
        healthCheck.database_status = 'error';
        healthCheck.database_error = err.message;
        res.status(503).json(healthCheck);
      });
  } else {
    res.json(healthCheck);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Quizzio Server Started!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api`);
  if (config.database.type === 'postgres') {
    console.log(`🗄️  Database: PostgreSQL (${config.database.type})`);
  } else {
    console.log(`🗄️  Database: In-Memory (${config.database.type})`);
  }
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});

export default app;
