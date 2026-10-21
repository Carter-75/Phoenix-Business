const mongoose = require('mongoose');

/**
 * One buyer's seat in a group buy event. The card is saved with a
 * SetupIntent at join time (nothing is charged). If the group fills,
 * the join price is charged off-session; success issues the buyer's
 * personal discount Coupon. Statuses:
 *  joined            card saved, waiting on the group
 *  charged           join price paid, discount issued
 *  charge_failed     the fill charge declined; buyer has a fix window
 *  dropped           fix window passed without payment
 *  cancelled_by_buyer buyer left while the event was open
 *  not_charged       event missed or was cancelled; card never charged
 */
const groupBuyEntrySchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupBuyEvent', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stripeCustomerId: { type: String, default: '' },
  setupIntentId: { type: String, default: '' },
  paymentMethodId: { type: String, default: '' },
  joinPriceCents: { type: Number, required: true },
  status: {
    type: String,
    enum: ['joined', 'charged', 'charge_failed', 'dropped', 'cancelled_by_buyer', 'not_charged'],
    default: 'joined',
    index: true
  },
  chargedAt: { type: Date },
  fixDeadline: { type: Date },
  fixSessionId: { type: String, default: '' },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  couponCode: { type: String, default: '' }
}, { timestamps: true });

// One seat per account per event.
groupBuyEntrySchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('GroupBuyEntry', groupBuyEntrySchema);
