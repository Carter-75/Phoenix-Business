const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  projectName: { type: String },
  businessName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String },
  adminComment: { type: String },
  dismissedLowRating: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
