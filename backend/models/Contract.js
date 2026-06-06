const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contractType: { type: String, default: 'Yearly Service Agreement v1' },
  acceptedAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
  termsSnapshot: { type: String }, // Stores the exact terms text at time of signing
  pdfSnapshot: { type: Buffer },   // Stores the binary PDF data
  status: { type: String, enum: ['active', 'breached', 'cancelled', 'expired', 'bought-out'], default: 'active' },
  expiresAt: { type: Date },
  stripeSubscriptionId: { type: String }, // Nullable for Simple Launch
  projectName: { type: String }, // E.g., "Carter's Plumbing - Essential Care"
  tier: { type: String }, // 'simple', 'essential', 'professional'
  setupFeePaid: { type: Number }, // In cents
  monthlyFee: { type: Number } // In cents
});

module.exports = mongoose.model('Contract', contractSchema);
