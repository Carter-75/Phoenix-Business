const mongoose = require('mongoose');

// Singleton cache of the Google Business Profile rating and recent reviews,
// refreshed from the Places API (New). Google reviews are read-only data:
// they can be displayed and linked to, never written from here.
const googleReviewCacheSchema = new mongoose.Schema({
  key: { type: String, default: 'google', unique: true },
  rating: { type: Number, default: 0 },
  userRatingCount: { type: Number, default: 0 },
  reviews: [{
    authorName: { type: String },
    rating: { type: Number },
    text: { type: String },
    publishTime: { type: Date },
    _id: false
  }],
  fetchedAt: { type: Date }
});

module.exports = mongoose.model('GoogleReviewCache', googleReviewCacheSchema);
