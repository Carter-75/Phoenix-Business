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

/**
 * @route POST /api/leads/capture
 * @desc Capture a lead and send a free guide
 */
router.post('/capture', async (req, res) => {
    const { email, name, guideType } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Send the guide to the user
        const userMailOptions = {
            from: `"Carter Moyer" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Free AI Implementation Guide & SaaS Checklist',
            text: `Hi ${name || 'there'},\n\nThank you for requesting my AI Implementation Guide. \n\nYou can access the full guide here: [Link Placeholder]\n\nI'll be in touch soon to see if you have any questions about scaling your systems.\n\nBest,\nCarter`,
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
                    <p style="font-size: 12px; color: #999;">Carter Moyer | Full-Stack Engineer & AI Architect</p>
                </div>
            `
        };

        // 2. Send notification to Carter
        const adminMailOptions = {
            from: `"Portfolio Lead Bot" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `🔥 New Lead: ${name || 'Unknown'} (${email})`,
            text: `New lead capture from portfolio:\nName: ${name}\nEmail: ${email}\nGuide: ${guideType || 'General'}`
        };

        // Execute both sends
        await Promise.all([
            transporter.sendMail(userMailOptions),
            transporter.sendMail(adminMailOptions)
        ]);

        res.json({ status: 'success', message: 'Guide sent successfully' });
    } catch (error) {
        console.error('Lead Capture Error:', error);
        res.status(500).json({ error: 'Failed to process lead capture' });
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
