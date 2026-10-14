const mongoose = require('mongoose');

/**
 * ClientCommsPolicy
 * Shared contract with the cold-emailing system (which writes inbound tagging
 * state to this same collection in the shared MongoDB cluster).
 * One document per client email tracking the Client Communication Policy
 * lifecycle: ok -> warning (5-day cure window) -> archived.
 */
const policyHistorySchema = new mongoose.Schema({
  at: { type: Date, default: Date.now },
  event: { type: String },
  detail: { type: String }
}, { _id: false });

const clientCommsPolicySchema = new mongoose.Schema({
  clientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  status: { type: String, enum: ['ok', 'warning', 'archived'], default: 'ok', index: true },
  requiredWord: { type: String, enum: ['NEW', 'OUTREACH', 'ORDER'] },
  lastInboundAt: { type: Date },
  lastInboundTagged: { type: Boolean },
  warningSentAt: { type: Date },
  warningDeadlineAt: { type: Date },
  triggerReason: { type: String },
  archivedAt: { type: Date },
  feeKeptCents: { type: Number },
  refundCents: { type: Number },
  reviewAnnotated: { type: Boolean, default: false },
  history: { type: [policyHistorySchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('ClientCommsPolicy', clientCommsPolicySchema, 'clientcommspolicies');
