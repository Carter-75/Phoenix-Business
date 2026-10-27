const mongoose = require('mongoose');

/**
 * A post-purchase add-on buy attached to an existing OrderSnapshot.
 *
 * Created when a signed-in customer starts an add-on checkout from their
 * dashboard. The priced selection is frozen on this record at creation,
 * so what gets applied to the order after payment is exactly what was
 * quoted, even if catalog prices or promotions change in between.
 * Application (subscription item + order update) happens exactly once,
 * guarded by the status transition and a ProcessedEvent claim keyed to
 * the Stripe session.
 */
const addonPurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerEmail: { type: String, required: true, lowercase: true },
  orderId: { type: String, required: true, index: true }, // OrderSnapshot.orderId
  orderSnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderSnapshot' },

  addons: [{
    id: { type: String },
    name: { type: String },
    category: { type: String },
    billingType: { type: String },
    setupCents: { type: Number, default: 0 },
    monthlyCents: { type: Number, default: 0 },
    autoAdded: { type: Boolean, default: false }
  }],

  // Priced snapshot (same shape calculateAddonPrice returns)
  subtotalSetupCents: { type: Number, default: 0 },
  subtotalMonthlyCents: { type: Number, default: 0 },
  bundleDiscountPercent: { type: Number, default: 0 },
  bundleDiscountSetupCents: { type: Number, default: 0 },
  bundleDiscountMonthlyCents: { type: Number, default: 0 },
  promotionId: { type: String, default: 'default' },
  promotionDiscountPercent: { type: Number, default: 0 },
  promoDiscountSetupCents: { type: Number, default: 0 },
  promoDiscountMonthlyCents: { type: Number, default: 0 },
  couponCode: { type: String },
  couponDiscountSetupCents: { type: Number, default: 0 },
  couponDiscountMonthlyCents: { type: Number, default: 0 },
  dueTodayCents: { type: Number, required: true },
  monthlyDeltaCents: { type: Number, required: true },

  termsVersion: { type: String },
  termsAcceptedAt: { type: Date },

  stripeSessionId: { type: String, index: true },
  stripeSubscriptionItemId: { type: String },

  // Set once this purchase has been written into the order record
  // (add-on lines and totals), so a resumed application can never
  // count it twice.
  orderRecorded: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['pending', 'applied', 'failed'],
    default: 'pending',
    index: true
  },
  failureReason: { type: String },
  appliedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AddonPurchase', addonPurchaseSchema);
