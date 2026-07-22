const express = require('express');
const router = express.Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const User = require('../models/user');
const Contract = require('../models/Contract');

/**
 * Helper function to send SMS alert to admin via Email-to-SMS (Spam Evading Format)
 */
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

        await transporter.sendMail({
            from: `"Phnx" <${process.env.EMAIL_USER}>`,
            to: `${phone}@${gateway}`,
            subject: 'update',
            text: message // Send as plain text
        });
        console.log(`[SMS] Alert sent via Email-to-SMS to ${phone}@${gateway} successfully.`);
    } catch (err) {
        console.error('[SMS] Failed to send Email-to-SMS:', err.message);
    }
};

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
 * POST /api/stripe/validate-discount
 * Validates a dynamic discount code
 */
router.post('/validate-discount', async (req, res) => {
    try {
        const { code, email } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        const upperCode = code.toUpperCase().trim();
        
        // 1. Check if it's an unlimited code
        const dcVal = process.env[`DC_${upperCode}`];
        if (dcVal) {
            return res.json({ valid: true, percentage: parseInt(dcVal), type: 'unlimited' });
        }

        // 2. Check if it's a limited code
        const dclVal = process.env[`DCL_${upperCode}`];
        if (dclVal) {
            // Need to ensure the user hasn't used it
            let user = req.user;
            if (!user && email) {
                 const User = require('../models/user');
                 user = await User.findOne({ email: email.toLowerCase() });
            }
            if (user && user.usedDiscountCodes && user.usedDiscountCodes.includes(upperCode)) {
                return res.status(400).json({ error: 'You have already used this discount code.' });
            }
            return res.json({ valid: true, percentage: parseInt(dclVal), type: 'limited' });
        }

        return res.status(400).json({ error: 'Invalid discount code.' });
    } catch (err) {
        console.error('DISCOUNT VALIDATION ERROR:', err.message);
        res.status(500).json({ error: 'Validation failed.' });
    }
});

/**
 * POST /api/stripe/checkout
 * Generates a dynamic Stripe Checkout session for services.
 */
router.post('/checkout', verifyStripe, async (req, res) => {
    try {
        const { tier, email, name, businessName, projectType, message, acceptedContract, contractTimestamp, discountCode } = req.body;
        const user = req.user;

        // Pricing logic pulled from environment variables with safe defaults (in cents)
        const prices = {
            simple_setup: parseInt(process.env.PRICE_SIMPLE_SETUP || '149900'),
            simple_monthly: parseInt(process.env.PRICE_SIMPLE_MONTHLY || '9900'),
            essential_setup: parseInt(process.env.PRICE_ESSENTIAL_SETUP || '349900'),
            essential_monthly: parseInt(process.env.PRICE_ESSENTIAL_MONTHLY || '29900'),
            professional_setup: parseInt(process.env.PRICE_PROFESSIONAL_SETUP || '799900'),
            professional_monthly: parseInt(process.env.PRICE_PROFESSIONAL_MONTHLY || '59900'),
            enterprise_setup: parseInt(process.env.PRICE_ENTERPRISE_SETUP || '1499900'),
            enterprise_monthly: parseInt(process.env.PRICE_ENTERPRISE_MONTHLY || '99900')
        };

        if (process.env.TEST_MODE === 'true') {
            prices.simple_setup = 100; // $1.00
            prices.simple_monthly = 100; // $1.00
            prices.essential_setup = 200; // $2.00
            prices.essential_monthly = 200; // $2.00
            prices.professional_setup = 300; // $3.00
            prices.professional_monthly = 300; // $3.00
            prices.enterprise_setup = 400; // $4.00
            prices.enterprise_monthly = 400; // $4.00
        }

        let baseDiscountPercentage = process.env.TEST_MODE === 'true' ? 0 : parseInt(process.env.DISCOUNT_PERCENTAGE || '0');
        let extraDiscountPercentage = 0;
        let appliedDiscountCode = '';

        if (discountCode) {
            const upperCode = discountCode.toUpperCase().trim();
            const dcVal = process.env[`DC_${upperCode}`];
            const dclVal = process.env[`DCL_${upperCode}`];
            
            if (dcVal) {
                extraDiscountPercentage = parseInt(dcVal);
                appliedDiscountCode = upperCode;
            } else if (dclVal) {
                // For checkout, we re-verify they haven't used it
                let dbUser = user;
                if (!dbUser && email) {
                    const User = require('../models/user');
                    dbUser = await User.findOne({ email: email.toLowerCase() });
                }
                if (dbUser && dbUser.usedDiscountCodes && dbUser.usedDiscountCodes.includes(upperCode)) {
                    return res.status(400).json({ error: 'You have already used this discount code.' });
                }
                extraDiscountPercentage = parseInt(dclVal);
                appliedDiscountCode = `DCL_${upperCode}`; // Prefix internally so webhook knows it's limited
            }
        }

        const totalDiscountPercentage = Math.min(100, baseDiscountPercentage + extraDiscountPercentage);

        const applyDiscount = (amount) => {
            return Math.round(amount * (1 - (totalDiscountPercentage / 100)));
        };

        let line_items = [];
        let mode = 'payment';
        let setupFee = 0;
        let monthlyFee = 0;

        switch (tier) {
            case 'simple':
                mode = 'subscription';
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Simple Launch - Setup Fee', description: `Strategic Infrastructure: ${projectType || 'Standard Build'}`, tax_code: 'txcd_10103100' },
                        unit_amount: applyDiscount(prices.simple_setup),
                    },
                    quantity: 1,
                });
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Simple Launch - Monthly Subscription', tax_code: 'txcd_10103100' },
                        unit_amount: applyDiscount(prices.simple_monthly),
                        recurring: { interval: 'month' }
                    },
                    quantity: 1,
                });
                setupFee = applyDiscount(prices.simple_setup);
                monthlyFee = applyDiscount(prices.simple_monthly);
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
                setupFee = applyDiscount(prices.essential_setup);
                monthlyFee = applyDiscount(prices.essential_monthly);
                break;
            case 'professional':
                mode = 'subscription';
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Professional Growth - Setup Fee', description: `Strategic Infrastructure: ${projectType || 'Premium Portal'}`, tax_code: 'txcd_10103100' },
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
                setupFee = applyDiscount(prices.professional_setup);
                monthlyFee = applyDiscount(prices.professional_monthly);
                break;
            case 'enterprise':
                mode = 'subscription';
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Enterprise Custom - Setup Fee', description: `Strategic Infrastructure: ${projectType || 'Custom Architecture'}`, tax_code: 'txcd_10103100' },
                        unit_amount: applyDiscount(prices.enterprise_setup),
                    },
                    quantity: 1,
                });
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Enterprise Custom - Monthly Subscription', tax_code: 'txcd_10103100' },
                        unit_amount: applyDiscount(prices.enterprise_monthly),
                        recurring: { interval: 'month' }
                    },
                    quantity: 1,
                });
                setupFee = applyDiscount(prices.enterprise_setup);
                monthlyFee = applyDiscount(prices.enterprise_monthly);
                break;
            case 'data':
                mode = 'payment';
                const dataPrice = applyDiscount(parseInt(process.env.PRICE_DATA || '24900'));
                const cartItems = req.body.cartItems || [];
                const dataQty = Math.max(1, cartItems.length);
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Data Intelligence Block', description: `AI-enriched public data — ${dataQty} block(s). One-time purchase, non-refundable.`, tax_code: 'txcd_10103100' },
                        unit_amount: dataPrice,
                    },
                    quantity: dataQty,
                });
                setupFee = dataPrice * dataQty;
                monthlyFee = 0;
                break;
            default:
                return res.status(400).json({ error: 'Invalid service tier selected.' });
        }

        const isDataTier = tier === 'data';
        const baseUrl = process.env.PROD_FRONTEND_URL || 'http://localhost:4200';

        const sessionConfig = {
            line_items: line_items,
            mode: mode,
            success_url: isDataTier 
                ? `${baseUrl}/data?purchase=success` 
                : `${baseUrl}/dashboard?success=true`,
            cancel_url: isDataTier 
                ? `${baseUrl}/data?canceled=true` 
                : `${baseUrl}/services?canceled=true`,
            customer_email: email || (user ? user.email : undefined),
            metadata: {
                tier,
                setupFee: setupFee.toString(),
                monthlyFee: monthlyFee.toString(),
                customer_name: name || (user ? `${user.firstName} ${user.lastName}` : 'Guest'),
                business_name: businessName || (user ? user.businessName : ''),
                project_type: projectType,
                initial_message: message,
                userId: user ? user._id.toString() : 'guest',
                acceptedContract: acceptedContract ? 'true' : 'false',
                contractTimestamp: contractTimestamp || new Date().toISOString(),
                discountCode: appliedDiscountCode
            },
        };

        if (mode === 'subscription') {
            sessionConfig.subscription_data = {
                trial_period_days: 30
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        res.json({ url: session.url });

    } catch (err) {
        console.error('STRIPE ERROR:', err.message);
        res.status(500).json({ error: 'Failed to initialize checkout session.' });
    }
});

/**
 * GET /api/stripe/cancellation-quote/:contractId
 * Calculate early termination and buyout quotes for a specific contract
 */
router.get('/cancellation-quote/:contractId', async (req, res) => {
    try {
        const { contractId } = req.params;
        const Contract = require('../models/Contract');

        const contract = await Contract.findById(contractId).populate('userId');
        if (!contract) return res.status(404).json({ error: 'Contract not found' });

        const user = contract.userId;

        if (!contract.stripeSubscriptionId) {
            return res.status(400).json({ error: 'This contract does not have a linked Stripe subscription.' });
        }

        const activeSub = await stripe.subscriptions.retrieve(contract.stripeSubscriptionId, {
            expand: ['plan.product']
        });

        if (activeSub.status === 'canceled') {
            return res.status(400).json({ error: 'This subscription is already canceled.' });
        }

        const daysUntilExpiration = Math.ceil((contract.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const monthsLeft = Math.max(0, Math.ceil(daysUntilExpiration / 30.44));

        const monthlyFeeInCents = contract.monthlyFee || activeSub.plan.amount;
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

        const tier = contract.tier || activeSub.metadata.tier || (activeSub.plan.product.name.toLowerCase().includes('professional') ? 'professional' : 'essential');
        
        let setupFeeInCents = contract.setupFeePaid;
        
        // Fallback for legacy contracts without setupFeePaid populated
        if (!setupFeeInCents && setupFeeInCents !== 0) {
            const discountPercentage = parseInt(process.env.DISCOUNT_PERCENTAGE || '0');
            const applyDiscount = (amount) => Math.round(amount * (1 - (discountPercentage / 100)));
            if (process.env.TEST_MODE === 'true') {
                setupFeeInCents = tier === 'enterprise' ? 400 : tier === 'professional' ? 300 : tier === 'simple' ? 100 : 200;
            } else {
                if (tier === 'enterprise') {
                    setupFeeInCents = applyDiscount(parseInt(process.env.PRICE_ENTERPRISE_SETUP || '1499900'));
                } else if (tier === 'professional') {
                    setupFeeInCents = applyDiscount(parseInt(process.env.PRICE_PROFESSIONAL_SETUP || '799900'));
                } else if (tier === 'essential') {
                    setupFeeInCents = applyDiscount(parseInt(process.env.PRICE_ESSENTIAL_SETUP || '349900'));
                } else {
                    setupFeeInCents = applyDiscount(parseInt(process.env.PRICE_SIMPLE_SETUP || '149900'));
                }
            }
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
            await stripe.subscriptions.cancel(subscriptionId);
            const Contract = require('../models/Contract');
            const finalStatus = type === 'buyout' ? 'bought-out' : 'cancelled';
            await Contract.updateMany({ userId: user._id, status: 'active' }, { status: finalStatus });
            return res.json({ url: '/dashboard?success=true', zeroDollar: true });
        }

        const session = await stripe.checkout.sessions.create({
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
            success_url: `${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/dashboard?cancellation_success=true`,
            cancel_url: `${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/dashboard?canceled=true`
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
            status: 'all',
            expand: ['data.plan.product']
        });

        const grouped = { simple: [], essential: [], professional: [] };
        subscriptions.data.forEach(sub => {
            if (sub.status === 'canceled') return;
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
                <p><strong>Important Note on Cancellations:</strong> Your contract requires a strict 30-to-60 day notice window for penalty-free cancellation prior to your renewal date. You can easily manage your subscription and request cancellation by logging into your client dashboard on our website.</p>
                <p>If you have any questions, please reply directly to this email.</p>
                <br><br>
                ${process.env.EMAIL_SIGNATURE || ''}
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

    // Best Practice for long running servers is returning early, BUT on Vercel Serverless, 
    // returning early kills the function before async tasks finish. We must wait.
    
    // Process the event
    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            if (session.metadata && session.metadata.action === 'cancellation_payment') {
                try {
                    const subId = session.metadata.subscriptionId;
                    await stripe.subscriptions.cancel(subId);
                    const Contract = require('../models/Contract');

                    const finalStatus = session.metadata.type === 'buyout' ? 'bought-out' : 'cancelled';

                    await Contract.updateMany({ userId: session.metadata.userId, status: 'active' }, { status: finalStatus });
                    console.log(`[STRIPE] Cancellation processed. Status updated to ${finalStatus}`);

                    const amountPaid = (session.amount_total / 100).toFixed(0);
                    const paymentType = session.metadata.type === 'buyout' ? 'buyout' : 'cncl';
                    
                    const User = require('../models/user');
                    const user = await User.findById(session.metadata.userId);
                    const userName = user ? `${user.firstName}`.trim() : 'Unk';
                    const businessName = user ? user.businessName : 'Unk';

                    const smsMessage = `+${amountPaid} from ${userName} (${businessName}) for ${paymentType}`;
                    await sendAdminSMS(smsMessage);

                    return res.json({ received: true }); // Respond after processing
                } catch (err) {
                    console.error('Failed to process cancellation payment:', err);
                    return res.status(500).json({ error: 'Failed' });
                }
            }

            const { userId, tier, acceptedContract, contractTimestamp, setupFee, monthlyFee, discountCode } = session.metadata || {};

            // If a limited discount code was used, save it to the user so they can't use it again
            if (discountCode && discountCode.startsWith('DCL_') && userId !== 'guest') {
                const actualCode = discountCode.replace('DCL_', '');
                const User = require('../models/user');
                await User.findByIdAndUpdate(userId, {
                    $addToSet: { usedDiscountCodes: actualCode }
                }).catch(err => console.error('[STRIPE] Failed to add used discount code:', err));
            }

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

            if (acceptedContract === 'true' && userId !== 'guest') {
                const user = await User.findById(userId);
                if (user) {
                    userToEmail = user;
                    user.hasAcceptedContract = true;
                    user.contractAcceptedAt = new Date(contractTimestamp);
                    user.stripeCustomerId = session.customer;
                    user.subscriptionStatus = tier === 'simple' ? 'simple-build' : tier;
                    await user.save();

                    const legalService = require('../services/legal.service');
                    pdfBuffer = await legalService.generateMergedLegalPDF({
                        tier,
                        setupFee: parseInt(setupFee || '0'),
                        monthlyFee: parseInt(monthlyFee || '0')
                    });

                    const isDataTier = tier === 'data';
                    const contractType = isDataTier 
                        ? 'Data Intelligence Purchase' 
                        : (tier === 'simple' ? 'Yearly Service Agreement - Simple' : `Yearly Service Agreement - ${tier}`);
                    const projectType = session.metadata?.project_type || 'Phoenix Digital Services';

                    // Data tiers: no expiration (perpetual access). Website tiers: 1 year.
                    let expiresAt = isDataTier ? null : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

                    const newContract = new Contract({
                        userId: user._id,
                        contractType: contractType,
                        projectName: projectType,
                        stripeSubscriptionId: session.subscription || null,
                        tier: tier,
                        setupFeePaid: parseInt(setupFee || '0'),
                        monthlyFee: parseInt(monthlyFee || '0'),
                        acceptedAt: new Date(contractTimestamp),
                        status: 'active',
                        expiresAt: expiresAt,
                        pdfSnapshot: pdfBuffer,
                        reviewToken: require('crypto').randomUUID()
                    });
                    await newContract.save();

                    // --- DATA TIER: Create DataPurchase records + deliver data via email ---
                    if (isDataTier && user) {
                        try {
                            const DataPurchase = require('../models/DataPurchase');
                            let DataRecord;
                            try { DataRecord = require('mongoose').model('DataRecord'); } catch(e) { DataRecord = null; }

                            const cartBlocks = user.cart || [];
                            
                            if (cartBlocks.length > 0 && DataRecord) {
                                // Collect ALL record IDs across all cart blocks
                                const allRecordIds = [];
                                const purchases = [];

                                for (const block of cartBlocks) {
                                    const purchase = new DataPurchase({
                                        userId: user._id,
                                        recordIds: block.recordIds || [],
                                        searchQuery: block.searchQuery || '',
                                        filters: block.filters || {},
                                        status: 'paid',
                                        stripeSessionId: session.id,
                                        paidAt: new Date(),
                                        deliveryEmail: user.email,
                                        totalRecords: (block.recordIds || []).length,
                                        amountPaid: parseInt(process.env.PRICE_DATA || '24900'),
                                        blockLabel: block.blockLabel || 'Data Block'
                                    });
                                    await purchase.save();
                                    purchases.push(purchase);
                                    allRecordIds.push(...(block.recordIds || []));
                                }

                                // Fetch full records with contact info
                                const uniqueIds = [...new Set(allRecordIds.map(id => id.toString()))];
                                const fullRecords = await DataRecord.find({ 
                                    _id: { $in: uniqueIds } 
                                }).select('-raw').lean();

                                // Build CSV
                                const csvHeader = 'Company,Project Type,Budget,City,State,Contact Name,Email,Phone,Summary';
                                const csvRows = fullRecords.map(r => {
                                    const s = r.structured || {};
                                    const loc = s.location || {};
                                    const c = s.contactInfo || {};
                                    return [
                                        `"${(s.companyName || '').replace(/"/g, '""')}"`,
                                        `"${(s.projectType || '').replace(/"/g, '""')}"`,
                                        s.estimatedBudget || 0,
                                        `"${(loc.city || '').replace(/"/g, '""')}"`,
                                        `"${(loc.state || '').replace(/"/g, '""')}"`,
                                        `"${(c.name || '').replace(/"/g, '""')}"`,
                                        `"${(c.email || '').replace(/"/g, '""')}"`,
                                        `"${(c.phone || '').replace(/"/g, '""')}"`,
                                        `"${(s.executiveSummary || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                                    ].join(',');
                                });
                                const csvContent = [csvHeader, ...csvRows].join('\n');

                                // Build HTML email
                                const outreachService = require('../services/outreach.service');
                                
                                // Generate AI summary paragraph using persona from DB
                                let aiParagraph = '';
                                try {
                                    aiParagraph = await outreachService.generateDataDeliverySummary(fullRecords, user.firstName);
                                } catch (aiErr) {
                                    console.error('[DATA DELIVERY] AI paragraph failed:', aiErr.message);
                                }

                                const persona = await outreachService.getPersona();
                                const portalBase = process.env.PROD_FRONTEND_URL || 'https://phoenixwebsites.ai';

                                // Generate HMAC tokens for per-record direct links
                                const crypto = require('crypto');
                                const tokenSecret = process.env.JWT_SECRET || 'phoenix-data-secret';

                                const recordTableRows = fullRecords.slice(0, 50).map(r => {
                                    const s = r.structured || {};
                                    const loc = s.location || {};
                                    const c = s.contactInfo || {};
                                    const budget = s.estimatedBudget >= 1000000 
                                        ? `$${(s.estimatedBudget / 1000000).toFixed(1)}M`
                                        : s.estimatedBudget >= 1000 
                                            ? `$${(s.estimatedBudget / 1000).toFixed(0)}K`
                                            : `$${s.estimatedBudget || 0}`;
                                    const viewToken = crypto.createHmac('sha256', tokenSecret).update(r._id.toString()).digest('hex').substring(0, 24);
                                    const viewLink = `${portalBase}/data/${r._id}?token=${viewToken}`;
                                    return `<tr>
                                        <td style="padding:10px;border-bottom:1px solid #333"><a href="${viewLink}" style="color:#fff;text-decoration:none;font-weight:bold">${s.companyName || 'N/A'}</a></td>
                                        <td style="padding:10px;border-bottom:1px solid #333">${s.projectType || 'N/A'}</td>
                                        <td style="padding:10px;border-bottom:1px solid #333;color:#10b981;font-weight:bold">${budget}</td>
                                        <td style="padding:10px;border-bottom:1px solid #333">${loc.city || ''}${loc.state ? ', ' + loc.state : ''}</td>
                                        <td style="padding:10px;border-bottom:1px solid #333">${c.name || '—'}<br><a href="mailto:${c.email}" style="color:#ea580c">${c.email || '—'}</a><br>${c.phone || '—'}</td>
                                    </tr>`;
                                }).join('');

                                const deliveryHtml = `
                                <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:800px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden">
                                    <div style="background:linear-gradient(135deg,#ea580c 0%,#eab308 100%);padding:40px;text-align:center">
                                        <h1 style="margin:0;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:2px">Your Data Is Ready</h1>
                                        <p style="margin:10px 0 0;opacity:0.9;font-size:14px">${fullRecords.length} records • ${purchases.length} block(s) • Purchased ${new Date().toLocaleDateString()}</p>
                                    </div>
                                    <div style="padding:30px">
                                        <p style="color:#ccc;font-size:14px;line-height:1.8;margin-bottom:24px">${aiParagraph.replace(/\n/g, '<br>')}</p>
                                        
                                        <div style="overflow-x:auto;margin:24px 0">
                                            <table style="width:100%;border-collapse:collapse;font-size:13px;color:#ddd">
                                                <thead>
                                                    <tr style="background:#1a1a1a">
                                                        <th style="padding:12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#ea580c">Company</th>
                                                        <th style="padding:12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#ea580c">Project</th>
                                                        <th style="padding:12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#ea580c">Budget</th>
                                                        <th style="padding:12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#ea580c">Location</th>
                                                        <th style="padding:12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#ea580c">Contact</th>
                                                    </tr>
                                                </thead>
                                                <tbody>${recordTableRows}</tbody>
                                            </table>
                                        </div>
                                        ${fullRecords.length > 50 ? '<p style="color:#666;font-size:12px;text-align:center">Showing first 50 records. Full data in attached CSV.</p>' : ''}
                                        
                                        <div style="text-align:center;margin:30px 0">
                                            <a href="${portalBase}/data" style="display:inline-block;padding:16px 40px;border-radius:14px;background:linear-gradient(135deg,#ea580c,#d97706);color:white;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:2px;text-decoration:none">View All Records on Portal</a>
                                        </div>

                                        <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-top:24px;text-align:center">
                                            <p style="color:#999;font-size:12px;margin:0">Click any company name above to view the full unlocked record, or visit</p>
                                            <a href="${portalBase}/data" style="color:#ea580c;font-size:14px;font-weight:bold;text-decoration:none">${portalBase}/data</a>
                                            <p style="color:#666;font-size:11px;margin:10px 0 0">Your Library tab shows all your purchases with full contact info.</p>
                                        </div>
                                        
                                        <p style="color:#666;font-size:11px;margin-top:30px;text-align:center">This purchase is non-refundable. All data sourced from public records under FOIA.</p>
                                        <p style="color:#444;font-size:11px;text-align:center;margin-top:8px">— ${persona.senderName}, ${persona.companyName}</p>
                                    </div>
                                </div>`;

                                // Send delivery email
                                const nodemailer = require('nodemailer');
                                const deliveryTransporter = nodemailer.createTransport({
                                    host: process.env.SMTP_HOST || 'smtppro.zoho.com',
                                    port: parseInt(process.env.SMTP_PORT || '465'),
                                    secure: true,
                                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                                });

                                await deliveryTransporter.sendMail({
                                    from: `"${persona.companyName} Data Intelligence" <${process.env.EMAIL_USER}>`,
                                    to: user.email,
                                    subject: `Your ${persona.companyName} Data Intelligence — ${fullRecords.length} Records Ready`,
                                    html: deliveryHtml,
                                    attachments: [{
                                        filename: `${persona.companyName.toLowerCase().replace(/\s+/g, '-')}-data-${new Date().toISOString().slice(0,10)}.csv`,
                                        content: csvContent,
                                        contentType: 'text/csv'
                                    }]
                                });

                                // Mark purchases as delivered
                                for (const p of purchases) {
                                    p.status = 'delivered';
                                    p.deliveredAt = new Date();
                                    await p.save();
                                }

                                // Clear the user's cart
                                user.cart = [];
                                await user.save();

                                console.log(`[DATA DELIVERY] ${fullRecords.length} records sent to ${user.email} (${purchases.length} blocks)`);
                            }
                        } catch (dataErr) {
                            console.error('[DATA DELIVERY] Failed to deliver data:', dataErr.message);
                        }
                    }
                }
            }

            if (userToEmail || session.customer_details?.email) {
                const emailTarget = userToEmail?.email || session.customer_details?.email;
                const userName = userToEmail ? `${userToEmail.firstName} ${userToEmail.lastName}`.trim() : session.metadata?.customer_name;
                const businessName = userToEmail?.businessName || session.metadata?.business_name || 'Not Provided';
                const projectType = session.metadata?.project_type || 'Phoenix Digital Services';

                // Update the Stripe Customer object with Business Name and Name
                try {
                    await stripe.customers.update(session.customer, {
                        name: businessName !== 'Not Provided' ? businessName : userName,
                        description: `Contact: ${userName}`,
                        metadata: {
                            individual_name: userName,
                            business_name: businessName,
                            tier: tier || 'Unknown'
                        }
                    });
                    console.log(`[STRIPE] Customer ${session.customer} updated with name/business_name.`);
                } catch (err) {
                    console.error('[STRIPE] Failed to update customer name:', err.message);
                }

                // 1. Send Receipt to Client
                sendReceiptEmail(emailTarget, userName, session.amount_total, projectType, pdfBuffer)
                    .catch(err => console.error('Background email failed:', err));

                // 2. Send Alert to Admin (Carter)
                try {
                    const nodemailer = require('nodemailer');
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST || 'smtppro.zoho.com',
                        port: parseInt(process.env.SMTP_PORT || '465'),
                        secure: true,
                        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                    });

                    transporter.sendMail({
                        from: `"Phoenix System Alerts" <${process.env.EMAIL_USER}>`,
                        to: process.env.EMAIL_USER,
                        subject: `🚀 NEW CLIENT ONBOARDED: ${businessName} / ${userName || 'Unknown'}`,
                        html: `
                        <div style="font-family: sans-serif; line-height: 1.6; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                            <h2 style="color: #ea580c;">New Client Checkout Completed!</h2>
                            <p>A new client has successfully paid and completed onboarding.</p>
                            <ul>
                                <li><strong>Client Name:</strong> ${userName || 'Unknown'}</li>
                                <li><strong>Business Name:</strong> ${businessName}</li>
                                <li><strong>Email:</strong> ${emailTarget}</li>
                                <li><strong>Project Type:</strong> ${projectType}</li>
                                <li><strong>Tier:</strong> ${tier || 'Unknown'}</li>
                                <li><strong>Amount Paid Today:</strong> $${(session.amount_total / 100).toFixed(2)}</li>
                            </ul>
                            <p>You can view their full billing details in the Stripe Dashboard.</p>
                        </div>
                    `
                    }).catch(err => console.error('Admin alert email failed:', err));
                } catch (err) {
                    console.error('Admin alert error:', err);
                }

                // 3. Send SMS Alert to Admin
                const amountPaid = (session.amount_total / 100).toFixed(0);
                let paymentType = 'new sub';
                if (tier === 'simple') paymentType = 'new site';
                
                const shortTier = tier ? tier.substring(0, 4) : 'unk';
                const smsMessage = `+${amountPaid} from ${userName || 'Unk'} for ${paymentType} [${shortTier}]`;
                await sendAdminSMS(smsMessage);
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
                            const pdfBuffer = await legalService.generateMergedLegalPDF({
                                tier: contract.tier,
                                setupFee: contract.setupFeePaid,
                                monthlyFee: contract.monthlyFee
                            });

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
                                <br><br>
                                ${process.env.EMAIL_SIGNATURE || ''}
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
                    const User = require('../models/user');
                    const Contract = require('../models/Contract');
                    const user = await User.findOne({ stripeCustomerId: invoice.customer });

                    if (user) {
                        // Restore website access (Kill Switch Untrigger)
                        await Contract.updateMany({ userId: user._id, status: 'breached' }, { status: 'active' });

                        const amountPaid = (invoice.amount_paid / 100).toFixed(0);
                        if (amountPaid > 0) {
                            const userName = `${user.firstName}`.trim();
                            const smsMessage = `+${amountPaid} from ${userName} (sub rnwl)`;
                            await sendAdminSMS(smsMessage);
                        }
                    } else {
                        const amountPaid = (invoice.amount_paid / 100).toFixed(0);
                        if (amountPaid > 0) {
                            const smsMessage = `+${amountPaid} from Unk (sub rnwl)`;
                            await sendAdminSMS(smsMessage);
                        }
                    }
                } catch (err) {
                    console.error('Failed to process invoice.payment_succeeded event:', err);
                }
            }
        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            try {
                const User = require('../models/user');
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
                    const User = require('../models/user');
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

        // Return 200 OK to Stripe AFTER all processing is done so Vercel doesn't kill the function early
        res.json({ received: true });
    } catch (err) {
        console.error('Webhook processing error:', err);
        if (!res.headersSent) res.status(500).send('Webhook processing failed');
    }
});

/**
 * GET /api/stripe/pricing
 * Exposes current dynamic pricing to the frontend
 */
router.get('/pricing', (req, res) => {
    const isTestMode = process.env.TEST_MODE === 'true';
    res.json({
        discountPercentage: isTestMode ? 0 : parseInt(process.env.DISCOUNT_PERCENTAGE || '0'),
        basePrices: {
            simple_setup: isTestMode ? 100 : parseInt(process.env.PRICE_SIMPLE_SETUP || '149900'),
            simple_monthly: isTestMode ? 100 : parseInt(process.env.PRICE_SIMPLE_MONTHLY || '9900'),
            essential_setup: isTestMode ? 200 : parseInt(process.env.PRICE_ESSENTIAL_SETUP || '349900'),
            essential_monthly: isTestMode ? 200 : parseInt(process.env.PRICE_ESSENTIAL_MONTHLY || '29900'),
            professional_setup: isTestMode ? 300 : parseInt(process.env.PRICE_PROFESSIONAL_SETUP || '799900'),
            professional_monthly: isTestMode ? 300 : parseInt(process.env.PRICE_PROFESSIONAL_MONTHLY || '59900'),
            enterprise_setup: isTestMode ? 400 : parseInt(process.env.PRICE_ENTERPRISE_SETUP || '1499900'),
            enterprise_monthly: isTestMode ? 400 : parseInt(process.env.PRICE_ENTERPRISE_MONTHLY || '99900'),
            // Data Intelligence Tiers (One-Time, Non-Refundable)
            data: isTestMode ? 100 : parseInt(process.env.PRICE_DATA || '24900')
        }
    });
});

module.exports = router;
