const express = require('express');
const router = express.Router();
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const Contract = require('../models/Contract');
const User = require('../models/user');

// Common Transporter
const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtppro.zoho.com',
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// @route   GET /api/cron/check-refunds
// @desc    Triggered by Vercel Cron every 5 mins. Connects to IMAP, sends SMS, exits.
router.get('/check-refunds', async (req, res) => {
    console.log('[CRON] Starting IMAP check for Refund Requests...');
    
    // In Vercel, we need to return a response so the cron doesn't timeout immediately,
    // but the background process might be killed. We will await the IMAP logic.
    
    const EMAIL_USER = process.env.PARTNERSHIP_EMAIL || process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.PARTNERSHIP_PASS || process.env.EMAIL_PASS;
    const IMAP_HOST = process.env.IMAP_HOST;
    const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993', 10);
    const SMS_EMAIL = `${process.env.ADMIN_PHONE_NUMBER}@${process.env.ADMIN_SMS_GATEWAY}`;

    if (!IMAP_HOST || !EMAIL_USER || !EMAIL_PASS || !process.env.ADMIN_PHONE_NUMBER) {
        return res.status(500).json({ error: 'Missing IMAP or SMS env vars' });
    }

    const imap = new Imap({
        user: EMAIL_USER,
        password: EMAIL_PASS,
        host: IMAP_HOST,
        port: IMAP_PORT,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 5000,
        connTimeout: 10000
    });

    return new Promise((resolve, reject) => {
        let hasResponded = false;
        
        const finish = (status, msg) => {
            if (!hasResponded) {
                hasResponded = true;
                imap.end();
                res.status(status).json({ message: msg });
                resolve();
            }
        };

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err, box) => {
                if (err) return finish(500, `Box error: ${err.message}`);
                
                imap.search(['UNSEEN', ['SUBJECT', 'Refund Request']], (err, results) => {
                    if (err) return finish(500, `Search error: ${err.message}`);
                    
                    if (!results || results.length === 0) {
                        return finish(200, 'No new refund requests found.');
                    }

                    console.log(`[CRON] Found ${results.length} new refund requests.`);
                    const f = imap.fetch(results, { bodies: '' });
                    
                    let processedCount = 0;
                    
                    f.on('message', (msg, seqno) => {
                        let rawMail = '';
                        msg.on('body', (stream) => {
                            stream.on('data', chunk => rawMail += chunk.toString('utf8'));
                        });

                        msg.once('end', () => {
                            simpleParser(rawMail, async (err, parsed) => {
                                if (err) {
                                    console.error('Parse error:', err);
                                    processedCount++;
                                    if (processedCount === results.length) finish(200, 'Processed with some parse errors');
                                    return;
                                }

                                const sender = parsed.from.text;
                                const snippet = parsed.text ? parsed.text.substring(0, 100) : 'No content';
                                
                                try {
                                    await getTransporter().sendMail({
                                        from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_USER}>`,
                                        to: SMS_EMAIL,
                                        subject: 'Phoenix Alert',
                                        text: `URGENT: Refund Request from ${sender}.\n\nPreview: ${snippet}...`
                                    });
                                    console.log(`[CRON] Sent SMS alert for: ${sender}`);
                                    
                                    // Mark as Seen
                                    imap.addFlags(results, ['\\Seen'], (err) => {
                                        if (err) console.error('Flag error:', err);
                                    });
                                } catch (smsErr) {
                                    console.error('SMS send error:', smsErr);
                                }

                                processedCount++;
                                if (processedCount === results.length) {
                                    finish(200, `Successfully processed ${results.length} request(s).`);
                                }
                            });
                        });
                    });

                    f.once('error', (err) => {
                        finish(500, `Fetch error: ${err.message}`);
                    });
                });
            });
        });

        imap.once('error', (err) => {
            console.error('IMAP connection error:', err);
            finish(500, `IMAP connection error: ${err.message}`);
        });

        imap.connect();
    });
});

// @route   GET /api/cron/daily-renewals
// @desc    Triggered by Vercel Cron every day at 8:00 AM server time
router.get('/daily-renewals', async (req, res) => {
    console.log('[CRON] Running daily cron job for contract renewals...');
    try {
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + 30);
        
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const expiringContracts = await Contract.find({
            status: 'active',
            expiresAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('userId');

        let emailsSent = 0;
        const transporter = getTransporter();

        for (const contract of expiringContracts) {
            if (contract.userId && contract.userId.email) {
                const mailOptions = {
                    from: `"Carter Moyer" <${process.env.EMAIL_USER}>`,
                    to: contract.userId.email,
                    subject: 'Notice: Your Annual Contract will Auto-Renew in 30 Days',
                    html: `
                        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                            <h2 style="color: #2563eb;">Notice of Contract Auto-Renewal</h2>
                            <p>Hi ${contract.userId.firstName || contract.userId.name || 'there'},</p>
                            <p>This is a courtesy reminder that your 12-month service agreement for the <b>${contract.contractType}</b> plan is set to automatically renew in exactly 30 days.</p>
                            <p>Your subscription will seamlessly continue for another 12-month period, ensuring uninterrupted service, hosting, and priority support.</p>
                            <p>If you wish to make any changes to your subscription or cancel before the renewal takes place, please log into your client portal or reply directly to this email.</p>
                            <p>Thank you for being a valued client!</p>
                            <br><br>
                            ${process.env.EMAIL_SIGNATURE || ''}
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`[CRON] Sent 30-day renewal notice to ${contract.userId.email}`);
                emailsSent++;
            }
        }

        res.json({ message: `Renewal cron finished. Sent ${emailsSent} emails.` });
    } catch (err) {
        console.error('Error in daily contract renewal cron:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
