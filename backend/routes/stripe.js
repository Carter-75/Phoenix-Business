const express = require('express');
const router = express.Router();
const retiredDataSales = require('../middleware/retired-data-sales');
const {
  checkoutStatus,
  freeOrderStatus,
  validateDiscount,
  verifyStripe,
  createServiceCheckout,
  unifiedCheckout,
  cancellationQuote,
  checkoutCancellation,
  createPortalSession,
  subscriptionsByEmail,
  stripeWebhook,
  recordDatabaseCouponRedemption
} = require('../services/stripe.service');

router.get('/checkout-status', checkoutStatus);
router.get('/free-order-status', freeOrderStatus);
router.post('/validate-discount', validateDiscount);
router.post('/checkout', retiredDataSales, verifyStripe, createServiceCheckout);
router.post('/unified-checkout', retiredDataSales, verifyStripe, unifiedCheckout);
router.get('/cancellation-quote/:contractId', cancellationQuote);
router.post('/checkout-cancellation', checkoutCancellation);
router.post('/create-portal-session', verifyStripe, createPortalSession);
router.get('/subscriptions/:email', verifyStripe, subscriptionsByEmail);
router.post('/webhook', stripeWebhook);

// GET /pricing is served by the inline handler in backend/app.js (registered before this
// router, so it always wins). Do not re-add a second copy here: two implementations of
// the same endpoint drift apart silently.

module.exports = router;

// Exposed for the coupon redemption verification harness (not an HTTP route)
module.exports.recordDatabaseCouponRedemption = recordDatabaseCouponRedemption;
