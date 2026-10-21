const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Coupon = require('../models/Coupon');
const { SUBJECT_WORD_NOTICE } = require('./policy-notice');

/**
 * The welcome email: sent the first time an account accepts the
 * current terms at login (the re-check flow), including old accounts
 * accepting the updated terms. It carries a 5% off code that is
 * unique to that account: generated from the current time plus
 * randomness, bound to the account (issuedToUserId), usable once.
 * One welcome per account, ever, guarded by user.welcomeEmailSentAt.
 */

function makeWelcomeCode() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `WELCOME-${timePart}-${randomPart}`;
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtppro.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }
  return transporter;
}

/**
 * Mint the code and send the welcome email, unless this account
 * already got one. Returns the code, or null when already sent or
 * when delivery fails (the stamp is only set after a successful
 * send, so a failure can retry on a later acceptance).
 */
async function mintAndSendWelcome(user) {
  if (!user || user.welcomeEmailSentAt) return null;
  let code = makeWelcomeCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await Coupon.create({
        code,
        type: 'percentage',
        amount: 5,
        appliesTo: 'both',
        usageLimit: 1,
        perCustomerLimit: 1,
        issuedToUserId: String(user._id),
        startsAt: new Date(),
        notes: `Welcome code for ${user.email}`,
        createdBy: 'welcome'
      });
      break;
    } catch (e) {
      if (e && e.code === 11000 && attempt < 4) { code = makeWelcomeCode(); continue; }
      throw e;
    }
  }
  const base = process.env.PROD_FRONTEND_URL || 'https://phoenixwebsites.ai';
  const text = [
    `Hi ${user.firstName || 'there'}, welcome to Phoenix Websites AI.`,
    `Your account is all set under the current terms. As a welcome, here is 5% off, made only for your account and good for one checkout:`,
    code,
    `Enter it in the discount code field when you build your site at ${base}/services. It is tied to your account, so it only works while you are signed in as ${user.email}.`,
    `You will also get occasional group buy and event announcement emails (a few times a year at most). To stop those, reply with UNSUBSCRIBE or use the unsubscribe link in any announcement.`,
    SUBJECT_WORD_NOTICE
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;color:#2b2118;line-height:1.55">${text.split('\n').map(l => l.trim() === '' ? '' : `<p style="margin:0 0 10px">${l}</p>`).join('')}</div>`;
  await getTransporter().sendMail({
    from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Welcome to Phoenix Websites AI: your 5% code is inside',
    text,
    html
  });
  user.welcomeCouponCode = code;
  user.welcomeEmailSentAt = new Date();
  await user.save();
  return code;
}

module.exports = { makeWelcomeCode, mintAndSendWelcome };
