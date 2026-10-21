const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: ['percentage', 'fixed', 'percentage_capped', 'intro'], 
    default: 'percentage' 
  },
  // intro only (outreach first-5 offer): after the free first month,
  // the monthly continues at this percent off, ongoing. The free
  // amounts themselves are 100% up to capSetupCents / capMonthlyCents.
  ongoingMonthlyPercentOff: { 
    type: Number, 
    default: 0 
  },
  // intro only: when set, the code can only be redeemed on this
  // package id (for example 'starter'). Any other package is refused.
  restrictToPackage: { 
    type: String, 
    default: '' 
  },
  // percentage_capped only: the percent applies to at most this much of
  // the subtotal (in cents). Example: 90% with capSetupCents 100000
  // takes 90% off the first $1,000 of the setup subtotal, so the total
  // setup discount can never exceed $900 no matter how big the cart is.
  capSetupCents: { 
    type: Number, 
    default: 0 
  },
  capMonthlyCents: { 
    type: Number, 
    default: 0 
  },
  // When true, this coupon ignores the PRICING_FLOORS minimum prices.
  // Used by group buy discounts, which are allowed to go below the
  // normal minimums by design.
  bypassFloors: { 
    type: Boolean, 
    default: false 
  },
  // When set, only this user account may redeem the code (group buy
  // codes are issued to one buyer and must not be shared).
  issuedToUserId: { 
    type: String, 
    default: '' 
  },
  amount: { 
    type: Number, 
    required: true 
  }, // Percentage (e.g. 10 for 10%) or fixed cents (e.g. 25000 for $250.00)
  appliesTo: { 
    type: String, 
    enum: ['setup', 'monthly', 'both'], 
    default: 'both' 
  },
  startsAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date 
  },
  enabled: { 
    type: Boolean, 
    default: true 
  },
  usageLimit: { 
    type: Number, 
    default: 0 
  }, // 0 = unlimited
  usageCount: { 
    type: Number, 
    default: 0 
  },
  perCustomerLimit: { 
    type: Number, 
    default: 1 
  },
  minimumSetupSubtotal: { 
    type: Number, 
    default: 0 
  }, // In cents
  minimumMonthlySubtotal: { 
    type: Number, 
    default: 0 
  }, // In cents
  eligibleTiers: [{ 
    type: String 
  }], // Empty array = all tiers eligible
  eligibleAddons: [{ 
    type: String 
  }],
  notes: { 
    type: String, 
    default: '' 
  },
  createdBy: { 
    type: String, 
    default: 'hello@phoenixwebsites.ai' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

couponSchema.methods.isValidNow = function(setupAmount = 0, monthlyAmount = 0, tierId = null) {
  if (!this.enabled) return { valid: false, reason: 'Coupon is disabled' };
  
  const now = new Date();
  if (this.startsAt && now < this.startsAt) return { valid: false, reason: 'Coupon is not yet active' };
  if (this.expiresAt && now > this.expiresAt) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit > 0 && this.usageCount >= this.usageLimit) return { valid: false, reason: 'Coupon usage limit reached' };
  
  if (this.minimumSetupSubtotal > 0 && setupAmount < this.minimumSetupSubtotal) {
    return { valid: false, reason: `Requires minimum setup subtotal of $${(this.minimumSetupSubtotal / 100).toFixed(2)}` };
  }
  if (this.minimumMonthlySubtotal > 0 && monthlyAmount < this.minimumMonthlySubtotal) {
    return { valid: false, reason: `Requires minimum monthly subtotal of $${(this.minimumMonthlySubtotal / 100).toFixed(2)}` };
  }
  if (this.eligibleTiers && this.eligibleTiers.length > 0 && tierId && !this.eligibleTiers.includes(tierId)) {
    return { valid: false, reason: `Coupon not eligible for plan '${tierId}'` };
  }
  
  return { valid: true };
};

couponSchema.statics.seedDefaultCoupons = async function() {
  const defaults = [
    { code: 'TEST', type: 'percentage', amount: 1, appliesTo: 'both', notes: 'Initial 1% testing code (migrated from .env)' },
    { code: 'ONETIME10', type: 'percentage', amount: 10, appliesTo: 'both', notes: '10% discount code (migrated from .env)' },
    { code: 'FREE100YAY', type: 'percentage', amount: 100, appliesTo: 'both', notes: '100% full waiver code (migrated from .env)' }
  ];
  for (const item of defaults) {
    const exists = await this.findOne({ code: item.code });
    if (!exists) {
      await this.create(item);
    }
  }
};

module.exports = mongoose.model('Coupon', couponSchema);
