const { test, describe } = require('node:test');
const assert = require('node:assert');
const { HOLIDAY_CAMPAIGNS } = require('../config/promotions.config');
const { calculateProjectPrice, FEATURE_ADDONS } = require('../services/pricing.service');
const { generateOwnerOrderEmail, generateCustomerReceiptEmail } = require('../services/order-email.service');

describe('Pass 4: Phoenix Theme-Aware Names & Colors', () => {
  test('every holiday campaign defines exactly 3 phoenix names and colors', () => {
    assert.strictEqual(HOLIDAY_CAMPAIGNS.length, 12, 'Must have exactly 12 campaigns');
    
    for (const campaign of HOLIDAY_CAMPAIGNS) {
      const theme = campaign.theme;
      assert.ok(theme, `Campaign ${campaign.id} must have a theme`);
      assert.ok(theme.phoenixes, `Campaign ${campaign.id} must define phoenixes set`);
      
      const { phoenix1, phoenix2, phoenix3 } = theme.phoenixes;
      assert.ok(phoenix1 && phoenix1.name && phoenix1.color, `${campaign.id} phoenix1 must have name and color`);
      assert.ok(phoenix2 && phoenix2.name && phoenix2.color, `${campaign.id} phoenix2 must have name and color`);
      assert.ok(phoenix3 && phoenix3.name && phoenix3.color, `${campaign.id} phoenix3 must have name and color`);
      
      // Ensure names are distinct per theme
      assert.notStrictEqual(phoenix1.name, phoenix2.name);
      assert.notStrictEqual(phoenix2.name, phoenix3.name);
      assert.notStrictEqual(phoenix1.name, phoenix3.name);
    }
  });

  test('halloween theme defines Ember, Specter, and Venom phoenix names', () => {
    const halloween = HOLIDAY_CAMPAIGNS.find(c => c.id === 'halloween');
    assert.ok(halloween);
    assert.strictEqual(halloween.theme.phoenixes.phoenix1.name, 'Ember Phoenix');
    assert.strictEqual(halloween.theme.phoenixes.phoenix2.name, 'Specter Phoenix');
    assert.strictEqual(halloween.theme.phoenixes.phoenix3.name, 'Venom Phoenix');
  });

  test('christmas theme defines Holly, Frost, and Solstice phoenix names', () => {
    const xmas = HOLIDAY_CAMPAIGNS.find(c => c.id === 'christmas_winter');
    assert.ok(xmas);
    assert.strictEqual(xmas.theme.phoenixes.phoenix1.name, 'Holly Phoenix');
    assert.strictEqual(xmas.theme.phoenixes.phoenix2.name, 'Frost Phoenix');
    assert.strictEqual(xmas.theme.phoenixes.phoenix3.name, 'Solstice Phoenix');
  });
});

describe('Pass 4: Modular Support Add-Ons & Pricing Engine', () => {
  test('default calculation has no optional support duration selected', () => {
    const res = calculateProjectPrice({
      tier: 'starter',
      features: ['database']
    });

    assert.strictEqual(res.support, null, 'Default support should be null');
    assert.strictEqual(res.schedule.supportDurationMonths, 0);
    assert.strictEqual(res.schedule.websiteCommitmentMonths, 12);
    assert.ok(res.projectBrief.includes('Support: Standard Baseline Included Care'));
  });

  test('6-month support selection calculates correctly', () => {
    const res = calculateProjectPrice({
      tier: 'business',
      features: ['support_6mo'],
      isTestMode: false,
      date: new Date('2026-06-15')
    });

    assert.ok(res.support, 'Support should be populated');
    assert.strictEqual(res.support.id, 'support_6mo');
    assert.strictEqual(res.support.durationMonths, 6);
    assert.strictEqual(res.support.standardMonthlyPrice, 8900);
    assert.ok(res.support.monthlyPrice > 0);
    assert.strictEqual(res.support.setupPrice, 0);
    assert.strictEqual(res.schedule.websiteCommitmentMonths, 12);
    assert.strictEqual(res.schedule.supportDurationMonths, 6);
    assert.ok(res.support.inclusions.length > 0);
    assert.ok(res.support.exclusions.length > 0);
  });

  test('12-month support selection calculates correctly', () => {
    const res = calculateProjectPrice({
      tier: 'business',
      features: ['support_12mo'],
      isTestMode: false
    });

    assert.ok(res.support);
    assert.strictEqual(res.support.id, 'support_12mo');
    assert.strictEqual(res.support.durationMonths, 12);
    assert.strictEqual(res.support.standardMonthlyPrice, 6900);
    assert.ok(res.support.monthlyPrice > 0);
  });

  test('24-month support selection calculates correctly and extends beyond 12-month base website', () => {
    const res = calculateProjectPrice({
      tier: 'ecommerce',
      features: ['support_24mo'],
      isTestMode: false
    });

    assert.ok(res.support);
    assert.strictEqual(res.support.id, 'support_24mo');
    assert.strictEqual(res.support.durationMonths, 24);
    assert.strictEqual(res.support.standardMonthlyPrice, 4900);
    assert.ok(res.support.monthlyPrice > 0);
    assert.strictEqual(res.schedule.websiteCommitmentMonths, 12);
    assert.strictEqual(res.schedule.supportDurationMonths, 24);
  });

  test('enforces mutual exclusivity on support durations: keeps only single selection', () => {
    const res = calculateProjectPrice({
      tier: 'business',
      // User passes contradictory choices simultaneously
      features: ['support_6mo', 'support_12mo', 'support_24mo']
    });

    assert.ok(res.support);
    // Should deduplicate and keep only one support option
    const supportAddonsInList = res.addons.filter(a => a.group === 'support-duration');
    assert.strictEqual(supportAddonsInList.length, 1, 'Only one support duration add-on allowed in list');
    assert.strictEqual(res.support.id, 'support_24mo', 'Keeps single authoritative resolution');
  });

  test('support start and end dates are calculated correctly based on first billing date', () => {
    const testDate = new Date('2026-10-01T12:00:00Z');
    const res = calculateProjectPrice({
      tier: 'starter',
      features: ['support_6mo'],
      date: testDate
    });

    assert.ok(res.support);
    const startDate = new Date(res.support.startDate);
    const endDate = new Date(res.support.endDate);

    // Starts ~30 days post-purchase
    assert.ok(startDate.getTime() > testDate.getTime() + (29 * 24 * 60 * 60 * 1000));
    // Ends ~6 months after start date
    const diffMonths = (endDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
    assert.ok(Math.abs(diffMonths - 6) < 0.2, `Expected approx 6 months, got ${diffMonths}`);
  });
});

describe('Pass 4: Authoritative Order Notification & Customer Receipt Emails', () => {
  test('generates complete owner notification email matching OrderSnapshot totals', () => {
    const mockSnapshot = {
      orderId: 'cs_test_order_12345',
      customerName: 'Alice Johnson',
      customerEmail: 'alice@example.com',
      customerPhone: '+1 (555) 234-5678',
      businessName: 'Johnson Tech LLC',
      tierId: 'business',
      tierName: 'Custom Business Website',
      totalPages: 8,
      extraPages: 2,
      baseSetupCents: 249900,
      baseMonthlyCents: 19900,
      extraPagesSetupCents: 30000,
      selectedAddons: [
        { name: 'User Authentication & Profiles', category: 'development', billingType: 'BOTH', setupCents: 60000, monthlyCents: 3000 },
        { name: 'Managed Database & Custom CRUD Logic', category: 'development', billingType: 'BOTH', setupCents: 80000, monthlyCents: 4000 }
      ],
      addonsSetupSubtotalCents: 140000,
      addonsMonthlySubtotalCents: 7000,
      supportAddon: {
        id: 'support_12mo',
        name: '12-Month Dedicated Care & SLA Coverage',
        durationMonths: 12,
        monthlyCents: 6900,
        setupCents: 0,
        startDate: new Date('2026-11-01'),
        endDate: new Date('2027-11-01'),
        inclusions: [
          'Bi-monthly dependency and framework security upgrades',
          'Automated uptime anomaly investigation',
          'Emergency weekend on-call coverage'
        ],
        exclusions: ['Major architectural redesigns']
      },
      bundleDiscountPercent: 5,
      bundleDiscountSetupCents: 7000,
      bundleDiscountMonthlyCents: 350,
      promotionName: 'Founder Special',
      promotionDiscountPercent: 20,
      promotionDiscountSetupCents: 82580,
      promotionDiscountMonthlyCents: 5310,
      couponCode: 'SAVE10',
      couponDiscountSetupCents: 33032,
      couponDiscountMonthlyCents: 2124,
      finalSetupCents: 297288,
      finalMonthlyCents: 19116,
      dueTodayCents: 297288,
      firstMonthlyBillingDate: new Date('2026-11-01'),
      commitmentMonths: 12,
      termsVersion: 'v4-wisconsin-hardened',
      termsAcceptedAt: new Date('2026-10-01'),
      createdAt: new Date('2026-10-01')
    };

    const email = generateOwnerOrderEmail(mockSnapshot, { id: 'cs_test_order_12345' });

    assert.ok(email.subject.includes('Alice Johnson') || email.subject.includes('Johnson Tech LLC'));
    assert.ok(email.subject.includes('$2,972.88'));
    assert.ok(email.subject.includes('$191.16/mo'));

    // HTML Content assertions
    assert.ok(email.html.includes('cs_test_order_12345'));
    assert.ok(email.html.includes('Alice Johnson'));
    assert.ok(email.html.includes('Johnson Tech LLC'));
    assert.ok(email.html.includes('alice@example.com'));
    assert.ok(email.html.includes('+1 (555) 234-5678'));
    assert.ok(email.html.includes('Custom Business Website'));
    assert.ok(email.html.includes('User Authentication & Profiles'));
    assert.ok(email.html.includes('12-Month Dedicated Care & SLA Coverage'));
    assert.ok(email.html.includes('SAVE10'));
    assert.ok(email.html.includes('$2,972.88'));
    assert.ok(email.html.includes('$191.16/mo'));
    assert.ok(email.html.includes('Wassenaar v. Panos'));
    assert.ok(email.html.includes('07 / Technical Implementation Brief'));

    // Plaintext content assertions
    assert.ok(email.text.includes('Alice Johnson'));
    assert.ok(email.text.includes('$2,972.88'));
    assert.ok(email.text.includes('$191.16/mo'));
    assert.ok(email.text.includes('12-Month Dedicated Care'));
  });

  test('handles zero optional add-ons cleanly without errors', () => {
    const emptySnapshot = {
      orderId: 'cs_empty_123',
      customerName: 'Bob Smith',
      customerEmail: 'bob@example.com',
      tierId: 'starter',
      tierName: 'Starter Launch Website',
      totalPages: 3,
      extraPages: 0,
      baseSetupCents: 149900,
      baseMonthlyCents: 9900,
      extraPagesSetupCents: 0,
      selectedAddons: [],
      addonsSetupSubtotalCents: 0,
      addonsMonthlySubtotalCents: 0,
      supportAddon: null,
      bundleDiscountPercent: 0,
      bundleDiscountSetupCents: 0,
      bundleDiscountMonthlyCents: 0,
      promotionDiscountPercent: 20,
      promotionDiscountSetupCents: 29980,
      promotionDiscountMonthlyCents: 1980,
      finalSetupCents: 119920,
      finalMonthlyCents: 7920,
      dueTodayCents: 119920,
      firstMonthlyBillingDate: new Date('2026-11-01'),
      termsVersion: 'v4-wisconsin-hardened'
    };

    const email = generateOwnerOrderEmail(emptySnapshot);
    assert.ok(email.html.includes('No optional feature add-ons selected'));
    assert.ok(email.html.includes('Standard Baseline Included Care'));
    assert.ok(email.text.includes('No optional feature add-ons selected'));
  });

  test('customer confirmation receipt formats correctly with Wis. Stat. § 134.49 notice', () => {
    const receiptSnapshot = {
      customerName: 'Claire Davis',
      customerEmail: 'claire@example.com',
      tierName: 'Custom Business Website',
      totalPages: 6,
      finalSetupCents: 249900,
      finalMonthlyCents: 19900,
      firstMonthlyBillingDate: new Date('2026-11-01'),
      supportAddon: {
        id: 'support_6mo',
        name: '6-Month Extended Support',
        durationMonths: 6,
        monthlyCents: 8900
      }
    };

    const receipt = generateCustomerReceiptEmail(receiptSnapshot);
    assert.ok(receipt.subject.includes('Payment Confirmation'));
    assert.ok(receipt.html.includes('Claire Davis'));
    assert.ok(receipt.html.includes('$2,499.00'));
    assert.ok(receipt.html.includes('$199.00/mo'));
    assert.ok(receipt.html.includes('6-Month Extended Support'));
    assert.ok(receipt.html.includes('Wis. Stat. § 134.49'));
  });
});
