import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import { fileURLToPath } from 'url';
import quizQuestionsRouter from './routes/quizQuestions.js';
import quizSessionsRouter from './routes/quizSessions.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import oauthRouter from './routes/oauth.js';
import aiRouter from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter, aiLimiter } from './middleware/rateLimit.js';
import { testDatabaseConnection } from './config/database.js';
import passport from './config/oauth.js';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://quizzzio.onrender.com", "https://quizzzio.vercel.app"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',      // Development (default Vite port)
      'http://localhost:5174',      // Development (alternative Vite port)
      'http://localhost:5175',      // Development (current Vite port)
      'http://localhost:3000',      // Alternative dev port
      'https://quizzzio.onrender.com', // Production Render
      'https://quizzzio.vercel.app',   // Production Vercel
      process.env.FRONTEND_URL       // Environment variable
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked CORS request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

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
app.use('/api/auth', oauthRouter); // OAuth routes
app.use('/api/ai', aiRouter);

// 404 handler for API routes (only for actual API requests, not preflight)
app.use('/api', (req, res, next) => {
  // Allow preflight OPTIONS requests to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Only return 404 for actual API requests that don't match routes
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/user',
      'POST /api/auth/change-password',
      'GET /api/quiz-questions',
      'POST /api/quiz-sessions',
      'GET /api/users/debug'
    ]
  });
});

// Serve static files for development (optional)
if (process.env.NODE_ENV === 'development') {
  app.get('/', (req, res) => {
    res.json({
      message: 'Quizzie API Server',
      status: 'running',
      endpoints: [
        'POST /api/auth/login',
        'POST /api/auth/register',
        'GET /api/auth/user',
        'GET /api/quiz-questions',
        'POST /api/quiz-questions/bulk',
        'POST /api/quiz-sessions'
      ]
    });
  });
}
  // In production, serve the built React app
  // Try multiple possible paths for the dist directory
  const possiblePaths = [
    path.join(__dirname, '../../dist'),           // Standard project structure
    path.join(__dirname, '../../../dist'),       // Alternative structure
    path.join(process.cwd(), 'dist'),            // From project root
    '/opt/render/project/dist'                   // Render-specific path
  ];

  let buildPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      buildPath = testPath;
      console.log(`✅ Found build directory at: ${testPath}`);
      break;
    }
  }

  if (!buildPath) {
    console.error('❌ Could not find build directory in any of these locations:');
    possiblePaths.forEach(p => console.error(`   ${p}`));
    console.error('❌ Make sure the React app is built and dist/ directory exists');
  } else {
    app.use(express.static(buildPath));

    // Catch-all handler: send back React's index.html file for client-side routing
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          error: 'Route not found',
          path: req.path,
          method: req.method
        });
      }

      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error(`❌ index.html not found at: ${indexPath}`);
        res.status(404).json({ error: 'Frontend not found' });
      }
    });
  }

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log('');
  console.log('🚀 Quizzio Server Started!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api`);

  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    console.log(`🗄️  Database: PostgreSQL (${process.env.DB_HOST || 'localhost'})`);
  } else {
    console.log(`🗄️  Database: In-Memory (fallback mode)`);
  }

  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});

export default app;
