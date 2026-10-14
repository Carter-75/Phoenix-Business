/**
 * Client Communication Policy Enforcement Service
 *
 * Implements the Client Communication Policy that clients accept in the Terms
 * of Service and Refund Policy at payment / account creation:
 *  - Client email must carry a subject word: NEW, OUTREACH, or ORDER.
 *  - Untagged mail may not be routed or read.
 *  - On a communication breakdown, the client gets a warning email and a
 *    5-day window to reply with ORDER in the subject to keep/restart the
 *    project.
 *  - On no reply: the project is ARCHIVED (data retained, existing lifecycle
 *    end states), the Stripe subscription is cancelled, and a refund is
 *    issued automatically minus a startup fee equal to the lesser of $100
 *    or 50% of the total amount paid.
 *  - The client's review is NOT deleted and NOT hidden. It stays public and
 *    searchable, gains a factual policy note displayed under it, and stops
 *    counting toward rating totals and the displayed average.
 *  - FREE ORDERS ARE EXEMPT: free or promotional orders are strictly
 *    personal favors for people Carter already knows, so their clients are
 *    never warned and never swept. A client's governing contract is a free
 *    order when it carries a freeOrderId (see isFreeOrderContract below).
 *
 * MODE GATE: POLICY_ENFORCEMENT_MODE env var. The system ships ACTIVE:
 * the default is 'live' when the var is unset. 'dry-run' is available only
 * when explicitly set, as an opt-out for testing.
 *  - live (default): performs every step (warning emails, archive, Stripe
 *    cancellation, refund, review annotation, status transitions).
 *  - dry-run (explicit only): records 'would_warn' / 'would_execute' history
 *    events and logs only. No emails, no Stripe calls, no contract or
 *    review changes, and no status transitions.
 *
 * State lives in the shared "clientcommspolicies" collection, the same
 * collection the cold-emailing system writes inbound tagging state to.
 */

const nodemailer = require('nodemailer');
const { SUBJECT_WORD_NOTICE, subjectWordNoticeHtml } = require('./policy-notice');

const SUBJECT_WORDS = ['NEW', 'OUTREACH', 'ORDER'];
const WARNING_WINDOW_DAYS = 5;
const STARTUP_FEE_CAP_CENTS = 10000; // $100.00

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Detect the policy subject word in an email subject line.
 * The word must appear as a standalone token (word boundaries), matched
 * case-insensitively. "REORDER" does NOT match ORDER; "New" matches NEW.
 * Any other subject text is allowed. First matching token wins.
 * @param {string} subject
 * @returns {'NEW'|'OUTREACH'|'ORDER'|null}
 */
function subjectTag(subject) {
  if (!subject || typeof subject !== 'string') return null;
  const match = subject.toUpperCase().match(/\b(NEW|OUTREACH|ORDER)\b/);
  return match ? match[1] : null;
}

/**
 * Split a total amount paid into the retained startup fee and the refund.
 * The startup fee is the lesser of $100 or 50% of the total paid, floored to
 * whole cents: $50 paid keeps $25, $99 keeps $49.50, $1,499 keeps $100, and a
 * free $0 order keeps $0.
 * @param {number} totalPaidCents
 * @returns {{ feeCents: number, refundCents: number }}
 */
function feeFor(totalPaidCents) {
  const paid = Math.max(0, Math.round(Number(totalPaidCents) || 0));
  const feeCents = Math.min(STARTUP_FEE_CAP_CENTS, Math.floor(paid / 2));
  return { feeCents, refundCents: paid - feeCents };
}

function getMode() {
  // Ships active: 'live' is the default when the env var is unset. Dry-run
  // happens only when POLICY_ENFORCEMENT_MODE is explicitly set to 'dry-run'.
  return process.env.POLICY_ENFORCEMENT_MODE === 'dry-run' ? 'dry-run' : 'live';
}

function isLive() {
  return getMode() === 'live';
}

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
}

function formatCents(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return '$0.00';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date) {
  if (!date) return 'N/A';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Dependencies (injectable for tests)
// ---------------------------------------------------------------------------

let deps = null;

function loadDefaultDeps() {
  return {
    ClientCommsPolicy: require('../models/ClientCommsPolicy'),
    User: require('../models/user'),
    Contract: require('../models/Contract'),
    ContractLifecycle: require('../models/ContractLifecycle'),
    Review: require('../models/Review'),
    createStripeClient: () => {
      const key = process.env.STRIPE_SECRET_KEY;
      return key ? require('stripe')(key) : null;
    },
    createTransporter: () => nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtppro.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    }),
    now: () => new Date()
  };
}

function getDeps() {
  if (!deps) deps = loadDefaultDeps();
  return deps;
}

function _setDeps(overrides) {
  deps = { ...(deps || {}), ...overrides };
}

function _resetDeps() {
  deps = null;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function pushHistory(doc, event, detail, at) {
  if (!Array.isArray(doc.history)) doc.history = [];
  doc.history.push({ at: at || new Date(), event, detail: detail || '' });
}

async function findOrCreatePolicy(d, email) {
  let doc = await d.ClientCommsPolicy.findOne({ clientEmail: email });
  if (!doc) {
    doc = await d.ClientCommsPolicy.create({ clientEmail: email, status: 'ok', history: [] });
  }
  if (!Array.isArray(doc.history)) doc.history = [];
  return doc;
}

// ---------------------------------------------------------------------------
// Inbound mail tagging (shared contract writer; also used by the cold-email
// system, which keeps its own copy against the same collection)
// ---------------------------------------------------------------------------

/**
 * Record an inbound email against the client's policy document.
 * If the client is inside a warning window and replies tagged with the
 * required word, the warning is rescued back to 'ok'.
 * @param {string} clientEmail
 * @param {{ tagged: boolean, word?: string, subject?: string, at?: Date }} inbound
 */
async function markInbound(clientEmail, inbound = {}) {
  const d = getDeps();
  const email = normalizeEmail(clientEmail);
  if (!email) throw new Error('markInbound requires a client email');

  const at = inbound.at ? new Date(inbound.at) : d.now();
  const tagged = Boolean(inbound.tagged);
  const word = inbound.word
    ? String(inbound.word).toUpperCase()
    : (tagged ? subjectTag(inbound.subject) : null);

  const doc = await findOrCreatePolicy(d, email);
  doc.lastInboundAt = at;
  doc.lastInboundTagged = tagged;
  if (word && SUBJECT_WORDS.includes(word) && !doc.requiredWord) {
    doc.requiredWord = word;
  }
  pushHistory(
    doc,
    tagged ? 'inbound_tagged' : 'inbound_untagged',
    tagged ? `Inbound email tagged${word ? ` ${word}` : ''}` : 'Inbound email without a subject word',
    at
  );

  if (doc.status === 'warning' && tagged && word && doc.requiredWord && word === doc.requiredWord) {
    doc.status = 'ok';
    pushHistory(doc, 'rescued', `Client replied with ${word} in the subject during the warning window`, at);
  }

  await doc.save();
  return doc;
}

// ---------------------------------------------------------------------------
// Warning
// ---------------------------------------------------------------------------

function buildWarningEmail({ name, triggerReason, deadline }) {
  const deadlineText = formatDate(deadline);
  const subject = 'Action Required: Reply with ORDER in the subject within 5 days to keep your project';
  const html = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #ea580c;">Important Notice About Your Phoenix Project</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Under the Client Communication Policy in the agreement you accepted with Phoenix Websites AI, email about your order or project must include the word <strong>ORDER</strong> in the subject line so it is routed to our team and read. Our records show a communication breakdown under that policy${triggerReason ? `: ${triggerReason}` : ''}.</p>
      <p><strong>What happens next:</strong> You have <strong>5 days</strong> to keep or restart your project. Simply reply to this email (or send a new email to hello@phoenixwebsites.ai) with <strong>ORDER</strong> anywhere in the subject line by <strong>${deadlineText}</strong>.</p>
      <p>If we do not receive a reply with ORDER in the subject line by ${deadlineText}, your project will be archived, your subscription will be cancelled, and a refund will be issued automatically minus the startup fee described in your agreement (the lesser of $100 or 50% of the amounts you have paid, covering setup and administrative costs already incurred).</p>
      <p>Replying in time costs nothing and fully restores your project. If you believe this notice was sent in error, reply with ORDER in the subject line and tell us what happened.</p>
      ${subjectWordNoticeHtml('ORDER')}
      <p>Phoenix Websites AI</p>
    </div>
  `;
  const text = [
    'Important Notice About Your Phoenix Project',
    '',
    `Hi ${name || 'there'},`,
    '',
    `Under the Client Communication Policy in the agreement you accepted with Phoenix Websites AI, email about your order or project must include the word ORDER in the subject line so it is routed to our team and read. Our records show a communication breakdown under that policy${triggerReason ? `: ${triggerReason}` : ''}.`,
    '',
    `You have 5 days to keep or restart your project. Reply to this email (or email hello@phoenixwebsites.ai) with ORDER anywhere in the subject line by ${deadlineText}.`,
    '',
    `If we do not receive a reply with ORDER in the subject line by ${deadlineText}, your project will be archived, your subscription will be cancelled, and a refund will be issued automatically minus the startup fee described in your agreement (the lesser of $100 or 50% of the amounts you have paid, covering setup and administrative costs already incurred).`,
    '',
    'Replying in time costs nothing and fully restores your project.',
    '',
    SUBJECT_WORD_NOTICE,
    '',
    'Phoenix Websites AI'
  ].join('\n');
  return { subject, html, text };
}

/**
 * Start the 5-day warning window for a client.
 * Live mode: sets status 'warning' and emails the client.
 * Dry-run: records a 'would_warn' history event only.
 * @param {string} clientEmail
 * @param {string} triggerReason
 */
async function startWarning(clientEmail, triggerReason = '') {
  const d = getDeps();
  const email = normalizeEmail(clientEmail);
  if (!email) throw new Error('startWarning requires a client email');

  const mode = getMode();
  const now = d.now();
  const deadline = addDays(now, WARNING_WINDOW_DAYS);

  // Free-order exemption: free or promotional orders are personal favors
  // and sit outside this policy entirely, so a warning is never started
  // for their clients (in either mode). Recorded as a history event when a
  // policy document already exists; no document is created otherwise.
  if (await isFreeOrderClient(d, email)) {
    console.log(`[POLICY] startWarning skipped for ${email}: free order (exempt from the Client Communication Policy)`);
    const existing = await d.ClientCommsPolicy.findOne({ clientEmail: email });
    if (existing) {
      pushHistory(existing, 'skipped_free_order', 'Warning not started: free order is exempt from the Client Communication Policy', now);
      await existing.save();
    }
    return { doc: existing || null, mode, emailed: false, skipped: 'free_order' };
  }

  const doc = await findOrCreatePolicy(d, email);

  if (!isLive()) {
    pushHistory(
      doc,
      'would_warn',
      `DRY-RUN: would start warning (${triggerReason || 'communication policy breakdown'}); deadline would be ${formatDate(deadline)}`,
      now
    );
    await doc.save();
    console.log(`[POLICY] DRY-RUN would_warn for ${email} (deadline would be ${deadline.toISOString()})`);
    return { doc, mode, emailed: false };
  }

  doc.status = 'warning';
  doc.requiredWord = 'ORDER';
  doc.triggerReason = triggerReason || doc.triggerReason || '';
  doc.warningSentAt = now;
  doc.warningDeadlineAt = deadline;
  pushHistory(doc, 'warning_started', triggerReason || 'Communication policy warning started', now);
  await doc.save();

  let emailed = false;
  try {
    const user = await d.User.findOne({ email });
    const name = user ? (user.firstName || user.name || '') : '';
    const mail = buildWarningEmail({ name, triggerReason, deadline });
    await d.createTransporter().sendMail({
      from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text
    });
    emailed = true;
    console.log(`[POLICY] Warning email sent to ${email}; deadline ${deadline.toISOString()}`);
  } catch (err) {
    console.error(`[POLICY] Failed to send warning email to ${email}:`, err.message);
  }

  return { doc, mode, emailed };
}

// ---------------------------------------------------------------------------
// Enforcement sweep
// ---------------------------------------------------------------------------

/**
 * Resolve the client's billing picture.
 * Live mode may read Stripe charges; dry-run NEVER touches Stripe and falls
 * back to the amounts recorded on the contract.
 */
async function getBillingPicture(d, user, contract, mode) {
  let stripe = null;
  let charges = [];

  if (mode === 'live') {
    stripe = d.createStripeClient();
    if (stripe && user && user.stripeCustomerId) {
      try {
        const list = await stripe.charges.list({ customer: user.stripeCustomerId, limit: 100 });
        charges = (list.data || []).filter(c => c.status === 'succeeded');
      } catch (err) {
        console.error('[POLICY] Stripe charges lookup failed:', err.message);
      }
    }
  }

  if (charges.length > 0) {
    const totalPaidCents = charges.reduce(
      (sum, c) => sum + Math.max(0, (c.amount || 0) - (c.amount_refunded || 0)),
      0
    );
    return { stripe, charges, totalPaidCents };
  }

  const fallback = contract && typeof contract.setupFeePaid === 'number' ? contract.setupFeePaid : 0;
  return { stripe, charges, totalPaidCents: fallback };
}

function pickActiveContract(contracts) {
  const list = Array.isArray(contracts) ? contracts.slice() : [];
  list.sort((a, b) => new Date(b.acceptedAt || 0) - new Date(a.acceptedAt || 0));
  return list.find(c => c.status === 'active') || list[0] || null;
}

/**
 * A contract is a free order when it carries a freeOrderId. That field is
 * the dedicated marker for $0 orders: the model documents it as "String ID
 * for $0 orders (free_...)" and the free checkout branch of
 * routes/stripe.js is the only code that ever sets it (alongside
 * setupFeePaid 0, monthlyFee 0, and no Stripe subscription). Paid contracts
 * never have one, which makes it the most reliable free-order signal in the
 * codebase (the cancellation-quote heuristic keys on absent fee fields,
 * which can also be missing on legacy paid contracts).
 */
function isFreeOrderContract(contract) {
  return Boolean(contract && contract.freeOrderId);
}

/**
 * True when the client's governing contract (the active one, else the most
 * recent) is a free order. Clients without an account or without any
 * contract are not free-order clients.
 */
async function isFreeOrderClient(d, email) {
  const user = await d.User.findOne({ email });
  if (!user) return false;
  const contract = pickActiveContract(await d.Contract.find({ userId: user._id }));
  return isFreeOrderContract(contract);
}

async function processExpiredWarning(d, doc, mode) {
  const email = doc.clientEmail;
  const now = d.now();

  const user = await d.User.findOne({ email });
  if (!user) throw new Error(`No user account found for ${email}`);

  const contract = pickActiveContract(await d.Contract.find({ userId: user._id }));
  const billing = await getBillingPicture(d, user, contract, mode);
  const { feeCents, refundCents } = feeFor(billing.totalPaidCents);

  if (mode !== 'live') {
    pushHistory(
      doc,
      'would_execute',
      `DRY-RUN: would archive project, cancel subscription, and refund ${formatCents(refundCents)} ` +
      `(startup fee kept ${formatCents(feeCents)} of ${formatCents(billing.totalPaidCents)} paid)`,
      now
    );
    await doc.save();
    console.log(`[POLICY] DRY-RUN would_execute for ${email}: fee ${formatCents(feeCents)}, refund ${formatCents(refundCents)}`);
    return { email, executed: false, dryRun: true, feeCents, refundCents, totalPaidCents: billing.totalPaidCents };
  }

  const steps = [];

  // 1. Archive the project / contract. Data is retained; we move records to
  // the codebase's existing end states (Contract 'cancelled' per the existing
  // cancellation flows; ContractLifecycle 'TERMINATED' per the lifecycle
  // state machine) rather than deleting anything.
  if (contract && contract.status === 'active') {
    contract.status = 'cancelled';
    await contract.save();
    steps.push('contract_archived');
  }

  const lifecycle = await d.ContractLifecycle.findOne({ userId: user._id });
  if (lifecycle && lifecycle.contractStatus !== 'TERMINATED') {
    lifecycle.contractStatus = 'TERMINATED';
    if (Array.isArray(lifecycle.auditLog)) {
      lifecycle.auditLog.push({
        timestamp: now,
        eventType: 'EARLY_TERMINATION_COMPLETED',
        actor: 'SYSTEM',
        details: {
          reason: 'Client Communication Policy: project archived after 5-day warning went unanswered',
          policyClientEmail: email
        }
      });
    }
    await lifecycle.save();
    steps.push('lifecycle_terminated');
  }

  // 2. Cancel the Stripe subscription.
  const subscriptionId = (contract && contract.stripeSubscriptionId) || (lifecycle && lifecycle.stripeSubscriptionId) || null;
  if (billing.stripe && subscriptionId) {
    try {
      const sub = await billing.stripe.subscriptions.retrieve(subscriptionId);
      if (sub && sub.status !== 'canceled') {
        await billing.stripe.subscriptions.cancel(subscriptionId);
        steps.push('subscription_cancelled');
      } else {
        steps.push('subscription_already_canceled');
      }
    } catch (err) {
      steps.push(`subscription_cancel_failed: ${err.message}`);
    }
  }

  // 3. Issue the refund (newest charges first) when there is anything to send back.
  let refundedCents = 0;
  if (refundCents > 0) {
    if (billing.stripe && billing.charges.length > 0) {
      let remaining = refundCents;
      for (const charge of billing.charges) {
        if (remaining <= 0) break;
        const available = Math.max(0, (charge.amount || 0) - (charge.amount_refunded || 0));
        if (available <= 0) continue;
        const amount = Math.min(available, remaining);
        await billing.stripe.refunds.create({ charge: charge.id, amount });
        refundedCents += amount;
        remaining -= amount;
      }
      steps.push(`refund_issued:${refundedCents}`);
    } else {
      steps.push('refund_skipped_no_stripe_charges');
    }
  }

  // 4. Annotate the client's review. The review is NOT deleted and NOT
  // hidden: it stays public and searchable, gains this factual note displayed
  // under it, and (via policyArchived) stops counting toward rating totals
  // and the displayed average. The note names the reason (the communication
  // policy), the date the 5-day notice was sent, and the archive date.
  const archivedOn = formatDate(now);
  const noticeOn = doc.warningSentAt ? formatDate(doc.warningSentAt) : null;
  const note = noticeOn
    ? `This project was archived on ${archivedOn} under our communication policy after the 5-day notice sent on ${noticeOn} went unanswered.`
    : `This project was archived on ${archivedOn} under our communication policy after a 5-day notice went unanswered.`;
  let reviews = contract
    ? await d.Review.find({ userId: user._id, contractId: contract._id })
    : await d.Review.find({ userId: user._id });
  if ((!reviews || reviews.length === 0) && contract) {
    reviews = await d.Review.find({ userId: user._id });
  }
  let annotated = 0;
  for (const review of reviews || []) {
    review.policyArchived = true;
    review.policyNote = note;
    await review.save();
    annotated++;
  }
  if (annotated > 0) steps.push(`review_annotated:${annotated}`);

  // 5. Final policy state.
  doc.status = 'archived';
  doc.archivedAt = now;
  doc.feeKeptCents = feeCents;
  doc.refundCents = refundedCents;
  doc.reviewAnnotated = annotated > 0;
  pushHistory(
    doc,
    'executed',
    `Project archived under the Client Communication Policy. Steps: ${steps.join(', ') || 'none'}. ` +
    `Startup fee kept ${formatCents(feeCents)}; refunded ${formatCents(refundedCents)} of ${formatCents(billing.totalPaidCents)} paid.`,
    now
  );
  await doc.save();

  return {
    email,
    executed: true,
    dryRun: false,
    feeCents,
    refundCents: refundedCents,
    totalPaidCents: billing.totalPaidCents,
    reviewAnnotated: annotated > 0,
    steps
  };
}

/**
 * Process every warning whose 5-day deadline has passed.
 * Each client is handled in its own try/catch; one failure never blocks the
 * sweep. Returns a summary.
 */
async function runEnforcementSweep() {
  const d = getDeps();
  const mode = getMode();
  const now = d.now();

  const warnings = await d.ClientCommsPolicy.find({ status: 'warning' });
  const expired = (warnings || []).filter(
    doc => doc.warningDeadlineAt && new Date(doc.warningDeadlineAt) <= now
  );

  const results = [];
  for (const doc of expired) {
    try {
      // Free-order exemption: a warned document whose client turns out to
      // be a free order is never executed. Its status is left unchanged and
      // the skip is recorded, in both live and dry-run mode.
      if (await isFreeOrderClient(d, doc.clientEmail)) {
        pushHistory(doc, 'skipped_free_order', 'Enforcement skipped: free order is exempt from the Client Communication Policy', d.now());
        await doc.save();
        console.log(`[POLICY] Enforcement skipped for ${doc.clientEmail}: free order exemption`);
        results.push({ email: doc.clientEmail, executed: false, skipped: 'free_order' });
        continue;
      }
      results.push(await processExpiredWarning(d, doc, mode));
    } catch (err) {
      console.error(`[POLICY] Enforcement failed for ${doc.clientEmail}:`, err.message);
      try {
        pushHistory(doc, 'execution_failed', err.message, d.now());
        await doc.save();
      } catch (saveErr) {
        console.error(`[POLICY] Failed to record enforcement failure for ${doc.clientEmail}:`, saveErr.message);
      }
      results.push({ email: doc.clientEmail, executed: false, error: err.message });
    }
  }

  console.log(`[POLICY] Enforcement sweep (${mode}) processed ${expired.length} expired warning(s).`);
  return { mode, processed: expired.length, results };
}

module.exports = {
  SUBJECT_WORDS,
  WARNING_WINDOW_DAYS,
  STARTUP_FEE_CAP_CENTS,
  subjectTag,
  feeFor,
  getMode,
  isLive,
  markInbound,
  buildWarningEmail,
  startWarning,
  runEnforcementSweep,
  isFreeOrderContract,
  isFreeOrderClient,
  _setDeps,
  _resetDeps
};
