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
    enum: ['percentage', 'fixed'], 
    default: 'percentage' 
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

module.exports = mongoose.model('Coupon', couponSchema);
