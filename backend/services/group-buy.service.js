/**
 * Group Buy service: sells a capped high-percentage discount, never a
 * website. Buyers save a card (SetupIntent) at join; nobody is charged
 * unless the group fills by the deadline. On a fill, each buyer is
 * charged the join price off-session and issued a personal
 * percentage_capped Coupon (see models/Coupon.js). On a miss, nothing
 * was ever charged, so there is nothing to refund or release.
 *
 * Tone rules live here too: one open event at a time (enforced in the
 * admin routes), thresholds lock when the event opens, cancellation is
 * free while the event is open, and a missed group gets a same-day
 * "you were not charged" email.
 */
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const GroupBuyEvent = require('../models/GroupBuyEvent');
const GroupBuyEntry = require('../models/GroupBuyEntry');
const Coupon = require('../models/Coupon');
const User = require('../models/user');

const BASE_URL = process.env.PROD_FRONTEND_URL || 'https://phoenixwebsites.ai';
const FIX_WINDOW_DAYS = 7;

const getTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtppro.zoho.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const money = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (d) => new Date(d).toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

async function sendMail(to, subject, text) {
  if (!to) return;
  const html = `<div style="font-family:Arial,sans-serif;color:#2b2118;line-height:1.55">${text.split('\n').map(l => l.trim() === '' ? '' : `<p style="margin:0 0 10px">${l}</p>`).join('')}</div>`;
  await getTransporter().sendMail({
    from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
    to, subject, text, html
  });
}

async function loadUser(entry) {
  if (entry.user && entry.user.email) return entry.user;
  return User.findById(entry.user);
}

async function sendJoinedEmail(event, entry, user) {
  const count = await GroupBuyEntry.countDocuments({ event: event._id, status: { $in: ['joined', 'charged'] } });
  const text = [
    `Hi ${user.firstName || 'there'},`,
    `You joined the group buy "${event.name}" at Phoenix Websites AI.`,
    `What you bought: a code for ${event.percentOff}% off, applied to up to ${money(event.capSetupCents)} of a website setup price and up to ${money(event.capMonthlyCents)} of the monthly price. It is a discount only; no website is included by itself.`,
    `So far ${count} of ${event.slotsNeeded} people have joined. If the group reaches ${event.slotsNeeded} by ${when(event.deadline)}, your saved card is charged ${money(event.joinPriceCents)} and your personal discount code is emailed to you. If the group does not fill, your card is never charged and there is nothing to refund.`,
    `The ${money(event.joinPriceCents)} buys the discount itself. It is not a deposit and does not come off your project price later.`,
    `Plans change? You can leave free any time before the group fills, from your dashboard at ${BASE_URL}/dashboard. No call needed.`,
    `Questions: reply to this email or write hello@phoenixwebsites.ai.`
  ].join('\n');
  await sendMail(user.email, `You are in: ${event.name} group buy`, text);
}

async function sendChargedEmail(event, entry, coupon) {
  const user = await loadUser(entry);
  if (!user) return;
  const text = [
    `Hi ${user.firstName || 'there'},`,
    `The group filled, so your card was charged ${money(entry.joinPriceCents)} for the group buy "${event.name}", and your discount is ready.`,
    `Your personal code: ${coupon.code}`,
    `It takes ${event.percentOff}% off up to ${money(event.capSetupCents)} of your setup price and up to ${money(event.capMonthlyCents)} of your monthly price, on any website package. Build your site at ${BASE_URL}/services and enter the code at checkout. The code is tied to your account, works once, and expires ${when(coupon.expiresAt)}. Projects are scheduled in the order codes are redeemed.`
  ].join('\n');
  await sendMail(user.email, `The group filled: your ${event.percentOff}% discount code is ready`, text);
}

async function sendFixEmail(event, entry) {
  const user = await loadUser(entry);
  if (!user) return;
  const text = [
    `Hi ${user.firstName || 'there'},`,
    `Good news first: the group buy "${event.name}" filled, and your spot is being held. The catch: the card you saved could not be charged the ${money(entry.joinPriceCents)} join price.`,
    `You have until ${when(entry.fixDeadline)} to pay with a working card and keep your ${event.percentOff}% discount. Pay here: ${BASE_URL}/group-buy`,
    `If the window passes without payment, your spot is released. The rest of the group is not affected either way.`
  ].join('\n');
  await sendMail(user.email, `Action needed: your group buy card could not be charged`, text);
}

async function sendNotChargedEmail(event, entry, reason) {
  const user = await loadUser(entry);
  if (!user) return;
  const lead = reason === 'cancelled'
    ? `The group buy "${event.name}" was cancelled before it filled.`
    : `The group buy "${event.name}" did not reach ${event.slotsNeeded} people by ${when(event.deadline)}.`;
  const text = [
    `Hi ${user.firstName || 'there'},`,
    lead,
    `As promised, your card was never charged. There is nothing to refund and nothing you need to do.`,
    `Thanks for joining. If another group buy runs, it will be announced on ${BASE_URL}. Regular pricing is always available there too.`
  ].join('\n');
  await sendMail(user.email, `Group buy update: you were not charged`, text);
}

async function sendDroppedEmail(event, entry) {
  const user = await loadUser(entry);
  if (!user) return;
  const text = [
    `Hi ${user.firstName || 'there'},`,
    `The payment window for your spot in the group buy "${event.name}" has closed, so the spot has been released.`,
    `If you still want the discount in a future group buy, watch ${BASE_URL}/group-buy for the next one.`
  ].join('\n');
  await sendMail(user.email, `Your group buy spot was released`, text);
}

/** Issue the buyer's personal capped-percentage coupon. */
async function issueCoupon(event, entry) {
  const user = await loadUser(entry);
  const expiresAt = new Date(Date.now() + event.redeemWindowDays * 24 * 60 * 60 * 1000);
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = `GB${event.percentOff}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    try {
      return await Coupon.create({
        code,
        type: 'percentage_capped',
        amount: event.percentOff,
        appliesTo: 'both',
        capSetupCents: event.capSetupCents,
        capMonthlyCents: event.capMonthlyCents,
        bypassFloors: true,
        issuedToUserId: String(entry.user._id || entry.user),
        usageLimit: 1,
        perCustomerLimit: 1,
        startsAt: new Date(),
        expiresAt,
        notes: `Group buy "${event.name}" issued to ${user ? user.email : 'unknown'}`,
        createdBy: 'group-buy'
      });
    } catch (err) {
      if (err && err.code === 11000) continue; // code collision, mint another
      throw err;
    }
  }
  throw new Error('Could not mint a unique discount code');
}

/** Charge every joined entry. Called once per fill; safe to re-run. */
async function runFillCharges(event) {
  const entries = await GroupBuyEntry.find({ event: event._id, status: 'joined' });
  for (const entry of entries) {
    try {
      if (!entry.stripeCustomerId || !entry.paymentMethodId) throw new Error('No saved card on this entry');
      const pi = await stripe.paymentIntents.create({
        amount: entry.joinPriceCents,
        currency: 'usd',
        customer: entry.stripeCustomerId,
        payment_method: entry.paymentMethodId,
        off_session: true,
        confirm: true,
        description: `Group buy join price: ${event.name}`,
        metadata: { purpose: 'group_buy_join', entryId: String(entry._id), eventId: String(event._id) }
      });
      if (pi.status !== 'succeeded') throw new Error(`Unexpected PaymentIntent status ${pi.status}`);
      entry.status = 'charged';
      entry.chargedAt = new Date();
      await entry.save();
      const coupon = await issueCoupon(event, entry);
      entry.couponId = coupon._id;
      entry.couponCode = coupon.code;
      await entry.save();
      await sendChargedEmail(event, entry, coupon).catch(e => console.error('[GROUP-BUY] charged email failed', e.message));
    } catch (err) {
      console.error('[GROUP-BUY] fill charge failed for entry', String(entry._id), err.message);
      entry.status = 'charge_failed';
      entry.fixDeadline = new Date(Date.now() + FIX_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      await entry.save();
      await sendFixEmail(event, entry).catch(e => console.error('[GROUP-BUY] fix email failed', e.message));
    }
  }
  await GroupBuyEvent.findByIdAndUpdate(event._id, { $set: { status: 'completed', closedAt: new Date() } });
}

/** If the open event has reached its threshold, claim and run the fill. */
async function triggerFillIfReady(eventId) {
  const event = await GroupBuyEvent.findById(eventId);
  if (!event || event.status !== 'open') return;
  const count = await GroupBuyEntry.countDocuments({ event: event._id, status: { $in: ['joined', 'charged'] } });
  if (count < event.slotsNeeded) return;
  const claimed = await GroupBuyEvent.findOneAndUpdate(
    { _id: event._id, status: 'open' },
    { $set: { status: 'filling', filledAt: new Date() } },
    { new: true }
  );
  if (!claimed) return; // another trigger is already filling it
  await runFillCharges(claimed);
}

/**
 * Complete a join after Stripe.js confirms the SetupIntent. Verifies
 * the intent really succeeded, belongs to this user and event, and
 * that the event is still open. Idempotent: replays return the entry.
 */
async function completeJoin(user, setupIntentId) {
  const intent = await stripe.setupIntents.retrieve(setupIntentId);
  if (!intent) throw new Error('Card setup not found');
  if (intent.status !== 'succeeded') throw new Error('The card was not saved yet');
  const eventId = intent.metadata && intent.metadata.eventId;
  const metaUser = intent.metadata && intent.metadata.userId;
  if (!eventId || String(metaUser) !== String(user._id)) throw new Error('This card setup does not belong to your account');
  const event = await GroupBuyEvent.findById(eventId);
  if (!event) throw new Error('Group buy not found');
  let entry = await GroupBuyEntry.findOne({ event: event._id, user: user._id });
  if (entry) return { event, entry };
  if (event.status !== 'open') throw new Error('This group buy is no longer open');
  if (event.deadline && new Date() > event.deadline) throw new Error('The deadline for this group buy has passed');
  entry = await GroupBuyEntry.create({
    event: event._id,
    user: user._id,
    stripeCustomerId: intent.customer || '',
    paymentMethodId: intent.payment_method || '',
    setupIntentId: intent.id,
    joinPriceCents: event.joinPriceCents,
    status: 'joined'
  });
  if (intent.customer) {
    await User.findByIdAndUpdate(user._id, { stripeCustomerId: intent.customer }).catch(() => {});
  }
  await sendJoinedEmail(event, entry, user).catch(e => console.error('[GROUP-BUY] joined email failed', e.message));
  triggerFillIfReady(event._id).catch(e => console.error('[GROUP-BUY] fill trigger failed', e.message));
  return { event, entry };
}

/** Finish a fix-window payment after the buyer returns from Checkout. */
async function completeFixPayment(user, entryId, sessionId) {
  const entry = await GroupBuyEntry.findOne({ _id: entryId, user: user._id });
  if (!entry) throw new Error('Entry not found');
  if (entry.status === 'charged') return entry;
  if (entry.status !== 'charge_failed') throw new Error('This entry is not waiting on a payment fix');
  if (entry.fixDeadline && new Date() > entry.fixDeadline) throw new Error('The fix window for this spot has closed');
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session || session.payment_status !== 'paid') throw new Error('Payment not completed');
  if (!session.metadata || session.metadata.purpose !== 'group_buy_fix' || String(session.metadata.entryId) !== String(entry._id)) {
    throw new Error('That checkout does not match this entry');
  }
  if (entry.fixSessionId && entry.fixSessionId !== sessionId) throw new Error('A different checkout already fixed this entry');
  entry.fixSessionId = sessionId;
  entry.status = 'charged';
  entry.chargedAt = new Date();
  await entry.save();
  const event = await GroupBuyEvent.findById(entry.event);
  const coupon = await issueCoupon(event, entry);
  entry.couponId = coupon._id;
  entry.couponCode = coupon.code;
  await entry.save();
  await sendChargedEmail(event, entry, coupon).catch(e => console.error('[GROUP-BUY] charged email failed', e.message));
  return entry;
}

/**
 * Deadline and housekeeping sweep, run inside the existing
 * /daily-renewals cron (both Vercel cron slots are taken).
 */
async function sweepDeadlines() {
  const now = new Date();
  const summary = { missed: 0, refilled: 0, dropped: 0 };

  const dueEvents = await GroupBuyEvent.find({ status: 'open', deadline: { $lte: now } });
  for (const event of dueEvents) {
    // A last-moment fill may have landed between the query and now.
    const count = await GroupBuyEntry.countDocuments({ event: event._id, status: { $in: ['joined', 'charged'] } });
    if (count >= event.slotsNeeded) {
      await triggerFillIfReady(event._id);
      summary.refilled++;
      continue;
    }
    await GroupBuyEvent.findByIdAndUpdate(event._id, { $set: { status: 'missed', closedAt: now } });
    const entries = await GroupBuyEntry.find({ event: event._id, status: 'joined' });
    for (const entry of entries) {
      entry.status = 'not_charged';
      await entry.save();
      await sendNotChargedEmail(event, entry, 'missed').catch(e => console.error('[GROUP-BUY] missed email failed', e.message));
    }
    summary.missed++;
  }

  const stuckFills = await GroupBuyEvent.find({ status: 'filling', updatedAt: { $lte: new Date(now.getTime() - 15 * 60 * 1000) } });
  for (const event of stuckFills) {
    await runFillCharges(event);
    summary.refilled++;
  }

  const expiredFixes = await GroupBuyEntry.find({ status: 'charge_failed', fixDeadline: { $lte: now } });
  for (const entry of expiredFixes) {
    entry.status = 'dropped';
    await entry.save();
    const event = await GroupBuyEvent.findById(entry.event);
    if (event) await sendDroppedEmail(event, entry).catch(e => console.error('[GROUP-BUY] dropped email failed', e.message));
    summary.dropped++;
  }

  return summary;
}

/** Shape an event for the public page: no Stripe or admin internals. */
async function publicEventView(event) {
  if (!event) return null;
  const joinedCount = await GroupBuyEntry.countDocuments({ event: event._id, status: { $in: ['joined', 'charged'] } });
  return {
    id: String(event._id),
    name: event.name,
    percentOff: event.percentOff,
    joinPriceCents: event.joinPriceCents,
    slotsNeeded: event.slotsNeeded,
    joinedCount,
    capSetupCents: event.capSetupCents,
    capMonthlyCents: event.capMonthlyCents,
    capacityReason: event.capacityReason,
    redeemWindowDays: event.redeemWindowDays,
    status: event.status,
    startsAt: event.startsAt,
    deadline: event.deadline
  };
}

module.exports = {
  stripe,
  money,
  when,
  sendMail,
  sendNotChargedEmail,
  completeJoin,
  completeFixPayment,
  triggerFillIfReady,
  runFillCharges,
  sweepDeadlines,
  publicEventView,
  FIX_WINDOW_DAYS
};
