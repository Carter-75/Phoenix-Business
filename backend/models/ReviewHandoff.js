const mongoose = require('mongoose');

// Records that a client went through the website review composer and was
// handed off to Google to post their review there. Reviews themselves live
// ONLY on Google; this log exists so the dashboard can stop listing the
// contract as "unreviewed" and so a handoff can be counted honestly as
// "sent to Google", which is not the same as "posted on Google".
const reviewHandoffSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 0.5, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReviewHandoff', reviewHandoffSchema);
