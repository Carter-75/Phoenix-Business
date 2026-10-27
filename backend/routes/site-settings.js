const express = require('express');
const router = express.Router();
const ownerAuth = require('../middleware/owner-auth');
const SiteSettings = require('../models/SiteSettings');

async function getSettingsDoc() {
  let doc = await SiteSettings.findOne({ key: 'global' });
  if (!doc) {
    doc = await SiteSettings.create({ key: 'global' });
  }
  return doc;
}

// @route   GET /api/site-settings
// @desc    Public site settings every visitor's app reads on load.
//          Fails closed: if the setting cannot be read, phoenixes stay off.
router.get('/', async (req, res) => {
  try {
    const doc = await getSettingsDoc();
    res.json({ phoenixesEnabled: !!doc.phoenixesEnabled });
  } catch (err) {
    res.json({ phoenixesEnabled: false });
  }
});

// @route   PATCH /api/site-settings
// @desc    Owner only: flip the master phoenix switch for the whole site.
router.patch('/', ownerAuth, async (req, res) => {
  try {
    const { phoenixesEnabled } = req.body || {};
    if (typeof phoenixesEnabled !== 'boolean') {
      return res.status(400).json({ error: 'phoenixesEnabled must be true or false.' });
    }
    const doc = await getSettingsDoc();
    doc.phoenixesEnabled = phoenixesEnabled;
    await doc.save();
    res.json({ phoenixesEnabled: !!doc.phoenixesEnabled });
  } catch (err) {
    console.error('Error updating site settings:', err);
    res.status(500).json({ error: 'Could not update site settings.' });
  }
});

module.exports = router;
