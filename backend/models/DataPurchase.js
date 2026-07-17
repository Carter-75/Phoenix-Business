const mongoose = require('mongoose');

const dataPurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recordIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DataRecord' }],
  searchQuery: { type: String, default: '' },
  filters: {
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    source: { type: String, default: '' }
  },
  status: { type: String, enum: ['pending', 'paid', 'delivered', 'failed'], default: 'pending' },
  stripeSessionId: { type: String },
  stripePaymentIntentId: { type: String },
  paidAt: { type: Date },
  deliveredAt: { type: Date },
  deliveryEmail: { type: String },
  totalRecords: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 }, // cents
  blockLabel: { type: String, default: '' } // Human-readable label like "Building permits in Chicago, IL"
}, { timestamps: true });

dataPurchaseSchema.index({ userId: 1, status: 1 });
dataPurchaseSchema.index({ stripeSessionId: 1 });

module.exports = mongoose.model('DataPurchase', dataPurchaseSchema);
