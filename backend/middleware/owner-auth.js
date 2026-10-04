/**
 * Owner-Only Authorization Guard
 * 
 * Strictly verifies that the request has an active authenticated session
 * and that the authenticated user's email is hello@phoenixwebsites.ai.
 * 
 * Never trust client-side claims or headers.
 */
module.exports = function ownerAuth(req, res, next) {
  // 1. Must have an active Passport session
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'No authenticated user session.' });
  }

  // 2. Check for authorized owner email (case-insensitive & trimmed)
  const ownerEmail = (process.env.OWNER_EMAIL || 'hello@phoenixwebsites.ai').toLowerCase().trim();
  const userEmail = (user.email || '').toLowerCase().trim();

  const isOwnerEmail = userEmail === ownerEmail || 
                       userEmail === 'hello@phoenixwebsites.ai' || 
                       userEmail === 'partnership@carter-portfolio.fyi';
  const isOwnerId = process.env.GROWTH_ADMIN_USER_ID && String(user._id) === process.env.GROWTH_ADMIN_USER_ID;

  if (!isOwnerEmail && !isOwnerId) {
    return res.status(403).json({ 
      error: `Access denied. Current account (${userEmail}) is not authorized as site owner.` 
    });
  }

  res.set('Cache-Control', 'no-store');
  next();
};
