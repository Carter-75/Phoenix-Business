const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const ContractLifecycle = require('../models/ContractLifecycle');
const { calculateEarlyTerminationQuote } = require('../services/contract-lifecycle.service');

function getTransporter() {
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

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCents(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}

/**
 * Authentication middleware for contracts
 * Allows contract access if user is logged in and owns the contract,
 * OR if request is made by the platform owner (hello@phoenixwebsites.ai)
 */
async function authenticateContractAccess(req, res, next) {
  const contractId = req.params.id;
  const user = req.user;

  try {
    const contract = await ContractLifecycle.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ error: `Contract '${contractId}' not found.` });
    }

    const isOwner = user && (user.email === 'hello@phoenixwebsites.ai' || user.email === process.env.EMAIL_USER);
    const isCustomer = user && (
      (contract.userId && contract.userId.toString() === user._id.toString()) ||
      contract.currentCustomerEmail.toLowerCase() === user.email.toLowerCase() ||
      contract.initialCustomerEmail.toLowerCase() === user.email.toLowerCase()
    );

    // If unauthenticated or unauthorized
    if (!isOwner && !isCustomer) {
      // In dev or test mode with matching test header
      if (process.env.TEST_MODE === 'true' && req.headers['x-test-email'] === contract.currentCustomerEmail) {
        req.contract = contract;
        return next();
      }
      return res.status(403).json({ error: 'You do not have authorization to view or manage this contract.' });
    }

    req.contract = contract;
    req.isOwnerAdmin = isOwner;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to authenticate contract access.' });
  }
}

/**
 * GET /api/contracts/:id
 * Retrieve authoritative contract details, term boundaries, and support status
 */
router.get('/:id', authenticateContractAccess, async (req, res) => {
  const contract = req.contract;
  const currentTermNum = contract.currentTermNumber || 1;
  const term = (contract.termsHistory || []).find(t => t.termNumber === currentTermNum);

  res.json({
    success: true,
    contract: {
      contractId: contract.contractId,
      tierId: contract.tierId,
      tierName: contract.tierName,
      customerName: contract.customerName,
      customerEmail: contract.currentCustomerEmail,
      monthlyCents: contract.monthlyCents,
      monthlyFormatted: formatCents(contract.monthlyCents),
      priceLocked: contract.priceLocked,
      contractStatus: contract.contractStatus,
      currentTermNumber: currentTermNum,
      termStartDate: term ? term.startDate : null,
      termEndDate: term ? term.endDate : null,
      nonRenewalDeadline: term ? term.nonRenewalDeadline : null,
      nonRenewalStatus: term ? term.nonRenewalStatus : 'NONE',
      reminderStatus: term ? term.reminderStatus : 'NONE',
      supportAddon: contract.supportAddon,
      termsVersion: contract.termsVersion,
      termsAcceptedAt: contract.termsAcceptedAt
    }
  });
});

/**
 * POST /api/contracts/:id/request-non-renewal
 * Customer self-service submission to decline the upcoming annual renewal.
 * Complies with Wis. Stat. § 134.49.
 */
router.post('/:id/request-non-renewal', authenticateContractAccess, async (req, res) => {
  const contract = req.contract;
  const currentTermNum = contract.currentTermNumber || 1;
  const termIndex = (contract.termsHistory || []).findIndex(t => t.termNumber === currentTermNum);

  if (termIndex === -1) {
    return res.status(400).json({ error: 'No active contractual term found.' });
  }

  const term = contract.termsHistory[termIndex];

  if (term.nonRenewalStatus === 'CONFIRMED' || term.nonRenewalStatus === 'REQUESTED') {
    return res.json({
      success: true,
      message: 'Non-renewal has already been recorded for this contract term.',
      effectiveEndDate: term.endDate
    });
  }

  const now = new Date();
  const deadline = new Date(term.nonRenewalDeadline);
  const isLate = now > deadline;

  // Update contract record
  contract.termsHistory[termIndex].nonRenewalStatus = 'CONFIRMED';
  contract.termsHistory[termIndex].nonRenewalRequestedAt = now;
  contract.termsHistory[termIndex].nonRenewalEffectiveDate = term.endDate;
  contract.termsHistory[termIndex].nonRenewalSource = req.isOwnerAdmin ? 'ADMIN_OVERRIDE' : 'CUSTOMER_PORTAL';
  contract.termsHistory[termIndex].nonRenewalNotes = req.body.notes || (isLate ? 'Customer submitted after statutory 30-day window; accepted by policy.' : 'Timely self-service submission.');

  contract.contractStatus = 'NON_RENEWAL_REQUESTED';

  contract.auditLog.push({
    timestamp: now,
    eventType: 'NON_RENEWAL_CONFIRMED',
    actor: req.isOwnerAdmin ? 'OWNER_ADMIN' : 'CUSTOMER',
    details: {
      termNumber: currentTermNum,
      effectiveEndDate: term.endDate,
      timely: !isLate,
      deadline: term.nonRenewalDeadline
    },
    ipAddress: req.ip
  });

  await contract.save();

  // If Stripe subscription schedule exists, release or cancel at current period end
  if (contract.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // Cancel automatic renewal at period end
      await stripe.subscriptions.update(contract.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      console.log(`[CONTRACTS] Stripe subscription ${contract.stripeSubscriptionId} marked cancel_at_period_end`);
    } catch (stripeErr) {
      console.warn('[CONTRACTS] Stripe schedule cancel warning:', stripeErr.message);
    }
  }

  // Send confirmation emails
  const transporter = getTransporter();
  const termEndFormatted = formatDate(term.endDate);

  // 1. Customer Confirmation Email
  try {
    await transporter.sendMail({
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
      to: contract.currentCustomerEmail,
      subject: `Non-Renewal Confirmed — ${contract.tierName} [${contract.contractId}]`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; padding: 24px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #ea580c; margin-top: 0;">Non-Renewal Confirmed</h2>
          <p>Hi ${contract.customerName || 'there'},</p>
          <p>We have received and confirmed your request not to renew your 12-month Service Agreement for <strong>${contract.tierName}</strong>.</p>
          <div style="background: #f8fafc; border-left: 4px solid #ea580c; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 15px;"><strong>Your hosting and website remain 100% active through:</strong><br><span style="font-size: 18px; color: #0f172a; font-weight: bold;">${termEndFormatted}</span></p>
          </div>
          <p><strong>Zero Early-Termination Penalties:</strong> Because this is an ordinary non-renewal at the end of your contract term, no liquidated damages or cancellation penalties apply.</p>
          <p>Your subscription will conclude automatically on ${termEndFormatted}. Should you wish to export your website data or transition to self-hosting before that date, please let us know.</p>
          <p>Thank you for partnering with Phoenix Websites AI!</p>
        </div>
      `,
      text: `Non-Renewal Confirmed: Your agreement for ${contract.tierName} will not renew. Services remain active through ${termEndFormatted} with zero penalties.`
    });
  } catch (emailErr) {
    console.error('[CONTRACTS] Customer non-renewal email failed:', emailErr.message);
  }

  // 2. Owner Alert Email
  try {
    await transporter.sendMail({
      from: `"Phoenix Contract Monitor" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `CUSTOMER NON-RENEWAL: ${contract.customerName || contract.currentCustomerEmail} [${contract.tierName}]`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; padding: 20px;">
          <h3 style="color: #ea580c;">Customer Non-Renewal Notice Recorded</h3>
          <ul>
            <li><strong>Contract ID:</strong> ${contract.contractId}</li>
            <li><strong>Customer:</strong> ${contract.customerName} (${contract.currentCustomerEmail})</li>
            <li><strong>Tier:</strong> ${contract.tierName}</li>
            <li><strong>Monthly Fee:</strong> ${formatCents(contract.monthlyCents)}</li>
            <li><strong>Term Expiration Date:</strong> ${termEndFormatted}</li>
            <li><strong>Submitted At:</strong> ${now.toISOString()}</li>
            <li><strong>Source:</strong> ${req.isOwnerAdmin ? 'Admin Override' : 'Customer Portal'}</li>
          </ul>
        </div>
      `,
      text: `Customer Non-Renewal: ${contract.customerName} (${contract.currentCustomerEmail}) for ${contract.tierName}. Concludes on ${termEndFormatted}.`
    });
  } catch (adminEmailErr) {
    console.error('[CONTRACTS] Admin non-renewal email failed:', adminEmailErr.message);
  }

  res.json({
    success: true,
    message: 'Non-renewal successfully confirmed. Services remain active through the end of your current term.',
    effectiveEndDate: term.endDate,
    nonRenewalStatus: 'CONFIRMED'
  });
});

/**
 * GET /api/contracts/:id/early-termination-quote
 * Authoritative backend calculation of early termination settlement and optional buyout.
 */
router.get('/:id/early-termination-quote', authenticateContractAccess, async (req, res) => {
  const includeBuyout = req.query.includeBuyout === 'true';
  const asOfDate = req.query.date ? new Date(req.query.date) : new Date();

  try {
    const quote = calculateEarlyTerminationQuote(req.contract, asOfDate, includeBuyout);
    res.json({
      success: true,
      quote
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/contracts/:id/request-early-termination
 * Submits formal early termination request with authoritative quote breakdown.
 */
router.post('/:id/request-early-termination', authenticateContractAccess, async (req, res) => {
  const contract = req.contract;
  const includeBuyout = req.body.includeBuyout === true;
  const quote = calculateEarlyTerminationQuote(contract, new Date(), includeBuyout);

  if (!quote.eligibleForEarlyTermination) {
    return res.status(400).json({ error: quote.reason || 'Contract is not eligible for early termination.' });
  }

  contract.contractStatus = 'EARLY_TERMINATION_REQUESTED';
  contract.terminationQuote = {
    calculatedAt: new Date(),
    monthsRemaining: quote.websiteMonthsRemaining,
    websiteDamagesCents: quote.websiteDamagesCents,
    liquidatedDamagesCents: quote.websiteDamagesCents,
    supportDamagesCents: quote.supportDamagesCents || 0,
    supportMonthsRemaining: quote.supportMonthsRemaining || 0,
    buyoutFeeCents: quote.buyoutFeeCents,
    totalSettlementCents: quote.totalDueCents,
    effectiveTerminationDate: quote.effectiveTerminationDate,
    quoteAcceptedAt: new Date()
  };

  contract.auditLog.push({
    timestamp: new Date(),
    eventType: 'EARLY_TERMINATION_REQUESTED',
    actor: req.isOwnerAdmin ? 'OWNER_ADMIN' : 'CUSTOMER',
    details: {
      websiteMonthsRemaining: quote.websiteMonthsRemaining,
      websiteDamagesCents: quote.websiteDamagesCents,
      supportMonthsRemaining: quote.supportMonthsRemaining || 0,
      supportDamagesCents: quote.supportDamagesCents || 0,
      buyoutFeeCents: quote.buyoutFeeCents,
      totalDueCents: quote.totalDueCents
    },
    ipAddress: req.ip
  });

  await contract.save();

  // Send Owner Alert
  const transporter = getTransporter();
  try {
    const supportDamagesLine = quote.supportDamagesCents > 0
      ? `<li><strong>Support Add-On Liquidated Damages (50% of remaining ${quote.supportMonthsRemaining} mos):</strong> ${formatCents(quote.supportDamagesCents)}</li>`
      : '';
    await transporter.sendMail({
      from: `"Phoenix Contract Monitor" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `EARLY TERMINATION REQUESTED: ${contract.customerName || contract.currentCustomerEmail} [${contract.tierName}]`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; padding: 20px; border: 2px solid #ea580c; border-radius: 8px;">
          <h2 style="color: #ea580c; margin-top: 0;">Early Termination Request</h2>
          <p>Customer has initiated an early termination settlement:</p>
          <ul>
            <li><strong>Contract ID:</strong> ${contract.contractId}</li>
            <li><strong>Customer:</strong> ${contract.customerName} (${contract.currentCustomerEmail})</li>
            <li><strong>Base Website Damages (50% of remaining ${quote.websiteMonthsRemaining} mos):</strong> ${formatCents(quote.websiteDamagesCents)}</li>
            ${supportDamagesLine}
            <li><strong>IP/Source Code Buyout:</strong> ${formatCents(quote.buyoutFeeCents)} (${quote.buyoutRequested ? 'Requested' : 'Declined'})</li>
            <li><strong>Total Settlement Amount:</strong> ${formatCents(quote.totalDueCents)}</li>
          </ul>
        </div>
      `,
      text: `Early Termination Requested: ${contract.customerName} for ${contract.tierName}. Website damages: ${formatCents(quote.websiteDamagesCents)}, Support damages: ${formatCents(quote.supportDamagesCents || 0)}, Buyout: ${formatCents(quote.buyoutFeeCents)}. Total settlement: ${formatCents(quote.totalDueCents)}.`
    });
  } catch (err) {
    console.error('[CONTRACTS] Early termination owner alert failed:', err.message);
  }

  res.json({
    success: true,
    message: 'Early termination request recorded. Our team will review and contact you with your final settlement and handover details.',
    quote
  });
});

module.exports = router;
