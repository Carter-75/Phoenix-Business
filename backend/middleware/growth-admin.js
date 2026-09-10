module.exports = function growthAdmin(req, res, next) {
  // Use an immutable account ID, not a self-registered email address.
  const adminId = process.env.GROWTH_ADMIN_USER_ID;
  if (!adminId || !req.isAuthenticated?.() || String(req.user?._id) !== adminId) {
    return res.status(403).json({ error: 'Owner access required.' });
  }
  res.set('Cache-Control', 'no-store');
  next();
};
