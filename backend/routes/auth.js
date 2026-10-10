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
router.get('/google/callback', (req, res, next) => {
  const returnUrl = req.query.state || '/dashboard';
  const frontendUrl = process.env.PROD_FRONTEND_URL || 'http://localhost:4200';
  
  passport.authenticate('google', (err, user, info) => {
    // Handle any errors (including MongoDB timeouts) gracefully with redirect
    if (err) {
      console.error('[AUTH] Google callback error:', err.message);
      const errorMsg = encodeURIComponent('We had trouble connecting. Please try signing in again.');
      return res.redirect(`${frontendUrl}/services?auth_error=${errorMsg}`);
    }
    
    if (!user) {
      const errorMsg = encodeURIComponent('Authentication was not completed. Please try again.');
      return res.redirect(`${frontendUrl}/services?auth_error=${errorMsg}`);
    }
    
    // Log the user in
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('[AUTH] Session login error:', loginErr.message);
        const errorMsg = encodeURIComponent('Session error. Please try signing in again.');
        return res.redirect(`${frontendUrl}/services?auth_error=${errorMsg}`);
      }
      
      // Open redirect protection
      let safeReturnUrl = returnUrl;
      if (!safeReturnUrl.startsWith('/')) {
        safeReturnUrl = '/dashboard';
      }
      
      res.redirect(`${frontendUrl}${safeReturnUrl}`);
    });
  })(req, res, next);
});

// @route   GET /auth/user
router.get('/user', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
    const em = (userObj.email || '').toLowerCase().trim();
    const ownerEmail = (process.env.OWNER_EMAIL || 'hello@phoenixwebsites.ai').toLowerCase().trim();
    userObj.isOwner = em === 'hello@phoenixwebsites.ai' || em === 'partnership@carter-portfolio.fyi' || em === ownerEmail;
    res.json(userObj);
  } else {
    res.json(null);
  }
});

// @route   POST /auth/forgot-password
// @desc    Generate a 6-digit verification code and email it to the user
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const lowerEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = code;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    // Send email with code
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtppro.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const mailOptions = {
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER || 'hello@phoenixwebsites.ai'}>`,
      to: lowerEmail,
      subject: `Your Password Reset Code: ${code} — Phoenix Websites AI`,
      text: `Your password reset verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #050508; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #ff4d00; margin-top: 0; text-transform: uppercase;">Password Reset Code</h2>
          <p style="color: #cccccc; font-size: 14px;">Use the verification code below to reset your Phoenix Websites AI account password:</p>
          <div style="background-color: #111118; border: 1px solid #333333; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ff4d00; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #888888; font-size: 12px;">This 6-digit code will expire in 15 minutes.</p>
          <p style="color: #666666; font-size: 11px; margin-top: 24px;">If you did not request this code, you can safely ignore this email.</p>
        </div>
      `
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
      } else {
        console.log(`[PASSWORD RESET DEV] Reset code for ${lowerEmail}: ${code}`);
      }
    } catch (mailErr) {
      console.error('Failed to send reset email:', mailErr.message);
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ 
          message: 'Code generated. (Email credentials not active in dev mode).', 
          devCode: code 
        });
      }
      return res.status(500).json({ error: 'Could not send verification email. Please try again later.' });
    }

    res.json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// @route   POST /auth/reset-password
// @desc    Verify 6-digit code and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const lowerEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const user = await User.findOne({
      email: lowerEmail,
      resetPasswordCode: cleanCode,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    // Update password (pre-save hook hashes with bcrypt)
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log user in automatically
    req.login(user, (err) => {
      if (err) return res.json({ success: true, message: 'Password updated. Please log in.' });
      const userObj = user.toObject ? user.toObject() : { ...user };
      const em = (userObj.email || '').toLowerCase().trim();
      const ownerEmail = (process.env.OWNER_EMAIL || 'hello@phoenixwebsites.ai').toLowerCase().trim();
      userObj.isOwner = em === 'hello@phoenixwebsites.ai' || em === 'partnership@carter-portfolio.fyi' || em === ownerEmail;
      return res.json({ success: true, message: 'Password reset successfully.', user: userObj });
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
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
