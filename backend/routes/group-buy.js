const express = require('express');
const router = express.Router();
const ownerAuth = require('../middleware/owner-auth');
const GroupBuyEvent = require('../models/GroupBuyEvent');
const GroupBuyEntry = require('../models/GroupBuyEntry');
const svc = require('../services/group-buy.service');
const stripe = svc.stripe;

const BASE_URL = process.env.PROD_FRONTEND_URL || 'https://phoenixwebsites.ai';

function requireUser(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Sign in to join the group buy.' });
  }
  next();
}

/** The event the public page should show: an open one, else the latest. */
async function currentEvent() {
  const open = await GroupBuyEvent.findOne({ status: { $in: ['open', 'filling'] } }).sort({ createdAt: -1 });
  if (open) return open;
  return GroupBuyEvent.findOne({ status: { $in: ['draft', 'completed', 'missed', 'cancelled'] } }).sort({ createdAt: -1 });
}

// ---------------------------------------------------------------
// Public
// ---------------------------------------------------------------

router.get('/current', async (req, res) => {
  try {
    // The rotation appears on its own schedule; a page view is one of
    // its chances to open the next event when the time has come.
    await svc.maybeOpenNextEvent().catch(() => {});
    const event = await currentEvent();
    res.json({ event: await svc.publicEventView(event) });
  } catch (err) {
    res.status(500).json({ error: 'Could not load the group buy.' });
  }
});

/** One-click unsubscribe from announcement emails (link in every announcement). */
router.get('/unsubscribe', async (req, res) => {
  try {
    const { u, t } = req.query;
    if (!u || !t || svc.unsubscribeToken(String(u)) !== String(t)) {
      return res.status(400).send('<p style="font-family:Arial">That unsubscribe link is not valid.</p>');
    }
    const User = require('../models/user');
    await User.findByIdAndUpdate(u, { eventEmailsOptIn: false });
    res.send('<p style="font-family:Arial">You are unsubscribed from Phoenix Websites AI group buy and event announcement emails. Transactional emails about your orders and account will still be sent. To resubscribe, accept the current terms again from your account banner.</p>');
  } catch (err) {
    res.status(500).send('<p style="font-family:Arial">Something went wrong. Please reply to any announcement email with UNSUBSCRIBE instead.</p>');
  }
});

// ---------------------------------------------------------------
// Buyer flow
// ---------------------------------------------------------------

/** Step 1 of joining: create the SetupIntent that saves the card. */
router.post('/join/setup-intent', requireUser, async (req, res) => {
  try {
    const event = await GroupBuyEvent.findOne({ status: 'open' }).sort({ createdAt: -1 });
    if (!event) return res.status(404).json({ error: 'No group buy is open right now.' });
    if (event.deadline && new Date() > event.deadline) return res.status(400).json({ error: 'The deadline for this group buy has passed.' });
    const existing = await GroupBuyEntry.findOne({ event: event._id, user: req.user._id });
    if (existing && existing.status !== 'cancelled_by_buyer') {
      return res.status(400).json({ error: 'You already have a spot in this group buy.' });
    }
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || undefined,
        metadata: { userId: String(req.user._id) }
      });
      customerId = customer.id;
      const User = require('../models/user');
      await User.findByIdAndUpdate(req.user._id, { stripeCustomerId: customerId });
    }
    const intent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { eventId: String(event._id), userId: String(req.user._id) }
    });
    res.json({ clientSecret: intent.client_secret, eventId: String(event._id) });
  } catch (err) {
    console.error('[GROUP-BUY] setup-intent failed', err.message);
    res.status(500).json({ error: 'Could not start the card setup. Please try again.' });
  }
});

/** Step 2: the browser saved the card; record the seat. */
router.post('/join/complete', requireUser, async (req, res) => {
  try {
    const { setupIntentId } = req.body || {};
    if (!setupIntentId) return res.status(400).json({ error: 'Missing card setup reference.' });
    const { event, entry } = await svc.completeJoin(req.user, setupIntentId);
    res.json({ ok: true, entryId: String(entry._id), status: entry.status, event: await svc.publicEventView(event) });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not complete joining.' });
  }
});

/** Leave the group while it is open. Free, no questions. */
router.post('/entries/:id/cancel', requireUser, async (req, res) => {
  try {
    const entry = await GroupBuyEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    if (entry.status !== 'joined') return res.status(400).json({ error: 'Only an active, unfilled spot can be cancelled.' });
    const event = await GroupBuyEvent.findById(entry.event);
    if (!event || event.status !== 'open') return res.status(400).json({ error: 'This group buy is no longer open.' });
    entry.status = 'cancelled_by_buyer';
    await entry.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not cancel. Please try again.' });
  }
});

/** The signed-in buyer's own entries, with their discount code. */
router.get('/mine', requireUser, async (req, res) => {
  try {
    const entries = await GroupBuyEntry.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('event');
    res.json({
      entries: entries.map(e => ({
        id: String(e._id),
        status: e.status,
        joinPriceCents: e.joinPriceCents,
        couponCode: e.status === 'charged' ? e.couponCode : '',
        fixDeadline: e.fixDeadline,
        createdAt: e.createdAt,
        event: e.event ? {
          id: String(e.event._id),
          name: e.event.name,
          percentOff: e.event.percentOff,
          capSetupCents: e.event.capSetupCents,
          capMonthlyCents: e.event.capMonthlyCents,
          slotsNeeded: e.event.slotsNeeded,
          status: e.event.status,
          deadline: e.event.deadline
        } : null
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not load your group buys.' });
  }
});

/** Fix window: send the buyer to a Checkout session for the join price. */
router.post('/entries/:id/fix-checkout', requireUser, async (req, res) => {
  try {
    const entry = await GroupBuyEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    if (entry.status !== 'charge_failed') return res.status(400).json({ error: 'This entry is not waiting on a payment fix.' });
    if (entry.fixDeadline && new Date() > entry.fixDeadline) return res.status(400).json({ error: 'The fix window for this spot has closed.' });
    const event = await GroupBuyEvent.findById(entry.event);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Group buy join price: ${event ? event.name : 'Phoenix Websites AI'}` },
          unit_amount: entry.joinPriceCents
        },
        quantity: 1
      }],
      customer_email: req.user.email,
      success_url: `${BASE_URL}/group-buy?fix_session={CHECKOUT_SESSION_ID}&entry=${entry._id}`,
      cancel_url: `${BASE_URL}/group-buy?fix=cancelled`,
      metadata: { purpose: 'group_buy_fix', entryId: String(entry._id), userId: String(req.user._id) }
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[GROUP-BUY] fix checkout failed', err.message);
    res.status(500).json({ error: 'Could not open the payment page. Please try again.' });
  }
});

/** Fix window: confirm the Checkout payment landed, issue the code. */
router.post('/entries/:id/fix-confirm', requireUser, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'Missing checkout reference.' });
    const entry = await svc.completeFixPayment(req.user, req.params.id, sessionId);
    res.json({ ok: true, status: entry.status, couponCode: entry.couponCode });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not confirm that payment.' });
  }
});

// ---------------------------------------------------------------
// Admin (owner session only)
// ---------------------------------------------------------------

router.get('/admin/events', ownerAuth, async (req, res) => {
  const events = await GroupBuyEvent.find().sort({ createdAt: -1 }).limit(20);
  const out = [];
  for (const event of events) {
    const counts = await GroupBuyEntry.aggregate([
      { $match: { event: event._id } },
      { $group: { _id: '$status', n: { $sum: 1 } } }
    ]);
    out.push({ ...event.toObject(), counts: Object.fromEntries(counts.map(c => [c._id, c.n])) });
  }
  res.json({ events: out });
});

router.post('/admin/events', ownerAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const percentOff = parseInt(b.percentOff, 10);
    const joinPriceCents = parseInt(b.joinPriceCents, 10);
    const slotsNeeded = parseInt(b.slotsNeeded, 10);
    const windowDays = parseInt(b.windowDays, 10);
    const capSetupCents = parseInt(b.capSetupCents, 10);
    const capMonthlyCents = parseInt(b.capMonthlyCents, 10);
    if (!(percentOff >= 1 && percentOff <= 95)) return res.status(400).json({ error: 'Percent off must be 1 to 95.' });
    if (!(joinPriceCents >= 100)) return res.status(400).json({ error: 'Join price must be at least $1.' });
    if (!(slotsNeeded >= 3 && slotsNeeded <= 10)) return res.status(400).json({ error: 'Slots must be 3 to 10. Group buys stay small.' });
    if (!(windowDays >= 1 && windowDays <= 30)) return res.status(400).json({ error: 'Window must be 1 to 30 days.' });
    if (!(capSetupCents >= 0) || !(capMonthlyCents >= 0)) return res.status(400).json({ error: 'Caps must be 0 or more.' });
    if (!b.name || !String(b.name).trim()) return res.status(400).json({ error: 'Give the event a name.' });
    if (!b.capacityReason || !String(b.capacityReason).trim()) return res.status(400).json({ error: 'A capacity reason is required. It is printed next to the slot count.' });
    const existing = await GroupBuyEvent.findOne({ status: { $in: ['draft', 'open', 'filling'] } });
    if (existing) return res.status(400).json({ error: 'Another group buy is already draft or open. One at a time.' });
    const event = await GroupBuyEvent.create({
      name: String(b.name).trim(),
      percentOff,
      joinPriceCents,
      slotsNeeded,
      windowDays,
      capSetupCents,
      capMonthlyCents,
      capacityReason: String(b.capacityReason).trim(),
      redeemWindowDays: b.redeemWindowDays ? parseInt(b.redeemWindowDays, 10) : 90,
      createdBy: req.user.email
    });
    res.json({ event });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not create the event.' });
  }
});

router.post('/admin/events/:id/open', ownerAuth, async (req, res) => {
  try {
    const event = await GroupBuyEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    if (event.status !== 'draft') return res.status(400).json({ error: 'Only a draft can be opened.' });
    const other = await GroupBuyEvent.findOne({ _id: { $ne: event._id }, status: { $in: ['open', 'filling'] } });
    if (other) return res.status(400).json({ error: 'Another group buy is already open. One at a time.' });
    event.startsAt = new Date();
    event.deadline = new Date(Date.now() + event.windowDays * 24 * 60 * 60 * 1000);
    event.status = 'open';
    await event.save();
    svc.announceEvent(event).catch(e => console.error('[GROUP-BUY] announcement failed', e.message));
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: 'Could not open the event.' });
  }
});

router.post('/admin/events/:id/cancel', ownerAuth, async (req, res) => {
  try {
    const event = await GroupBuyEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    if (!['draft', 'open'].includes(event.status)) return res.status(400).json({ error: 'This event can no longer be cancelled.' });
    event.status = 'cancelled';
    event.closedAt = new Date();
    await event.save();
    const entries = await GroupBuyEntry.find({ event: event._id, status: 'joined' });
    for (const entry of entries) {
      entry.status = 'not_charged';
      await entry.save();
      await svc.sendNotChargedEmail(event, entry, 'cancelled').catch(() => {});
    }
    await svc.scheduleNextGap();
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: 'Could not cancel the event.' });
  }
});

router.get('/admin/events/:id/entries', ownerAuth, async (req, res) => {
  const entries = await GroupBuyEntry.find({ event: req.params.id }).sort({ createdAt: 1 }).populate('user', 'firstName lastName email');
  res.json({
    entries: entries.map(e => ({
      id: String(e._id),
      status: e.status,
      joinPriceCents: e.joinPriceCents,
      couponCode: e.couponCode,
      chargedAt: e.chargedAt,
      createdAt: e.createdAt,
      user: e.user ? { name: `${e.user.firstName || ''} ${e.user.lastName || ''}`.trim(), email: e.user.email } : null
    }))
  });
});

router.get('/admin/rotation', ownerAuth, async (req, res) => {
  const state = await svc.ensureRotation();
  const { getPreset } = require('../config/group-buy-presets');
  const nextKey = state.order && state.order[state.nextIndex];
  res.json({
    enabled: state.enabled,
    nextOpenAt: state.nextOpenAt,
    cyclePosition: state.nextIndex,
    cycleLength: state.order ? state.order.length : 0,
    nextPreset: nextKey ? getPreset(nextKey) : null
  });
});

router.post('/admin/rotation', ownerAuth, async (req, res) => {
  const state = await svc.ensureRotation();
  if (typeof req.body?.enabled === 'boolean') state.enabled = req.body.enabled;
  await state.save();
  res.json({ enabled: state.enabled });
});

router.post('/admin/rotation/next-now', ownerAuth, async (req, res) => {
  try {
    const event = await svc.forceOpenNextEvent();
    if (!event) return res.status(400).json({ error: 'An event is already draft, open, or filling. The rotation runs one at a time.' });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not start the next event.' });
  }
});

module.exports = router;
