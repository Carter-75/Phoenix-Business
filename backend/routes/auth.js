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
      lastName
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
    if (!user) return res.status(401).json({ message: info.message || 'Login failed' });
    
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json(user);
    });
  })(req, res, next);
});

// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /auth/google/callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect(process.env.PROD_FRONTEND_URL || 'http://localhost:4200');
  }
);

// @route   GET /auth/user
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
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
