const express = require('express');
const router = express.Router();
const ownerAuth = require('../middleware/owner-auth');
const Coupon = require('../models/Coupon');
const OrderSnapshot = require('../models/OrderSnapshot');
const { 
  getEffectiveCampaigns, 
  setCampaignOverride, 
  clearCampaignOverrides 
} = require('../config/promotions.config');
const { getActivePromotion } = require('../services/promotion.service');
const { syncDatabaseCoupons } = require('../services/pricing.service');

// Protect all admin endpoints with strict owner authorization
router.use(ownerAuth);

// ==========================================
// 1. PROMOTIONS MANAGEMENT
// ==========================================

/**
 * GET /api/admin/promotions
 * Returns all seasonal campaigns with active status and editable configurations
 */
router.get('/promotions', (req, res) => {
  try {
    const active = getActivePromotion();
    const campaigns = getEffectiveCampaigns();
    res.json({
      success: true,
      activePromotionId: active.id,
      campaigns
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve promotional campaigns.' });
  }
});

/**
 * POST /api/admin/promotions/override
 * Overrides a campaign's discount percentage or banner text at runtime
 */
router.post('/promotions/override', (req, res) => {
  try {
    const { campaignId, discountPercent, bannerText, enabled } = req.body;
    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId is required.' });
    }

    const updates = {};
    if (typeof discountPercent === 'number') updates.discountPercent = Math.max(0, Math.min(100, discountPercent));
    if (typeof bannerText === 'string') updates.bannerText = bannerText.trim().slice(0, 300);
    if (typeof enabled === 'boolean') updates.enabled = enabled;

    const updated = setCampaignOverride(campaignId, updates);
    if (!updated) {
      return res.status(404).json({ error: `Campaign '${campaignId}' not found.` });
    }

    res.json({
      success: true,
      campaign: updated,
      activePromotion: getActivePromotion()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update campaign override.' });
  }
});

/**
 * POST /api/admin/promotions/reset
 * Clears all runtime overrides back to code defaults
 */
router.post('/promotions/reset', (req, res) => {
  try {
    clearCampaignOverrides();
    res.json({
      success: true,
      message: 'All runtime promotional overrides cleared.',
      campaigns: getEffectiveCampaigns()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset campaign overrides.' });
  }
});

// ==========================================
// 2. COUPON MANAGEMENT
// ==========================================

/**
 * GET /api/admin/coupons
 * Lists all database-backed coupons with usage counts
 */
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons from database.' });
  }
});

/**
 * POST /api/admin/coupons
 * Creates a new database-backed coupon
 */
router.post('/coupons', async (req, res) => {
  try {
    const { 
      code, 
      type = 'percentage', 
      amount, 
      appliesTo = 'both', 
      usageModel = 'repeatable', // 'single' (1-time) or 'repeatable' (constant multi-use) or 'custom'
      usageLimit = 0, 
      perCustomerLimit,
      expiresAt, 
      minimumSetupSubtotal = 0,
      notes = '' 
    } = req.body;

    if (!code || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Coupon code and amount are required.' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ error: `Coupon code '${cleanCode}' already exists.` });
    }

    let finalUsageLimit = 0;
    let finalPerCustomer = 0; // 0 = repeatable

    if (usageModel === 'single') {
      finalUsageLimit = 1;
      finalPerCustomer = 1;
    } else if (usageModel === 'repeatable') {
      finalUsageLimit = 0; // unlimited
      finalPerCustomer = 0; // repeatable
    } else {
      finalUsageLimit = parseInt(usageLimit, 10) || 0;
      finalPerCustomer = perCustomerLimit !== undefined ? parseInt(perCustomerLimit, 10) : 1;
    }

    const coupon = new Coupon({
      code: cleanCode,
      type: type === 'fixed' ? 'fixed' : 'percentage',
      amount: parseInt(amount, 10),
      appliesTo: ['setup', 'monthly', 'both'].includes(appliesTo) ? appliesTo : 'both',
      usageLimit: finalUsageLimit,
      perCustomerLimit: finalPerCustomer,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      minimumSetupSubtotal: parseInt(minimumSetupSubtotal, 10) || 0,
      notes: String(notes || (usageModel === 'single' ? '1-Time Single Use' : 'Constant Repeatable')).trim().slice(0, 500),
      createdBy: req.user.email
    });

    await coupon.save();
    const allActive = await Coupon.find({ enabled: true });
    syncDatabaseCoupons(allActive);

    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create coupon.' });
  }
});

/**
 * PATCH /api/admin/coupons/:id
 * Toggles or updates coupon properties
 */
router.patch('/coupons/:id', async (req, res) => {
  try {
    const { enabled, usageLimit, expiresAt, notes } = req.body;
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });

    if (typeof enabled === 'boolean') coupon.enabled = enabled;
    if (usageLimit !== undefined) coupon.usageLimit = parseInt(usageLimit, 10) || 0;
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (notes !== undefined) coupon.notes = String(notes).trim().slice(0, 500);

    coupon.updatedAt = new Date();
    await coupon.save();

    const allActive = await Coupon.find({ enabled: true });
    syncDatabaseCoupons(allActive);

    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coupon.' });
  }
});

/**
 * PATCH /api/admin/coupons/:id/toggle
 * Specific toggle endpoint for convenience
 */
router.patch('/coupons/:id/toggle', async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });

    if (typeof req.body.enabled === 'boolean') {
      coupon.enabled = req.body.enabled;
    } else {
      coupon.enabled = !coupon.enabled;
    }

    coupon.updatedAt = new Date();
    await coupon.save();

    const allActive = await Coupon.find({ enabled: true });
    syncDatabaseCoupons(allActive);

    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle coupon.' });
  }
});

/**
 * DELETE /api/admin/coupons/:id
 * Deletes a coupon from the database
 */
router.delete('/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });

    const allActive = await Coupon.find({ enabled: true });
    syncDatabaseCoupons(allActive);

    res.json({ success: true, message: `Coupon '${coupon.code}' deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon.' });
  }
});

// ==========================================
// 3.5 ORDER SNAPSHOTS MANAGEMENT
// ==========================================

/**
 * GET /api/admin/orders
 * Returns list of captured order snapshots for the owner console
 */
router.get('/orders', async (req, res) => {
  try {
    const orders = await OrderSnapshot.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// ==========================================
// 4. CONTRACT LIFECYCLE & RENEWALS MANAGEMENT (Wis. Stat. § 134.49)
// ==========================================

const { 
  advanceContractRenewal,
  activateSupportOnLaunch,
  transitionSupportToSelfHosted,
  expireSupportAndStopStripeBilling,
  logSupportRequest,
  calculateEarlyTerminationQuote
} = require('../services/contract-lifecycle.service');
const { generateStatutoryRenewalNoticeEmail } = require('../services/renewal-scheduler.service');
const nodemailer = require('nodemailer');

function getAdminTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtppro.zoho.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

/**
 * GET /api/admin/contracts
 * Returns list of contracts with active term boundaries, renewal status, and support status
 */
router.get('/contracts', async (req, res) => {
  try {
    const contracts = await ContractLifecycle.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, contracts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve contracts.' });
  }
});

/**
 * GET /api/admin/contracts/:id
 * Retrieve single contract with full audit trail and terms history
 */
router.get('/contracts/:id', async (req, res) => {
  try {
    const contract = await ContractLifecycle.findOne({ contractId: req.params.id });
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });
    res.json({ success: true, contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve contract.' });
  }
});

/**
 * POST /api/admin/contracts/:id/resend-reminder
 * Manually trigger or resend the Wisconsin statutory renewal notice
 */
router.post('/contracts/:id/resend-reminder', async (req, res) => {
  try {
    const contract = await ContractLifecycle.findOne({ contractId: req.params.id });
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });

    const currentTermNum = contract.currentTermNumber || 1;
    const term = (contract.termsHistory || []).find(t => t.termNumber === currentTermNum);
    if (!term) return res.status(400).json({ error: 'No active term found.' });

    const emailData = generateStatutoryRenewalNoticeEmail(contract, term);
    const transporter = getAdminTransporter();

    const info = await transporter.sendMail({
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
      to: contract.currentCustomerEmail,
      subject: `[RESENT] ${emailData.subject}`,
      html: emailData.html,
      text: emailData.text
    });

    const termIndex = contract.termsHistory.findIndex(t => t.termNumber === currentTermNum);
    contract.termsHistory[termIndex].reminderStatus = 'SENT';
    contract.termsHistory[termIndex].reminderSentAt = new Date();
    contract.termsHistory[termIndex].providerMessageId = info.messageId || 'MANUAL-RESEND';

    contract.auditLog.push({
      timestamp: new Date(),
      eventType: 'RENEWAL_REMINDER_SENT',
      actor: 'OWNER_ADMIN',
      details: {
        action: 'MANUAL_RESEND',
        recipient: contract.currentCustomerEmail,
        messageId: info.messageId
      },
      ipAddress: req.ip
    });

    await contract.save();

    res.json({
      success: true,
      message: `Statutory reminder sent to ${contract.currentCustomerEmail}`,
      messageId: info.messageId
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to resend reminder: ${err.message}` });
  }
});

/**
 * POST /api/admin/contracts/:id/record-external-non-renewal
 * Records a customer's non-renewal notice received via direct email to hello@phoenixwebsites.ai
 */
router.post('/contracts/:id/record-external-non-renewal', async (req, res) => {
  try {
    const { receivedAt, notes, effectiveDate } = req.body;
    const contract = await ContractLifecycle.findOne({ contractId: req.params.id });
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });

    const currentTermNum = contract.currentTermNumber || 1;
    const termIndex = contract.termsHistory.findIndex(t => t.termNumber === currentTermNum);
    if (termIndex === -1) return res.status(400).json({ error: 'No active term found.' });

    const term = contract.termsHistory[termIndex];
    const receiptTimestamp = receivedAt ? new Date(receivedAt) : new Date();

    contract.termsHistory[termIndex].nonRenewalStatus = 'CONFIRMED';
    contract.termsHistory[termIndex].nonRenewalRequestedAt = receiptTimestamp;
    contract.termsHistory[termIndex].nonRenewalEffectiveDate = effectiveDate ? new Date(effectiveDate) : term.endDate;
    contract.termsHistory[termIndex].nonRenewalSource = 'EMAIL_MANUAL';
    contract.termsHistory[termIndex].nonRenewalNotes = notes || 'Customer emailed hello@phoenixwebsites.ai directly';

    contract.contractStatus = 'NON_RENEWAL_REQUESTED';

    contract.auditLog.push({
      timestamp: new Date(),
      eventType: 'NON_RENEWAL_CONFIRMED',
      actor: 'OWNER_ADMIN',
      details: {
        receiptTimestamp,
        source: 'EMAIL_MANUAL',
        notes: notes || 'Direct email to hello@phoenixwebsites.ai'
      },
      ipAddress: req.ip
    });

    await contract.save();

    res.json({
      success: true,
      message: 'External email non-renewal recorded and audit log updated.',
      effectiveEndDate: term.endDate
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to record non-renewal: ${err.message}` });
  }
});

/**
 * POST /api/admin/contracts/:id/advance-term
 * Advances contract to the next renewal term
 */
router.post('/contracts/:id/advance-term', async (req, res) => {
  try {
    const updated = await advanceContractRenewal(req.params.id);
    res.json({
      success: true,
      message: `Contract advanced to Term ${updated.currentTermNumber}.`,
      contract: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/contracts/:id/activate-support
 * Marks website launched and activates support add-on
 */
router.post('/contracts/:id/activate-support', async (req, res) => {
  try {
    const launchedAt = req.body.launchedAt ? new Date(req.body.launchedAt) : new Date();
    const updated = await activateSupportOnLaunch(req.params.id, launchedAt, 'OWNER_ADMIN');
    res.json({
      success: true,
      message: `Website marked launched and support activated for ${updated.contractId}`,
      supportStatus: updated.supportAddon.status,
      contract: updated
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to activate support: ${err.message}` });
  }
});

/**
 * POST /api/admin/contracts/:id/transition-support
 * Transitions 24-month support add-on to self-hosted transition support
 */
router.post('/contracts/:id/transition-support', async (req, res) => {
  try {
    const notes = req.body.notes || 'Manual owner transition to self-hosted support';
    const updated = await transitionSupportToSelfHosted(req.params.id, 'OWNER_ADMIN', notes);
    res.json({
      success: true,
      message: `24-month support transitioned to self-hosted support for ${updated.contractId}`,
      supportStatus: updated.supportAddon.status,
      contract: updated
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to transition support: ${err.message}` });
  }
});

/**
 * POST /api/admin/contracts/:id/expire-support
 * Manually expires support add-on and halts recurring Stripe billing
 */
router.post('/contracts/:id/expire-support', async (req, res) => {
  try {
    const updated = await expireSupportAndStopStripeBilling(req.params.id, 'OWNER_ADMIN');
    res.json({
      success: true,
      message: `Support expired and billing halted for ${updated.contractId}`,
      supportStatus: updated.supportAddon.status,
      contract: updated
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to expire support: ${err.message}` });
  }
});

/**
 * POST /api/admin/contracts/:id/log-support-request
 * Logs a customer request against their monthly support allowance
 */
router.post('/contracts/:id/log-support-request', async (req, res) => {
  try {
    const { description, hoursSpent } = req.body;
    const result = await logSupportRequest(req.params.id, { description, hoursSpent }, 'OWNER_ADMIN');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: `Failed to log support request: ${err.message}` });
  }
});

/**
 * GET /api/admin/contracts/:id/termination-quote
 * Returns authoritative early termination quote separating website, support, and buyout
 */
router.get('/contracts/:id/termination-quote', async (req, res) => {
  try {
    const contract = await ContractLifecycle.findOne({ contractId: req.params.id });
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });

    const includeBuyout = req.query.buyout === 'true';
    const asOfDate = req.query.date ? new Date(req.query.date) : new Date();

    const quote = calculateEarlyTerminationQuote(contract, asOfDate, includeBuyout);
    res.json({ success: true, quote });
  } catch (err) {
    res.status(500).json({ error: `Failed to calculate termination quote: ${err.message}` });
  }
});

/**
 * POST /api/admin/contracts/:id/process-early-termination
 * Executes early termination and halts Stripe subscription
 */
router.post('/contracts/:id/process-early-termination', async (req, res) => {
  try {
    const contract = await ContractLifecycle.findOne({ contractId: req.params.id });
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });

    const includeBuyout = req.body.buyout === true;
    const quote = calculateEarlyTerminationQuote(contract, new Date(), includeBuyout);

    contract.contractStatus = 'TERMINATED';
    if (contract.supportAddon && contract.supportAddon.durationMonths > 0) {
      contract.supportAddon.status = 'TERMINATED';
    }

    contract.terminationQuote = {
      calculatedAt: new Date(),
      monthsRemaining: quote.websiteMonthsRemaining,
      websiteDamagesCents: quote.websiteDamagesCents,
      liquidatedDamagesCents: quote.websiteDamagesCents,
      supportDamagesCents: quote.supportDamagesCents,
      supportMonthsRemaining: quote.supportMonthsRemaining,
      buyoutFeeCents: quote.buyoutFeeCents,
      totalSettlementCents: quote.totalDueCents,
      effectiveTerminationDate: new Date(),
      quoteAcceptedAt: new Date()
    };

    contract.auditLog.push({
      timestamp: new Date(),
      eventType: 'EARLY_TERMINATION_COMPLETED',
      actor: 'OWNER_ADMIN',
      details: {
        websiteDamages: quote.websiteDamagesCents,
        supportDamages: quote.supportDamagesCents,
        buyoutFee: quote.buyoutFeeCents,
        totalDue: quote.totalDueCents
      },
      ipAddress: req.ip
    });

    if (includeBuyout) {
      contract.auditLog.push({
        timestamp: new Date(),
        eventType: 'BUYOUT_COMPLETED',
        actor: 'OWNER_ADMIN',
        details: { buyoutFeeCents: quote.buyoutFeeCents }
      });
    }

    await contract.save();

    // Cancel Stripe subscription if active
    if (contract.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(contract.stripeSubscriptionId);
      } catch (stripeErr) {
        console.warn('[ADMIN] Stripe subscription cancellation warning:', stripeErr.message);
      }
    }

    res.json({
      success: true,
      message: `Contract ${contract.contractId} early termination processed.`,
      settlementQuote: quote
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to process early termination: ${err.message}` });
  }
});

module.exports = router;

