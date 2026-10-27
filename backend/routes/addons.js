const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const OrderSnapshot = require('../models/OrderSnapshot');
const AddonPurchase = require('../models/AddonPurchase');
const Coupon = require('../models/Coupon');
const { FEATURE_ADDONS, calculateAddonPrice } = require('../services/pricing.service');
const { applyAddonPurchase } = require('../services/addons.service');
const { ACCOUNT_TERMS_VERSION } = require('../services/legal.service');

function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) return next();
  return res.status(401).json({ error: 'You must be signed in.' });
}

function baseUrl() {
  return process.env.PROD_FRONTEND_URL || 'http://localhost:4200';
}

/** Catalog add-ons a customer can buy after the fact (support plans excluded). */
function listPurchasableAddons() {
  return Object.values(FEATURE_ADDONS)
    .filter(f => f.group !== 'support-duration')
    .map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      category: f.category,
      billingType: f.billingType,
      setupCents: f.setupPrice,
      monthlyCents: f.monthlyPrice,
      requires: f.requires || []
    }));
}

async function findOwnedOrder(req, orderId) {
  if (!orderId || typeof orderId !== 'string') return null;
  const order = await OrderSnapshot.findOne({ orderId });
  if (!order) return null;
  const sameUser = order.userId && String(order.userId) === String(req.user._id);
  const sameEmail = (order.customerEmail || '').toLowerCase() === (req.user.email || '').toLowerCase();
  return (sameUser || sameEmail) ? order : null;
}

/**
 * Resolves a discount code the same way /stripe/validate-discount does:
 * database coupons first (validity window, usage limit, per-customer
 * one-time use, account binding), then legacy env codes.
 * Returns { coupon } (doc or null for env codes), or { error }.
 */
async function resolveCoupon(req, rawCode) {
  if (!rawCode) return { coupon: null };
  const code = String(rawCode).trim().toUpperCase();
  if (!code) return { coupon: null };

  const dbCoupon = await Coupon.findOne({ code });
  if (dbCoupon) {
    const check = dbCoupon.isValidNow();
    if (!check.valid) return { error: check.reason || 'This coupon is not valid.' };
    if (dbCoupon.perCustomerLimit > 0 && (req.user.usedDiscountCodes || []).includes(code)) {
      return { error: 'You have already used this single-use discount code.' };
    }
    if (dbCoupon.issuedToUserId && String(dbCoupon.issuedToUserId) !== String(req.user._id)) {
      return { error: 'This discount code belongs to a different account.' };
    }
    return { coupon: dbCoupon };
  }

  if (process.env[`DC_${code}`]) return { coupon: null };
  if (process.env[`DCL_${code}`]) {
    if ((req.user.usedDiscountCodes || []).includes(code)) {
      return { error: 'You have already used this discount code.' };
    }
    return { coupon: null };
  }

  return { error: 'Invalid discount code.' };
}

function quoteFor(order, addonIds, coupon, rawCode) {
  const ownedAddonIds = (order.selectedAddons || []).map(a => a.id).filter(Boolean);
  return calculateAddonPrice(
    { addonIds, discountCode: rawCode || undefined },
    { coupon, ownedAddonIds }
  );
}

/**
 * GET /api/addons/mine
 * The signed-in customer's paid orders with the add-ons they do not
 * own yet, so the dashboard can offer post-purchase add-ons.
 */
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const orders = await OrderSnapshot.find({
      $or: [{ userId: req.user._id }, { customerEmail: (req.user.email || '').toLowerCase() }],
      paymentStatus: 'paid'
    }).sort({ createdAt: -1 });

    const catalog = listPurchasableAddons();
    const result = orders.map(order => {
      const ownedIds = new Set((order.selectedAddons || []).map(a => a.id));
      return {
        orderId: order.orderId,
        tierName: order.tierName,
        businessName: order.businessName || '',
        finalMonthlyCents: order.finalMonthlyCents,
        selfServeAvailable: Boolean(order.stripeSubscriptionId),
        ownedAddonIds: [...ownedIds],
        availableAddons: catalog.filter(a => !ownedIds.has(a.id))
      };
    });
    res.json({ orders: result });
  } catch (err) {
    console.error('[ADDONS] mine failed:', err.message);
    res.status(500).json({ error: 'Could not load your add-ons.' });
  }
});

/** POST /api/addons/quote { orderId, addonIds, couponCode } */
router.post('/quote', requireAuth, async (req, res) => {
  try {
    const { orderId, addonIds, couponCode } = req.body || {};
    const order = await findOwnedOrder(req, orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Add-ons are available once the order is paid.' });
    }
    const resolved = await resolveCoupon(req, couponCode);
    if (resolved.error) return res.status(400).json({ error: resolved.error });

    const quote = quoteFor(order, addonIds, resolved.coupon, couponCode);
    if (quote.couponError) return res.status(400).json({ error: quote.couponError });
    if (!quote.addons.length) {
      return res.status(400).json({ error: 'Pick at least one add-on you do not already have.' });
    }
    res.json({
      quote,
      currentMonthlyCents: order.finalMonthlyCents,
      newMonthlyCents: (order.finalMonthlyCents || 0) + quote.monthlyDeltaCents
    });
  } catch (err) {
    console.error('[ADDONS] quote failed:', err.message);
    res.status(500).json({ error: 'Could not price those add-ons.' });
  }
});

/**
 * POST /api/addons/checkout { orderId, addonIds, couponCode, acceptedTerms }
 * Freezes the quote on an AddonPurchase, then either applies it at once
 * (nothing due today: a comp or a pure monthly add-on, billed from the
 * next invoice) or sends the customer to Stripe Checkout for the setup
 * total. The webhook (or the status endpoint) applies it after payment.
 */
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { orderId, addonIds, couponCode, acceptedTerms } = req.body || {};
    if (acceptedTerms !== true) {
      return res.status(400).json({ error: 'Please accept the terms to add add-ons to your package.' });
    }
    const order = await findOwnedOrder(req, orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Add-ons are available once the order is paid.' });
    }
    const resolved = await resolveCoupon(req, couponCode);
    if (resolved.error) return res.status(400).json({ error: resolved.error });

    const quote = quoteFor(order, addonIds, resolved.coupon, couponCode);
    if (quote.couponError) return res.status(400).json({ error: quote.couponError });
    if (!quote.addons.length) {
      return res.status(400).json({ error: 'Pick at least one add-on you do not already have.' });
    }
    if (quote.monthlyDeltaCents > 0 && !order.stripeSubscriptionId) {
      return res.status(400).json({
        error: 'This order has no card subscription to extend. Email us and we will add it for you.'
      });
    }

    const purchase = await new AddonPurchase({
      userId: req.user._id,
      customerEmail: (req.user.email || '').toLowerCase(),
      orderId: order.orderId,
      orderSnapshotId: order._id,
      addons: quote.addons,
      subtotalSetupCents: quote.subtotalSetupCents,
      subtotalMonthlyCents: quote.subtotalMonthlyCents,
      bundleDiscountPercent: quote.bundleDiscountPercent,
      bundleDiscountSetupCents: quote.bundleDiscountSetupCents,
      bundleDiscountMonthlyCents: quote.bundleDiscountMonthlyCents,
      promotionId: quote.promotionId,
      promotionDiscountPercent: quote.promotionDiscountPercent,
      promoDiscountSetupCents: quote.promoDiscountSetupCents,
      promoDiscountMonthlyCents: quote.promoDiscountMonthlyCents,
      couponCode: quote.couponCode || undefined,
      couponDiscountSetupCents: quote.couponDiscountSetupCents,
      couponDiscountMonthlyCents: quote.couponDiscountMonthlyCents,
      dueTodayCents: quote.dueTodayCents,
      monthlyDeltaCents: quote.monthlyDeltaCents,
      termsVersion: ACCOUNT_TERMS_VERSION,
      termsAcceptedAt: new Date()
    }).save();

    if (quote.dueTodayCents <= 0) {
      const applied = await applyAddonPurchase(stripe, purchase._id);
      if (applied.status !== 'applied') {
        return res.status(500).json({
          error: applied.failureReason || 'The add-ons could not be applied. Nothing was charged.'
        });
      }
      return res.json({ applied: true, purchaseId: String(purchase._id) });
    }

    const names = quote.addons.map(a => a.name).join(', ');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: order.stripeCustomerId || undefined,
      customer_email: order.stripeCustomerId ? undefined : order.customerEmail,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: quote.dueTodayCents,
          product_data: {
            name: 'Website Add-Ons (setup)',
            description: names.slice(0, 500)
          }
        }
      }],
      metadata: {
        purpose: 'addon_purchase',
        purchaseId: String(purchase._id),
        orderId: order.orderId
      },
      success_url: `${baseUrl()}/dashboard?addons=success&purchase=${purchase._id}`,
      cancel_url: `${baseUrl()}/dashboard?addons=cancelled`
    });

    purchase.stripeSessionId = session.id;
    await purchase.save();
    res.json({ applied: false, purchaseId: String(purchase._id), url: session.url });
  } catch (err) {
    console.error('[ADDONS] checkout failed:', err.message);
    res.status(500).json({ error: 'Could not start the add-on checkout.' });
  }
});

/**
 * GET /api/addons/status/:purchaseId
 * The dashboard polls this after returning from Stripe. If Stripe says
 * the session is paid and the purchase is still pending, apply it here
 * too (the webhook remains the primary path; both are idempotent).
 */
router.get('/status/:purchaseId', requireAuth, async (req, res) => {
  try {
    const purchase = await AddonPurchase.findById(req.params.purchaseId);
    if (!purchase || String(purchase.userId) !== String(req.user._id)) {
      return res.status(404).json({ error: 'Purchase not found.' });
    }
    if (purchase.status === 'pending' && purchase.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(purchase.stripeSessionId);
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        await applyAddonPurchase(stripe, purchase._id);
      }
    }
    const fresh = await AddonPurchase.findById(purchase._id);
    res.json({
      status: fresh.status,
      addons: fresh.addons.map(a => a.name),
      dueTodayCents: fresh.dueTodayCents,
      monthlyDeltaCents: fresh.monthlyDeltaCents,
      failureReason: fresh.failureReason || null
    });
  } catch (err) {
    console.error('[ADDONS] status failed:', err.message);
    res.status(500).json({ error: 'Could not check the purchase status.' });
  }
});

module.exports = router;
