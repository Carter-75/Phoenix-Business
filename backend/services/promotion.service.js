const {
  BUSINESS_TIMEZONE,
  HOLIDAY_CAMPAIGNS,
  getEffectiveCampaigns
} = require('../config/promotions.config');

/**
 * Extracts month and day in business timezone (America/Chicago)
 * @param {Date} [date=new Date()]
 * @returns {{ month: number, day: number, year: number }} (1-indexed month & day)
 */
function getBusinessDateComponents(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIMEZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '2026', 10);
    return { month, day, year };
  } catch (err) {
    return {
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      year: date.getUTCFullYear()
    };
  }
}

/**
 * Checks if a given month/day falls within a campaign date range
 * @param {{ month: number, day: number }} current
 * @param {object} range
 * @returns {boolean}
 */
function isDateInRange(current, range) {
  if (!range) return false;

  const currentScore = current.month * 100 + current.day;
  const startScore = range.startMonth * 100 + range.startDay;
  const endScore = range.endMonth * 100 + range.endDay;

  if (range.crossYear) {
    // e.g., Dec 26 (1226) through Jan 7 (107)
    return currentScore >= startScore || currentScore <= endScore;
  }

  return currentScore >= startScore && currentScore <= endScore;
}

/**
 * Resolves the active campaign based on date and priority
 * Authoritative: ignores any client-supplied theme name or discount
 * 
 * @param {Date} [date=new Date()]
 * @returns {object} Active holiday campaign
 */
function getActivePromotion(date = new Date()) {
  const current = getBusinessDateComponents(date);
  const campaigns = getEffectiveCampaigns();

  const activeMatches = campaigns.filter(campaign => {
    if (!campaign.enabled) return false;
    if (!campaign.dateRange) return false; // Default has no range
    return isDateInRange(current, campaign.dateRange);
  });

  if (activeMatches.length === 0) {
    return campaigns.find(c => c.id === 'default');
  }

  // Sort by priority descending (highest priority wins)
  activeMatches.sort((a, b) => b.priority - a.priority);
  return activeMatches[0];
}

/**
 * Returns all configured campaigns (safe for client inspection and theme previews)
 */
function getAllCampaigns() {
  return getEffectiveCampaigns().map(c => ({
    id: c.id,
    name: c.name,
    displayName: c.displayName,
    discountPercent: c.discountPercent,
    bannerText: c.bannerText,
    ctaText: c.ctaText,
    ctaLink: c.ctaLink,
    theme: c.theme,
    dateRange: c.dateRange,
    priority: c.priority,
    enabled: c.enabled
  }));
}

/**
 * Applies authoritative promotional discount to an amount in cents
 * Clamps discount between 0 and 100
 * @param {number} amountCents
 * @param {Date} [date=new Date()]
 * @returns {{ finalAmount: number, discountAmount: number, discountPercent: number, promotionId: string, promotionName: string }}
 */
function applyAuthoritativeDiscount(amountCents, date = new Date()) {
  const activePromo = getActivePromotion(date);
  
  // Also check if legacy process.env.DISCOUNT_PERCENTAGE is explicitly set and higher
  const legacyEnvDiscount = process.env.TEST_MODE === 'true' 
    ? 0 
    : parseInt(process.env.DISCOUNT_PERCENTAGE || '0', 10);

  const effectiveDiscountPercent = Math.max(
    0, 
    Math.min(100, Math.max(activePromo.discountPercent || 0, legacyEnvDiscount))
  );

  const discountAmount = Math.round(amountCents * (effectiveDiscountPercent / 100));
  const finalAmount = Math.max(0, amountCents - discountAmount);

  return {
    finalAmount,
    discountAmount,
    discountPercent: effectiveDiscountPercent,
    promotionId: activePromo.id,
    promotionName: activePromo.name
  };
}

module.exports = {
  BUSINESS_TIMEZONE,
  getBusinessDateComponents,
  isDateInRange,
  getActivePromotion,
  getAllCampaigns,
  applyAuthoritativeDiscount
};
