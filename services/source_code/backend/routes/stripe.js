const express = require('express');
const router = express.Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.NG_APP_STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);

/**
 * Middleware to verify Stripe configuration
 */
const verifyStripe = (req, res, next) => {
    if (!stripeSecretKey) {
        console.error('STRIPE: Secret key missing in environment.');
        return res.status(503).json({ error: 'Stripe is not configured on the server. Please add STRIPE_SECRET_KEY to .env.local' });
    }
    next();
};

/**
 * POST /api/stripe/checkout
 * Generates a dynamic Stripe Checkout session for services.
 */
router.post('/checkout', verifyStripe, async (req, res) => {
    try {
        const { tier, email, name, projectType, message } = req.body;

        // Pricing logic (matching latest requirements)
        const prices = {
            simple: 35000,       // $350.00
            essential: 25000,    // $250.00 (Setup Fee)
            professional: 50000  // $500.00 (Setup Fee)
        };

        let amount = 0;
        let title = '';

        switch (tier) {
            case 'simple':
                amount = prices.simple;
                title = 'Simple Launch - Website Build';
                break;
            case 'essential':
                amount = prices.essential;
                title = 'Essential Care - Setup Fee';
                break;
            case 'professional':
                amount = prices.professional;
                title = 'Professional Growth - Setup Fee';
                break;
            default:
                return res.status(400).json({ error: 'Invalid service tier selected.' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: title,
                            description: `Strategic Infrastructure: ${projectType || 'Standard Build'}`,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.origin}/contact?success=true`,
            cancel_url: `${req.headers.origin}/services?canceled=true`,
            customer_email: email,
            metadata: {
                tier,
                customer_name: name,
                project_type: projectType,
                initial_message: message,
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
 * Generates a Stripe Customer Portal link for subscription management.
 */
router.post('/create-portal-session', verifyStripe, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required to locate your account.' });
        }

        // 1. Find customer by email
        const customers = await stripe.customers.list({
            email: email.toLowerCase(),
            limit: 1
        });

        if (customers.data.length === 0) {
            return res.status(404).json({ error: 'No subscription found with this email. Please ensure you used this email at checkout.' });
        }

        const customerId = customers.data[0].id;

        // 2. Create Portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${req.headers.origin}/services`,
        });

        res.json({ url: portalSession.url });

    } catch (err) {
        console.error('STRIPE PORTAL ERROR:', err.message);
        res.status(500).json({ error: 'Failed to initialize management portal.' });
    }
});

/**
 * GET /api/stripe/subscriptions/:email
 * Returns active subscriptions grouped by tier metadata.
 */
router.get('/subscriptions/:email', verifyStripe, async (req, res) => {
    try {
        const { email } = req.params;
        
        // 1. Find customer
        const customers = await stripe.customers.list({
            email: email.toLowerCase(),
            limit: 1
        });

        if (customers.data.length === 0) {
            return res.json({ subscriptions: {} });
        }

        const customerId = customers.data[0].id;

        // 2. Fetch all active subscriptions
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            expand: ['data.plan.product']
        });

        // 3. Group by tier (using metadata or product name as fallback)
        const grouped = {
            simple: [],
            essential: [],
            professional: []
        };

        subscriptions.data.forEach(sub => {
            const tier = sub.metadata.tier || 
                         (sub.plan.product.name.toLowerCase().includes('essential') ? 'essential' : 
                          sub.plan.product.name.toLowerCase().includes('professional') ? 'professional' : 'simple');
            
            if (grouped[tier]) {
                grouped[tier].push({
                    id: sub.id,
                    status: sub.status,
                    current_period_end: sub.current_period_end,
                    cancel_at_period_end: sub.cancel_at_period_end,
                    product_name: sub.plan.product.name
                });
            }
        });

        res.json({ subscriptions: grouped });

    } catch (err) {
        console.error('FETCH SUBSCRIPTIONS ERROR:', err.message);
        res.status(500).json({ error: 'Failed to fetch your subscription status.' });
    }
});

module.exports = router;
