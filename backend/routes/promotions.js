const express = require('express');
const router = express.Router();
const {
  getActivePromotion,
  getAllCampaigns,
  BUSINESS_TIMEZONE,
  PROPOSED_HALLOWEEN_DISCOUNT,
  HALLOWEEN_DISCOUNT_PERCENT
} = require('../services/promotion.service');

/**
 * GET /api/promotions/active
 * Returns currently active promotion and theme based on America/Chicago date
 */
router.get('/active', (req, res) => {
  const isTestMode = process.env.TEST_MODE === 'true';
  const active = getActivePromotion();
  
  const legacyEnvDiscount = isTestMode ? 0 : parseInt(process.env.DISCOUNT_PERCENTAGE || '0', 10);
  const effectiveDiscount = isTestMode ? 0 : Math.max(active.discountPercent || 0, legacyEnvDiscount);

  res.json({
    success: true,
    timezone: BUSINESS_TIMEZONE,
    promotion: {
      id: active.id,
      name: active.name,
      displayName: active.displayName,
      discountPercent: effectiveDiscount,
      bannerText: active.bannerText,
      ctaText: active.ctaText,
      ctaLink: active.ctaLink,
      theme: active.theme
    },
    meta: {
      proposedHalloweenDiscount: PROPOSED_HALLOWEEN_DISCOUNT,
      configuredHalloweenDiscount: HALLOWEEN_DISCOUNT_PERCENT,
      isProposedActive: HALLOWEEN_DISCOUNT_PERCENT > 0
    }
  });
});

/**
 * GET /api/promotions/all
 * Returns all configured seasonal campaigns for the hidden control menu
 */
router.get('/all', (req, res) => {
  const campaigns = getAllCampaigns();
  res.json({
    success: true,
    timezone: BUSINESS_TIMEZONE,
    campaigns
  });
});

module.exports = router;
