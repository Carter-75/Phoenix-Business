const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configuration for PrivateEmail SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true for 465, false for other ports
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
router.post('/capture', async (req, res) => {
    const { email, name, businessName, guideType } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if already unsubscribed
        const existingLead = await Lead.findOne({ email: email.toLowerCase() });
        if (existingLead && existingLead.status === 'unsubscribed') {
            return res.status(400).json({ error: 'This email has been unsubscribed.' });
        }

        // 1. Save or Update the lead in DB
        if (!existingLead) {
            await Lead.create({
                email: email.toLowerCase(),
                name,
                businessName,
                status: 'pending',
                source: 'web-capture'
            });
        }

        // 2. Send the guide to the user
        const userMailOptions = {
            from: `"Carter Moyer" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Free AI Implementation Guide & SaaS Checklist',
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Hi ${name || 'there'},</h2>
                    <p>Thank you for requesting my <b>AI Implementation Guide & SaaS Scaling Checklist</b>.</p>
                    <p>This guide covers the 5 critical pillars of production-grade AI integration that $10k+ agencies use to scale high-concurrency applications.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.carter-portfolio.fyi/assets/guides/ai-saas-checklist.pdf" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download The Guide</a>
                    </div>
                    <p>If you're ready to automate your revenue engines or have questions about your specific technical roadmap, just reply to this email.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 11px; color: #999;">
                        Carter Moyer | Full-Stack Engineer & AI Architect<br>
                        <a href="${process.env.PROD_BACKEND_URL || 'http://localhost:3000'}/api/leads/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a>
                    </p>
                </div>
            `
        };

        // 3. Send notification to Carter
        const adminMailOptions = {
            from: `"Phoenix Lead Bot" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `🔥 New Lead: ${name || 'Unknown'} (${email})`,
            text: `New lead capture from web:\nName: ${name}\nBusiness: ${businessName}\nEmail: ${email}\nGuide: ${guideType || 'General'}`
        };

        await Promise.all([
            transporter.sendMail(userMailOptions),
            transporter.sendMail(adminMailOptions)
        ]);

        res.json({ status: 'success', message: 'Guide sent and lead recorded.' });
    } catch (error) {
        console.error('Lead Capture Error:', error);
        res.status(500).json({ error: 'Failed to process lead capture' });
    }
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
            { status: 'unsubscribed' },
            { upsert: true }
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
router.post('/test-outreach', async (req, res) => {
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
