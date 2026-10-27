/**
 * Post-purchase add-ons: applying a paid AddonPurchase to the customer's
 * existing order and Stripe subscription.
 *
 * Application is idempotent and resumable:
 *  - a ProcessedEvent claim (addon-apply:<purchaseId>) stops duplicate
 *    webhook deliveries from applying twice;
 *  - the Stripe subscription item id is persisted on the purchase as
 *    soon as it exists, so a resumed run never creates a second item;
 *  - the order's monthly total is only increased behind the purchase's
 *    monthlyCounted flag.
 * The monthly amount starts with the subscription's next regular
 * invoice (proration_behavior 'none'): the customer agreed to a new
 * monthly rate, not a surprise mid-cycle charge.
 */
const AddonPurchase = require('../models/AddonPurchase');
const OrderSnapshot = require('../models/OrderSnapshot');
const ProcessedEvent = require('../models/ProcessedEvent');
const Coupon = require('../models/Coupon');
const User = require('../models/user');
const { SUBJECT_WORD_NOTICE, subjectWordNoticeHtml } = require('./policy-notice');

const ADDON_PRODUCT_NAME = 'Phoenix Websites AI - Website Add-On';

async function recordAddonCouponRedemption(purchase) {
  const cleanCode = String(purchase.couponCode || '').trim().toUpperCase();
  if (!cleanCode) return false;
  const coupon = await Coupon.findOne({ code: cleanCode });
  if (!coupon) return false; // legacy env code: nothing to record

  try {
    await new ProcessedEvent({
      eventId: `coupon-redeem-addon:${purchase._id}`,
      type: 'coupon_redemption'
    }).save();
  } catch (claimErr) {
    return false; // already recorded for this purchase
  }

  await Coupon.updateOne({ _id: coupon._id }, { $inc: { usageCount: 1 } });
  try {
    const { setDatabaseCoupon } = require('./pricing.service');
    coupon.usageCount = (coupon.usageCount || 0) + 1;
    setDatabaseCoupon(coupon);
  } catch (cacheErr) {
    console.warn('[ADDONS] Coupon cache sync warning:', cacheErr.message);
  }

  await User.updateOne(
    { _id: purchase.userId },
    { $addToSet: { usedDiscountCodes: cleanCode } }
  );
  return true;
}

async function sendAddonConfirmationEmail(purchase, order) {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtppro.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    const money = (c) => `$${(Math.max(0, c || 0) / 100).toFixed(2)}`;
    const names = purchase.addons.map(a => a.name).join(', ');
    const lines = [
      `Hi ${order.customerName || 'there'},`,
      '',
      `Your add-on${purchase.addons.length > 1 ? 's are' : ' is'} now on your website package: ${names}.`,
      `Charged today: ${money(purchase.dueTodayCents)}.`,
      purchase.monthlyDeltaCents > 0
        ? `Your monthly rate is now ${money(order.finalMonthlyCents)}, starting with your next regular invoice.`
        : 'There is no change to your monthly rate.',
      '',
      'We will follow up as the work is scheduled. Reply to this email any time you need anything.',
      '',
      SUBJECT_WORD_NOTICE
    ];
    await transporter.sendMail({
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
      to: purchase.customerEmail,
      subject: 'Your website add-ons are confirmed',
      text: lines.join('\n'),
      html: `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.6">
        <p>Hi ${order.customerName || 'there'},</p>
        <p>Your add-on${purchase.addons.length > 1 ? 's are' : ' is'} now on your website package: <strong>${names}</strong>.</p>
        <p>Charged today: <strong>${money(purchase.dueTodayCents)}</strong>.<br>
        ${purchase.monthlyDeltaCents > 0
          ? `Your monthly rate is now <strong>${money(order.finalMonthlyCents)}</strong>, starting with your next regular invoice.`
          : 'There is no change to your monthly rate.'}</p>
        <p>We will follow up as the work is scheduled. Reply to this email any time you need anything.</p>
        ${subjectWordNoticeHtml()}
      </div>`
    });
  } catch (emailErr) {
    // A failed receipt email must never fail the purchase application.
    console.error('[ADDONS] Confirmation email failed:', emailErr.message);
  }
}

/**
 * Applies the purchase to the order + subscription. Safe to call more
 * than once (webhook redelivery, status polling): later calls no-op
 * once the purchase is 'applied'.
 */
async function applyAddonPurchase(stripe, purchaseId) {
  const purchase = await AddonPurchase.findById(purchaseId);
  if (!purchase) throw new Error('Addon purchase not found');
  if (purchase.status === 'applied') return purchase;
  if (purchase.status === 'failed') return purchase;

  // Claim this purchase exactly once. A duplicate claim means another
  // run is applying or already applied it; the persisted step markers
  // below make it safe for that run (or a later retry) to resume.
  let claimed = false;
  try {
    await new ProcessedEvent({
      eventId: `addon-apply:${purchase._id}`,
      type: 'addon_purchase'
    }).save();
    claimed = true;
  } catch (claimErr) {
    claimed = false;
  }
  const fresh = await AddonPurchase.findById(purchaseId);
  if (fresh.status === 'applied') return fresh;
  if (!claimed && fresh.orderRecorded && (fresh.monthlyDeltaCents <= 0 || fresh.stripeSubscriptionItemId)) {
    // A prior run finished the effects but died before the final stamp.
    fresh.status = 'applied';
    fresh.appliedAt = new Date();
    await fresh.save();
    return fresh;
  }

  const order = await OrderSnapshot.findOne({ orderId: purchase.orderId });
  if (!order) {
    purchase.status = 'failed';
    purchase.failureReason = 'Original order not found';
    await purchase.save();
    return purchase;
  }

  // 1. Monthly: add one subscription item for the whole purchase's
  //    monthly delta on the order's existing subscription.
  if (purchase.monthlyDeltaCents > 0 && !purchase.stripeSubscriptionItemId) {
    if (!order.stripeSubscriptionId) {
      purchase.status = 'failed';
      purchase.failureReason = 'Order has no Stripe subscription to extend';
      await purchase.save();
      return purchase;
    }
    const subscription = await stripe.subscriptions.retrieve(order.stripeSubscriptionId);
    if (!['active', 'trialing', 'past_due'].includes(subscription.status)) {
      purchase.status = 'failed';
      purchase.failureReason = `Subscription is ${subscription.status}`;
      await purchase.save();
      return purchase;
    }
    let productId = null;
    const existing = await stripe.products.search({
      query: `name:'${ADDON_PRODUCT_NAME}' and active:'true'`
    });
    if (existing.data && existing.data.length) {
      productId = existing.data[0].id;
    } else {
      const product = await stripe.products.create({ name: ADDON_PRODUCT_NAME });
      productId = product.id;
    }
    const price = await stripe.prices.create({
      product: productId,
      currency: 'usd',
      unit_amount: purchase.monthlyDeltaCents,
      recurring: { interval: 'month' },
      nickname: purchase.addons.map(a => a.name).join(', ').slice(0, 250)
    });
    const item = await stripe.subscriptionItems.create({
      subscription: order.stripeSubscriptionId,
      price: price.id,
      quantity: 1,
      proration_behavior: 'none',
      metadata: { addonPurchaseId: String(purchase._id), orderId: purchase.orderId }
    });
    purchase.stripeSubscriptionItemId = item.id;
    await purchase.save();
  }

  // 2. Order record: append the add-ons (never twice) and raise the
  //    totals once, behind the orderRecorded flag.
  if (!purchase.orderRecorded) {
    const ownedIds = new Set((order.selectedAddons || []).map(a => a.id));
    for (const addon of purchase.addons) {
      if (!ownedIds.has(addon.id)) {
        order.selectedAddons.push({
          id: addon.id,
          name: addon.name,
          category: addon.category,
          billingType: addon.billingType,
          setupCents: addon.setupCents,
          monthlyCents: addon.monthlyCents,
          includedInBase: false
        });
      }
    }
    order.addonsSetupSubtotalCents = (order.addonsSetupSubtotalCents || 0) + purchase.subtotalSetupCents;
    order.addonsMonthlySubtotalCents = (order.addonsMonthlySubtotalCents || 0) + purchase.subtotalMonthlyCents;
    if (purchase.monthlyDeltaCents > 0) {
      order.finalMonthlyCents = (order.finalMonthlyCents || 0) + purchase.monthlyDeltaCents;
    }
    await order.save();
    purchase.orderRecorded = true;
    await purchase.save();
  }

  // 3. Coupon bookkeeping + final stamp + receipt.
  await recordAddonCouponRedemption(purchase);
  purchase.status = 'applied';
  purchase.appliedAt = new Date();
  await purchase.save();

  await sendAddonConfirmationEmail(purchase, order);
  return purchase;
}

module.exports = { applyAddonPurchase, recordAddonCouponRedemption };
