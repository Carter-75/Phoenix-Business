const mongoose = require('mongoose');

const estimateSchema = new mongoose.Schema({
  estimateCode: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, maxlength: 120 },
  email: { type: String, required: true, maxlength: 254 },
  businessName: { type: String, maxlength: 200 },
  phone: { type: String, maxlength: 50 },
  projectType: { type: String, required: true },
  totalPages: { type: Number, default: 3 },
  features: [{ type: String }],
  careTier: { type: String, default: 'edge' },
  oneTimeTotal: { type: Number, required: true },
  recurringMonthly: { type: Number, default: 0 },
  isFixedPrice: { type: Boolean, default: true },
  projectBrief: { type: String },
  notes: { type: String, maxlength: 3000 },
  status: { type: String, enum: ['new', 'contacted', 'deposit_pending', 'converted', 'archived'], default: 'new' }
}, { timestamps: true });

estimateSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('Estimate', estimateSchema);
