const mongoose = require('mongoose');

// Singleton site-wide settings (one document, key 'global').
// phoenixesEnabled is the master switch for the animated phoenix
// background birds. It defaults to OFF: the phoenixes do not show
// for anyone until the owner turns them on from the dashboard.
const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  phoenixesEnabled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
