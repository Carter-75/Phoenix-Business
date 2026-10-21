/**
 * Coupon API Authorization
 *
 * Alternative authorization for the /api/admin/coupons endpoints ONLY.
 * A request is authorized when it carries an `x-api-key` header equal to
 * the DISCOUNT_API_KEY environment variable. The check is active only
 * when that variable is set and non-empty; the key value lives solely
 * in the environment and is never stored in code.
 *
 * Requests without a matching key fall back to the standard owner
 * session check (ownerAuth), so the owner console keeps working
 * exactly as before and every non-coupon admin endpoint stays
 * owner-session only.
 */
const ownerAuth = require('./owner-auth');

module.exports = function couponApiKeyAuth(req, res, next) {
  const configuredKey = process.env.DISCOUNT_API_KEY;
  if (configuredKey && req.headers['x-api-key'] === configuredKey) {
    res.set('Cache-Control', 'no-store');
    return next();
  }
  return ownerAuth(req, res, next);
};
