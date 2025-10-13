import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as FacebookStrategy } from 'passport-facebook'; // DISABLED FOR NOW
import { UserModel } from '../models/User.js';
import jwt from 'jsonwebtoken';

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔐 Google OAuth profile received:', profile.displayName, profile.emails[0].value);
    // Check if user already exists
    let user = await UserModel.findByEmail(profile.emails[0].value);
    
    if (user) {
      console.log('✅ Existing user found:', user.email);
      // Update OAuth info if needed
      if (!user.google_id) {
        await UserModel.update(user.id, { google_id: profile.id });
      }
      return done(null, user);
    }
    
    console.log('✅ Creating new user for OAuth');
    // Create new user
    const newUser = await UserModel.create({
      full_name: profile.displayName,
      email: profile.emails[0].value,
      google_id: profile.id,
      role: 'user',
      total_points: 0,
      best_streak: 0,
      accuracy: 0,
      quizzes_completed: 0
    });
    
    console.log('✅ New user created:', newUser.email);
    return done(null, newUser);
  } catch (error) {
    console.error('❌ OAuth error:', error);
    return done(error, null);
  }
}));

// Facebook OAuth Strategy - DISABLED FOR NOW
// passport.use(new FacebookStrategy({
//   clientID: process.env.FACEBOOK_APP_ID,
//   clientSecret: process.env.FACEBOOK_APP_SECRET,
//   callbackURL: "/api/auth/facebook/callback",
//   profileFields: ['id', 'displayName', 'emails']
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     // Check if user already exists
//     let user = await UserModel.findByEmail(profile.emails[0].value);
    
//     if (user) {
//       // Update OAuth info if needed
//       if (!user.facebook_id) {
//         await UserModel.update(user.id, { facebook_id: profile.id });
//       }
//       return done(null, user);
//     }
    
//     // Create new user
//     const newUser = await UserModel.create({
//       full_name: profile.displayName,
//       email: profile.emails[0].value,
//       facebook_id: profile.id,
//       role: 'user',
//       total_points: 0,
//       best_streak: 0,
//       accuracy: 0,
//       quizzes_completed: 0
//     });
    
//     return done(null, newUser);
//   } catch (error) {
//     return done(error, null);
//   }
// }));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Generate JWT token for OAuth users
export const generateOAuthToken = (user) => {
  return jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'user'
      }
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export default passport;
