const mongoose = require('mongoose');

/**
 * Singleton state for the group buy rotation: the shuffled order of
 * preset keys for the current cycle, where we are in it, whether
 * auto-opening is enabled, and when the next event may appear.
 */
const groupBuyRotationSchema = new mongoose.Schema({
  key: { type: String, default: 'singleton', unique: true },
  enabled: { type: Boolean, default: true },
  order: [{ type: String }],
  nextIndex: { type: Number, default: 0 },
  nextOpenAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('GroupBuyRotation', groupBuyRotationSchema);
