/**
 * Renewal Scheduler Service
 * Production-ready, idempotent automated scheduler for Wisconsin statutory renewal notices
 * Wis. Stat. § 134.49 (Business Contracts; Automatic Renewal)
 */

const nodemailer = require('nodemailer');
const ContractLifecycle = require('../models/ContractLifecycle');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtppro.zoho.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCents(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}

/**
 * Generate Statutory Renewal Notice HTML & Text per Wis. Stat. § 134.49(3)
 */
function generateStatutoryRenewalNoticeEmail(contract, term) {
  const customerName = contract.customerName || 'Valued Client';
  const tierName = contract.tierName || 'Phoenix Digital Services';
  const monthlyFormatted = formatCents(contract.monthlyCents);
  const termEndFormatted = formatDate(term.endDate);
  const deadlineFormatted = formatDate(term.nonRenewalDeadline);
  const windowEndFormatted = formatDate(term.reminderWindowEnd);

  const portalNonRenewalUrl = `https://phoenixwebsites.ai/account/contract?id=${contract.contractId}&action=non-renewal`;

  const subject = `Statutory Notice: Upcoming Annual Renewal for Your ${tierName} Service Agreement`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0a0a0a; color: #f3f4f6; margin: 0; padding: 24px; }
        .card { max-width: 650px; margin: 0 auto; background: #121215; border: 1px solid #27272a; border-radius: 14px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #ff4d00 0%, #d97706 100%); padding: 32px 24px; text-align: center; color: #fff; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .alert-box { background: rgba(234, 88, 12, 0.12); border-left: 4px solid #ea580c; padding: 16px 20px; border-radius: 6px; margin: 24px 0; }
        .specs-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .specs-table td { padding: 10px 14px; border-bottom: 1px solid #27272a; }
        .specs-table td:first-child { color: #9ca3af; font-weight: 500; width: 40%; }
        .specs-table td:last-child { color: #f3f4f6; font-weight: 600; }
        .btn { display: inline-block; background: #ea580c; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; margin: 16px 0; }
        .legal-notice { font-size: 12px; color: #9ca3af; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 32px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 style="margin:0; font-size: 22px; text-transform: uppercase; letter-spacing: 1.5px;">Renewal & Extension Notice</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Wis. Stat. § 134.49 Statutory Disclosure</p>
        </div>
        <div class="content">
          <p>Hello ${customerName},</p>
          <p>This is a formal statutory notice regarding your active 12-month Service Agreement with <strong>Phoenix Websites AI</strong> for your <strong>${tierName}</strong> project.</p>
          
          <div class="alert-box">
            <h3 style="margin: 0 0 8px; color: #f97316; font-size: 16px;">Important Contract Milestone</h3>
            <p style="margin: 0; font-size: 14px;">Pursuant to <strong>Wis. Stat. § 134.49</strong>, this notice informs you that your agreement will automatically renew for an additional 12-month term on <strong>${termEndFormatted}</strong> unless you elect not to renew by or before <strong>${deadlineFormatted}</strong>.</p>
          </div>

          <table class="specs-table">
            <tr>
              <td>Contract Reference</td>
              <td>${contract.contractId}</td>
            </tr>
            <tr>
              <td>Covered Project / Tier</td>
              <td>${tierName}</td>
            </tr>
            <tr>
              <td>Current Term Expiration</td>
              <td>${termEndFormatted}</td>
            </tr>
            <tr>
              <td>Renewal Term Duration</td>
              <td>12 Months</td>
            </tr>
            <tr>
              <td>Renewal Rate / Price Lock</td>
              <td>${monthlyFormatted} / month (0% increase guarantee)</td>
            </tr>
            <tr>
              <td>Non-Renewal Notice Deadline</td>
              <td><span style="color: #f87171;">${deadlineFormatted}</span></td>
            </tr>
          </table>

          <h3 style="color: #f3f4f6; margin-top: 28px;">How to Exercise Non-Renewal</h3>
          <p>If you wish to continue receiving managed hosting, SSL, daily backups, automated security updates, and priority care, <strong>no action is required</strong>. Your agreement and price lock will automatically renew for another 12 months on ${termEndFormatted}.</p>
          <p>If you prefer that your agreement not renew at the end of the current term, you may decline renewal using either of the following methods prior to <strong>${deadlineFormatted}</strong>:</p>
          <ol style="padding-left: 20px; line-height: 1.8;">
            <li><strong>Self-Service Portal:</strong> Click below to access your authenticated client portal and confirm non-renewal:
              <br>
              <a href="${portalNonRenewalUrl}" class="btn">Submit Non-Renewal Request</a>
            </li>
            <li><strong>Email Notice:</strong> Reply directly to this email or send an email to <a href="mailto:hello@phoenixwebsites.ai" style="color: #ea580c;">hello@phoenixwebsites.ai</a> stating your business name and your decision not to renew.</li>
          </ol>
          <p style="font-size: 13px; color: #9ca3af;"><em>Note: Non-renewal means your services and hosting remain 100% active until the end of your current paid term (${termEndFormatted}), with zero early-termination fees.</em></p>

          <div class="legal-notice">
            <strong>Statutory Disclosure (Wis. Stat. § 134.49):</strong> This written notice is provided at least 15 days and not more than 60 days prior to the deadline for non-renewal. Under Wisconsin law, business service contracts containing automatic renewal provisions require advance notice specifying the renewal terms, price changes (if any), and cancellation instructions.
            <br><br>
            Phoenix Websites AI LLC • 790 N Water St, Milwaukee, WI 53202 • hello@phoenixwebsites.ai
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
STATUTORY RENEWAL NOTICE — PHOENIX WEBSITES AI
Wis. Stat. § 134.49 Disclosure

Hello ${customerName},

This is your statutory notice regarding your active 12-month Service Agreement for ${tierName}.

CURRENT TERM EXPIRATION: ${termEndFormatted}
NON-RENEWAL DEADLINE: ${deadlineFormatted}
RENEWAL RATE: ${monthlyFormatted} / month (Locked 0% increase)

Your agreement will automatically renew for an additional 12-month term on ${termEndFormatted} unless you provide written notice not to renew by or before ${deadlineFormatted}.

HOW TO DECLINE RENEWAL:
1. Online: Visit ${portalNonRenewalUrl}
2. Email: Reply directly to this email or write to hello@phoenixwebsites.ai

If non-renewal is submitted, your service remains fully active through ${termEndFormatted} with zero penalties. If no action is taken, your service seamlessly continues at your locked monthly rate.

Phoenix Websites AI LLC • Milwaukee, WI • hello@phoenixwebsites.ai
  `.trim();

  return { subject, html, text };
}

/**
 * Generate Owner Alert Email for Failed Statutory Deliveries
 */
function generateOwnerEscalationEmail(contract, term, attempts, lastError) {
  const subject = `ACTION REQUIRED — RENEWAL NOTICE DELIVERY FAILURE [${contract.contractId}]`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; padding: 20px; border: 2px solid #dc2626; border-radius: 8px;">
      <h2 style="color: #dc2626; margin-top: 0;">CRITICAL: Statutory Renewal Notice Delivery Failure</h2>
      <p>Under <strong>Wis. Stat. § 134.49</strong>, automatic renewal requires written notice delivered between 15 and 60 days before the non-renewal deadline. The automated scheduler has failed to deliver this notice after multiple attempts.</p>
      
      <h3>Contract Details:</h3>
      <ul>
        <li><strong>Contract ID:</strong> ${contract.contractId}</li>
        <li><strong>Customer Name:</strong> ${contract.customerName || 'N/A'}</li>
        <li><strong>Customer Email:</strong> ${contract.currentCustomerEmail}</li>
        <li><strong>Tier:</strong> ${contract.tierName}</li>
        <li><strong>Term End Date:</strong> ${formatDate(term.endDate)}</li>
        <li><strong>Non-Renewal Deadline:</strong> ${formatDate(term.nonRenewalDeadline)}</li>
        <li><strong>Statutory Window Closes:</strong> ${formatDate(term.reminderWindowEnd)}</li>
        <li><strong>Failed Delivery Attempts:</strong> ${attempts}</li>
        <li><strong>Last Error Message:</strong> <code>${lastError || 'Unknown SMTP error'}</code></li>
      </ul>

      <p style="background: #fee2e2; padding: 12px; border-radius: 6px; font-weight: bold; color: #991b1b;">
        URGENT ACTION REQUIRED: Please manually verify the customer's email, or deliver notice via regular mail / personal contact before ${formatDate(term.reminderWindowEnd)} to maintain enforceability under Wisconsin law.
      </p>
    </div>
  `;
  const text = `
ACTION REQUIRED — RENEWAL NOTICE DELIVERY FAILURE
Contract ID: ${contract.contractId}
Customer: ${contract.customerName} (${contract.currentCustomerEmail})
Deadline: ${formatDate(term.nonRenewalDeadline)}
Window Closes: ${formatDate(term.reminderWindowEnd)}
Failed Attempts: ${attempts}
Last Error: ${lastError}
Please deliver manually before the statutory window closes.
  `.trim();
  return { subject, html, text };
}

/**
 * Process Daily Renewals Job
 * Safe, idempotent execution for daily cron or manual trigger.
 * 
 * @param {Object} options
 * @param {Date} [options.referenceDate=new Date()] - Reference date for checking windows (useful for test simulation)
 * @param {boolean} [options.dryRun=false] - If true, evaluates without sending or writing to DB
 * @returns {Promise<Object>} Job execution summary
 */
async function processDailyRenewals({ referenceDate = new Date(), dryRun = false } = {}) {
  const refDate = new Date(referenceDate);
  const results = {
    processedAt: refDate,
    eligibleContractsFound: 0,
    remindersSent: 0,
    remindersFailed: 0,
    escalationsSent: 0,
    supportRemindersSent: 0,
    errors: []
  };

  const transporter = dryRun ? null : getTransporter();

  try {
    // 1. Find all active contracts requiring renewal notices
    // Look for contracts where reminder is not yet SENT, contract is ACTIVE, and referenceDate is within the window
    const candidates = await ContractLifecycle.find({
      contractStatus: { $in: ['ACTIVE', 'RENEWAL_REMINDER_PENDING'] }
    });

    for (const contract of candidates) {
      const currentTermNum = contract.currentTermNumber || 1;
      const term = (contract.termsHistory || []).find(t => t.termNumber === currentTermNum);

      if (!term) continue;

      // Skip if already sent or exempt or non-renewal already requested
      if (term.reminderStatus === 'SENT' || term.reminderStatus === 'EXEMPT' || term.reminderStatus === 'SKIPPED') {
        continue;
      }
      if (term.nonRenewalStatus === 'REQUESTED' || term.nonRenewalStatus === 'CONFIRMED') {
        continue;
      }

      // Check if referenceDate is inside statutory window [reminderWindowStart, reminderWindowEnd]
      const winStart = new Date(term.reminderWindowStart);
      const winEnd = new Date(term.reminderWindowEnd);

      if (refDate < winStart) {
        // Too early; window has not opened
        continue;
      }

      results.eligibleContractsFound++;

      if (dryRun) {
        results.remindersSent++;
        continue;
      }

      // 2. ATOMIC LOCKING for Idempotency
      // Only one worker will succeed in transitioning from PENDING/FAILED to PROCESSING
      const lockedContract = await ContractLifecycle.findOneAndUpdate(
        {
          _id: contract._id,
          "termsHistory.termNumber": currentTermNum,
          "termsHistory.reminderStatus": { $in: ['PENDING', 'FAILED'] }
        },
        {
          $set: {
            "termsHistory.$.reminderStatus": 'PROCESSING',
            "termsHistory.$.reminderLastAttemptAt": refDate
          }
        },
        { new: true }
      );

      if (!lockedContract) {
        // Another concurrent worker acquired this lock or it was already sent
        continue;
      }

      // 3. Prepare and Send Statutory Notice Email
      const emailData = generateStatutoryRenewalNoticeEmail(lockedContract, term);

      try {
        const info = await transporter.sendMail({
          from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
          to: lockedContract.currentCustomerEmail,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });

        // 4. Record Successful Delivery
        await ContractLifecycle.findOneAndUpdate(
          {
            _id: contract._id,
            "termsHistory.termNumber": currentTermNum
          },
          {
            $set: {
              contractStatus: 'RENEWAL_REMINDER_PENDING',
              "termsHistory.$.reminderStatus": 'SENT',
              "termsHistory.$.reminderSentAt": new Date(),
              "termsHistory.$.providerMessageId": info.messageId || 'MOCK-MSG-ID'
            },
            $push: {
              auditLog: {
                timestamp: new Date(),
                eventType: 'RENEWAL_REMINDER_SENT',
                actor: 'SYSTEM_SCHEDULER',
                details: {
                  termNumber: currentTermNum,
                  recipient: lockedContract.currentCustomerEmail,
                  messageId: info.messageId,
                  deadline: term.nonRenewalDeadline
                }
              }
            }
          }
        );

        results.remindersSent++;
        console.log(`[RENEWAL-SCHEDULER] Sent statutory renewal reminder to ${lockedContract.currentCustomerEmail} for ${lockedContract.contractId}`);

      } catch (sendErr) {
        const attempts = (term.reminderAttemptCount || 0) + 1;
        const lastErrMsg = sendErr.message;

        await ContractLifecycle.findOneAndUpdate(
          {
            _id: contract._id,
            "termsHistory.termNumber": currentTermNum
          },
          {
            $set: {
              "termsHistory.$.reminderStatus": 'FAILED',
              "termsHistory.$.reminderAttemptCount": attempts,
              "termsHistory.$.reminderFailureReason": lastErrMsg
            },
            $push: {
              auditLog: {
                timestamp: new Date(),
                eventType: 'RENEWAL_REMINDER_FAILED',
                actor: 'SYSTEM_SCHEDULER',
                details: {
                  termNumber: currentTermNum,
                  attempt: attempts,
                  error: lastErrMsg
                }
              }
            }
          }
        );

        results.remindersFailed++;
        results.errors.push({ contractId: contract.contractId, error: lastErrMsg });

        // 5. Check if escalation is required (attempts >= 3 or window closing in < 3 days)
        const daysLeftInWindow = (winEnd.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);
        if (attempts >= 3 || daysLeftInWindow <= 3) {
          try {
            const escalation = generateOwnerEscalationEmail(lockedContract, term, attempts, lastErrMsg);
            await transporter.sendMail({
              from: `"Phoenix Renewal Safety" <${process.env.EMAIL_USER}>`,
              to: process.env.EMAIL_USER, // hello@phoenixwebsites.ai
              subject: escalation.subject,
              html: escalation.html,
              text: escalation.text
            });
            results.escalationsSent++;

            await ContractLifecycle.findByIdAndUpdate(contract._id, {
              $push: {
                auditLog: {
                  timestamp: new Date(),
                  eventType: 'RENEWAL_REMINDER_ESCALATED',
                  actor: 'SYSTEM_SCHEDULER',
                  details: { attempts, daysLeftInWindow, escalatedTo: process.env.EMAIL_USER }
                }
              }
            });
          } catch (escErr) {
            console.error('[RENEWAL-SCHEDULER] Failed to send owner escalation alert:', escErr.message);
          }
        }
      }
    }

    // 6. Support Add-on Advance Courtesy Reminder (30-day advance notice)
    const expiringSupportContracts = await ContractLifecycle.find({
      "supportAddon.status": { $in: ['ACTIVE_HOSTED', 'ACTIVE_TRANSITION', 'ACTIVE'] },
      "supportAddon.reminderSentAt": { $exists: false },
      $or: [
        {
          "supportAddon.supportEndAt": {
            $lte: new Date(refDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
            $gte: refDate
          }
        },
        {
          "supportAddon.endDate": {
            $lte: new Date(refDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
            $gte: refDate
          }
        }
      ]
    });

    for (const sc of expiringSupportContracts) {
      if (dryRun) {
        results.supportRemindersSent++;
        continue;
      }
      try {
        const supportEnd = sc.supportAddon.supportEndAt || sc.supportAddon.endDate;
        const supportEndStr = formatDate(supportEnd);
        const suppSubject = `Notice: Your ${sc.supportAddon.name} Coverage Concludes on ${supportEndStr}`;
        const suppHtml = `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #ea580c; margin-top: 0;">Support Plan Expiration Notice</h2>
            <p>Hi ${sc.customerName || 'there'},</p>
            <p>Your optional <strong>${sc.supportAddon.name}</strong> coverage will conclude on <strong>${supportEndStr}</strong>.</p>
            <p><strong>Your Website Remains 100% Active:</strong> The expiration of your optional support plan does not affect your base website hosting, domain, SSL, or core service agreement. You will simply transition back to the standard maintenance inclusions of your base plan.</p>
            <p><strong>No Automatic Support Renewal:</strong> Optional support does not auto-renew. Your monthly support billing will automatically cease upon reaching ${supportEndStr}.</p>
            <p>If you would like to renew or extend your support coverage at our discounted loyalty rates, please reply to this email or visit your account portal.</p>
            <p>Thank you for partnering with Phoenix Websites AI!</p>
          </div>
        `;
        const suppText = `Support Plan Expiration Notice: Your ${sc.supportAddon.name} concludes on ${supportEndStr}. Recurring support billing will stop. Your base website remains active. Contact hello@phoenixwebsites.ai to extend.`;

        await transporter.sendMail({
          from: `"Phoenix Websites AI" <${process.env.EMAIL_USER}>`,
          to: sc.currentCustomerEmail,
          subject: suppSubject,
          html: suppHtml,
          text: suppText
        });

        sc.supportAddon.reminderSentAt = new Date();
        sc.supportAddon.status = 'EXPIRING';
        sc.auditLog.push({
          timestamp: new Date(),
          eventType: 'SUPPORT_EXPIRATION_NOTICE_SENT',
          actor: 'SYSTEM_SCHEDULER',
          details: { supportEndDate: supportEnd }
        });
        await sc.save();
        results.supportRemindersSent++;
      } catch (suppErr) {
        console.error('[RENEWAL-SCHEDULER] Support expiration reminder failed:', suppErr.message);
      }
    }

    // 7. Authoritative Support Expiration Execution (When supportEndAt is reached)
    const { expireSupportAndStopStripeBilling } = require('./contract-lifecycle.service');
    const expiredSupportContracts = await ContractLifecycle.find({
      "supportAddon.status": { $in: ['ACTIVE_HOSTED', 'ACTIVE_TRANSITION', 'ACTIVE', 'EXPIRING'] },
      $or: [
        { "supportAddon.supportEndAt": { $lte: refDate } },
        { "supportAddon.endDate": { $lte: refDate } }
      ]
    });

    results.supportExpiredCount = 0;
    for (const esc of expiredSupportContracts) {
      if (dryRun) {
        results.supportExpiredCount++;
        continue;
      }
      try {
        await expireSupportAndStopStripeBilling(esc.contractId, 'SYSTEM_SCHEDULER');
        results.supportExpiredCount++;
        console.log(`[RENEWAL-SCHEDULER] Successfully expired support and halted billing for ${esc.contractId}`);
      } catch (expErr) {
        console.error(`[RENEWAL-SCHEDULER] Failed to expire support for ${esc.contractId}:`, expErr.message);
        results.errors.push({ contractId: esc.contractId, error: expErr.message });
      }
    }

  } catch (err) {
    console.error('[RENEWAL-SCHEDULER] Daily cron job fatal error:', err);
    results.errors.push({ fatal: err.message });
  }

  return results;
}

module.exports = {
  processDailyRenewals,
  generateStatutoryRenewalNoticeEmail,
  generateOwnerEscalationEmail
};
