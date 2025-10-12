import express from 'express';
import passport from '../config/oauth.js';
import { generateOAuthToken } from '../config/oauth.js';

const router = express.Router();

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    // Generate JWT token
    const token = generateOAuthToken(req.user);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=google`);
  }
);

// Facebook OAuth routes - DISABLED FOR NOW
// router.get('/facebook', passport.authenticate('facebook', {
//   scope: ['email']
// }));

// router.get('/facebook/callback',
//   passport.authenticate('facebook', { failureRedirect: '/login?error=oauth_failed' }),
//   (req, res) => {
//     // Generate JWT token
//     const token = generateOAuthToken(req.user);
    
//     // Redirect to frontend with token
//     res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=facebook`);
//   }
// );

// OAuth success/failure handlers
router.get('/success', (req, res) => {
  res.json({ 
    success: true, 
    user: req.user,
    message: 'OAuth authentication successful' 
  });
});

router.get('/failure', (req, res) => {
  res.status(401).json({ 
    success: false, 
    message: 'OAuth authentication failed' 
  });
});

export default router;
