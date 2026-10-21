const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: function() { return !this.googleId; } },
  googleId: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  businessName: { type: String },
  hasFinalizedProfile: { type: Boolean, default: false },
  hasAcceptedContract: { type: Boolean, default: false },
  contractAcceptedAt: { type: Date },
  termsAcceptedAt: { type: Date },
  termsAcceptedVersion: { type: String },
  termsAcceptedFullText: { type: String },
  stripeCustomerId: { type: String },
  subscriptionStatus: { type: String, default: 'none' },
  usedDiscountCodes: [{ type: String }],
  // Group buy and event announcement emails. Set true when the user
  // accepts the current account terms (the terms include these
  // emails); set false when they unsubscribe by reply or link.
  eventEmailsOptIn: { type: Boolean, default: false },
  // The welcome email (with its one-time 5% code) is sent the first
  // time an account accepts the current terms at login, old accounts
  // included. Stamped once; never sent twice to the same account.
  welcomeEmailSentAt: { type: Date },
  welcomeCouponCode: { type: String },
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
  changePasswordCode: { type: String },
  changePasswordExpires: { type: Date },
  // Data Intelligence — Saved Searches & Cart
  savedSearches: [{
    query: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    source: { type: String, default: '' },
    label: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }],
  cart: [{
    type: { type: String, enum: ['data', 'service'], default: 'data' },
    // Data block fields
    recordIds: [{ type: mongoose.Schema.Types.ObjectId }],
    searchQuery: { type: String, default: '' },
    filters: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      source: { type: String, default: '' }
    },
    blockLabel: { type: String, default: '' },
    totalRecords: { type: Number, default: 0 },
    // Service tier fields
    tierId: { type: String },
    tierName: { type: String },
    tierDescription: { type: String },
    projectType: { type: String },
    price: { type: Number },
    monthlyPrice: { type: String },
    // Common
    addedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
