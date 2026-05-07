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

        // Pricing logic (matching old portfolio requirements)
        const prices = {
            simple: 35000,       // $350.00
            essential: 25000,    // $250.00 (Setup Fee)
            professional: 50000  // $500.00 (Setup Fee)
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
                        },
                        unit_amount: prices.simple,
                    },
                    quantity: 1,
                });
                break;
            case 'essential':
                mode = 'subscription';
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Essential Care - Setup Fee', description: `Strategic Infrastructure: ${projectType || 'Standard Build'}` },
                        unit_amount: prices.essential,
                    },
                    quantity: 1,
                });
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Essential Care - Monthly Subscription' },
                        unit_amount: 9900,
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
                        product_data: { name: 'Professional Growth - Setup Fee', description: `Strategic Infrastructure: ${projectType || 'Standard Build'}` },
                        unit_amount: prices.professional,
                    },
                    quantity: 1,
                });
                line_items.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Professional Growth - Monthly Subscription' },
                        unit_amount: 14900,
                        recurring: { interval: 'month' }
                    },
                    quantity: 1,
                });
                break;
            default:
                return res.status(400).json({ error: 'Invalid service tier selected.' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: mode,
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
        });

        res.json({ url: session.url });

    } catch (err) {
        console.error('STRIPE ERROR:', err.message);
        res.status(500).json({ error: 'Failed to initialize checkout session.' });
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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, tier, acceptedContract, contractTimestamp } = session.metadata;

        if (acceptedContract === 'true' && userId !== 'guest' && tier !== 'simple') {
            const user = await User.findById(userId);
            if (user) {
                user.hasAcceptedContract = true;
                user.contractAcceptedAt = new Date(contractTimestamp);
                user.stripeCustomerId = session.customer;
                user.subscriptionStatus = tier;
                await user.save();

                const newContract = new Contract({
                    userId: user._id,
                    contractType: `Yearly Service Agreement - ${tier}`,
                    acceptedAt: new Date(contractTimestamp),
                    status: 'active',
                    expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                });
                await newContract.save();
            }
        } else if (tier === 'simple' && userId !== 'guest') {
            // Just update subscription status for one-time build
            const user = await User.findById(userId);
            if (user) {
                user.subscriptionStatus = 'simple-build';
                user.stripeCustomerId = session.customer;
                await user.save();
            }
        }
    }
    res.json({ received: true });
});

module.exports = router;
