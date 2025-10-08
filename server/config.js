import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Database (configure based on your choice)
  database: {
    type: process.env.DB_TYPE || 'memory', // memory, postgres, mysql, mongodb
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'quizmaster',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

export default config;