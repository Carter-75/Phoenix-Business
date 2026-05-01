const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  businessName: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'emailed', 'replied', 'unsubscribed'], 
    default: 'pending' 
  },
  lastEmailedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },

  // Source tag — identifies this as a portfolio outreach lead in the shared MongoDB.
  source: { type: String, default: 'portfolio' },

  // Message Thread — same shape as engine leads so the dashboard can display & reply
  messageIds: [String],
  thread: [{
    from: String,
    to: String,
    subject: String,
    body: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Lead', LeadSchema);

