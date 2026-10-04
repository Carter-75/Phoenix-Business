/**
 * Support Email Service
 * Generates transactional and lifecycle emails for Phoenix optional support add-ons.
 * Strictly derives all dates, rates, and commitment details from ContractLifecycle and OrderSnapshot.
 */

function formatCents(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return '$0.00';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date) {
  if (!date) return 'N/A';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * 1. Support Activation Confirmation Email (Customer)
 */
function generateSupportActivationCustomerEmail(contract) {
  const customerName = contract.customerName || 'Valued Client';
  const support = contract.supportAddon || {};
  const coverageStart = formatDate(support.coverageStartAt || contract.websiteLaunchedAt || new Date());
  const coverageEnd = formatDate(support.supportEndAt || support.endDate);
  const monthlyFormatted = formatCents(support.discountedMonthlyCents || support.monthlyCents);
  const requestsIncluded = support.monthlyRequestsIncluded || (support.durationMonths === 6 ? 2 : support.durationMonths === 12 ? 4 : 6);

  const subject = `Your ${support.name || 'Optional Support'} is Now Active!`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #f3f4f6; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #121215; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ff4d00 0%, #d97706 100%); padding: 28px 24px; text-align: center; color: #fff;">
          <h1 style="margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Support Coverage Activated</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Website Launched & Architecture Assurance Active</p>
        </div>
        <div style="padding: 28px 24px; line-height: 1.6;">
          <p>Hello ${customerName},</p>
          <p>Congratulations on your website launch! Your optional <strong>${support.name}</strong> coverage has been officially activated.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 10px 0; color: #9ca3af;">Support Plan:</td>
              <td style="padding: 10px 0; color: #fff; font-weight: bold; text-align: right;">${support.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 10px 0; color: #9ca3af;">Status:</td>
              <td style="padding: 10px 0; color: #10b981; font-weight: bold; text-align: right;">ACTIVE (Hosted)</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 10px 0; color: #9ca3af;">Coverage Started:</td>
              <td style="padding: 10px 0; color: #fff; text-align: right;">${coverageStart}</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 10px 0; color: #9ca3af;">Coverage Ends:</td>
              <td style="padding: 10px 0; color: #fff; text-align: right;">${coverageEnd}</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 10px 0; color: #9ca3af;">Locked Monthly Rate:</td>
              <td style="padding: 10px 0; color: #f59e0b; font-weight: bold; text-align: right;">${monthlyFormatted}/month</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 10px 0; color: #9ca3af;">Monthly Minor Requests:</td>
              <td style="padding: 10px 0; color: #fff; text-align: right;">${requestsIncluded} requests / mo (up to 1.5 hrs each)</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #9ca3af;">Automatic Renewal:</td>
              <td style="padding: 10px 0; color: #9ca3af; text-align: right;">No (Expires automatically at term end)</td>
            </tr>
          </table>

          <p style="font-size: 13px; color: #9ca3af; margin-top: 20px;">
            To submit a support ticket or request assistance, email <a href="mailto:support@phoenixwebsites.ai" style="color: #ea580c;">support@phoenixwebsites.ai</a> or access your client portal.
          </p>
        </div>
      </div>
    </div>
  `;
  const text = `Support Coverage Activated: Your ${support.name} coverage is now active from ${coverageStart} to ${coverageEnd}. Rate: ${monthlyFormatted}/mo locked. Requests: ${requestsIncluded}/mo. Automatic renewal: No. Contact: support@phoenixwebsites.ai`;

  return { subject, html, text };
}

/**
 * 2. Support Transition to Self-Hosted Support Email (Customer)
 */
function generateSupportTransitionCustomerEmail(contract) {
  const customerName = contract.customerName || 'Valued Client';
  const support = contract.supportAddon || {};
  const coverageEnd = formatDate(support.supportEndAt || support.endDate);
  const monthlyFormatted = formatCents(support.discountedMonthlyCents || support.monthlyCents);
  const requestsIncluded = support.monthlyRequestsIncluded || 6;

  const subject = `Notice: Transition to Self-Hosted Support for Your 24-Month Agreement`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #f3f4f6; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #121215; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 28px 24px; text-align: center; color: #fff;">
          <h1 style="margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Support Transition Notice</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Self-Hosted Architecture Assurance (Months 13–24)</p>
        </div>
        <div style="padding: 28px 24px; line-height: 1.6;">
          <p>Hello ${customerName},</p>
          <p>As your initial 12-month Phoenix hosting agreement concludes, your active <strong>24-Month Long-Term Architecture Assurance</strong> add-on has automatically transitioned into <strong>Self-Hosted / Transition Support</strong> for the remainder of your committed 24-month term (through <strong>${coverageEnd}</strong>).</p>
          
          <div style="background: rgba(37, 99, 235, 0.1); border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 6px; margin: 18px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Zero Continuing Phoenix Hosting Charges:</strong> Phoenix website hosting fees have stopped. You are only billed your contracted locked support rate of <strong>${monthlyFormatted}/month</strong>.</p>
          </div>

          <h3 style="color: #f3f4f6; margin-top: 24px;">What Your Self-Hosted Support Covers:</h3>
          <ul style="padding-left: 20px; color: #d1d5db; line-height: 1.8;">
            <li>Source-code maintenance and critical bug fixes on your delivered Phoenix application.</li>
            <li>Dependency security vulnerability patching and runtime compatibility updates.</li>
            <li>Deployment troubleshooting and cutover guidance on your external host (AWS, Vercel, DigitalOcean, etc.).</li>
            <li>Database schema and connection troubleshooting.</li>
            <li>Up to <strong>${requestsIncluded} minor update requests per month</strong> (up to 1.5 engineering hours each).</li>
          </ul>

          <p style="font-size: 13px; color: #9ca3af;"><em>Note: Self-hosted support covers maintenance and defect remediation on your delivered system; it does not include third-party hosting server fees or brand-new major feature developments.</em></p>
        </div>
      </div>
    </div>
  `;
  const text = `Support Transition Notice: Your 24-month support add-on has transitioned to Self-Hosted Support through ${coverageEnd}. Phoenix hosting charges have stopped ($0 hosting). Your locked support rate is ${monthlyFormatted}/mo covering source code maintenance, bug fixes, dependency updates, and ${requestsIncluded} minor requests/mo.`;

  return { subject, html, text };
}

/**
 * 3. Support Expiration Confirmation Email (Customer)
 */
function generateSupportExpirationConfirmationEmail(contract) {
  const customerName = contract.customerName || 'Valued Client';
  const support = contract.supportAddon || {};
  const expiredDate = formatDate(support.supportEndAt || support.endDate || new Date());

  const subject = `Your ${support.name || 'Optional Support'} Coverage Has Concluded`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #f3f4f6; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #121215; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4b5563 0%, #374151 100%); padding: 28px 24px; text-align: center; color: #fff;">
          <h1 style="margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Support Coverage Concluded</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Effective ${expiredDate} — Billing Halted</p>
        </div>
        <div style="padding: 28px 24px; line-height: 1.6;">
          <p>Hello ${customerName},</p>
          <p>This email confirms that your optional <strong>${support.name}</strong> coverage has reached the end of its contracted ${support.durationMonths}-month duration on <strong>${expiredDate}</strong>.</p>
          
          <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin: 18px 0;">
            <p style="margin: 0; font-size: 14px; color: #10b981;"><strong>Billing Status:</strong> Recurring monthly billing for this support add-on has automatically terminated in Stripe ($0 continuing support charge). Because optional support does not auto-renew, no further support charges will occur.</p>
          </div>

          <p><strong>Base Website Unaffected:</strong> If your base Phoenix website agreement remains active, your core hosting, SSL, daily backups, and baseline included maintenance remain 100% operational.</p>
          <p>If you ever wish to re-enroll in an extended architecture or SLA retainer in the future, please reach out to us at <a href="mailto:hello@phoenixwebsites.ai" style="color: #ea580c;">hello@phoenixwebsites.ai</a>.</p>
        </div>
      </div>
    </div>
  `;
  const text = `Support Coverage Concluded: Your ${support.name} ended on ${expiredDate}. Recurring billing for this support add-on has stopped in Stripe ($0 continuing charge). Base website hosting remains unaffected.`;

  return { subject, html, text };
}

/**
 * 4. Owner Support Lifecycle Notification Email (Carter Moyer)
 */
function generateOwnerSupportAlertEmail(contract, eventType, details = {}) {
  const support = contract.supportAddon || {};
  const customerName = contract.customerName || 'Client';
  const customerEmail = contract.currentCustomerEmail;
  const contractId = contract.contractId;

  let title = 'Support Lifecycle Event';
  let badgeColor = '#ea580c';

  if (eventType === 'SUPPORT_ACTIVATED') {
    title = `Support Activated: ${customerName} (${support.name})`;
    badgeColor = '#10b981';
  } else if (eventType === 'SUPPORT_TRANSITIONED_TO_SELF_HOSTED') {
    title = `Support Transitioned: ${customerName} -> Self-Hosted Transition`;
    badgeColor = '#2563eb';
  } else if (eventType === 'SUPPORT_EXPIRED') {
    title = `Support Expired: ${customerName} (${support.name}) - Billing Stopped`;
    badgeColor = '#6b7280';
  } else if (eventType === 'SUPPORT_TERMINATED') {
    title = `Support Early Termination: ${customerName}`;
    badgeColor = '#ef4444';
  } else if (eventType === 'SUPPORT_BILLING_FAILED') {
    title = `ALERT: Support Billing Failed for ${customerName}`;
    badgeColor = '#ef4444';
  }

  const subject = `[SUPPORT ALERT] ${title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #f3f4f6; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px; color: #fff;">${title}</h2>
          <span style="background: ${badgeColor}; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${eventType}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr><td style="padding: 6px 0; color: #9ca3af;">Contract ID:</td><td style="padding: 6px 0; color: #fff; font-weight: bold;">${contractId}</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">Customer:</td><td style="padding: 6px 0; color: #fff;">${customerName} (${customerEmail})</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">Plan:</td><td style="padding: 6px 0; color: #fff;">${support.name || 'N/A'} (${support.durationMonths} Mos)</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">Rate:</td><td style="padding: 6px 0; color: #f59e0b;">${formatCents(support.discountedMonthlyCents || support.monthlyCents)}/mo locked</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">Status:</td><td style="padding: 6px 0; color: #fff; font-weight: bold;">${support.status}</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">Details:</td><td style="padding: 6px 0; color: #fff;">${JSON.stringify(details)}</td></tr>
        </table>
      </div>
    </div>
  `;
  const text = `[SUPPORT ALERT] ${title}\nContract: ${contractId}\nCustomer: ${customerName} (${customerEmail})\nPlan: ${support.name}\nRate: ${formatCents(support.discountedMonthlyCents || support.monthlyCents)}/mo\nStatus: ${support.status}\nDetails: ${JSON.stringify(details)}`;

  return { subject, html, text };
}

module.exports = {
  generateSupportActivationCustomerEmail,
  generateSupportTransitionCustomerEmail,
  generateSupportExpirationConfirmationEmail,
  generateOwnerSupportAlertEmail
};
