/**
 * Outreach first-5 offer.
 *
 * The outreach email links to /services?ref=outreach5. The first 5
 * accounts created through that link each receive their own personal
 * intro code: Starter package only, setup free in full (up to the
 * non-discounted $1,499), first month free (up to the non-discounted
 * $99), then half off the monthly ongoing. Codes are account-bound,
 * one use, and are counted by createdBy so the campaign can never
 * issue more than 5.
 *
 * Issuance follows the welcome flow's hard lessons: adopt an
 * existing code instead of minting a duplicate, stamp the account
 * BEFORE sending, and let the caller await the send so it is not
 * stranded in a fire-and-forget promise.
 */
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Coupon = require('../models/Coupon');
const { SUBJECT_WORD_NOTICE } = require('./policy-notice');

const REF_VALUE = 'outreach5';
const CAMPAIGN = 'outreach-first5';
const MAX_CODES = 5;
const STARTER_SETUP_CAP_CENTS = 149900;
const STARTER_MONTHLY_CAP_CENTS = 9900;
const ONGOING_PERCENT_OFF = 50;

let transporter = null;
function getTransporter() {
  if (!transporter) {
    // Mirrors the proven transport in routes/cron.js exactly.
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtppro.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }
  return transporter;
}

function makeOutreachCode() {
  return `FIRST5-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function issuedCount() {
  return Coupon.countDocuments({ createdBy: CAMPAIGN });
}

async function spotsRemaining() {
  return Math.max(0, MAX_CODES - (await issuedCount()));
}

/**
 * Issue (or re-return) this account's first-5 code. Returns the code,
 * or null when the account did not come through the outreach link or
 * all 5 spots are already taken. Awaited by the signup paths: on a
 * send failure the error propagates to the caller's catch (which
 * logs it); the code and the account stamp already exist by then,
 * and the code also shows in the admin coupons list.
 */
async function issueOutreachCode(user) {
  if (!user || user.signupRef !== REF_VALUE) return null;
  if (user.outreachFreeCode) return user.outreachFreeCode;

  let code = null;
  const existing = await Coupon.findOne({ issuedToUserId: String(user._id), createdBy: CAMPAIGN });
  if (existing) {
    code = existing.code;
  } else {
    if ((await issuedCount()) >= MAX_CODES) return null;
    code = makeOutreachCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await Coupon.create({
          code,
          type: 'intro',
          amount: 100,
          appliesTo: 'both',
          capSetupCents: STARTER_SETUP_CAP_CENTS,
          capMonthlyCents: STARTER_MONTHLY_CAP_CENTS,
          ongoingMonthlyPercentOff: ONGOING_PERCENT_OFF,
          restrictToPackage: 'starter',
          bypassFloors: true,
          usageLimit: 1,
          perCustomerLimit: 1,
          issuedToUserId: String(user._id),
          startsAt: new Date(),
          notes: `Outreach first-5 code for ${user.email}`,
          createdBy: CAMPAIGN
        });
        break;
      } catch (e) {
        if (e && e.code === 11000 && attempt < 4) { code = makeOutreachCode(); continue; }
        throw e;
      }
    }
  }

  user.outreachFreeCode = code;
  await user.save();

  const base = process.env.PROD_FRONTEND_URL || 'https://phoenixwebsites.ai';
  const text = [
    `Hi ${user.firstName || 'there'}, you got one of the 5 free spots.`,
    `You signed up through our outreach email, and you were one of the first 5, so your Starter website starts free. Your personal code is:`,
    code,
    `What it covers, on the Starter package:`,
    `- The setup fee is free in full (up to $1,499).`,
    `- Your first month is free (up to $99).`,
    `- From month 2 on, your monthly is half price, ongoing, for as long as you stay on the plan.`,
    `The code only works on the Starter package, only on your account, and only once. To use it: sign in at ${base}/services, build your Starter site, and enter the code in the discount field at checkout. The exact amounts show before you pay. If a site promotion is running when you check out, the half-off monthly applies to the promoted monthly price.`,
    SUBJECT_WORD_NOTICE
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;color:#2b2118;line-height:1.55">${text.split('\n').map(l => l.trim() === '' ? '' : `<p style="margin:0 0 10px">${l}</p>`).join('')}</div>`;
  await getTransporter().sendMail({
    from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'You got one of the 5 free spots: your Starter code is inside',
    text,
    html
  });
  return code;
}

module.exports = {
  REF_VALUE,
  CAMPAIGN,
  MAX_CODES,
  makeOutreachCode,
  issuedCount,
  spotsRemaining,
  issueOutreachCode
};
