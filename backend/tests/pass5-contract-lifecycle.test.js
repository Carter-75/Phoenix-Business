const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  addMonths,
  calculateTermDates,
  calculateSupportDates,
  calculateEarlyTerminationQuote
} = require('../services/contract-lifecycle.service');
const {
  generateStatutoryRenewalNoticeEmail,
  generateOwnerEscalationEmail
} = require('../services/renewal-scheduler.service');

describe('Pass 5: Contract Lifecycle Date Math & Wisconsin Statutory Calculations', () => {

  it('calculates exactly 12-month calendar anniversary for standard term', () => {
    const start = new Date('2026-10-03T00:00:00.000Z');
    const term = calculateTermDates(start, 12, 30);

    assert.strictEqual(term.startDate.toISOString(), '2026-10-03T00:00:00.000Z');
    // 12 months from Oct 3, 2026 is Oct 3, 2027
    assert.strictEqual(term.endDate.getUTCFullYear(), 2027);
    assert.strictEqual(term.endDate.getUTCMonth(), 9); // October is month index 9
    assert.strictEqual(term.endDate.getUTCDate(), 3);

    // Non-renewal deadline is 30 days prior to term end
    const expectedDeadline = new Date(term.endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    assert.strictEqual(term.nonRenewalDeadline.toISOString(), expectedDeadline.toISOString());

    // Wis. Stat. § 134.49: Window starts 60 days before deadline, ends 15 days before deadline
    const expectedWinStart = new Date(expectedDeadline.getTime() - (60 * 24 * 60 * 60 * 1000));
    const expectedWinEnd = new Date(expectedDeadline.getTime() - (15 * 24 * 60 * 60 * 1000));

    assert.strictEqual(term.reminderWindowStart.toISOString(), expectedWinStart.toISOString());
    assert.strictEqual(term.reminderWindowEnd.toISOString(), expectedWinEnd.toISOString());

    // Window duration is exactly 45 days (60 - 15)
    const windowDays = (term.reminderWindowEnd.getTime() - term.reminderWindowStart.getTime()) / (1000 * 60 * 60 * 24);
    assert.strictEqual(windowDays, 45);
  });

  it('handles leap-year purchase dates correctly without date overflow (Feb 29 -> Feb 28)', () => {
    // 2028 is a leap year; Feb 29, 2028 + 12 months -> Feb 28, 2029 (non-leap year)
    const leapStart = new Date('2028-02-29T12:00:00.000Z');
    const term = calculateTermDates(leapStart, 12, 30);

    assert.strictEqual(term.endDate.getUTCFullYear(), 2029);
    assert.strictEqual(term.endDate.getUTCMonth(), 1); // February
    assert.strictEqual(term.endDate.getUTCDate(), 28); // Clamped cleanly to Feb 28
  });

  it('clamps month-end dates correctly when adding 6 months (Aug 31 -> Feb 28)', () => {
    const aug31 = new Date('2026-08-31T00:00:00.000Z');
    const plus6 = addMonths(aug31, 6);

    assert.strictEqual(plus6.getUTCFullYear(), 2027);
    assert.strictEqual(plus6.getUTCMonth(), 1); // February
    assert.strictEqual(plus6.getUTCDate(), 28); // Clamped to Feb 28 in non-leap year
  });

  it('calculates support add-on start and end dates', () => {
    const billingStart = new Date('2026-11-02T00:00:00.000Z');
    
    const s6 = calculateSupportDates(billingStart, 6);
    assert.strictEqual(s6.endDate.toISOString(), '2027-05-02T00:00:00.000Z');

    const s12 = calculateSupportDates(billingStart, 12);
    assert.strictEqual(s12.endDate.toISOString(), '2027-11-02T00:00:00.000Z');

    const s24 = calculateSupportDates(billingStart, 24);
    assert.strictEqual(s24.endDate.toISOString(), '2028-11-02T00:00:00.000Z');
  });
});

describe('Pass 5: Early Termination Liquidated Damages vs. Buyout Separation', () => {

  const sampleContract = {
    contractId: 'CT-ord_test_01',
    currentTermNumber: 1,
    setupCents: 349900,  // $3,499.00
    monthlyCents: 29900, // $299.00 / month
    termsHistory: [{
      termNumber: 1,
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: new Date('2027-10-01T00:00:00.000Z'),
      nonRenewalDeadline: new Date('2027-09-01T00:00:00.000Z')
    }]
  };

  it('calculates 50% early termination damages accurately at Month 4 (8 months remaining)', () => {
    // 4 months elapsed (Feb 1, 2027) -> 8 months remaining
    const refDate = new Date('2027-02-01T00:00:00.000Z');
    const quote = calculateEarlyTerminationQuote(sampleContract, refDate, false);

    assert.strictEqual(quote.eligibleForEarlyTermination, true);
    assert.strictEqual(quote.monthsRemaining, 8);
    assert.strictEqual(quote.remainingMonthlyObligationCents, 8 * 29900); // $2,392.00 (239200 cents)
    
    // Liquidated damages = 50% of 239200 = 119600 cents ($1,196.00)
    assert.strictEqual(quote.liquidatedDamagesCents, 119600);
    assert.strictEqual(quote.buyoutRequested, false);
    assert.strictEqual(quote.buyoutFeeCents, 0);
    assert.strictEqual(quote.totalDueCents, 119600);
  });

  it('includes 50% setup fee buyout as separate consideration when requested', () => {
    const refDate = new Date('2027-02-01T00:00:00.000Z');
    const quote = calculateEarlyTerminationQuote(sampleContract, refDate, true);

    assert.strictEqual(quote.liquidatedDamagesCents, 119600); // $1,196.00
    // Buyout = 50% of $3,499.00 setup fee = $1,749.50 (174950 cents)
    assert.strictEqual(quote.buyoutRequested, true);
    assert.strictEqual(quote.buyoutFeeCents, 174950);
    // Total settlement = $1,196.00 + $1,749.50 = $2,945.50 (294550 cents)
    assert.strictEqual(quote.totalDueCents, 119600 + 174950);
  });

  it('returns ineligible if contract term has already expired', () => {
    const pastDate = new Date('2027-10-15T00:00:00.000Z');
    const quote = calculateEarlyTerminationQuote(sampleContract, pastDate, false);

    assert.strictEqual(quote.eligibleForEarlyTermination, false);
    assert.strictEqual(quote.totalDueCents, 0);
  });
});

describe('Pass 5: Statutory Renewal Email Templates & Owner Alert Generation', () => {

  const contract = {
    contractId: 'CT-ord_998877',
    customerName: 'Sarah Jenkins',
    currentCustomerEmail: 'sarah@midwestlogistics.com',
    tierName: 'Business Growth Engine',
    monthlyCents: 29900
  };

  const term = {
    endDate: new Date('2027-10-01T00:00:00.000Z'),
    nonRenewalDeadline: new Date('2027-09-01T00:00:00.000Z'),
    reminderWindowEnd: new Date('2027-08-17T00:00:00.000Z')
  };

  it('generates statutory renewal notice complying with Wis. Stat. § 134.49(3)', () => {
    const email = generateStatutoryRenewalNoticeEmail(contract, term);

    assert.match(email.subject, /Statutory Notice: Upcoming Annual Renewal/);
    assert.match(email.html, /Wis\. Stat\. § 134\.49/);
    assert.match(email.html, /\$299\.00 \/ month/);
    assert.match(email.html, /Price Lock/);
    assert.match(email.html, /hello@phoenixwebsites\.ai/);
    assert.match(email.html, /Submit Non-Renewal Request/);
    assert.match(email.text, /CURRENT TERM EXPIRATION/);
    assert.match(email.text, /NON-RENEWAL DEADLINE/);
  });

  it('generates high-priority owner escalation alert when delivery repeatedly fails', () => {
    const alert = generateOwnerEscalationEmail(contract, term, 3, 'SMTP 550 Mailbox unavailable');

    assert.match(alert.subject, /ACTION REQUIRED — RENEWAL NOTICE DELIVERY FAILURE/);
    assert.match(alert.html, /CRITICAL: Statutory Renewal Notice Delivery Failure/);
    assert.match(alert.html, /sarah@midwestlogistics\.com/);
    assert.match(alert.html, /SMTP 550 Mailbox unavailable/);
    assert.match(alert.html, /Wis\. Stat\. § 134\.49/);
    assert.match(alert.text, /ACTION REQUIRED/);
  });
});
