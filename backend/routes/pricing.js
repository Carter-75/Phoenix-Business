const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { 
  BASE_PROJECTS, 
  FEATURE_ADDONS, 
  EXTRA_PAGE_PRICE,
  PRICING_FLOORS,
  calculateProjectPrice 
} = require('../services/pricing.service');
const Estimate = require('../models/Estimate');
const AuditRequest = require('../models/AuditRequest');

// Reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * GET /api/pricing/catalog
 * Public endpoint to fetch full configuration catalog and active promotion
 */
router.get('/catalog', (req, res) => {
  const isTestMode = process.env.TEST_MODE === 'true';
  const { getActivePromotion } = require('../services/promotion.service');
  const activePromo = getActivePromotion();
  const legacyEnvDiscount = isTestMode ? 0 : parseInt(process.env.DISCOUNT_PERCENTAGE || '0', 10);
  const discountPercentage = isTestMode ? 0 : Math.max(activePromo.discountPercent || 20, legacyEnvDiscount);

  res.json({
    success: true,
    discountPercentage,
    activePromotion: {
      id: activePromo.id,
      name: activePromo.name,
      displayName: activePromo.displayName,
      discountPercent: discountPercentage,
      bannerText: activePromo.bannerText,
      ctaText: activePromo.ctaText,
      ctaLink: activePromo.ctaLink,
      theme: activePromo.theme
    },
    baseProjects: Object.values(BASE_PROJECTS),
    featureAddons: Object.values(FEATURE_ADDONS),
    extraPagePrice: EXTRA_PAGE_PRICE,
    pricingFloors: PRICING_FLOORS
  });
});

/**
 * POST /api/pricing/calculate
 * Computes authoritative price from client selections
 */
router.post('/calculate', async (req, res) => {
  try {
    let dbCoupon = null;
    if (req.body && req.body.discountCode) {
      const Coupon = require('../models/Coupon');
      dbCoupon = await Coupon.findOne({ code: String(req.body.discountCode).trim().toUpperCase(), enabled: true });
    }
    const result = calculateProjectPrice(req.body, { coupon: dbCoupon });
    res.json(result);
  } catch (err) {
    console.error('PRICING CALCULATION ERROR:', err);
    res.status(400).json({ success: false, error: 'Could not calculate project pricing.' });
  }
});

/**
 * POST /api/pricing/save-estimate
 * Saves customer project configuration and sends brief to Carter
 */
router.post('/save-estimate', async (req, res) => {
  try {
    const { name, email, businessName, phone, notes, configuration } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required to save your estimate.' });
    }

    const calcResult = calculateProjectPrice(configuration || {});
    const estimateCode = 'PHX-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const estimate = new Estimate({
      estimateCode,
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().toLowerCase().slice(0, 254),
      businessName: businessName ? String(businessName).trim().slice(0, 200) : '',
      phone: phone ? String(phone).trim().slice(0, 50) : '',
      projectType: calcResult.tier.id,
      totalPages: calcResult.scope.totalPages,
      features: calcResult.addons.map(a => a.id),
      oneTimeTotal: calcResult.finalPrices.dueToday,
      recurringMonthly: calcResult.finalPrices.monthlyRecurring,
      isFixedPrice: true,
      projectBrief: calcResult.projectBrief,
      notes: notes ? String(notes).trim().slice(0, 3000) : ''
    });

    await estimate.save();

    // Also register in AuditRequest so owner CRM / notification pipeline captures it
    try {
      await AuditRequest.create({
        name: estimate.name,
        email: estimate.email,
        businessName: estimate.businessName,
        message: `Project Estimate (${estimateCode}):\n${calcResult.projectBrief}\n\nClient Notes: ${notes || 'None'}`
      });
    } catch (e) {
      console.warn('AuditRequest creation failed for estimate:', e.message);
    }

    // Attempt email alert to owner
    if (process.env.EMAIL_USER) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          replyTo: estimate.email,
          subject: `New Project Estimate: ${estimate.name} [${estimateCode}]`,
          text: `A new project estimate was generated:\n\nEstimate Code: ${estimateCode}\nName: ${estimate.name}\nEmail: ${estimate.email}\nBusiness: ${estimate.businessName || 'N/A'}\nPhone: ${estimate.phone || 'N/A'}\n\n${calcResult.projectBrief}\n\nClient Notes:\n${notes || 'None'}`
        });
      } catch (mailErr) {
        console.warn('Notification email for estimate could not be sent:', mailErr.message);
      }
    }

    res.json({
      success: true,
      estimateCode,
      brief: calcResult.projectBrief,
      dueToday: calcResult.finalPrices.dueToday,
      monthlyRecurring: calcResult.finalPrices.monthlyRecurring,
      schedule: calcResult.schedule
    });
  } catch (err) {
    console.error('SAVE ESTIMATE ERROR:', err);
    res.status(500).json({ error: 'Failed to save project estimate. Please try again.' });
  }
});

module.exports = router;
