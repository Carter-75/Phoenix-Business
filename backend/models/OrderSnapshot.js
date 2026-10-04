const mongoose = require('mongoose');

const orderSnapshotSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerEmail: { type: String, required: true, lowercase: true },
  customerName: { type: String },
  customerPhone: { type: String },
  businessName: { type: String },
  
  // Selected Tier / Project
  tierId: { type: String, required: true },
  tierName: { type: String, required: true },
  projectType: { type: String },
  totalPages: { type: Number, default: 3 },
  extraPages: { type: Number, default: 0 },
  
  // Base Prices (Prior to Discounts)
  baseSetupCents: { type: Number, required: true },
  baseMonthlyCents: { type: Number, required: true },
  extraPagesSetupCents: { type: Number, default: 0 },
  
  // Selected Add-ons
  selectedAddons: [{
    id: { type: String },
    name: { type: String },
    category: { type: String },
    billingType: { type: String, enum: ['ONE_TIME', 'MONTHLY', 'BOTH'] },
    setupCents: { type: Number, default: 0 },
    monthlyCents: { type: Number, default: 0 },
    includedInBase: { type: Boolean, default: false }
  }],
  addonsSetupSubtotalCents: { type: Number, default: 0 },
  addonsMonthlySubtotalCents: { type: Number, default: 0 },

  // Optional Support Duration Add-On Details
  supportAddon: {
    id: { type: String },
    name: { type: String },
    durationMonths: { type: Number, default: 0 },
    standardMonthlyCents: { type: Number, default: 0 },
    discountedMonthlyCents: { type: Number, default: 0 },
    monthlyCents: { type: Number, default: 0 }, // legacy compatibility alias
    promotionPercentage: { type: Number, default: 0 },
    totalCommitmentStandardCents: { type: Number, default: 0 },
    totalCommitmentDiscountedCents: { type: Number, default: 0 },
    setupCents: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    autoRenew: { type: Boolean, default: false },
    monthlyRequestsIncluded: { type: Number, default: 0 },
    maxHoursPerRequest: { type: Number, default: 1.5 },
    requestsRollOver: { type: Boolean, default: false },
    slaInitialResponse: { type: String },
    transitionSupportRule: { type: String },
    coverageStartRule: { type: String },
    billingStartRule: { type: String },
    inclusions: [{ type: String }],
    exclusions: [{ type: String }]
  },
  
  // Bundle / Volume Discount
  bundleDiscountPercent: { type: Number, default: 0 },
  bundleDiscountSetupCents: { type: Number, default: 0 },
  bundleDiscountMonthlyCents: { type: Number, default: 0 },
  
  // Global Seasonal Promotion
  promotionId: { type: String, default: 'default' },
  promotionName: { type: String, default: 'Evergreen Promotion' },
  promotionDiscountPercent: { type: Number, default: 0 },
  promotionDiscountSetupCents: { type: Number, default: 0 },
  promotionDiscountMonthlyCents: { type: Number, default: 0 },
  
  // Coupon
  couponCode: { type: String },
  couponDiscountSetupCents: { type: Number, default: 0 },
  couponDiscountMonthlyCents: { type: Number, default: 0 },
  
  // Final Charge Amounts
  finalSetupCents: { type: Number, required: true },
  finalMonthlyCents: { type: Number, required: true },
  baseMonthlyRecurringCents: { type: Number },
  supportMonthlyRecurringCents: { type: Number },
  
  // Billing Schedule
  dueTodayCents: { type: Number, required: true },
  firstMonthlyBillingDate: { type: Date, required: true },
  commitmentMonths: { type: Number, default: 12 },
  
  // Contractual Details
  termsVersion: { type: String, default: 'v3-unified' },
  termsAcceptedAt: { type: Date, default: Date.now },
  contractSnapshotText: { type: String },
  
  // Stripe References
  stripeSessionId: { type: String },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrderSnapshot', orderSnapshotSchema);
