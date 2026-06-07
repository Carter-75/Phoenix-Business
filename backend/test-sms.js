require('dotenv').config({ path: '../.env.local' });

const sendAdminSMS = async (message) => {
    try {
        const phone = process.env.ADMIN_PHONE_NUMBER;
        const gateway = process.env.ADMIN_SMS_GATEWAY;

        if (!phone || !gateway) {
            console.log('[SMS] Admin phone or SMS gateway missing. Skipping SMS alert.');
            return;
        }

        console.log(`Sending to: ${phone}@${gateway}`);

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtppro.zoho.com',
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const info = await transporter.sendMail({
            from: `"Phoenix Alerts" <${process.env.EMAIL_USER}>`,
            to: `${phone}@${gateway}`,
            subject: 'Payment Alert',
            text: message // Send as plain text for SMS compatibility
        });
        console.log(`[SMS] Alert sent via Email-to-SMS to ${phone}@${gateway} successfully. Info:`, info.messageId);
    } catch (err) {
        console.error('[SMS] Failed to send Email-to-SMS:', err.message);
    }
};

sendAdminSMS('Test from Phoenix system');
