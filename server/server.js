// Import required modules
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import quizQuestionsRouter from './routes/quizQuestions.js';
import quizSessionsRouter from './routes/quizSessions.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import oauthRouter from './routes/oauth.js';
import aiRouter from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter, aiLimiter } from './middleware/rateLimit.js';
import { testDatabaseConnection, pool } from './config/database.js';
import { initializeDatabase } from './init-db.js';
import passport from './config/oauth.js';

// Load environment variables FIRST
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
} else {
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
}

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log('');
  console.log('🚀 Quizzio Server Started!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api`);

  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (dbConnected) {
      console.log(`🗄️  Database: PostgreSQL (${process.env.DB_HOST || 'localhost'})`);

      // Initialize database tables if in production
      if (process.env.NODE_ENV === 'production') {
        try {
          console.log('🔧 Initializing database tables...');

          // Initialize all tables with retry logic (don't fail if some tables can't be created)
          const { initializeUserTable } = await import('./models/User.js');
          const { initializeQuizQuestionTable } = await import('./models/QuizQuestion.js');
          const { initializeQuizSessionTable } = await import('./models/QuizSession.js');

          // Try to initialize tables but don't fail if some can't be created
          try {
            await initializeUserTable();
            console.log('✅ Users table initialized');
          } catch (error) {
            console.error('❌ Failed to initialize users table:', error.message);
          }

          try {
            await initializeQuizQuestionTable();
            console.log('✅ Quiz question tables initialized');
          } catch (error) {
            console.error('❌ Failed to initialize quiz question tables:', error.message);
            console.log('💡 Application will use in-memory fallback for questions');
          }

          try {
            await initializeQuizSessionTable();
            console.log('✅ Quiz session tables initialized');
          } catch (error) {
            console.error('❌ Failed to initialize quiz session tables:', error.message);
          }

          console.log('✅ Database initialization completed (some tables may have failed but server continues)');
        } catch (error) {
          console.error('❌ Error initializing database tables:', error.message);
          console.error('❌ Full error:', error);
        }
      }
    } else {
      console.log(`🗄️  Database: In-Memory (fallback mode)`);
    }

    // Create demo user if database is connected and in production
    if (dbConnected && process.env.NODE_ENV === 'production') {
      try {
        console.log('🔧 Creating demo user for production...');
        const { UserModel } = await import('./models/User.js');
        const existingDemo = await UserModel.findByEmail('demo@quizmaster.com');

        if (!existingDemo) {
          const demoUser = await UserModel.register({
            email: 'demo@quizmaster.com',
            password: 'demo123',
            full_name: 'Demo User'
          });
          console.log('✅ Demo user created:', demoUser.email);
        } else {
          console.log('✅ Demo user already exists:', existingDemo.email);
        }
      } catch (error) {
        console.error('❌ Error creating demo user:', error.message);
        console.error('❌ Full error:', error);
      }
    }

    // Import questions if database is connected and in production
    if (dbConnected && process.env.NODE_ENV === 'production') {
      try {
        console.log('🔧 Checking questions in production...');

        // Wait a bit for tables to be fully ready
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if questions exist using the database pool
        if (pool) {
          try {
            // Check if geography_questions table exists first
            const tableCheck = await pool.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'geography_questions'
              );
            `);

            if (!tableCheck.rows[0].exists) {
              console.log('ℹ️ Geography questions table does not exist - skipping questions import');
              return;
            }

            const result = await pool.query('SELECT COUNT(*) as count FROM geography_questions');
            const questionCount = parseInt(result.rows[0].count);

            if (questionCount === 0) {
              console.log('🔧 No questions found, importing sample questions...');

              // Import Geography questions directly
              const geographyQuestions = [
                {
                  subject: 'Geography',
                  question: 'What is the capital of France?',
                  options: ['London', 'Berlin', 'Paris', 'Rome'],
                  correct_answer: 'Paris',
                  difficulty: 'easy',
                  explanation: 'Paris, located on the Seine River, is the capital and most populous city of France.',
                  points: 10
                },
                {
                  subject: 'Geography',
                  question: 'Which is the largest ocean on Earth?',
                  options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
                  correct_answer: 'Pacific Ocean',
                  difficulty: 'easy',
                  explanation: 'The Pacific Ocean is the largest and deepest of the world\'s ocean basins.',
                  points: 10
                },
                {
                  subject: 'Geography',
                  question: 'What is the longest river in the world?',
                  options: ['The Amazon River', 'The Nile River', 'The Yangtze River', 'The Mississippi River'],
                  correct_answer: 'The Nile River',
                  difficulty: 'easy',
                  explanation: 'The Nile River in Africa is historically considered the longest river in the world at about 6,650 km (4,130 miles).',
                  points: 10
                },
                {
                  subject: 'Geography',
                  question: 'Which desert is the largest in the world?',
                  options: ['The Gobi Desert', 'The Sahara Desert', 'The Arabian Desert', 'The Kalahari Desert'],
                  correct_answer: 'The Sahara Desert',
                  difficulty: 'easy',
                  explanation: 'The Sahara in Northern Africa is the world\'s largest hot desert.',
                  points: 10
                },
                {
                  subject: 'Geography',
                  question: 'Which continent is the smallest by land area?',
                  options: ['Europe', 'Australia', 'Antarctica', 'South America'],
                  correct_answer: 'Australia',
                  difficulty: 'easy',
                  explanation: 'Australia is the smallest continent, also considered a single country.',
                  points: 10
                }
              ];

              // Import Geography questions
              for (const q of geographyQuestions) {
                try {
                  await pool.query(
                    `INSERT INTO geography_questions
                     (subject, question, options, correct_answer, difficulty, explanation, points)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [q.subject, q.question, q.options, q.correct_answer, q.difficulty, q.explanation, q.points]
                  );
                } catch (insertError) {
                  console.error(`❌ Error inserting question "${q.question}":`, insertError.message);
                }
              }

              console.log('✅ Geography questions imported to production database');

              // Also import some Mathematics questions if mathematics_questions table exists
              const mathTableCheck = await pool.query(`
                SELECT EXISTS (
                  SELECT FROM information_schema.tables
                  WHERE table_schema = 'public'
                  AND table_name = 'mathematics_questions'
                );
              `);

              if (mathTableCheck.rows[0].exists) {
                const mathQuestions = [
                  {
                    subject: 'Mathematics',
                    question: 'What is 2 + 2?',
                    options: ['3', '4', '5', '6'],
                    correct_answer: '4',
                    difficulty: 'easy',
                    explanation: 'Basic addition: 2 + 2 equals 4.',
                    points: 10
                  },
                  {
                    subject: 'Mathematics',
                    question: 'What is the square root of 16?',
                    options: ['2', '4', '6', '8'],
                    correct_answer: '4',
                    difficulty: 'easy',
                    explanation: 'The square root of 16 is 4, since 4 × 4 = 16.',
                    points: 10
                  }
                ];

                for (const q of mathQuestions) {
                  try {
                    await pool.query(
                      `INSERT INTO mathematics_questions
                       (subject, question, options, correct_answer, difficulty, explanation, points)
                       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                      [q.subject, q.question, q.options, q.correct_answer, q.difficulty, q.explanation, q.points]
                    );
                  } catch (insertError) {
                    console.error(`❌ Error inserting math question "${q.question}":`, insertError.message);
                  }
                }

                console.log('✅ Mathematics questions imported to production database');
              } else {
                console.log('ℹ️ Mathematics questions table does not exist - skipping math questions import');
              }
            } else {
              console.log(`✅ Questions already exist in production database (${questionCount} questions)`);
            }
          } catch (queryError) {
            console.error('❌ Error querying questions table:', queryError.message);
            console.log('ℹ️ Questions table may not exist - this is expected if table creation failed');
          }
        } else {
          console.log('ℹ️ Database pool not available for questions import');
        }
      } catch (error) {
        console.error('❌ Error checking/importing questions:', error.message);
        console.error('❌ Full error:', error);
        console.log('ℹ️ Questions may need to be imported manually to production database');
      }
    }

    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
  } catch (error) {
    console.error('❌ Fatal error during server startup:', error);
    console.error('❌ Server failed to start properly');
    console.error('💡 Note: Server will continue running for debugging purposes');
    // Don't exit - let the server run even if initialization fails
    // process.exit(1);
  }
});

export default app;
