const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configuration for PrivateEmail SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: parseInt(process.env.SMTP_PORT || '465') === 465,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const Lead = require('../models/Lead');

/**
 * @route POST /api/leads/capture
 * @desc Capture a lead and send a free guide
 */
const Request = require('../models/AuditRequest');
const ownerOnly = require('../middleware/growth-admin');
const { createCaptureHandler } = require('../services/capture.service');
const { rateLimit } = require('express-rate-limit');
router.post('/capture', rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false }), createCaptureHandler({
    Request,
    notify: data => transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        replyTo: data.email,
        subject: 'New Phoenix website audit request',
        text: `Name: ${data.name}\nEmail: ${data.email}\nBusiness: ${data.businessName}\nWebsite: ${data.website}\nProject details: ${data.message}`
    })
}));
router.get('/requests', ownerOnly, async (req, res) => {
    try { res.json(await Request.find().sort({ createdAt: -1 }).limit(100).lean()); }
    catch { res.status(503).json({ error: 'Cannot load requests.' }); }
});
router.patch('/requests/:id', ownerOnly, async (req, res) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(400).json({ error: 'Invalid request ID.' });
    const { stage, nextAction, nextActionAt } = req.body;
    if (!['new', 'qualified', 'call_booked', 'proposal', 'won', 'lost'].includes(stage) || typeof nextAction !== 'string' || nextAction.length > 1000) return res.status(400).json({ error: 'Invalid stage or next action.' });
    if (nextActionAt && !Number.isFinite(Date.parse(nextActionAt))) return res.status(400).json({ error: 'Invalid date.' });
    try {
        const item = await Request.findByIdAndUpdate(req.params.id, { $set: { stage, nextAction, nextActionAt: nextActionAt || null } }, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ error: 'Request not found.' });
        res.json(item);
    } catch { res.status(503).json({ error: 'Cannot save changes.' }); }
});

/**
 * @route GET /api/leads/unsubscribe
 * @desc Global unsubscribe handler
 */
router.get('/unsubscribe', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).send('Email required');

    try {
        await Lead.findOneAndUpdate(
            { email: email.toLowerCase() },
            { status: 'unsubscribed' }
        );
        res.send('<h1>You have been successfully unsubscribed.</h1><p>You will no longer receive automated outreach or guides from Phoenix.</p>');
    } catch (error) {
        res.status(500).send('Error processing unsubscribe request.');
    }
});

/**
 * @route POST /api/leads/test-outreach
 * @desc Trigger a test outreach email (debug menu)
 */
router.post('/test-outreach', ownerOnly, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        const OutreachService = require('../services/outreach.service');
        const result = await OutreachService.sendTestOutreach(email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
