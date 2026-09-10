const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 120 },
  email: { type: String, required: true, maxlength: 254 },
  businessName: { type: String, maxlength: 200 },
  website: { type: String, maxlength: 500 },
  message: { type: String, maxlength: 5000 },
  attribution: { utm_source: String, utm_medium: String, utm_campaign: String, utm_content: String },
  stage: { type: String, enum: ['new', 'qualified', 'call_booked', 'proposal', 'won', 'lost'], default: 'new' },
  nextAction: { type: String, maxlength: 1000, default: 'Review request and prepare audit' },
  nextActionAt: Date,
  notification: { type: String, enum: ['pending', 'sent'], default: 'pending' }
}, { timestamps: true });
schema.index({ stage: 1, createdAt: -1 });
// Separate collection: inbound requests must never enter a cold sending queue.
module.exports = mongoose.model('AuditRequest', schema);
