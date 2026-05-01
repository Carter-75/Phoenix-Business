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
    // Check if user is pending registration (Google info received but not yet in DB)
    if (req.user && req.user.isPending) {
      return res.redirect(`${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/complete-profile`);
    }
    // Successful authentication, redirect home.
    res.redirect(`${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/dashboard`);
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

// @route   POST /auth/complete-google-registration
router.post('/complete-google-registration', async (req, res) => {
  if (!req.isAuthenticated() || !req.user.isPending) {
    return res.status(401).json({ message: 'No pending registration found' });
  }

  try {
    const { firstName, lastName } = req.body;
    const { email, googleId } = req.user;

    // Create the user now
    const newUser = new User({
      email: email.toLowerCase(),
      googleId,
      firstName,
      lastName,
      hasFinalizedProfile: true
    });

    await newUser.save();

    // Log in as the NEW user (clear the pending state)
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ message: 'Error logging in new user' });
      res.json(newUser);
    });

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
