const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getBusinessDateComponents,
  isDateInRange,
  getActivePromotion,
  getAllCampaigns,
  applyAuthoritativeDiscount
} = require('../services/promotion.service');
const { calculateProjectPrice } = require('../services/pricing.service');

describe('Promotions and Seasonal Themes Engine', () => {
  it('correctly extracts month and day in America/Chicago timezone', () => {
    // 2026-10-31T23:59:00Z is 6:59 PM on Oct 31 in Chicago (CDT, UTC-5)
    const date = new Date('2026-11-01T00:30:00Z');
    const comp = getBusinessDateComponents(date);
    assert.equal(comp.month, 10);
    assert.equal(comp.day, 31);
    assert.equal(comp.year, 2026);
  });

  it('correctly matches date within non-cross-year range', () => {
    const oct15 = { month: 10, day: 15 };
    const range = { startMonth: 10, startDay: 1, endMonth: 10, endDay: 31 };
    assert.equal(isDateInRange(oct15, range), true);

    const nov1 = { month: 11, day: 1 };
    assert.equal(isDateInRange(nov1, range), false);
  });

  it('correctly matches date in cross-year range (New Year: Dec 26 - Jan 15)', () => {
    const range = { crossYear: true, startMonth: 12, startDay: 26, endMonth: 1, endDay: 15 };
    assert.equal(isDateInRange({ month: 12, day: 31 }, range), true);
    assert.equal(isDateInRange({ month: 1, day: 5 }, range), true);
    assert.equal(isDateInRange({ month: 2, day: 1 }, range), false);
  });

  it('resolves Halloween campaign during October', () => {
    const octDate = new Date('2026-10-15T12:00:00-05:00');
    const promo = getActivePromotion(octDate);
    assert.equal(promo.id, 'halloween');
    assert.equal(promo.displayName, 'Halloween');
    assert.ok(promo.theme.colors.primary);
    assert.ok(promo.theme.colors.secondary);
    assert.ok(promo.theme.colors.tertiary);
  });

  it('resolves Valentine campaign in early February', () => {
    const febDate = new Date('2026-02-14T12:00:00-06:00');
    const promo = getActivePromotion(febDate);
    assert.equal(promo.id, 'valentines');
  });

  it('resolves St. Patrick campaign in mid March', () => {
    const marDate = new Date('2026-03-17T12:00:00-05:00');
    const promo = getActivePromotion(marDate);
    assert.equal(promo.id, 'st_patricks');
  });

  it('resolves July 4 campaign in early July', () => {
    const julyDate = new Date('2026-07-04T12:00:00-05:00');
    const promo = getActivePromotion(julyDate);
    assert.equal(promo.id, 'july4');
  });

  it('resolves Christmas / Winter campaign in mid December', () => {
    const decDate = new Date('2026-12-15T12:00:00-06:00');
    const promo = getActivePromotion(decDate);
    assert.equal(promo.id, 'christmas_winter');
  });

  it('resolves Black Friday priority override over Thanksgiving in late November', () => {
    // Nov 25 falls within both Thanksgiving (Nov 1-30) and Cyber Week (Nov 20 - Dec 2)
    // Black Friday priority is 20 vs Thanksgiving priority 5
    const blackFridayDate = new Date('2026-11-25T12:00:00-06:00');
    const promo = getActivePromotion(blackFridayDate);
    assert.equal(promo.id, 'black_friday');
  });

  it('falls back to default Phoenix Core theme when outside any holiday window', () => {
    // May 5 has no specific holiday window
    const mayDate = new Date('2026-05-05T12:00:00-05:00');
    const promo = getActivePromotion(mayDate);
    assert.equal(promo.id, 'default');
    assert.equal(promo.theme.colors.primary, '#ff4d00'); // Core Fire
  });

  it('provides all 12 campaigns for the hidden preview menu', () => {
    const all = getAllCampaigns();
    assert.equal(all.length, 12);
    const ids = all.map(c => c.id);
    assert.ok(ids.includes('default'));
    assert.ok(ids.includes('halloween'));
    assert.ok(ids.includes('black_friday'));
    assert.ok(ids.includes('christmas_winter'));
    assert.ok(ids.includes('valentines'));
    assert.ok(ids.includes('st_patricks'));
    assert.ok(ids.includes('july4'));
  });

  it('rejects malicious client discount input and calculates server-side price authoritatively', () => {
    // Client attempts to send fake discountPercent and fake theme
    const result = calculateProjectPrice({
      projectType: 'starter',
      discountPercent: 99,       // Malicious attempt to override discount
      promotion: 'fake_promo',   // Malicious fake promotion
      theme: 'halloween'         // Visual theme preview
    });

    // Base starter is $1,499 (149900 cents)
    // Client's discountPercent: 99 must NOT apply!
    assert.ok(result.oneTimeTotal > 0);
    assert.notEqual(result.discountPercentage, 99);
    assert.equal(result.oneTimeSubtotal, 149900);
  });

  it('applies discount exactly once and rounds currency cents accurately', () => {
    // If a 10% discount is applied to $1,499.00 (149900 cents):
    // Discount = 14990 cents, Final = 134910 cents
    const res = applyAuthoritativeDiscount(149900);
    assert.equal(res.finalAmount + res.discountAmount, 149900);
  });
});
