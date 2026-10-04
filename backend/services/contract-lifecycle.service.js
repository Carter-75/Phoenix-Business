/**
 * Contract Lifecycle Service
 * Authoritative date calculations, state machine transitions, support add-on lifecycles, and termination quotes
 * Strictly compliant with Wis. Stat. § 134.49 (Business Contracts; Automatic Renewal)
 * and Wassenaar v. Panos (111 Wis. 2d 518) liquidated damages standards.
 */

const ContractLifecycle = require('../models/ContractLifecycle');
const nodemailer = require('nodemailer');

function getEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtppro.zoho.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/**
 * Add calendar months to a Date, properly clamping end-of-month and leap years.
 * @param {Date} date - Source date
 * @param {number} months - Number of months to add
 * @returns {Date} New Date clamped to valid calendar day
 */
function addMonths(date, months) {
  const d = new Date(date);
  const targetMonth = d.getUTCMonth() + months;
  const originalDay = d.getUTCDate();
  
  d.setUTCMonth(targetMonth);
  
  // If date overflowed to next month (e.g. Feb 31 -> Mar 3 or Feb 29 in non-leap year -> Mar 1),
  // clamp back to last day of intended target month.
  if (d.getUTCDate() !== originalDay) {
    d.setUTCDate(0); // Sets to last day of previous month
  }
  return d;
}

/**
 * Calculate authoritative term dates for a contract term
 * Compliant with Wis. Stat. § 134.49(3)
 * @param {Date|string} startDate - Start of the term
 * @param {number} termMonths - Length of the term (default 12)
 * @param {number} noticeDays - Customer non-renewal notice requirement (default 30 days)
 * @returns {Object} Calculated dates
 */
function calculateTermDates(startDate, termMonths = 12, noticeDays = 30) {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start date provided for contract term calculation');
  }

  // 1. Anniversary Date: Exactly termMonths later
  const endDate = addMonths(start, termMonths);

  // 2. Non-Renewal Deadline: Customer must notify seller at least noticeDays prior to expiration
  const nonRenewalDeadline = new Date(endDate.getTime() - (noticeDays * 24 * 60 * 60 * 1000));

  // 3. Wisconsin Statutory Reminder Window under Wis. Stat. § 134.49(3)(a):
  // "no more than 60 days and no less than 15 days before the date on which the customer
  // must provide notice to the seller of the customer's intention not to renew"
  const reminderWindowStart = new Date(nonRenewalDeadline.getTime() - (60 * 24 * 60 * 60 * 1000));
  const reminderWindowEnd = new Date(nonRenewalDeadline.getTime() - (15 * 24 * 60 * 60 * 1000));

  // 4. Target Scheduled Dispatch Date: Midpoint of the statutory window (35 days before non-renewal deadline)
  // Ensures maximum buffer against temporary transmission hiccups or retry queues
  const reminderScheduledDate = new Date(nonRenewalDeadline.getTime() - (35 * 24 * 60 * 60 * 1000));

  return {
    startDate: start,
    endDate,
    nonRenewalDeadline,
    reminderWindowStart,
    reminderWindowEnd,
    reminderScheduledDate
  };
}

/**
 * Calculate support add-on lifecycle dates
 * @param {Date|string} billingStartDate - First monthly recurring billing date (+30 days after kickoff)
 * @param {number} durationMonths - 6, 12, or 24
 * @returns {Object} Start and end dates
 */
function calculateSupportDates(billingStartDate, durationMonths) {
  if (!durationMonths || durationMonths <= 0) {
    return { startDate: null, endDate: null, durationMonths: 0 };
  }
  const start = new Date(billingStartDate);
  const end = addMonths(start, durationMonths);
  return {
    startDate: start,
    endDate: end,
    durationMonths
  };
}

/**
 * Authoritative Early Termination Quote Calculator
 * Strictly separates:
 * 1. Base Website Liquidated Damages (50% of remaining monthly fees) under Wassenaar v. Panos
 * 2. Support Add-on Liquidated Damages (50% of remaining monthly support commitment)
 * 3. Source code / intellectual property buyout fee (50% of setup fee) as separate consideration
 * 
 * @param {Object} contract - ContractLifecycle document or plain object
 * @param {Date} [asOfDate=new Date()] - Reference date for calculation
 * @param {boolean} [includeBuyout=false] - Whether customer requests source code buyout
 * @returns {Object} Authoritative quote breakdown
 */
function calculateEarlyTerminationQuote(contract, asOfDate = new Date(), includeBuyout = false) {
  const currentTermNum = contract.currentTermNumber || 1;
  const currentTerm = (contract.termsHistory || []).find(t => t.termNumber === currentTermNum)
    || (contract.termsHistory && contract.termsHistory[0]);

  if (!currentTerm) {
    throw new Error('No active contractual term found for early termination calculation');
  }

  const termStart = new Date(currentTerm.startDate);
  const termEnd = new Date(currentTerm.endDate);
  const refDate = new Date(asOfDate);

  if (refDate >= termEnd) {
    return {
      eligibleForEarlyTermination: false,
      reason: 'Contract term has already expired or reached scheduled completion.',
      websiteMonthsRemaining: 0,
      websiteDamagesCents: 0,
      liquidatedDamagesCents: 0,
      supportMonthsRemaining: 0,
      supportDamagesCents: 0,
      buyoutFeeCents: 0,
      totalDueCents: 0
    };
  }

  // Calculate elapsed whole months from termStart for Base Website
  let monthsElapsed = (refDate.getUTCFullYear() - termStart.getUTCFullYear()) * 12 + (refDate.getUTCMonth() - termStart.getUTCMonth());
  if (refDate.getUTCDate() < termStart.getUTCDate()) {
    monthsElapsed = Math.max(0, monthsElapsed - 1);
  }
  monthsElapsed = Math.max(0, monthsElapsed);

  const totalTermMonths = 12;
  const websiteMonthsRemaining = Math.max(1, Math.min(totalTermMonths, totalTermMonths - monthsElapsed));

  // Determine base website monthly portion vs support monthly portion
  const support = contract.supportAddon || {};
  const supportMonthlyCents = (support.discountedMonthlyCents || support.monthlyCents || 0);
  const totalMonthlyCents = contract.monthlyCents || 0;
  const websiteMonthlyCents = Math.max(0, totalMonthlyCents - supportMonthlyCents);
  const setupCents = contract.setupCents || 0;

  // 1. Base Website Liquidated Damages: 50% of remaining monthly fees in current 12-month term
  const remainingWebsiteObligationCents = websiteMonthsRemaining * websiteMonthlyCents;
  const websiteDamagesCents = Math.round(remainingWebsiteObligationCents * 0.50);

  // 2. Support Add-On Liquidated Damages: 50% of remaining monthly support fees
  let supportMonthsRemaining = 0;
  let supportDamagesCents = 0;
  let remainingSupportObligationCents = 0;

  const activeSupportStates = ['ACTIVE_HOSTED', 'ACTIVE_TRANSITION', 'ACTIVE', 'PENDING_ACTIVATION', 'EXPIRING'];
  if (support.durationMonths > 0 && activeSupportStates.includes(support.status)) {
    const supportStart = new Date(support.billingStartAt || support.startDate || termStart);
    const supportEnd = new Date(support.supportEndAt || support.endDate || addMonths(supportStart, support.durationMonths));
    
    if (refDate < supportEnd) {
      let suppElapsed = (refDate.getUTCFullYear() - supportStart.getUTCFullYear()) * 12 + (refDate.getUTCMonth() - supportStart.getUTCMonth());
      if (refDate.getUTCDate() < supportStart.getUTCDate()) {
        suppElapsed = Math.max(0, suppElapsed - 1);
      }
      suppElapsed = Math.max(0, suppElapsed);
      supportMonthsRemaining = Math.max(1, Math.min(support.durationMonths, support.durationMonths - suppElapsed));
      remainingSupportObligationCents = supportMonthsRemaining * supportMonthlyCents;
      supportDamagesCents = Math.round(remainingSupportObligationCents * 0.50);
    }
  }

  // 3. Buyout Fee: Consideration for IP/source code transfer (50% of setup fee)
  const buyoutFeeCents = includeBuyout ? Math.round(setupCents * 0.50) : 0;

  const totalDueCents = websiteDamagesCents + supportDamagesCents + buyoutFeeCents;

  return {
    eligibleForEarlyTermination: true,
    termNumber: currentTermNum,
    termStartDate: termStart,
    termEndDate: termEnd,
    calculationDate: refDate,
    websiteMonthsElapsed: monthsElapsed,
    websiteMonthsRemaining,
    monthsRemaining: websiteMonthsRemaining, // backwards compatibility alias for Pass 5
    websiteMonthlyRateCents: websiteMonthlyCents,
    monthlyRateCents: websiteMonthlyCents, // backwards compatibility alias for Pass 5
    remainingWebsiteObligationCents,
    remainingMonthlyObligationCents: remainingWebsiteObligationCents, // backwards compatibility alias for Pass 5
    websiteDamagesPercent: 50,
    websiteDamagesCents,
    liquidatedDamagesCents: websiteDamagesCents, // backwards compatibility alias

    supportPlanName: support.name || null,
    supportDurationMonths: support.durationMonths || 0,
    supportStatus: support.status || 'NONE',
    supportMonthlyRateCents: supportMonthlyCents,
    supportMonthsRemaining,
    remainingSupportObligationCents,
    supportDamagesPercent: 50,
    supportDamagesCents,

    buyoutRequested: Boolean(includeBuyout),
    buyoutFeeCents,
    totalDueCents,
    effectiveTerminationDate: refDate,
    legalBasis: {
      websiteLiquidatedDamages: 'Wis. Sup. Ct. Wassenaar v. Panos (111 Wis. 2d 518) reasonableness standard; compensates for reserved developer capacity minus avoided variable hosting overhead.',
      supportLiquidatedDamages: 'Wis. Sup. Ct. Wassenaar v. Panos reasonableness standard; compensates for reserved engineering standby SLA capacity and discount recapture minus avoided infrastructure execution.',
      buyout: 'Contractual consideration for assignment of full Git repository, uncompiled source-code license, and proprietary asset detachment.'
    }
  };
}

/**
 * Initialize a new ContractLifecycle record from an OrderSnapshot and Stripe Session
 * @param {Object} orderSnapshot - Authoritative OrderSnapshot document
 * @param {Object} stripeSession - Stripe checkout session object
 * @returns {Promise<ContractLifecycle>} Created ContractLifecycle document
 */
async function initializeContractFromOrder(orderSnapshot, stripeSession = {}) {
  const contractId = `CT-${orderSnapshot.orderId}`;
  
  // Check if already created (idempotent webhook processing)
  const existing = await ContractLifecycle.findOne({ contractId });
  if (existing) {
    return existing;
  }

  const startDate = new Date(orderSnapshot.termsAcceptedAt || Date.now());
  const term1 = calculateTermDates(startDate, 12, 30);

  const termHistoryEntry = {
    termNumber: 1,
    startDate: term1.startDate,
    endDate: term1.endDate,
    nonRenewalDeadline: term1.nonRenewalDeadline,
    reminderWindowStart: term1.reminderWindowStart,
    reminderWindowEnd: term1.reminderWindowEnd,
    reminderScheduledDate: term1.reminderScheduledDate,
    reminderStatus: 'PENDING',
    reminderAttemptCount: 0,
    nonRenewalStatus: 'NONE',
    termsVersion: orderSnapshot.termsVersion || '2026.5-WI'
  };

  // Support Add-on Tracking (Independent lifecycle from base contract)
  let supportData = { status: 'NONE' };
  const hasSupport = orderSnapshot.supportAddon && orderSnapshot.supportAddon.durationMonths > 0;
  
  if (hasSupport) {
    const sAddon = orderSnapshot.supportAddon;
    const billingStart = orderSnapshot.firstMonthlyBillingDate || addMonths(startDate, 1);
    const supportDates = calculateSupportDates(billingStart, sAddon.durationMonths);

    // Initial state before launch: PENDING_ACTIVATION
    const isLaunched = Boolean(orderSnapshot.websiteLaunchedAt);
    const initialSupportStatus = isLaunched ? 'ACTIVE_HOSTED' : 'PENDING_ACTIVATION';

    supportData = {
      id: sAddon.id,
      name: sAddon.name,
      durationMonths: sAddon.durationMonths,
      standardMonthlyCents: sAddon.standardMonthlyCents || sAddon.monthlyCents || 0,
      discountedMonthlyCents: sAddon.discountedMonthlyCents || sAddon.monthlyCents || 0,
      monthlyCents: sAddon.discountedMonthlyCents || sAddon.monthlyCents || 0,
      promotionPercentage: sAddon.promotionPercentage || 0,
      totalCommitmentStandardCents: sAddon.totalCommitmentStandardCents || 0,
      totalCommitmentDiscountedCents: sAddon.totalCommitmentDiscountedCents || 0,
      coverageStartAt: isLaunched ? new Date(orderSnapshot.websiteLaunchedAt) : null,
      billingStartAt: billingStart,
      startDate: billingStart,
      supportEndAt: supportDates.endDate,
      endDate: supportDates.endDate,
      status: initialSupportStatus,
      stripeSubscriptionItemId: stripeSession.supportItemId || null,
      monthlyRequestsIncluded: sAddon.monthlyRequestsIncluded || (sAddon.durationMonths === 6 ? 2 : sAddon.durationMonths === 12 ? 4 : 6),
      maxHoursPerRequest: sAddon.maxHoursPerRequest || 1.5,
      requestsUsedThisCycle: 0,
      cycleResetAt: billingStart,
      requestsRollOver: false,
      slaInitialResponse: sAddon.slaInitialResponse || '< 24-hour triage',
      transitionSupportRule: sAddon.transitionSupportRule || null,
      inclusions: sAddon.inclusions || [],
      exclusions: sAddon.exclusions || []
    };
  }

  const auditEvents = [{
    timestamp: new Date(),
    eventType: 'CONTRACT_CREATED',
    actor: 'STRIPE_WEBHOOK',
    details: {
      orderId: orderSnapshot.orderId,
      tier: orderSnapshot.tierName,
      term1End: term1.endDate,
      nonRenewalDeadline: term1.nonRenewalDeadline,
      reminderWindow: `${term1.reminderWindowStart.toISOString().split('T')[0]} to ${term1.reminderWindowEnd.toISOString().split('T')[0]}`
    }
  }];

  if (hasSupport) {
    auditEvents.push({
      timestamp: new Date(),
      eventType: 'SUPPORT_PURCHASED',
      actor: 'CUSTOMER',
      details: {
        plan: supportData.name,
        durationMonths: supportData.durationMonths,
        standardRate: supportData.standardMonthlyCents,
        lockedRate: supportData.discountedMonthlyCents,
        status: supportData.status
      }
    });
  }

  const newContract = new ContractLifecycle({
    contractId,
    orderSnapshotId: orderSnapshot.orderId,
    userId: orderSnapshot.userId,
    initialCustomerEmail: orderSnapshot.customerEmail,
    currentCustomerEmail: orderSnapshot.customerEmail,
    customerName: orderSnapshot.customerName,
    customerPhone: orderSnapshot.customerPhone,
    businessName: orderSnapshot.businessName,
    stripeCustomerId: stripeSession.customer || orderSnapshot.stripeCustomerId,
    stripeSubscriptionId: stripeSession.subscription || orderSnapshot.stripeSubscriptionId,
    tierId: orderSnapshot.tierId,
    tierName: orderSnapshot.tierName,
    setupCents: orderSnapshot.finalSetupCents,
    monthlyCents: orderSnapshot.finalMonthlyCents,
    priceLocked: true,
    contractStatus: 'ACTIVE',
    currentTermNumber: 1,
    termsHistory: [termHistoryEntry],
    websiteLaunchedAt: orderSnapshot.websiteLaunchedAt || null,
    supportAddon: supportData,
    termsVersion: orderSnapshot.termsVersion || '2026.5-WI',
    termsAcceptedAt: startDate,
    auditLog: auditEvents
  });

  return await newContract.save();
}

/**
 * Activate support upon production website launch
 * Sets websiteLaunchedAt, activates supportAddon to ACTIVE_HOSTED, and notifies customer
 * @param {string} contractId 
 * @param {Date} [launchedAt=new Date()]
 * @param {string} [actor='OWNER_ADMIN']
 */
async function activateSupportOnLaunch(contractId, launchedAt = new Date(), actor = 'OWNER_ADMIN') {
  const contract = await ContractLifecycle.findOne({ contractId });
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  contract.websiteLaunchedAt = launchedAt;

  if (contract.supportAddon && contract.supportAddon.durationMonths > 0) {
    contract.supportAddon.status = 'ACTIVE_HOSTED';
    contract.supportAddon.coverageStartAt = launchedAt;

    contract.auditLog.push({
      timestamp: new Date(),
      eventType: 'SUPPORT_ACTIVATED',
      actor,
      details: {
        websiteLaunchedAt: launchedAt,
        coverageStartAt: launchedAt,
        supportEndAt: contract.supportAddon.supportEndAt || contract.supportAddon.endDate
      }
    });

    // Send customer activation email
    try {
      const { generateSupportActivationCustomerEmail, generateOwnerSupportAlertEmail } = require('./support-email.service');
      const emailData = generateSupportActivationCustomerEmail(contract);
      const transporter = getEmailTransporter();

      await transporter.sendMail({
        from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
        to: contract.currentCustomerEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      const ownerAlert = generateOwnerSupportAlertEmail(contract, 'SUPPORT_ACTIVATED', { launchedAt });
      await transporter.sendMail({
        from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: ownerAlert.subject,
        html: ownerAlert.html,
        text: ownerAlert.text
      });
    } catch (mailErr) {
      console.error('[CONTRACT-LIFECYCLE] Support activation email error:', mailErr.message);
    }
  }

  return await contract.save();
}

/**
 * Transition 24-month support add-on to Self-Hosted Support
 * Triggered when base website agreement non-renews at Month 12 or client buys out early
 * @param {string} contractId
 * @param {string} [actor='SYSTEM']
 * @param {string} [notes='']
 */
async function transitionSupportToSelfHosted(contractId, actor = 'SYSTEM', notes = '') {
  const contract = await ContractLifecycle.findOne({ contractId });
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  if (!contract.supportAddon || contract.supportAddon.durationMonths !== 24) {
    throw new Error('Only 24-month support commitments transition into self-hosted transition support.');
  }

  contract.supportAddon.status = 'ACTIVE_TRANSITION';

  contract.auditLog.push({
    timestamp: new Date(),
    eventType: 'SUPPORT_TRANSITIONED_TO_SELF_HOSTED',
    actor,
    details: {
      reason: 'Base website agreement non-renewal or buyout transition',
      supportEndAt: contract.supportAddon.supportEndAt || contract.supportAddon.endDate,
      lockedMonthlyRate: contract.supportAddon.discountedMonthlyCents || contract.supportAddon.monthlyCents,
      notes
    }
  });

  // Send Customer Transition Email and Owner Notification
  try {
    const { generateSupportTransitionCustomerEmail, generateOwnerSupportAlertEmail } = require('./support-email.service');
    const emailData = generateSupportTransitionCustomerEmail(contract);
    const transporter = getEmailTransporter();

    await transporter.sendMail({
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
      to: contract.currentCustomerEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    const ownerAlert = generateOwnerSupportAlertEmail(contract, 'SUPPORT_TRANSITIONED_TO_SELF_HOSTED', { notes });
    await transporter.sendMail({
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: ownerAlert.subject,
      html: ownerAlert.html,
      text: ownerAlert.text
    });
  } catch (mailErr) {
    console.error('[CONTRACT-LIFECYCLE] Support transition email error:', mailErr.message);
  }

  return await contract.save();
}

/**
 * Authoritatively expire support add-on and stop Stripe recurring billing
 * Ensures base website hosting and unrelated add-ons are NOT cancelled.
 * @param {string} contractId
 * @param {string} [actor='SYSTEM']
 * @param {Object} [stripeClient=null]
 */
async function expireSupportAndStopStripeBilling(contractId, actor = 'SYSTEM', stripeClient = null) {
  const contract = await ContractLifecycle.findOne({ contractId });
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  if (!contract.supportAddon || contract.supportAddon.status === 'EXPIRED') {
    return contract;
  }

  contract.supportAddon.status = 'EXPIRED';

  // Attempt Stripe billing termination for support item
  const stripe = stripeClient || (process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null);
  let stripeActionDetails = { billingStopped: true };

  if (stripe && contract.stripeSubscriptionId) {
    try {
      if (contract.supportAddon.stripeSubscriptionItemId) {
        // Delete distinct subscription item
        await stripe.subscriptionItems.del(contract.supportAddon.stripeSubscriptionItemId);
        stripeActionDetails.method = 'subscription_item_deleted';
      } else {
        // If single subscription, retrieve and reduce amount by support monthly rate
        const sub = await stripe.subscriptions.retrieve(contract.stripeSubscriptionId);
        if (sub && sub.items && sub.items.data.length > 0) {
          const mainItem = sub.items.data[0];
          const supportMonthly = contract.supportAddon.discountedMonthlyCents || contract.supportAddon.monthlyCents || 0;
          const currentUnitAmount = mainItem.price.unit_amount;
          const newUnitAmount = Math.max(0, currentUnitAmount - supportMonthly);

          if (newUnitAmount > 0 && newUnitAmount !== currentUnitAmount) {
            // Update subscription with reduced price for base website only
            await stripe.subscriptions.update(contract.stripeSubscriptionId, {
              items: [{
                id: mainItem.id,
                price_data: {
                  currency: 'usd',
                  product: mainItem.price.product,
                  unit_amount: newUnitAmount,
                  recurring: { interval: 'month' }
                }
              }],
              proration_behavior: 'none'
            });
            stripeActionDetails.method = 'subscription_amount_reduced_to_base_only';
            stripeActionDetails.newMonthlyAmount = newUnitAmount;
          }
        }
      }
    } catch (stripeErr) {
      console.warn('[CONTRACT-LIFECYCLE] Stripe support item removal warning:', stripeErr.message);
      stripeActionDetails.error = stripeErr.message;
    }
  }

  contract.auditLog.push({
    timestamp: new Date(),
    eventType: 'SUPPORT_EXPIRED',
    actor,
    details: stripeActionDetails
  });

  // Send Customer Confirmation and Owner Alert
  try {
    const { generateSupportExpirationConfirmationEmail, generateOwnerSupportAlertEmail } = require('./support-email.service');
    const emailData = generateSupportExpirationConfirmationEmail(contract);
    const transporter = getEmailTransporter();

    await transporter.sendMail({
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
      to: contract.currentCustomerEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    const ownerAlert = generateOwnerSupportAlertEmail(contract, 'SUPPORT_EXPIRED', stripeActionDetails);
    await transporter.sendMail({
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: ownerAlert.subject,
      html: ownerAlert.html,
      text: ownerAlert.text
    });
  } catch (mailErr) {
    console.error('[CONTRACT-LIFECYCLE] Support expiration email error:', mailErr.message);
  }

  return await contract.save();
}

/**
 * Log a support request against monthly allocation
 * @param {string} contractId
 * @param {Object} details - { description, hoursSpent }
 * @param {string} [actor='OWNER_ADMIN']
 */
async function logSupportRequest(contractId, details = {}, actor = 'OWNER_ADMIN') {
  const contract = await ContractLifecycle.findOne({ contractId });
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  if (!contract.supportAddon || contract.supportAddon.status === 'NONE') {
    throw new Error('No support plan active for this contract.');
  }

  const support = contract.supportAddon;
  const now = new Date();

  // Reset cycle if a calendar month has passed
  if (support.cycleResetAt && now >= addMonths(support.cycleResetAt, 1)) {
    support.requestsUsedThisCycle = 0;
    support.cycleResetAt = now;
  }

  support.requestsUsedThisCycle = (support.requestsUsedThisCycle || 0) + 1;

  contract.auditLog.push({
    timestamp: now,
    eventType: 'SUPPORT_REQUEST_LOGGED',
    actor,
    details: {
      requestNumber: support.requestsUsedThisCycle,
      totalAllowed: support.monthlyRequestsIncluded,
      description: details.description || 'Routine support request',
      hoursSpent: details.hoursSpent || 1.0
    }
  });

  await contract.save();

  return {
    success: true,
    requestsUsedThisCycle: support.requestsUsedThisCycle,
    monthlyRequestsIncluded: support.monthlyRequestsIncluded,
    remainingThisCycle: Math.max(0, support.monthlyRequestsIncluded - support.requestsUsedThisCycle)
  };
}

/**
 * Advance contract to the next renewal term
 * Triggered by Stripe subscription renewal or owner action
 * @param {string} contractId - Contract ID
 * @returns {Promise<ContractLifecycle>} Updated ContractLifecycle document
 */
async function advanceContractRenewal(contractId) {
  const contract = await ContractLifecycle.findOne({ contractId });
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  const currentTermNum = contract.currentTermNumber;
  const currentTerm = contract.termsHistory.find(t => t.termNumber === currentTermNum);

  if (!currentTerm) throw new Error(`Term ${currentTermNum} not found for contract ${contractId}`);

  // If customer requested non-renewal, renewal should NOT occur
  if (currentTerm.nonRenewalStatus === 'REQUESTED' || currentTerm.nonRenewalStatus === 'CONFIRMED') {
    contract.contractStatus = 'TERMINATED';
    contract.auditLog.push({
      timestamp: new Date(),
      eventType: 'CONTRACT_RENEWED',
      actor: 'SYSTEM',
      details: { outcome: 'BLOCKED_BY_NON_RENEWAL', termNumber: currentTermNum }
    });

    // If customer has 24-month support and website is non-renewed at Month 12:
    if (contract.supportAddon && contract.supportAddon.durationMonths === 24 && contract.supportAddon.status === 'ACTIVE_HOSTED') {
      await transitionSupportToSelfHosted(contractId, 'SYSTEM', 'Automatic transition upon website Month 12 non-renewal');
    }

    return await contract.save();
  }

  // Calculate next term dates starting from previous term end date
  const nextTermNum = currentTermNum + 1;
  const nextDates = calculateTermDates(currentTerm.endDate, 12, 30);

  const nextTermHistory = {
    termNumber: nextTermNum,
    startDate: nextDates.startDate,
    endDate: nextDates.endDate,
    nonRenewalDeadline: nextDates.nonRenewalDeadline,
    reminderWindowStart: nextDates.reminderWindowStart,
    reminderWindowEnd: nextDates.reminderWindowEnd,
    reminderScheduledDate: nextDates.reminderScheduledDate,
    reminderStatus: 'PENDING',
    reminderAttemptCount: 0,
    nonRenewalStatus: 'NONE',
    termsVersion: contract.termsVersion
  };

  contract.currentTermNumber = nextTermNum;
  contract.termsHistory.push(nextTermHistory);
  contract.contractStatus = 'ACTIVE';

  contract.auditLog.push({
    timestamp: new Date(),
    eventType: 'CONTRACT_RENEWED',
    actor: 'SYSTEM',
    details: {
      renewedFromTerm: currentTermNum,
      newTermNumber: nextTermNum,
      newTermEnd: nextDates.endDate,
      newNonRenewalDeadline: nextDates.nonRenewalDeadline
    }
  });

  return await contract.save();
}

module.exports = {
  addMonths,
  calculateTermDates,
  calculateSupportDates,
  calculateEarlyTerminationQuote,
  initializeContractFromOrder,
  activateSupportOnLaunch,
  transitionSupportToSelfHosted,
  expireSupportAndStopStripeBilling,
  logSupportRequest,
  advanceContractRenewal
};
