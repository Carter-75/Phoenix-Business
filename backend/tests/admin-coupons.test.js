const test = require('node:test');
const assert = require('node:assert/strict');
const ownerAuth = require('../middleware/owner-auth');
const { calculateProjectPrice } = require('../services/pricing.service');
const { 
  getEffectiveCampaigns, 
  setCampaignOverride, 
  clearCampaignOverrides 
} = require('../config/promotions.config');

test('ownerAuth rejects unauthenticated requests with 401', () => {
  let statusSent = null;
  let jsonSent = null;
  const req = {
    isAuthenticated: () => false,
    user: null
  };
  const res = {
    status: (s) => { statusSent = s; return res; },
    json: (j) => { jsonSent = j; }
  };
  const next = () => { assert.fail('next should not be called'); };

  ownerAuth(req, res, next);
  assert.equal(statusSent, 401);
  assert.ok(jsonSent.error);
});

test('ownerAuth rejects non-owner authenticated users with 403', () => {
  let statusSent = null;
  let jsonSent = null;
  const req = {
    isAuthenticated: () => true,
    user: { _id: 'some_other_id', email: 'random.client@gmail.com' }
  };
  const res = {
    set: () => {},
    status: (s) => { statusSent = s; return res; },
    json: (j) => { jsonSent = j; }
  };
  const next = () => { assert.fail('next should not be called'); };

  ownerAuth(req, res, next);
  assert.equal(statusSent, 403);
  assert.ok(jsonSent.error.includes('Access denied'));
});

test('ownerAuth allows hello@phoenixwebsites.ai through to next()', () => {
  let nextCalled = false;
  const req = {
    isAuthenticated: () => true,
    user: { _id: 'owner_user_id', email: 'hello@phoenixwebsites.ai' }
  };
  const res = {
    set: () => {}
  };
  const next = () => { nextCalled = true; };

  ownerAuth(req, res, next);
  assert.equal(nextCalled, true);
});

test('runtime overrides allow owner to safely modify campaign discount and clear them', () => {
  // 1. Modify Halloween campaign
  const updated = setCampaignOverride('halloween', {
    discountPercent: 38,
    bannerText: 'Special Owner Promo Test'
  });
  assert.equal(updated.discountPercent, 38);
  assert.equal(updated.bannerText, 'Special Owner Promo Test');

  // 2. Verify it is reflected in effective campaigns
  const effective = getEffectiveCampaigns().find(c => c.id === 'halloween');
  assert.equal(effective.discountPercent, 38);

  // 3. Reset overrides
  clearCampaignOverrides();
  const resetCampaign = getEffectiveCampaigns().find(c => c.id === 'halloween');
  assert.equal(resetCampaign.discountPercent, 35); // Reverts to code default
});

test('authoritative calculation enforces 50% max combined discount cap across bundle + promo + coupon', () => {
  process.env.DC_VIPMAX = '40'; // 40% coupon
  const result = calculateProjectPrice({
    tier: 'starter',
    features: ['branding', 'ai_assistant', 'sms_notifications', 'file_storage', 'realtime', 'multilingual'], // 6 add-ons -> 15% bundle discount
    discountCode: 'VIPMAX',
    isTestMode: false,
    date: new Date('2026-10-15T12:00:00-05:00') // 35% Halloween promo
  });
  delete process.env.DC_VIPMAX;

  // 15% bundle + 35% promo + 40% coupon would theoretically exceed 70% discount
  // The system clamps total discount to maximum 50% of undiscounted subtotal
  const normalSubtotal = result.normalPrices.setupSubtotal;
  const finalSetup = result.finalPrices.dueToday;
  const totalSetupDiscount = normalSubtotal - finalSetup;
  const maxAllowedDiscount = Math.round(normalSubtotal * 0.50);

  assert.ok(totalSetupDiscount <= maxAllowedDiscount + 1); // allow 1 cent rounding tolerance
  assert.ok(finalSetup >= normalSubtotal * 0.499);
});
