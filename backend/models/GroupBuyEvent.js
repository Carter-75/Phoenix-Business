const mongoose = require('mongoose');

/**
 * A group buy event sells ONE thing: a high-percentage discount with a
 * dollar cap (for example 90% off, applied to at most $1,000 of the
 * setup price and at most $10 of the monthly price). It never sells a
 * website directly. Buyers pay the join price only if the group fills;
 * on a fill each buyer is issued a personal percentage_capped Coupon.
 *
 * Tone rules enforced here and in the service layer: only one event may
 * be open at a time, slots stay modest (3 to 10), the discount percent
 * may not exceed 95, and threshold/deadline lock once the event opens.
 */
const groupBuyEventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  percentOff: { type: Number, required: true, min: 1, max: 95 },
  joinPriceCents: { type: Number, required: true, min: 100 },
  slotsNeeded: { type: Number, required: true, min: 3, max: 10 },
  windowDays: { type: Number, required: true, min: 1, max: 30 },
  // Covered subtotal caps for the issued discount (see Coupon model).
  capSetupCents: { type: Number, required: true, min: 0 },
  capMonthlyCents: { type: Number, required: true, min: 0 },
  // Printed next to the slot count on the public page, in the
  // organizer's words: why this many slots makes the price possible.
  capacityReason: { type: String, required: true, trim: true },
  redeemWindowDays: { type: Number, default: 90, min: 7, max: 365 },
  status: {
    type: String,
    enum: ['draft', 'open', 'filling', 'completed', 'missed', 'cancelled'],
    default: 'draft',
    index: true
  },
  startsAt: { type: Date },
  deadline: { type: Date },
  filledAt: { type: Date },
  closedAt: { type: Date },
  createdBy: { type: String, default: 'hello@phoenixwebsites.ai' }
}, { timestamps: true });

module.exports = mongoose.model('GroupBuyEvent', groupBuyEventSchema);
