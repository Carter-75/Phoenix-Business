const test = require('node:test');
const assert = require('node:assert/strict');
const { 
  calculateProjectPrice, 
  BASE_PROJECTS, 
  FEATURE_ADDONS,
  calculateBundleDiscount,
  PRICING_FLOORS
} = require('../services/pricing.service');

test('calculates standard starter website with setup and monthly fees accurately', () => {
  const result = calculateProjectPrice({
    tier: 'starter',
    totalPages: 3,
    features: [],
    isTestMode: false,
    date: new Date('2026-05-10T12:00:00-05:00') // May 10 -> Evergreen 20% discount
  });

  assert.equal(result.success, true);
  assert.equal(result.tier.id, 'starter');
  assert.equal(result.scope.totalPages, 3);
  assert.equal(result.scope.extraPages, 0);

  // Starter Normal: Setup $1,499 (149900 cents), Monthly $99/mo (9900 cents)
  assert.equal(result.normalPrices.setupSubtotal, 149900);
  assert.equal(result.normalPrices.monthlySubtotal, 9900);

  // 20% Evergreen Discount applied to BOTH:
  // Setup: 149900 * 0.8 = 119920 cents ($1,199.20)
  // Monthly: 9900 * 0.8 = 7920 cents ($79.20/mo)
  assert.equal(result.finalPrices.dueToday, 119920);
  assert.equal(result.finalPrices.monthlyRecurring, 7920);

  // 30-day deferred billing schedule
  assert.equal(result.schedule.trialDays, 30);
  assert.ok(result.schedule.firstMonthlyBillingDate);
  assert.ok(result.schedule.firstMonthlyBillingDisplay);
  assert.equal(result.schedule.commitmentMonths, 12);
});

test('adds extra page charges to setup fee beyond included quota', () => {
  const result = calculateProjectPrice({
    tier: 'business', // 6 pages included, normal setup $2,499
    totalPages: 8,    // 2 extra pages = $300 setup (30000 cents)
    features: [],
    isTestMode: false,
    date: new Date('2026-05-10T12:00:00-05:00') // 20% evergreen promo
  });

  assert.equal(result.scope.totalPages, 8);
  assert.equal(result.scope.extraPages, 2);

  // Normal Setup: 249900 + 30000 = 279900 cents ($2,799.00)
  assert.equal(result.normalPrices.setupSubtotal, 279900);
  
  // 20% promo: 279900 * 0.8 = 223920 cents ($2,239.20)
  assert.equal(result.finalPrices.dueToday, 223920);
});

test('supports add-ons with ONE_TIME, MONTHLY, and BOTH billing types', () => {
  const result = calculateProjectPrice({
    tier: 'starter',
    features: [
      'branding',      // ONE_TIME ($450 setup / $0 mo)
      'priority_sla',  // MONTHLY ($0 setup / $150 mo)
      'ai_assistant'   // BOTH ($900 setup / $50 mo)
    ],
    isTestMode: false,
    date: new Date('2026-05-10T12:00:00-05:00') // 20% promo
  });

  // Verify billing types in returned add-on catalog
  const branding = result.addons.find(a => a.id === 'branding');
  assert.equal(branding.billingType, 'ONE_TIME');
  assert.equal(branding.setupPrice, 45000);
  assert.equal(branding.monthlyPrice, 0);

  const sla = result.addons.find(a => a.id === 'priority_sla');
  assert.equal(sla.billingType, 'MONTHLY');
  assert.equal(sla.setupPrice, 0);
  assert.equal(sla.monthlyPrice, 15000);

  const ai = result.addons.find(a => a.id === 'ai_assistant');
  assert.equal(ai.billingType, 'BOTH');
  assert.equal(ai.setupPrice, 90000);
  assert.equal(ai.monthlyPrice, 5000);

  // 3 add-ons -> qualifies for 5% bundle discount
  assert.equal(result.discounts.bundle.percent, 5);
});

test('applies progressive bundle discounts as add-on count increases', () => {
  assert.equal(calculateBundleDiscount(1).discountPercent, 0);
  assert.equal(calculateBundleDiscount(2).discountPercent, 5);
  assert.equal(calculateBundleDiscount(3).discountPercent, 5);
  assert.equal(calculateBundleDiscount(4).discountPercent, 10);
  assert.equal(calculateBundleDiscount(5).discountPercent, 10);
  assert.equal(calculateBundleDiscount(6).discountPercent, 15);
  assert.equal(calculateBundleDiscount(10).discountPercent, 15);
});

test('inherently includes payments in ecommerce without double billing', () => {
  const result = calculateProjectPrice({
    tier: 'ecommerce',
    features: ['payments', 'branding'],
    isTestMode: false,
    date: new Date('2026-05-10T12:00:00-05:00')
  });

  const payments = result.addons.find(a => a.id === 'payments');
  assert.ok(payments);
  assert.equal(payments.includedInBase, true);
  assert.equal(payments.setupPrice, 0);
  assert.equal(payments.monthlyPrice, 0);
});

test('inherently includes auth and database in webapp without double billing', () => {
  const result = calculateProjectPrice({
    tier: 'webapp',
    features: ['auth', 'database', 'dashboard'],
    isTestMode: false,
    date: new Date('2026-05-10T12:00:00-05:00')
  });

  const auth = result.addons.find(a => a.id === 'auth');
  const db = result.addons.find(a => a.id === 'database');
  const dash = result.addons.find(a => a.id === 'dashboard');

  assert.equal(auth.includedInBase, true);
  assert.equal(auth.setupPrice, 0);
  assert.equal(db.includedInBase, true);
  assert.equal(db.setupPrice, 0);
  assert.equal(dash.includedInBase, true);
  assert.equal(dash.setupPrice, 0);
});

test('enforces pricing floor for setup fee and monthly fee', () => {
  // Even with an aggressive coupon, price cannot drop below floor
  process.env.DC_SUPERVIP = '90'; // 90% off coupon
  const result = calculateProjectPrice({
    tier: 'starter',
    discountCode: 'SUPERVIP',
    isTestMode: false,
    date: new Date('2026-10-15T12:00:00-05:00') // Halloween 35% promo
  });
  delete process.env.DC_SUPERVIP;

  // Maximum allowed combined discount is 50%, and minimum setup floor is $799
  assert.ok(result.finalPrices.dueToday >= PRICING_FLOORS.MIN_SETUP_CENTS);
  assert.ok(result.finalPrices.monthlyRecurring >= PRICING_FLOORS.MIN_MONTHLY_CENTS);
});

test('global seasonal promotion applies to BOTH setup and monthly fees during Halloween', () => {
  const result = calculateProjectPrice({
    tier: 'business',
    totalPages: 6,
    features: [],
    isTestMode: false,
    date: new Date('2026-10-15T12:00:00-05:00') // Halloween 35% promo
  });

  assert.equal(result.discounts.promotion.percent, 35);
  assert.equal(result.discounts.promotion.id, 'halloween');

  // Business Normal: Setup $2,499 (249900 cents), Monthly $199 (19900 cents)
  // 35% savings on Setup: 249900 * 0.35 = 87465 cents -> $1,624.35
  // 35% savings on Monthly: 19900 * 0.35 = 6965 cents -> $129.35/mo
  assert.equal(result.finalPrices.dueToday, 162435);
  assert.equal(result.finalPrices.monthlyRecurring, 12935);
});
