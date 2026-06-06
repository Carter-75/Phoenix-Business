const express = require('express');
const router = express.Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const User = require('../models/user');
const Contract = require('../models/Contract');

/**
 * Middleware to verify Stripe configuration
 */
const verifyStripe = (req, res, next) => {
    if (!stripeSecretKey) {
        console.error('STRIPE: Secret key missing in environment.');
        return res.status(503).json({ error: 'Stripe is not configured on the server.' });
    }
    next();
};

/**
 * POST /api/stripe/checkout
 * Generates a dynamic Stripe Checkout session for services.
 */
router.post('/checkout', verifyStripe, async (req, res) => {
    try {
        const { tier, email, name, businessName, projectType, message, acceptedContract, contractTimestamp } = req.body;
        const user = req.user;

        // Pricing logic pulled from environment variables with safe defaults (in cents)
        const prices = {
            simple: parseInt(process.env.PRICE_SIMPLE || '74900'),
            essential_setup: parseInt(process.env.PRICE_ESSENTIAL_SETUP || '49900'),
            essential_monthly: parseInt(process.env.PRICE_ESSENTIAL_MONTHLY || '24900'),
            professional_setup: parseInt(process.env.PRICE_PROFESSIONAL_SETUP || '89900'),
            professional_monthly: parseInt(process.env.PRICE_PROFESSIONAL_MONTHLY || '44900')
        };

        const discountPercentage = parseInt(process.env.DISCOUNT_PERCENTAGE || '0');
        const applyDiscount = (amount) => {
            return Math.round(amount * (1 - (discountPercentage / 100)));
        };

        let line_items = [];
        let mode = 'payment';

        switch (tier) {
            case 'simple':
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Simple Launch - Website Build',
                            description: `Strategic Infrastructure: ${projectType || 'Standard Build'}`,
                            tax_code: 'txcd_10103100'
                        },
                        unit_amount: applyDiscount(prices.simple),
                    },
                    quantity: 1,
                });
                break;
            case 'essential':
                mode = 'subscription';
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Essential Care - Setup Fee', description: `Strategic Infrastructure: ${projectType || 'Standard Build'}`, tax_code: 'txcd_10103100' },
                        unit_amount: applyDiscount(prices.essential_setup),
                    },
                    quantity: 1,
                });
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Essential Care - Monthly Subscription', tax_code: 'txcd_10103100' },
                        unit_amount: applyDiscount(prices.essential_monthly),
                        recurring: { interval: 'month' }
                    },
                    quantity: 1,
                });
                break;
            case 'professional':
                mode = 'subscription';
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Professional Growth - Setup Fee', description: `Strategic Infrastructure: ${projectType || 'Standard Build'}`, tax_code: 'txcd_10103100' },
                        unit_amount: applyDiscount(prices.professional_setup),
                    },
                    quantity: 1,
                });
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Professional Growth - Monthly Subscription', tax_code: 'txcd_10103100' },
                        unit_amount: applyDiscount(prices.professional_monthly),
                        recurring: { interval: 'month' }
                    },
                    quantity: 1,
                });
                break;
            default:
                return res.status(400).json({ error: 'Invalid service tier selected.' });
        }

        const sessionConfig = {
            payment_method_types: ['card'],
            line_items: line_items,
            mode: mode,
            managed_payments: { enabled: true },
            success_url: `${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/dashboard?success=true`,
            cancel_url: `${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/services?canceled=true`,
            customer_email: email || (user ? user.email : undefined),
            metadata: {
                tier,
                customer_name: name || (user ? `${user.firstName} ${user.lastName}` : 'Guest'),
                business_name: businessName || (user ? user.businessName : ''),
                project_type: projectType,
                initial_message: message,
                userId: user ? user._id.toString() : 'guest',
                acceptedContract: acceptedContract ? 'true' : 'false',
                contractTimestamp: contractTimestamp || new Date().toISOString()
            },
        };

        if (mode === 'subscription') {
            sessionConfig.subscription_data = {
                trial_period_days: 30
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig, {
            stripeVersion: '2026-02-25.preview'
        });

        res.json({ url: session.url });

    } catch (err) {
        console.error('STRIPE ERROR:', err.message);
        res.status(500).json({ error: 'Failed to initialize checkout session.' });
    }
});

/**
 * POST /api/ Calculate early termination and buyout quotes
 */
router.get('/cancellation-quote/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const User = require('../models/user');
        const Contract = require('../models/Contract');
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const contract = await Contract.findOne({ userId: user._id, status: 'active' }).sort({ expiresAt: -1 });
        if (!contract || !contract.expiresAt) return res.status(400).json({ error: 'No active contract found' });

        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            expand: ['data.plan.product']
        });

        if (subscriptions.data.length === 0) return res.status(400).json({ error: 'No active Stripe subscription found' });
        const activeSub = subscriptions.data[0];

        const daysUntilExpiration = Math.ceil((contract.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const monthsLeft = Math.max(0, Math.ceil(daysUntilExpiration / 30.44));
        
        const monthlyFeeInCents = activeSub.plan.amount;
        let earlyTerminationFeeInCents = 0;
        let windowStatus = 'in-window';

        if (daysUntilExpiration > 60) {
            // Too Early: Pay 50% of remaining months
            windowStatus = 'too-early';
            earlyTerminationFeeInCents = Math.round((monthsLeft * monthlyFeeInCents) / 2);
        } else if (daysUntilExpiration < 30) {
            // Too Late: Pay 50% of remaining time + 50% of next 12-month contract (6 months penalty)
            windowStatus = 'too-late';
            earlyTerminationFeeInCents = Math.round((monthsLeft * monthlyFeeInCents) / 2) + (6 * monthlyFeeInCents);
        } else {
            // In Window: Exactly 60 to 30 days left
            windowStatus = 'in-window';
            earlyTerminationFeeInCents = 0;
        }

        const tier = activeSub.metadata.tier || (activeSub.plan.product.name.toLowerCase().includes('professional') ? 'professional' : 'essential');
        const discountPercentage = parseInt(process.env.DISCOUNT_PERCENTAGE || '0');
        const applyDiscount = (amount) => Math.round(amount * (1 - (discountPercentage / 100)));

        let setupFeeInCents = 0;
        if (tier === 'professional') {
            setupFeeInCents = applyDiscount(parseInt(process.env.PRICE_PROFESSIONAL_SETUP || '99800'));
        } else {
            setupFeeInCents = applyDiscount(parseInt(process.env.PRICE_ESSENTIAL_SETUP || '55400'));
        }

        const buyoutFeeInCents = Math.round(setupFeeInCents / 2);
        const totalBuyoutCost = buyoutFeeInCents + earlyTerminationFeeInCents;

        res.json({
            windowStatus,
            monthsLeft,
            daysUntilExpiration,
            earlyTerminationFee: earlyTerminationFeeInCents / 100,
            buyoutFeeOnly: buyoutFeeInCents / 100,
            totalBuyoutCost: totalBuyoutCost / 100,
            subscriptionId: activeSub.id
        });
    } catch (err) {
        console.error('QUOTE ERROR:', err);
        res.status(500).json({ error: 'Failed to generate quote' });
    }
});

// Create Stripe Checkout Session for Cancellation or Buyout
router.post('/checkout-cancellation', async (req, res) => {
    try {
        const { email, type, amount, subscriptionId } = req.body;
        const User = require('../models/user');
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // If the amount is 0 (e.g. they cancel in the notice window, no fees apply)
        if (amount === 0) {
            await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
            return res.json({ url: '/dashboard?success=true', zeroDollar: true });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: user.stripeCustomerId,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: type === 'buyout' ? 'Website Buyout & Early Termination' : 'Early Termination Fee',
                            description: type === 'buyout' ? 'Purchase full rights to your website.' : '50% of remaining 12-month contract.'
                        },
                        unit_amount: Math.round(amount * 100)
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            metadata: {
                action: 'cancellation_payment',
                type: type,
                subscriptionId: subscriptionId,
                userId: user._id.toString()
            },
            success_url: `${process.env.CLIENT_URL}/dashboard?cancellation_success=true`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard?canceled=true`
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('CANCELLATION CHECKOUT ERROR:', err);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

/**
 * POST /api/stripe/create-portal-session
 */
router.post('/create-portal-session', verifyStripe, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        let customerId;
        const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
        if (user && user.stripeCustomerId) {
            customerId = user.stripeCustomerId;
        } else {
            let customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
            if (customers.data.length === 0 && email !== email.toLowerCase()) {
                customers = await stripe.customers.list({ email: email, limit: 1 });
            }
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            }
        }

        if (!customerId) {
            return res.status(404).json({ error: 'No subscription found with this email.' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/services`,
        });

        res.json({ url: portalSession.url });
    } catch (err) {
        console.error('STRIPE PORTAL ERROR:', err.message);
        res.status(500).json({ error: 'Failed to initialize portal.' });
    }
});

/**
 * GET /api/stripe/subscriptions/:email
 */
router.get('/subscriptions/:email', verifyStripe, async (req, res) => {
    try {
        const { email } = req.params;
        
        let customerId;
        const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
        if (user && user.stripeCustomerId) {
            customerId = user.stripeCustomerId;
        } else {
            let customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
            if (customers.data.length === 0 && email !== email.toLowerCase()) {
                customers = await stripe.customers.list({ email: email, limit: 1 });
            }
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            }
        }

        if (!customerId) return res.json({ subscriptions: {} });

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            expand: ['data.plan.product']
        });

        const grouped = { simple: [], essential: [], professional: [] };
        subscriptions.data.forEach(sub => {
            const tier = sub.metadata.tier || (sub.plan.product.name.toLowerCase().includes('essential') ? 'essential' : 
                          sub.plan.product.name.toLowerCase().includes('professional') ? 'professional' : 'simple');
            if (grouped[tier]) {
                grouped[tier].push({
                    id: sub.id,
                    status: sub.status,
                    current_period_end: sub.current_period_end,
                    product_name: sub.plan.product.name
                });
            }
        });
        res.json({ subscriptions: grouped });
    } catch (err) {
        console.error('FETCH SUBSCRIPTIONS ERROR:', err.message);
        res.status(500).json({ error: 'Failed to fetch status.' });
    }
});

/**
 * Helper function to send receipt email via Zoho
 */
const sendReceiptEmail = async (userEmail, userName, amountTotal, projectType, pdfBuffer) => {
    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtppro.zoho.com',
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const htmlContent = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #ea580c;">Phoenix Payment Receipt</h2>
                <p>Hi ${userName || 'there'},</p>
                <p>Thank you for your payment. Your transaction has been successfully processed.</p>
                <h3>Transaction Details:</h3>
                <ul>
                    <li><strong>Service:</strong> ${projectType || 'Phoenix Digital Services'}</li>
                    <li><strong>Amount Paid:</strong> $${(amountTotal / 100).toFixed(2)}</li>
                    <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
                <p>A copy of your signed Master Service Agreement and our legal policies are attached to this email for your records.</p>
                <p>If you have any questions, please reply directly to this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 11px; color: #999;">Phoenix Digital Infrastructure</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"Phoenix" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: 'Payment Receipt & Legal Agreements - Phoenix',
            html: htmlContent,
            attachments: pdfBuffer ? [{ filename: 'Phoenix_Master_Service_Agreement.pdf', content: pdfBuffer }] : []
        });
        console.log('Receipt email sent to', userEmail);
    } catch (err) {
        console.error('Failed to send receipt email:', err);
    }
};

/**
 * Webhook handler to record contracts
 */
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        // Use the raw body captured in app.js
        event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const ProcessedEvent = require('../models/ProcessedEvent');
    try {
        const existingEvent = await ProcessedEvent.findOne({ eventId: event.id });
        if (existingEvent) {
            console.log(`[STRIPE] Ignoring duplicate event ${event.id}`);
            return res.json({ received: true });
        }
    } catch (err) {
        console.error('Failed to check for processed event:', err.message);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        if (session.metadata && session.metadata.action === 'cancellation_payment') {
            try {
                const subId = session.metadata.subscriptionId;
                await stripe.subscriptions.cancel(subId);
                const Contract = require('../models/Contract');
                
                const finalStatus = session.metadata.type === 'buyout' ? 'bought-out' : 'cancelled';
                
                await Contract.updateMany({ userId: session.metadata.userId, status: 'active' }, { status: finalStatus });
                return res.json({ received: true, cancellation_processed: true, status: finalStatus });
            } catch (err) {
                console.error('Failed to process cancellation payment:', err);
                return res.status(500).json({ error: 'Cancellation failed' });
            }
        }

        const { userId, tier, acceptedContract, contractTimestamp } = session.metadata || {};

        // Automate 12-month subscription schedule if a subscription exists
        if (session.subscription) {
            try {
                const schedule = await stripe.subscriptionSchedules.create({
                    from_subscription: session.subscription,
                });

                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                
                const items = subscription.items.data.map(item => ({
                    price: item.price.id,
                    quantity: item.quantity
                }));

                await stripe.subscriptionSchedules.update(schedule.id, {
                    end_behavior: 'release',
                    phases: [
                        {
                            items: items,
                            iterations: 12,
                        }
                    ]
                });
            } catch (err) {
                console.error('Failed to create subscription schedule:', err.message);
            }
        }

        let pdfBuffer = null;
        let userToEmail = null;

        if (acceptedContract === 'true' && userId !== 'guest' && tier !== 'simple') {
            const user = await User.findById(userId);
            if (user) {
                userToEmail = user;
                user.hasAcceptedContract = true;
                user.contractAcceptedAt = new Date(contractTimestamp);
                user.stripeCustomerId = session.customer;
                user.subscriptionStatus = tier;
                await user.save();

                const legalService = require('../services/legal.service');
                pdfBuffer = await legalService.generateMergedLegalPDF();

                const newContract = new Contract({
                    userId: user._id,
                    contractType: `Yearly Service Agreement - ${tier}`,
                    acceptedAt: new Date(contractTimestamp),
                    status: 'active',
                    expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    pdfSnapshot: pdfBuffer
                });
                await newContract.save();
            }
        } else if (tier === 'simple' && userId !== 'guest') {
            // Just update subscription status for one-time build
            const user = await User.findById(userId);
            if (user) {
                userToEmail = user;
                user.subscriptionStatus = 'simple-build';
                user.stripeCustomerId = session.customer;
                await user.save();
                
                // For simple tier we still want to generate the PDF to email it
                const legalService = require('../services/legal.service');
                pdfBuffer = await legalService.generateMergedLegalPDF();
            }
        }

        if (userToEmail || session.customer_details?.email) {
            const emailTarget = userToEmail?.email || session.customer_details?.email;
            const userName = userToEmail ? `${userToEmail.firstName} ${userToEmail.lastName}`.trim() : session.metadata.customer_name;
            sendReceiptEmail(emailTarget, userName, session.amount_total, session.metadata.project_type, pdfBuffer)
                .catch(err => console.error('Background email failed:', err));
        }
    } else if (event.type === 'subscription_schedule.released') {
        const schedule = event.data.object;
        const subscriptionId = schedule.subscription;

        if (subscriptionId) {
            try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const customerId = subscription.customer;
                const user = await User.findOne({ stripeCustomerId: customerId });

                if (user) {
                    // Create a NEW 12-month schedule for the next cycle
                    const items = subscription.items.data.map(item => ({
                        price: item.price.id,
                        quantity: item.quantity
                    }));

                    const newSchedule = await stripe.subscriptionSchedules.create({
                        from_subscription: subscriptionId,
                    });

                    await stripe.subscriptionSchedules.update(newSchedule.id, {
                        end_behavior: 'release',
                        phases: [{ items: items, iterations: 12 }]
                    });

                    // Extend the contract in DB by 1 year and update PDF snapshot
                    const contract = await Contract.findOne({ userId: user._id, status: 'active' }).sort({ expiresAt: -1 });
                    if (contract && contract.expiresAt) {
                        const legalService = require('../services/legal.service');
                        const pdfBuffer = await legalService.generateMergedLegalPDF();
                        
                        contract.expiresAt = new Date(new Date(contract.expiresAt).setFullYear(new Date(contract.expiresAt).getFullYear() + 1));
                        contract.pdfSnapshot = pdfBuffer;
                        await contract.save();
                    }

                    // Send renewal confirmation email
                    const nodemailer = require('nodemailer');
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST || 'mail.privateemail.com',
                        port: parseInt(process.env.SMTP_PORT || '465'),
                        secure: true,
                        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                    });

                    await transporter.sendMail({
                        from: `"Carter Moyer" <${process.env.EMAIL_USER}>`,
                        to: user.email,
                        subject: 'Your Annual Contract has Renewed',
                        html: `
                            <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                                <h2 style="color: #2563eb;">Contract Renewed</h2>
                                <p>Hi ${user.firstName || user.name || 'there'},</p>
                                <p>Your 12-month service contract has successfully auto-renewed for another year.</p>
                                <p>Your continued partnership ensures uninterrupted access to hosting, maintenance, and support.</p>
                                <p>If you have any questions or need anything, just reply to this email!</p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                                <p style="font-size: 11px; color: #999;">Carter Moyer | Phoenix Business Systems</p>
                            </div>
                        `
                    });
                }
            } catch (err) {
                console.error('Error handling subscription schedule release (renewal):', err);
            }
        }
    } else if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object;
        
        try {
            const customerId = invoice.customer;
            const User = require('../models/user');
            const user = await User.findOne({ stripeCustomerId: customerId });
            
            const customerEmail = user?.email || invoice.customer_email || 'Unknown Email';
            const customerName = user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer';
            const amountDue = (invoice.amount_due / 100).toFixed(2);
            
            // Email the Admin (Carter)
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtppro.zoho.com',
                port: parseInt(process.env.SMTP_PORT || '465'),
                secure: true,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });

            await transporter.sendMail({
                from: `"Phoenix System Alerts" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER, // Send to Carter
                subject: `URGENT: Payment Failed - ${customerName}`,
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px; border-left: 5px solid #ef4444;">
                        <h2 style="color: #ef4444;">Payment Failure Alert</h2>
                        <p>A recurring subscription payment has failed.</p>
                        <ul>
                            <li><strong>Client:</strong> ${customerName}</li>
                            <li><strong>Email:</strong> ${customerEmail}</li>
                            <li><strong>Amount Due:</strong> $${amountDue}</li>
                            <li><strong>Invoice URL:</strong> <a href="${invoice.hosted_invoice_url}">View Stripe Invoice</a></li>
                        </ul>
                        <p>Stripe will automatically attempt to retry this payment based on your retry schedule settings. If it continues to fail, you may need to suspend their website services or take further collection action.</p>
                    </div>
                `
            });
            
            // Suspend the client's website (Kill Switch Trigger)
            if (user) {
                const Contract = require('../models/Contract');
                await Contract.updateMany({ userId: user._id, status: 'active' }, { status: 'breached' });
            }
            
        } catch (err) {
            console.error('Failed to process invoice.payment_failed event:', err);
        }
    } else if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        
        // If this is a subscription payment and it succeeded, ensure their status is restored to active
        if (invoice.subscription) {
            try {
                const User = require('../models/User');
                const Contract = require('../models/Contract');
                const user = await User.findOne({ stripeCustomerId: invoice.customer });
                
                if (user) {
                    // Restore website access (Kill Switch Untrigger)
                    await Contract.updateMany({ userId: user._id, status: 'breached' }, { status: 'active' });
                }
            } catch (err) {
                console.error('Failed to process invoice.payment_succeeded event:', err);
            }
        }
    } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        try {
            const User = require('../models/User');
            const Contract = require('../models/Contract');
            const user = await User.findOne({ stripeCustomerId: subscription.customer });
            
            if (user) {
                // Permanently suspend site when subscription is fully deleted/cancelled
                await Contract.updateMany({ userId: user._id, status: { $in: ['active', 'breached'] } }, { status: 'cancelled' });
            }
        } catch (err) {
            console.error('Failed to process customer.subscription.deleted event:', err);
        }
    } else if (event.type === 'charge.dispute.created') {
        const dispute = event.data.object;
        try {
            const chargeId = dispute.charge;
            const charge = await stripe.charges.retrieve(chargeId);
            if (charge && charge.customer) {
                const User = require('../models/User');
                const Contract = require('../models/Contract');
                const user = await User.findOne({ stripeCustomerId: charge.customer });
                if (user) {
                    // If they did a chargeback on ANY payment (including a Buyout), instantly breach their contract
                    await Contract.updateMany({ userId: user._id }, { status: 'breached' });
                    
                    const nodemailer = require('nodemailer');
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST || 'smtppro.zoho.com',
                        port: parseInt(process.env.SMTP_PORT || '465'),
                        secure: true,
                        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                    });

                    await transporter.sendMail({
                        from: `"Phoenix System Alerts" <${process.env.EMAIL_USER}>`,
                        to: process.env.EMAIL_USER,
                        subject: `URGENT: Chargeback / Dispute Received!`,
                        html: `<p>A chargeback was filed by customer email: ${user.email}. Their contract has been marked as breached and the Kill Switch has been activated.</p>`
                    });
                }
            }
        } catch (err) {
            console.error('Failed to process charge.dispute.created event:', err);
        }
    }

    try {
        await new ProcessedEvent({ eventId: event.id, type: event.type }).save();
    } catch (err) {
        console.error('Failed to save processed event:', err.message);
    }

    res.json({ received: true });
});

/**
 * GET /api/stripe/pricing
 * Exposes current dynamic pricing to the frontend
 */
router.get('/pricing', (req, res) => {
    res.json({
        discountPercentage: parseInt(process.env.DISCOUNT_PERCENTAGE || '0'),
        basePrices: {
            simple: parseInt(process.env.PRICE_SIMPLE || '83200'),
            essential_setup: parseInt(process.env.PRICE_ESSENTIAL_SETUP || '55400'),
            essential_monthly: parseInt(process.env.PRICE_ESSENTIAL_MONTHLY || '27600'),
            professional_setup: parseInt(process.env.PRICE_PROFESSIONAL_SETUP || '99800'),
            professional_monthly: parseInt(process.env.PRICE_PROFESSIONAL_MONTHLY || '49800')
        }
    });
});

module.exports = router;
