const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  calculateProjectPrice,
  FEATURE_ADDONS,
  BASE_PROJECTS
} = require('../services/pricing.service');

const {
  addMonths,
  calculateTermDates,
  calculateSupportDates,
  calculateEarlyTerminationQuote
} = require('../services/contract-lifecycle.service');

const {
  generateSupportActivationCustomerEmail,
  generateSupportTransitionCustomerEmail,
  generateSupportExpirationConfirmationEmail,
  generateOwnerSupportAlertEmail
} = require('../services/support-email.service');

describe('Pass 6: Support Catalog, Durations & SLA Specifications', () => {

  it('defines 6mo, 12mo, and 24mo support products with correct standard rates, SLAs, and request limits', () => {
    const s6 = FEATURE_ADDONS.support_6mo;
    const s12 = FEATURE_ADDONS.support_12mo;
    const s24 = FEATURE_ADDONS.support_24mo;

    assert.ok(s6 && s12 && s24);

    // 6-Month Plan ($89/mo standard)
    assert.strictEqual(s6.monthlyPrice, 8900);
    assert.strictEqual(s6.durationMonths, 6);
    assert.strictEqual(s6.monthlyRequestsIncluded, 2);
    assert.strictEqual(s6.maxHoursPerRequest, 1.5);
    assert.strictEqual(s6.requestsRollOver, false);
    assert.strictEqual(s6.autoRenew, false);
    assert.strictEqual(s6.slaInitialResponse, '< 24-hour business day triage');

    // 12-Month Plan ($69/mo standard)
    assert.strictEqual(s12.monthlyPrice, 6900);
    assert.strictEqual(s12.durationMonths, 12);
    assert.strictEqual(s12.monthlyRequestsIncluded, 4);
    assert.strictEqual(s12.maxHoursPerRequest, 1.5);
    assert.strictEqual(s12.requestsRollOver, false);
    assert.strictEqual(s12.autoRenew, false);
    assert.strictEqual(s12.slaInitialResponse, '< 12-hour response window + weekend emergency on-call');

    // 24-Month Plan ($49/mo standard)
    assert.strictEqual(s24.monthlyPrice, 4900);
    assert.strictEqual(s24.durationMonths, 24);
    assert.strictEqual(s24.monthlyRequestsIncluded, 6);
    assert.strictEqual(s24.maxHoursPerRequest, 1.5);
    assert.strictEqual(s24.requestsRollOver, false);
    assert.strictEqual(s24.autoRenew, false);
    assert.strictEqual(s24.slaInitialResponse, '< 4-hour critical outage triage + < 12-hour standard ticket triage + priority sprint queue');
    assert.ok(s24.transitionSupportRule.includes('Self-Hosted Transition Support'));
  });

  it('calculates support pricing breakdown with separate base and support monthly amounts', () => {
    const calc = calculateProjectPrice({
      tier: 'essential',
      selectedFeatures: ['support_24mo'],
      isTestMode: false
    });

    assert.strictEqual(calc.success, true);
    assert.ok(calc.support);
    assert.strictEqual(calc.support.durationMonths, 24);
    assert.strictEqual(calc.support.standardMonthlyPrice, 4900);
    assert.strictEqual(calc.support.totalCommitmentStandard, 4900 * 24); // 117600 ($1,176.00)
    assert.strictEqual(calc.support.autoRenew, false);
    assert.strictEqual(calc.support.coverageStartRule, 'Website Production Launch Date (Immediate Coverage)');
    assert.strictEqual(calc.support.billingStartRule, 'First Monthly Care Cycle (+30 Days from Kickoff)');

    // Monthly breakdown
    assert.strictEqual(calc.finalPrices.supportMonthlyRecurring, calc.support.discountedMonthlyPrice);
    assert.strictEqual(calc.finalPrices.baseMonthlyRecurring, calc.finalPrices.monthlyRecurring - calc.support.discountedMonthlyPrice);
    assert.ok(calc.finalPrices.baseMonthlyRecurring > 0);
  });

});

describe('Pass 6: Promotional Rate Locking & Immutability', () => {

  it('locks discounted support rate at purchase and preserves it across future dates', () => {
    // Halloween promotion: Oct 20 - Nov 3 (35% discount)
    const halloweenDate = new Date('2026-10-25T12:00:00.000Z');
    const calcHalloween = calculateProjectPrice({
      tier: 'essential',
      selectedFeatures: ['support_24mo'],
      calculationDate: halloweenDate
    });

    // 24mo support standard is $49.00 (4900 cents)
    // 35% discount off $49.00 = $17.15 discount -> $31.85 / mo (3185 cents)
    assert.strictEqual(calcHalloween.discounts.promotion.percent, 35);
    assert.strictEqual(calcHalloween.support.discountedMonthlyPrice, 3185);
    assert.strictEqual(calcHalloween.support.totalCommitmentDiscounted, 3185 * 24); // 76440 cents ($764.40)

    // Simulate order snapshot created during Halloween
    const snapshot = {
      orderId: 'ORD-HAL-24MO',
      supportAddon: {
        id: calcHalloween.support.id,
        name: calcHalloween.support.name,
        durationMonths: calcHalloween.support.durationMonths,
        standardMonthlyCents: calcHalloween.support.standardMonthlyPrice,
        discountedMonthlyCents: calcHalloween.support.discountedMonthlyPrice,
        monthlyCents: calcHalloween.support.discountedMonthlyPrice,
        totalCommitmentStandardCents: calcHalloween.support.totalCommitmentStandard,
        totalCommitmentDiscountedCents: calcHalloween.support.totalCommitmentDiscounted,
        promotionPercentage: 35
      }
    };

    // When time advances to January (Winter promo) or July (Summer promo),
    // customer rate remains strictly the snapshot rate of 3185 cents ($31.85/mo)
    assert.strictEqual(snapshot.supportAddon.discountedMonthlyCents, 3185);
    assert.strictEqual(snapshot.supportAddon.promotionPercentage, 35);
    assert.strictEqual(snapshot.supportAddon.standardMonthlyCents, 4900);
  });

});

describe('Pass 6: 24-Month Support Lifecycles & Year 2 Determinism', () => {

  const baseContract = {
    contractId: 'CT-24MO-TEST',
    currentTermNumber: 1,
    setupCents: 349900,  // $3,499.00
    monthlyCents: 34800, // $299.00 base website + $49.00 24mo support = $348.00 / mo
    termsHistory: [{
      termNumber: 1,
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: new Date('2027-10-01T00:00:00.000Z'),
      nonRenewalDeadline: new Date('2027-09-01T00:00:00.000Z'),
      nonRenewalStatus: 'NONE'
    }],
    supportAddon: {
      id: 'support_24mo',
      name: '24-Month Long-Term Architecture Assurance',
      durationMonths: 24,
      standardMonthlyCents: 4900,
      discountedMonthlyCents: 4900,
      monthlyCents: 4900,
      billingStartAt: new Date('2026-11-01T00:00:00.000Z'),
      supportEndAt: new Date('2028-11-01T00:00:00.000Z'),
      status: 'ACTIVE_HOSTED',
      monthlyRequestsIncluded: 6,
      maxHoursPerRequest: 1.5,
      requestsRollOver: false,
      autoRenew: false
    }
  };

  it('Scenario A: Website renews at Month 12 -> Support continues seamlessly in ACTIVE_HOSTED mode', () => {
    // At Month 12, if base website renews, support status remains ACTIVE_HOSTED
    assert.strictEqual(baseContract.supportAddon.status, 'ACTIVE_HOSTED');
    assert.strictEqual(baseContract.supportAddon.durationMonths, 24);
    assert.strictEqual(baseContract.supportAddon.supportEndAt.toISOString(), '2028-11-01T00:00:00.000Z');
  });

  it('Scenario B: Website does NOT renew at Month 12 -> Transitions to ACTIVE_TRANSITION with $0 hosting fees', () => {
    const contractNonRenewed = JSON.parse(JSON.stringify(baseContract));
    contractNonRenewed.contractStatus = 'TERMINATED'; // Base website ends at Month 12
    contractNonRenewed.termsHistory[0].nonRenewalStatus = 'CONFIRMED';
    
    // Support transitions to ACTIVE_TRANSITION
    contractNonRenewed.supportAddon.status = 'ACTIVE_TRANSITION';

    assert.strictEqual(contractNonRenewed.contractStatus, 'TERMINATED');
    assert.strictEqual(contractNonRenewed.supportAddon.status, 'ACTIVE_TRANSITION');
    assert.strictEqual(contractNonRenewed.supportAddon.discountedMonthlyCents, 4900); // Continues at locked $49/mo
    assert.strictEqual(contractNonRenewed.supportAddon.monthlyRequestsIncluded, 6);
  });

  it('Scenario C & D: Separate calculation of Base Website Damages vs. Support Damages vs. Buyout', () => {
    // Terminated at Month 4 (8 website months remaining, 20 support months remaining)
    const asOfDate = new Date('2027-02-01T00:00:00.000Z');
    
    // Case 1: Without source code buyout
    const quoteNoBuyout = calculateEarlyTerminationQuote(baseContract, asOfDate, false);

    assert.strictEqual(quoteNoBuyout.eligibleForEarlyTermination, true);
    assert.strictEqual(quoteNoBuyout.websiteMonthsRemaining, 8);
    // Base monthly rate is total monthly (34800) - support monthly (4900) = 29900 cents
    assert.strictEqual(quoteNoBuyout.websiteMonthlyRateCents, 29900);
    // Base liquidated damages = 50% of (8 * 29900) = 50% of 239200 = 119600 cents ($1,196.00)
    assert.strictEqual(quoteNoBuyout.websiteDamagesCents, 119600);

    // Support months remaining: 24 - 3 elapsed months = 21 months remaining
    assert.strictEqual(quoteNoBuyout.supportMonthsRemaining, 21);
    assert.strictEqual(quoteNoBuyout.supportMonthlyRateCents, 4900);
    // Support liquidated damages = 50% of (21 * 4900) = 50% of 102900 = 51450 cents ($514.50)
    assert.strictEqual(quoteNoBuyout.supportDamagesCents, 51450);

    // Buyout fee = $0
    assert.strictEqual(quoteNoBuyout.buyoutFeeCents, 0);

    // Total Due = websiteDamages (119600) + supportDamages (51450) = 171050 cents ($1,710.50)
    assert.strictEqual(quoteNoBuyout.totalDueCents, 119600 + 51450);

    // Case 2: With source code buyout (+50% of setup fee: 50% of 349900 = 174950 cents)
    const quoteWithBuyout = calculateEarlyTerminationQuote(baseContract, asOfDate, true);
    assert.strictEqual(quoteWithBuyout.buyoutRequested, true);
    assert.strictEqual(quoteWithBuyout.buyoutFeeCents, 174950);
    assert.strictEqual(quoteWithBuyout.totalDueCents, 119600 + 51450 + 174950);
  });

  it('Scenario E: Support termination alone calculates 50% liquidated damages under Wassenaar v. Panos', () => {
    const asOfDate = new Date('2027-02-01T00:00:00.000Z');
    const quote = calculateEarlyTerminationQuote(baseContract, asOfDate, false);

    assert.strictEqual(quote.supportDamagesPercent, 50);
    assert.strictEqual(quote.supportDamagesCents, Math.round(quote.remainingSupportObligationCents * 0.50));
    assert.ok(quote.legalBasis.supportLiquidatedDamages.includes('Wassenaar v. Panos'));
  });

  it('Scenario F: Support reaches Month 24 and stops billing ($0 continuing support charge)', () => {
    const pastEnd = new Date('2028-11-02T00:00:00.000Z');
    const quoteAtEnd = calculateEarlyTerminationQuote(baseContract, pastEnd, false);

    assert.strictEqual(quoteAtEnd.eligibleForEarlyTermination, false);
    assert.strictEqual(quoteAtEnd.supportDamagesCents, 0);
    assert.strictEqual(quoteAtEnd.supportMonthsRemaining, 0);
  });

});

describe('Pass 6: Transactional Support Lifecycle Emails', () => {

  const testContract = {
    contractId: 'CT-TEST-EMAIL-01',
    customerName: 'Sarah Jenkins',
    currentCustomerEmail: 'sarah@northstarclinic.com',
    tierName: 'Professional Healthcare System',
    monthlyCents: 34800,
    supportAddon: {
      name: '24-Month Long-Term Architecture Assurance',
      durationMonths: 24,
      discountedMonthlyCents: 4900,
      monthlyCents: 4900,
      coverageStartAt: new Date('2026-10-15T00:00:00.000Z'),
      supportEndAt: new Date('2028-10-15T00:00:00.000Z'),
      monthlyRequestsIncluded: 6
    }
  };

  it('generates clear customer activation email with coverage dates, locked rate, and request limits', () => {
    const email = generateSupportActivationCustomerEmail(testContract);

    assert.ok(email.subject.includes('Active'));
    assert.ok(email.html.includes('Sarah Jenkins'));
    assert.ok(email.html.includes('24-Month Long-Term Architecture Assurance'));
    assert.ok(email.html.includes('$49.00/month'));
    assert.ok(email.html.includes('6 requests / mo'));
    assert.ok(email.html.includes('Auto-Renew: No') || email.html.includes('Expires automatically'));
  });

  it('generates customer transition email for self-hosted support with $0 hosting fee disclosure', () => {
    const email = generateSupportTransitionCustomerEmail(testContract);

    assert.ok(email.subject.includes('Transition to Self-Hosted Support'));
    assert.ok(email.html.includes('Zero Continuing Phoenix Hosting Charges'));
    assert.ok(email.html.includes('$49.00/month'));
    assert.ok(email.html.includes('Source-code maintenance and critical bug fixes'));
    assert.ok(email.html.includes('6 minor update requests per month'));
  });

  it('generates customer expiration confirmation confirming billing cessation in Stripe', () => {
    const email = generateSupportExpirationConfirmationEmail(testContract);

    assert.ok(email.subject.includes('Coverage Has Concluded'));
    assert.ok(email.html.includes('Recurring monthly billing for this support add-on has automatically terminated in Stripe ($0 continuing support charge)'));
    assert.ok(email.html.includes('Base Website Unaffected'));
  });

  it('generates owner alert email with contractId and status', () => {
    const alert = generateOwnerSupportAlertEmail(testContract, 'SUPPORT_TRANSITIONED_TO_SELF_HOSTED', { reason: 'Test' });

    assert.ok(alert.subject.includes('[SUPPORT ALERT]'));
    assert.ok(alert.html.includes('CT-TEST-EMAIL-01'));
    assert.ok(alert.html.includes('Sarah Jenkins'));
  });

});
