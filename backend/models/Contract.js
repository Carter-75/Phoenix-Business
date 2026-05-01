const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contractType: { type: String, default: 'Yearly Service Agreement v1' },
  acceptedAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
  termsSnapshot: { type: String }, // Stores the exact terms text at time of signing
  status: { type: String, enum: ['active', 'breached', 'cancelled', 'expired'], default: 'active' },
  expiresAt: { type: Date }
});

module.exports = mongoose.model('Contract', contractSchema);
