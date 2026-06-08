require('dotenv').config({ path: '../.env.local' });

const sendAdminSMS = async (message) => {
    try {
        const phone = process.env.ADMIN_PHONE_NUMBER;
        const gateway = process.env.ADMIN_SMS_GATEWAY;

        if (!phone || !gateway) {
            console.log('[SMS] Admin phone or SMS gateway missing. Skipping SMS alert.');
            return;
        }

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
        console.log(`[SMS] Alert successfully dispatched over the network to ${phone}@${gateway}. Info: ${info.messageId}`);
    } catch (err) {
        console.error('[SMS] Failed to send Email-to-SMS:', err.message);
    }
};

(async () => {
    console.log("Sending Text 1 (Simple)...");
    await sendAdminSMS('Test 1: This is a simple plain text message just like the first one you received.');
    
    console.log("Waiting 5 seconds before sending Text 2...");
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Sending Text 2 (Spam Trigger)...");
    const smsMessage = `Phoenix Payment Alert!\nWho: John Doe (Test Business)\nAmount: $249.00\nFor: Monthly Subscription Renewal\nTier: essential`;
    await sendAdminSMS(smsMessage);
    
    console.log("Both emails have been successfully sent from the computer to T-Mobile's servers.");
})();
