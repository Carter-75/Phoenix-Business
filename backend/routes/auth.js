const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// @route   POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      hasFinalizedProfile: true
    });

    await user.save();
    
    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: 'Error logging in after registration' });
      return res.status(201).json(user);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /auth/login
  router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        const status = info.message === 'USER_NOT_FOUND' ? 404 : 401;
        return res.status(status).json({ message: info.message });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

// @route   GET /auth/google
router.get('/google', (req, res, next) => {
  const returnTo = req.query.returnTo || '/dashboard';
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: returnTo
  })(req, res, next);
});

// @route   GET /auth/google/callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const returnUrl = req.query.state || '/dashboard';
    
    // Check if user is pending registration
    if (req.user && req.user.isPending) {
      return res.redirect(`${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/complete-profile`);
    }
    
    // Successful authentication, redirect to returnUrl or dashboard
    res.redirect(`${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}${returnUrl}`);
  }
);

// @route   GET /auth/user
router.get('/user', (req, res) => {
  console.log(`[DEBUG] /auth/user check - Authenticated: ${req.isAuthenticated()}`);
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// @route   POST /auth/update-profile
router.post('/update-profile', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findById(req.user._id);
    user.firstName = firstName;
    user.lastName = lastName;
    user.hasFinalizedProfile = true;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /auth/finalize-onboarding
router.post('/finalize-onboarding', async (req, res) => {
  try {
    const { firstName, lastName, acceptedTerms, acceptedPrivacy, acceptedRefunds } = req.body;
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required to finalize profile' });
    }

    let user;
    if (req.user.isPending) {
      // Create NEW user from Google pending session
      const { email, googleId } = req.user;
      user = new User({
        email: email.toLowerCase(),
        googleId,
        firstName,
        lastName,
        hasFinalizedProfile: true,
        hasAcceptedContract: acceptedTerms // Use terms as proxy for contract acceptance
      });
    } else {
      // Update EXISTING user
      user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.firstName = firstName;
      user.lastName = lastName;
      user.hasFinalizedProfile = true;
      user.hasAcceptedContract = acceptedTerms;
    }

    await user.save();

    // If it was a new user, we need to log them in fully
    if (req.user.isPending) {
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: 'Error establishing full session' });
        return res.json(user);
      });
    } else {
      res.json(user);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /auth/logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
