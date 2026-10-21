/**
 * Public offer status endpoints.
 *
 * GET /api/offers/first5
 * Live spot counter for the outreach first-5 offer, so the signup
 * page (and anyone checking) can show how many of the 5 free spots
 * remain. Read-only; issuing happens at signup in the auth routes.
 */
const express = require('express');
const router = express.Router();
const offer = require('../services/outreach-offer.service');

router.get('/first5', async (req, res) => {
  try {
    const claimed = await offer.issuedCount();
    res.json({
      success: true,
      total: offer.MAX_CODES,
      claimed,
      remaining: Math.max(0, offer.MAX_CODES - claimed)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load offer status.' });
  }
});

module.exports = router;
