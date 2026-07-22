const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const { getDynamicPolicies } = require('../services/legal.service');

const getFullLegalText = () => Object.values(getDynamicPolicies()).join('\n\n---\n\n');

// @route   POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, businessName, acceptedTerms, termsAcceptedVersion } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const lowerEmail = email.toLowerCase();
    
    let user = await User.findOne({ email: lowerEmail });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({
      email: lowerEmail,
      password,
      firstName,
      lastName,
      businessName,
      hasFinalizedProfile: true,
      hasAcceptedContract: acceptedTerms === true,
      termsAcceptedVersion: acceptedTerms ? termsAcceptedVersion : undefined,
      termsAcceptedFullText: acceptedTerms ? getFullLegalText() : undefined,
      termsAcceptedAt: acceptedTerms ? new Date() : undefined
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
  passport.authenticate('google', { failureRedirect: '/services' }),
  (req, res) => {
    let returnUrl = req.query.state || '/dashboard';
    
    // Open Redirect Protection
    if (!returnUrl.startsWith('/')) {
        returnUrl = '/dashboard';
    }
    
    // Successful authentication or pending registration, redirect to returnUrl
    res.redirect(`${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}${returnUrl}`);
  }
);

// @route   GET /auth/user
router.get('/user', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.json(null);
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
    const { firstName, lastName, businessName, acceptedTerms, termsAcceptedVersion } = req.body;
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required to finalize profile' });
    }

    let user;
    if (req.user.isPending) {
      // Create NEW user from Google pending session
      const email = req.user.email || '';
      const googleId = req.user.googleId;
      user = new User({
        email: email.toLowerCase(),
        googleId,
        firstName,
        lastName,
        businessName,
        hasFinalizedProfile: true,
        hasAcceptedContract: acceptedTerms,
        termsAcceptedVersion: acceptedTerms ? termsAcceptedVersion : undefined,
        termsAcceptedFullText: acceptedTerms ? getFullLegalText() : undefined,
        termsAcceptedAt: acceptedTerms ? new Date() : undefined
      });
    } else {
      // Update EXISTING user
      user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.firstName = firstName;
      user.lastName = lastName;
      user.businessName = businessName;
      user.hasFinalizedProfile = true;
      user.hasAcceptedContract = acceptedTerms;
      if (acceptedTerms) {
        user.termsAcceptedVersion = termsAcceptedVersion;
        user.termsAcceptedFullText = getFullLegalText();
        user.termsAcceptedAt = new Date();
      }
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

// @route   GET /auth/contract/pdf/:contractId
router.get('/contract/pdf/:contractId', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const Contract = require('../models/Contract');
    const contract = await Contract.findOne({ _id: req.params.contractId, userId: req.user._id });
    
    if (!contract || !contract.pdfSnapshot) {
      return res.status(404).json({ message: 'No receipt found for this user.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Phoenix_Contract_Receipt.pdf"');
    res.send(contract.pdfSnapshot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /auth/contracts
// @desc    Get all contracts/projects for the logged-in user
router.get('/contracts', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const Contract = require('../models/Contract');
    // Fetch all active/expired contracts but exclude the massive PDF buffer to save bandwidth
    const contracts = await Contract.find({ userId: req.user._id })
                                    .select('-pdfSnapshot -termsSnapshot')
                                    .sort({ acceptedAt: -1 });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /auth/public/site-status/:email
// @desc    Public "Kill Switch" API for client websites to check if they should be online.
router.get('/public/site-status/:email', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.KILL_SWITCH_API_KEY) {
      return res.status(403).json({ authorized: false, reason: 'Invalid API Key' });
    }

    const { email } = req.params;
    const User = require('../models/user');
    const Contract = require('../models/Contract');
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ authorized: false }); // User doesn't exist

    // Check if they have an active contract
    const contract = await Contract.findOne({ userId: user._id }).sort({ acceptedAt: -1 });
    
    if (!contract) return res.json({ authorized: false });
    
    if (contract.status === 'active' || contract.status === 'bought-out') {
      return res.json({ authorized: true, status: contract.status });
    } else {
      return res.json({ authorized: false, reason: contract.status });
    }
  } catch (err) {
    res.status(500).json({ authorized: false, error: 'Server error' });
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
