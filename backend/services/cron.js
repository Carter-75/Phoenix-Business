const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Contract = require('../models/Contract');
const User = require('../models/user');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const startCronJobs = () => {
    // Run every day at 8:00 AM server time
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily cron job for contract renewals...');
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
                    console.log(`Sent 30-day renewal notice to ${contract.userId.email}`);
                }
            }
        } catch (err) {
            console.error('Error in daily contract renewal cron job:', err);
        }
    });
};

module.exports = { startCronJobs };
