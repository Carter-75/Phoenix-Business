const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const { getDynamicPolicies, ACCOUNT_TERMS_VERSION } = require('../services/legal.service');
const { mintAndSendWelcome } = require('../services/welcome.service');
const outreachOffer = require('../services/outreach-offer.service');

async function fireWelcome(user) {
  // Awaited by every caller on purpose: a fire-and-forget send on
  // serverless can be frozen after the account stamp saves but
  // before SMTP finishes, recording a welcome that never left
  // (proven in production Oct 21, 2026: stamped, no error logged,
  // and no copy anywhere in the mailbox). This runs once per
  // account, so the small delay is acceptable.
  try { await mintAndSendWelcome(user); }
  catch (e) { console.error('[AUTH] welcome email failed', e.message); }
}

/**
 * Backfill: an account that already accepted the current terms but
 * never got its welcome email (for example, its acceptance landed
 * while an older build was still serving) receives it on its next
 * sign-in or session check. mintAndSendWelcome self-guards, so this
 * can never send twice. No account is excluded, owner included.
 */
async function fireWelcomeIfPending(user) {
  if (user && !user.isPending && user.termsAcceptedVersion === ACCOUNT_TERMS_VERSION && !user.welcomeEmailSentAt) {
    await fireWelcome(user);
  }
}
const { SUBJECT_WORD_NOTICE, subjectWordNoticeHtml } = require('../services/policy-notice');

const getFullLegalText = () => Object.values(getDynamicPolicies()).join('\n\n---\n\n');

// @route   POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, businessName, acceptedTerms, termsAcceptedVersion, signupRef } = req.body;
    
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
      termsAcceptedVersion: acceptedTerms ? ACCOUNT_TERMS_VERSION : undefined,
      termsAcceptedFullText: acceptedTerms ? getFullLegalText() : undefined,
      termsAcceptedAt: acceptedTerms ? new Date() : undefined,
      eventEmailsOptIn: acceptedTerms === true,
      signupRef: signupRef === outreachOffer.REF_VALUE ? outreachOffer.REF_VALUE : ''
    });

    await user.save();
    if (acceptedTerms === true) await fireWelcome(user);
    // Outreach first-5: awaited on purpose (the welcome saga's
    // lesson); a failure is logged and never blocks the signup.
    try { await outreachOffer.issueOutreachCode(user); }
    catch (e) { console.error('[AUTH] outreach first-5 issue failed', e && e.message); }

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
    passport.authenticate('local', async (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        const status = info.message === 'USER_NOT_FOUND' ? 404 : 401;
        return res.status(status).json({ message: info.message });
      }

      // Terms gate: when the account terms have changed since this
      // account accepted them, signing in requires re-checking the
      // updated terms. Without the re-check, no session is created.
      if (user.termsAcceptedVersion !== ACCOUNT_TERMS_VERSION) {
        if (req.body && req.body.acceptedTerms === true) {
          user.termsAcceptedVersion = ACCOUNT_TERMS_VERSION;
          user.termsAcceptedFullText = getFullLegalText();
          user.termsAcceptedAt = new Date();
          user.hasAcceptedContract = true;
          user.eventEmailsOptIn = true;
          await user.save();
          await fireWelcome(user);
        } else {
          return res.status(403).json({
            code: 'TERMS_UPDATE_REQUIRED',
            message: 'Our terms were updated. Please accept the updated terms to sign in.',
            currentTermsVersion: ACCOUNT_TERMS_VERSION
          });
        }
      }

      await fireWelcomeIfPending(user);
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
    req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error('[AUTH] Session login error:', loginErr.message);
        const errorMsg = encodeURIComponent('Session error. Please try signing in again.');
        return res.redirect(`${frontendUrl}/services?auth_error=${errorMsg}`);
      }

      await fireWelcomeIfPending(user);
      // Terms gate for Google sign-in: OAuth has no password step to
      // attach the re-check to, so an established account on old terms
      // lands on the re-acceptance gate before anything else opens.
      if (user.hasFinalizedProfile && user.termsAcceptedVersion !== ACCOUNT_TERMS_VERSION) {
        req.session.termsGate = true;
        return res.redirect(`${frontendUrl}/dashboard?terms=update`);
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
router.get('/user', async (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    // A policy change logs established accounts out: if this session
    // predates the current terms and is not the mid-login Google
    // re-acceptance, the session ends here and the client signs in
    // again through the re-check. Pending (new Google) accounts are
    // exempt; their onboarding collects the acceptance.
    if (!req.user.isPending
      && req.user.termsAcceptedVersion !== ACCOUNT_TERMS_VERSION
      && !(req.session && req.session.termsGate)) {
      const send = () => res.status(401).json({ error: 'terms_update_required', currentTermsVersion: ACCOUNT_TERMS_VERSION });
      if (req.session && req.session.destroy) return req.session.destroy(send);
      return send();
    }
    await fireWelcomeIfPending(req.user);
    const userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
    userObj.hasPassword = !!userObj.password;
    delete userObj.password;
    const em = (userObj.email || '').toLowerCase().trim();
    const ownerEmail = (process.env.OWNER_EMAIL || 'hello@phoenixwebsites.ai').toLowerCase().trim();
    userObj.isOwner = em === 'hello@phoenixwebsites.ai' || em === 'partnerships@carter-portfolio.fyi' || em === ownerEmail;
    userObj.currentTermsVersion = ACCOUNT_TERMS_VERSION;
    userObj.needsTermsUpdate = userObj.termsAcceptedVersion !== ACCOUNT_TERMS_VERSION;
    res.json(userObj);
  } else {
    res.json(null);
  }
});

// @route   POST /auth/accept-terms
// Records acceptance of the current account terms. Replaces whatever
// acceptance was stored before and stamps the time, per the terms
// update flow. Accepting also subscribes the account to group buy and
// event announcement emails (Terms section 13), until unsubscribed.
router.post('/accept-terms', async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.termsAcceptedVersion = ACCOUNT_TERMS_VERSION;
    user.termsAcceptedFullText = getFullLegalText();
    user.termsAcceptedAt = new Date();
    user.hasAcceptedContract = true;
    user.eventEmailsOptIn = true;
    await user.save();
    if (req.session) delete req.session.termsGate;
    await fireWelcome(user);
    res.json({
      ok: true,
      termsAcceptedVersion: user.termsAcceptedVersion,
      termsAcceptedAt: user.termsAcceptedAt,
      needsTermsUpdate: false
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
      text: `Your password reset verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.\n\n${SUBJECT_WORD_NOTICE}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #050508; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #ff4d00; margin-top: 0; text-transform: uppercase;">Password Reset Code</h2>
          <p style="color: #cccccc; font-size: 14px;">Use the verification code below to reset your Phoenix Websites AI account password:</p>
          <div style="background-color: #111118; border: 1px solid #333333; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ff4d00; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #888888; font-size: 12px;">This 6-digit code will expire in 15 minutes.</p>
          <p style="color: #666666; font-size: 11px; margin-top: 24px;">If you did not request this code, you can safely ignore this email.</p>
          ${subjectWordNoticeHtml('ORDER', 'font-size: 12px; color: #9ca3af; margin-top: 16px; line-height: 1.5;')}
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
      userObj.isOwner = em === 'hello@phoenixwebsites.ai' || em === 'partnerships@carter-portfolio.fyi' || em === ownerEmail;
      return res.json({ success: true, message: 'Password reset successfully.', user: userObj });
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// @route   POST /auth/change-password/request-code
// @desc    Signed-in email/password users only: email a 6-digit verification
//          code that authorizes a password change. Google-only accounts have
//          no password and are told to manage it with Google instead.
router.post('/change-password/request-code', async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'This account signs in with Google, so there is no password to change. Manage your password in your Google account.' });
    }

    // Resend cooldown: a code issued less than 60 seconds ago is still fresh.
    if (user.changePasswordExpires && user.changePasswordCode) {
      const msLeft = new Date(user.changePasswordExpires).getTime() - Date.now();
      if (msLeft > 14 * 60 * 1000) {
        return res.status(429).json({ error: 'A verification code was just sent. Please wait a minute before requesting another.' });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.changePasswordCode = code;
    user.changePasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtppro.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const mailOptions = {
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER || 'hello@phoenixwebsites.ai'}>`,
      to: user.email,
      subject: `Your Password Change Code: ${code} — Phoenix Websites AI`,
      text: `You asked to change the password on your Phoenix Websites AI account. Your verification code is: ${code}\n\nEnter this code with your current password and your new password to finish the change. This code will expire in 15 minutes.\n\nIf you did not request this change, do not share the code with anyone. Your password stays the same unless the code is used.\n\n${SUBJECT_WORD_NOTICE}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #050508; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #ff4d00; margin-top: 0; text-transform: uppercase;">Password Change Code</h2>
          <p style="color: #cccccc; font-size: 14px;">You asked to change the password on your Phoenix Websites AI account. Enter this verification code with your current password and your new password to finish:</p>
          <div style="background-color: #111118; border: 1px solid #333333; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ff4d00; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #888888; font-size: 12px;">This 6-digit code will expire in 15 minutes. Your password stays the same unless the code is used.</p>
          <p style="color: #666666; font-size: 11px; margin-top: 24px;">If you did not request this change, do not share the code with anyone and you can safely ignore this email.</p>
          ${subjectWordNoticeHtml('ORDER', 'font-size: 12px; color: #9ca3af; margin-top: 16px; line-height: 1.5;')}
        </div>
      `
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
      } else {
        console.log(`[PASSWORD CHANGE DEV] Change code for ${user.email}: ${code}`);
      }
    } catch (mailErr) {
      console.error('Failed to send password change email:', mailErr.message);
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
    console.error('Change password request error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// @route   POST /auth/change-password/confirm
// @desc    Signed-in email/password users: verify the emailed code AND the
//          current password, then set the new password.
router.post('/change-password/confirm', async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { code, currentPassword, newPassword } = req.body || {};
    if (!code || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Verification code, current password, and new password are required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'This account signs in with Google, so there is no password to change. Manage your password in your Google account.' });
    }

    if (!user.changePasswordCode || user.changePasswordCode !== String(code).trim() ||
        !user.changePasswordExpires || new Date(user.changePasswordExpires) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Request a new code and try again.' });
    }

    const currentOk = await user.comparePassword(String(currentPassword));
    if (!currentOk) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    if (await user.comparePassword(String(newPassword))) {
      return res.status(400).json({ error: 'New password must be different from your current password.' });
    }

    // Update password (pre-save hook hashes with bcrypt) and burn the code.
    user.password = newPassword;
    user.changePasswordCode = undefined;
    user.changePasswordExpires = undefined;
    await user.save();

    // Best-effort security confirmation email.
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtppro.zoho.com',
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: true,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
          from: `"Phoenix Websites AI" <${process.env.EMAIL_USER || 'hello@phoenixwebsites.ai'}>`,
          to: user.email,
          subject: `Your Phoenix Websites AI password was changed`,
          text: `The password on your Phoenix Websites AI account was just changed.\n\nIf this was you, no further action is needed.\n\nIf this was NOT you, contact us right away at hello@phoenixwebsites.ai so we can secure your account.\n\n${SUBJECT_WORD_NOTICE}`,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #050508; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px;">
              <h2 style="color: #ff4d00; margin-top: 0; text-transform: uppercase;">Password Changed</h2>
              <p style="color: #cccccc; font-size: 14px;">The password on your Phoenix Websites AI account was just changed.</p>
              <p style="color: #cccccc; font-size: 14px;">If this was you, no further action is needed.</p>
              <p style="color: #888888; font-size: 12px; margin-top: 24px;">If this was NOT you, contact us right away at hello@phoenixwebsites.ai so we can secure your account.</p>
              ${subjectWordNoticeHtml('ORDER', 'font-size: 12px; color: #9ca3af; margin-top: 16px; line-height: 1.5;')}
            </div>
          `
        });
      }
    } catch (mailErr) {
      console.error('Failed to send password changed confirmation email:', mailErr.message);
    }

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password confirm error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
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
    const { firstName, lastName, businessName, acceptedTerms, termsAcceptedVersion, signupRef } = req.body;
    
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
        termsAcceptedVersion: acceptedTerms ? ACCOUNT_TERMS_VERSION : undefined,
        termsAcceptedFullText: acceptedTerms ? getFullLegalText() : undefined,
        termsAcceptedAt: acceptedTerms ? new Date() : undefined,
        eventEmailsOptIn: acceptedTerms === true,
        signupRef: signupRef === outreachOffer.REF_VALUE ? outreachOffer.REF_VALUE : ''
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
        user.termsAcceptedVersion = ACCOUNT_TERMS_VERSION;
        user.termsAcceptedFullText = getFullLegalText();
        user.termsAcceptedAt = new Date();
        user.eventEmailsOptIn = true;
      }
    }

    await user.save();
    if (acceptedTerms) await fireWelcome(user);
    // Outreach first-5 for accounts that carried the ref through a
    // Google signup. Existing accounts only get it if they arrived
    // with the ref on this finalize and never had one recorded.
    try {
      if (!user.signupRef && signupRef === outreachOffer.REF_VALUE) {
        user.signupRef = outreachOffer.REF_VALUE;
        await user.save();
      }
      await outreachOffer.issueOutreachCode(user);
    } catch (e) { console.error('[AUTH] outreach first-5 issue failed', e && e.message); }

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
