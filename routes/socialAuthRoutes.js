import express from 'express';
import passport from 'passport';

const router = express.Router();

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  (req, res) => {
    try {
      const { user } = req;
      
      if (!user) {
        console.error('❌ No user found in Google OAuth callback');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      console.log('✅ Google OAuth successful for:', user.email);
      
      // Redirect to frontend with token
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${user.token}&provider=google`;
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

export default router; 