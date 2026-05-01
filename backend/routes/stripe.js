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
        return res.status(503).json({ error: 'Stripe not configured.' });
    }
    next();
};

/**
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', verifyStripe, async (req, res) => {
    try {
        const { tierId, acceptedContract, contractTimestamp } = req.body;
        const user = req.user;

        const tiers = {
          essential: { price: 49900, name: 'Phoenix Core' },
          advanced: { price: 99900, name: 'Phoenix Pro' },
          enterprise: { price: 249900, name: 'Phoenix Elite' }
        };

        const tier = tiers[tierId];
        if (!tier) return res.status(400).json({ error: 'Invalid tier' });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: tier.name,
                            description: 'Yearly Service Commitment - Next-Gen Infrastructure',
                        },
                        unit_amount: tier.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // Or 'subscription' if we want recurring, but user said yearly contract paid yearly?
            success_url: `${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/dashboard?success=true`,
            cancel_url: `${process.env.PROD_FRONTEND_URL || 'http://localhost:4200'}/services?canceled=true`,
            customer_email: user ? user.email : undefined,
            metadata: {
                tierId,
                userId: user ? user._id.toString() : 'guest',
                acceptedContract: 'true',
                contractTimestamp
            },
        });

        res.json({ url: session.url });

    } catch (err) {
        console.error('STRIPE ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Webhook handler to record contracts
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, tierId, acceptedContract, contractTimestamp } = session.metadata;

        if (acceptedContract === 'true' && userId !== 'guest') {
            const user = await User.findById(userId);
            if (user) {
                user.hasAcceptedContract = true;
                user.contractAcceptedAt = new Date(contractTimestamp);
                user.stripeCustomerId = session.customer;
                user.subscriptionStatus = tierId;
                await user.save();

                // Create Contract record
                const newContract = new Contract({
                    userId: user._id,
                    contractType: `Yearly Service Agreement - ${tierId}`,
                    acceptedAt: new Date(contractTimestamp),
                    status: 'active',
                    expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                });
                await newContract.save();
            }
        }
    }

    res.json({ received: true });
});

module.exports = router;
