/**
 * Phoenix Websites AI — Authoritative Order Notification & Customer Receipt Email Generator
 * 
 * Strictly derives all order data, line items, pricing, discounts, support details,
 * contract terms, and technical briefs from the authoritative OrderSnapshot.
 */

/**
 * Formats cents into clean currency string ($XX.XX)
 * @param {number} cents 
 * @returns {string}
 */
function formatCents(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return '$0.00';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a Date object into a readable string
 * @param {Date|string} date 
 * @returns {string}
 */
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
 * Generates the complete, structured HTML and plaintext email for the business owner (Carter Moyer)
 * 
 * @param {Object} snapshot - Authoritative OrderSnapshot document
 * @param {Object} [session] - Stripe Checkout Session object
 * @returns {{ subject: string, html: string, text: string }}
 */
function generateOwnerOrderEmail(snapshot, session = {}) {
  const customerName = snapshot.customerName || (session.metadata && session.metadata.customer_name) || 'Client';
  const customerEmail = snapshot.customerEmail || (session.customer_details && session.customer_details.email) || session.customer_email || 'N/A';
  const customerPhone = snapshot.customerPhone || (session.customer_details && session.customer_details.phone) || 'Not Provided';
  const businessName = snapshot.businessName || (session.metadata && session.metadata.business_name) || 'Not Provided';
  const orderId = snapshot.orderId || session.id || 'N/A';
  const orderDate = formatDate(snapshot.createdAt || new Date());

  const tierName = snapshot.tierName || 'Custom Platform';
  const totalPages = snapshot.totalPages || 3;
  const extraPages = snapshot.extraPages || 0;

  const baseSetup = snapshot.baseSetupCents || 0;
  const extraPagesSetup = snapshot.extraPagesSetupCents || 0;
  const addonsSetup = snapshot.addonsSetupSubtotalCents || 0;
  const normalSetupSubtotal = baseSetup + extraPagesSetup + addonsSetup;

  const baseMonthly = snapshot.baseMonthlyCents || 0;
  const addonsMonthly = snapshot.addonsMonthlySubtotalCents || 0;
  const normalMonthlySubtotal = baseMonthly + addonsMonthly;

  const dueToday = snapshot.finalSetupCents ?? snapshot.dueTodayCents ?? (session.amount_total || 0);
  const monthlyRecurring = snapshot.finalMonthlyCents ?? 0;

  const totalSetupSavings = Math.max(0, normalSetupSubtotal - dueToday);
  const totalMonthlySavings = Math.max(0, normalMonthlySubtotal - monthlyRecurring);

  const firstBillingDisplay = formatDate(snapshot.firstMonthlyBillingDate);

  // Selected Add-Ons formatting
  const addonsList = Array.isArray(snapshot.selectedAddons) ? snapshot.selectedAddons : [];
  const nonSupportAddons = addonsList.filter(a => a.group !== 'support-duration' && !a.id?.startsWith('support_'));

  let addonsHtmlRows = '';
  let addonsTextRows = '';

  if (nonSupportAddons.length === 0) {
    addonsHtmlRows = `<tr><td colspan="4" style="padding: 12px; color: #888; text-align: center; font-style: italic;">No optional feature add-ons selected.</td></tr>`;
    addonsTextRows = '  - No optional feature add-ons selected.\n';
  } else {
    for (const a of nonSupportAddons) {
      const bType = a.billingType || (a.monthlyCents > 0 && a.setupCents > 0 ? 'BOTH' : (a.monthlyCents > 0 ? 'MONTHLY' : 'ONE_TIME'));
      const setupText = a.setupCents > 0 ? formatCents(a.setupCents) : '$0.00';
      const monthlyText = a.monthlyCents > 0 ? `${formatCents(a.monthlyCents)}/mo` : '$0.00/mo';
      const statusNote = a.includedInBase ? '<span style="color: #10b981; font-weight: bold;">(Base Included)</span>' : '';

      addonsHtmlRows += `
        <tr style="border-bottom: 1px solid #222;">
          <td style="padding: 10px 12px; font-weight: bold; color: #fff;">${a.name} ${statusNote}</td>
          <td style="padding: 10px 12px; color: #aaa; text-transform: uppercase; font-size: 11px;">${a.category || 'General'}</td>
          <td style="padding: 10px 12px; color: #f59e0b; font-size: 11px; font-weight: bold;">${bType}</td>
          <td style="padding: 10px 12px; color: #fff; text-align: right;">${setupText} setup | ${monthlyText}</td>
        </tr>`;
      addonsTextRows += `  - ${a.name} [${bType}] (${a.category || 'General'}): ${setupText} setup, ${monthlyText}${a.includedInBase ? ' (Included in Base)' : ''}\n`;
    }
  }

  // Support Add-on Details
  const support = snapshot.supportAddon;
  let supportHtmlBlock = '';
  let supportTextBlock = '';

  if (support && support.id) {
    const inclusionsList = (support.inclusions && support.inclusions.length > 0)
      ? support.inclusions.map(i => `<li style="margin-bottom: 4px; color: #ccc;">${i}</li>`).join('')
      : '<li style="color: #aaa;">Priority maintenance & defect triage</li>';
    const inclusionsText = (support.inclusions && support.inclusions.length > 0)
      ? support.inclusions.map(i => `      * ${i}`).join('\n')
      : '      * Priority maintenance & defect triage';

    supportHtmlBlock = `
      <div style="background: rgba(249, 115, 22, 0.08); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <strong style="color: #ea580c; font-size: 15px;">🛡️ ${support.name}</strong>
          <span style="background: #ea580c; color: #fff; font-size: 11px; font-weight: bold; padding: 2px 8px; rounded: 4px;">${support.durationMonths} MONTH COMMITMENT</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px;">
          <tr>
            <td style="color: #888; padding: 4px 0;">Due Today:</td>
            <td style="color: #fff; font-weight: bold; text-align: right;">$0.00</td>
          </tr>
          <tr>
            <td style="color: #888; padding: 4px 0;">Monthly Support Rate:</td>
            <td style="color: #fff; font-weight: bold; text-align: right;">${formatCents(support.monthlyCents)}/mo</td>
          </tr>
          <tr>
            <td style="color: #888; padding: 4px 0;">Support Starts:</td>
            <td style="color: #fff; font-weight: bold; text-align: right;">${firstBillingDisplay} (with 1st monthly subscription)</td>
          </tr>
          <tr>
            <td style="color: #888; padding: 4px 0;">Support Duration Ends:</td>
            <td style="color: #fff; font-weight: bold; text-align: right;">${formatDate(support.endDate)}</td>
          </tr>
        </table>
        <div style="font-size: 12px; color: #aaa; margin-top: 8px;">
          <strong style="color: #10b981; display: block; margin-bottom: 4px;">Contracted Inclusions:</strong>
          <ul style="margin: 0; padding-left: 20px;">
            ${inclusionsList}
          </ul>
        </div>
      </div>
    `;

    supportTextBlock = [
      `  Plan: ${support.name}`,
      `  Duration: ${support.durationMonths} Months`,
      `  Due Today: $0.00`,
      `  Monthly Support Rate: ${formatCents(support.monthlyCents)}/mo`,
      `  Support Billing Starts: ${firstBillingDisplay}`,
      `  Support Period Ends: ${formatDate(support.endDate)}`,
      `  Inclusions:`,
      inclusionsText
    ].join('\n');
  } else {
    supportHtmlBlock = `
      <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 14px; margin-bottom: 20px; color: #888; font-size: 13px;">
        <strong style="color: #aaa;">Standard Baseline Included Care:</strong> No optional support duration add-on selected. Customer receives base tier hosting, SSL lifecycle, daily backups, 99.9% uptime, and standard included tier maintenance.
      </div>
    `;
    supportTextBlock = `  Standard Baseline Included Care: No optional support duration add-on selected.\n  Customer receives base tier hosting, SSL lifecycle, daily backups, and included tier maintenance hours.`;
  }

  // Discounts breakdown
  let discountsHtml = '';
  let discountsText = '';

  if (snapshot.bundleDiscountSetupCents > 0 || snapshot.bundleDiscountMonthlyCents > 0) {
    discountsHtml += `<tr><td style="padding: 6px 0; color: #10b981;">Volume Bundle Discount (${snapshot.bundleDiscountPercent}% on Add-Ons):</td><td style="text-align: right; color: #10b981; font-weight: bold;">-${formatCents(snapshot.bundleDiscountSetupCents)} setup / -${formatCents(snapshot.bundleDiscountMonthlyCents)}/mo</td></tr>`;
    discountsText += `  - Volume Bundle (${snapshot.bundleDiscountPercent}% on Add-Ons): -${formatCents(snapshot.bundleDiscountSetupCents)} setup / -${formatCents(snapshot.bundleDiscountMonthlyCents)}/mo\n`;
  }
  if (snapshot.promotionDiscountSetupCents > 0 || snapshot.promotionDiscountMonthlyCents > 0) {
    discountsHtml += `<tr><td style="padding: 6px 0; color: #f97316;">Global Promo (${snapshot.promotionName} - ${snapshot.promotionDiscountPercent}%):</td><td style="text-align: right; color: #f97316; font-weight: bold;">-${formatCents(snapshot.promotionDiscountSetupCents)} setup / -${formatCents(snapshot.promotionDiscountMonthlyCents)}/mo</td></tr>`;
    discountsText += `  - Seasonal Promo (${snapshot.promotionName} - ${snapshot.promotionDiscountPercent}%): -${formatCents(snapshot.promotionDiscountSetupCents)} setup / -${formatCents(snapshot.promotionDiscountMonthlyCents)}/mo\n`;
  }
  if (snapshot.couponCode) {
    discountsHtml += `<tr><td style="padding: 6px 0; color: #38bdf8;">Coupon Code (${snapshot.couponCode}):</td><td style="text-align: right; color: #38bdf8; font-weight: bold;">-${formatCents(snapshot.couponDiscountSetupCents)} setup / -${formatCents(snapshot.couponDiscountMonthlyCents)}/mo</td></tr>`;
    discountsText += `  - Coupon Code (${snapshot.couponCode}): -${formatCents(snapshot.couponDiscountSetupCents)} setup / -${formatCents(snapshot.couponDiscountMonthlyCents)}/mo\n`;
  }
  if (!discountsHtml) {
    discountsHtml = `<tr><td colspan="2" style="padding: 6px 0; color: #666; font-style: italic;">No promotional or coupon discounts applied.</td></tr>`;
    discountsText = `  - No promotional or coupon discounts applied.\n`;
  }

  // Implementation Brief
  const nonSupportNames = nonSupportAddons.map(a => a.name).join(', ') || 'None';
  const supportSummary = support && support.id ? `${support.name} (${support.durationMonths} Mos)` : 'Standard Base Care';
  const technicalBriefText = [
    `1. Base Tier: Commission and deploy ${tierName} with ${totalPages} pages (${extraPages} extra pages beyond ${totalPages - extraPages} included quota).`,
    `2. Feature Add-Ons to Integrate: ${nonSupportNames}.`,
    `3. Support Tier: ${supportSummary}.`,
    `4. Edge Hosting: Provision Cloudflare/Vercel edge environment with SSL lifecycle and daily backups.`,
    `5. Customer Contact: ${customerName} (${customerEmail}, Phone: ${customerPhone}, Business: ${businessName}).`,
    `6. Initial Payment Verified: ${formatCents(dueToday)} charged today at Stripe checkout.`,
    `7. Subscription Pipeline: First recurring billing of ${formatCents(monthlyRecurring)}/mo scheduled for ${firstBillingDisplay} (30 days post-onboarding).`
  ].join('\n');

  const subject = `🔥 NEW PHOENIX ORDER: ${businessName !== 'Not Provided' ? businessName : customerName} — ${tierName} (${formatCents(dueToday)} today, ${formatCents(monthlyRecurring)}/mo)`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #e2e8f0; background-color: #050508; margin: 0; padding: 24px;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #0b0b12; border: 1px solid #1e1e2d; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e1008 0%, #0b0b12 100%); border-bottom: 2px solid #ea580c; padding: 24px 30px;">
      <div style="font-size: 11px; font-weight: 900; letter-spacing: 0.25em; color: #ea580c; text-transform: uppercase; margin-bottom: 6px;">
        Authoritative Order Notification
      </div>
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 6px 0; letter-spacing: -0.02em;">
        New Client Project Secured
      </h1>
      <div style="color: #94a3b8; font-size: 13px;">
        Order ID: <code style="color: #fdba74; font-family: monospace;">${orderId}</code> • ${orderDate}
      </div>
    </div>

    <div style="padding: 24px 30px;">
      
      <!-- Section 1: Customer Details -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 13px; font-weight: 900; letter-spacing: 0.15em; color: #94a3b8; text-transform: uppercase; margin: 0 0 12px 0; border-bottom: 1px solid #1e1e2d; padding-bottom: 6px;">
          01 / Customer Information
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;">Client Name:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Business / Company:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${businessName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Contact Email:</td>
            <td style="padding: 6px 0; color: #38bdf8; font-family: monospace;"><a href="mailto:${customerEmail}" style="color: #38bdf8; text-decoration: none;">${customerEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Phone Number:</td>
            <td style="padding: 6px 0; color: #ffffff;">${customerPhone}</td>
          </tr>
        </table>
      </div>

      <!-- Section 2: Project & Scope -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 13px; font-weight: 900; letter-spacing: 0.15em; color: #94a3b8; text-transform: uppercase; margin: 0 0 12px 0; border-bottom: 1px solid #1e1e2d; padding-bottom: 6px;">
          02 / Project Tier &amp; Scope
        </h2>
        <div style="background: #10101a; border: 1px solid #1e1e2d; border-radius: 8px; padding: 14px;">
          <div style="font-size: 16px; font-weight: 900; color: #ffffff; margin-bottom: 4px;">
            ${tierName}
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">
            Tier ID: <code style="color: #cbd5e1;">${snapshot.tierId}</code>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="color: #64748b; padding: 3px 0;">Total Configured Pages:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">${totalPages} Pages</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 3px 0;">Included in Base Tier:</td>
              <td style="color: #ffffff; text-align: right;">${totalPages - extraPages} Pages</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 3px 0;">Extra Scope Pages:</td>
              <td style="color: #f59e0b; font-weight: bold; text-align: right;">${extraPages} Pages (${formatCents(extraPagesSetup)})</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Section 3: Selected Add-Ons -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 13px; font-weight: 900; letter-spacing: 0.15em; color: #94a3b8; text-transform: uppercase; margin: 0 0 12px 0; border-bottom: 1px solid #1e1e2d; padding-bottom: 6px;">
          03 / Selected Modular Add-Ons
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #10101a; border: 1px solid #1e1e2d; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #161624; border-bottom: 1px solid #252538; text-align: left;">
              <th style="padding: 8px 12px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;">Add-On Name</th>
              <th style="padding: 8px 12px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;">Category</th>
              <th style="padding: 8px 12px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;">Billing</th>
              <th style="padding: 8px 12px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; text-align: right;">Pricing</th>
            </tr>
          </thead>
          <tbody>
            ${addonsHtmlRows}
          </tbody>
        </table>
      </div>

      <!-- Section 4: Support Plan -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 13px; font-weight: 900; letter-spacing: 0.15em; color: #94a3b8; text-transform: uppercase; margin: 0 0 12px 0; border-bottom: 1px solid #1e1e2d; padding-bottom: 6px;">
          04 / Optional Support Add-On &amp; SLA
        </h2>
        ${supportHtmlBlock}
      </div>

      <!-- Section 5: Pricing, Discounts & Final Authoritative Totals -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 13px; font-weight: 900; letter-spacing: 0.15em; color: #94a3b8; text-transform: uppercase; margin: 0 0 12px 0; border-bottom: 1px solid #1e1e2d; padding-bottom: 6px;">
          05 / Financial Reconciliation &amp; Discounts
        </h2>
        <div style="background: #10101a; border: 1px solid #1e1e2d; border-radius: 8px; padding: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px;">
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Standard Setup Subtotal:</td>
              <td style="color: #ffffff; text-align: right;">${formatCents(normalSetupSubtotal)}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Standard Monthly Subtotal:</td>
              <td style="color: #ffffff; text-align: right;">${formatCents(normalMonthlySubtotal)}/mo</td>
            </tr>
            <tr>
              <td colspan="2" style="border-top: 1px solid #1e1e2d; padding: 6px 0 2px 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #94a3b8;">
                Discounts &amp; Promotional Deductions:
              </td>
            </tr>
            ${discountsHtml}
          </table>

          <div style="border-top: 2px solid #2a2a3d; padding-top: 12px; display: flex; justify-content: space-between; gap: 12px;">
            <div style="flex: 1; background: #07070d; border: 1px solid #1e1e2d; border-radius: 6px; padding: 12px; text-align: center;">
              <span style="display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 4px;">Due Today (Paid in Stripe):</span>
              <span style="font-size: 20px; font-weight: 900; color: #ea580c;">${formatCents(dueToday)}</span>
              <span style="display: block; font-size: 10px; color: #10b981; margin-top: 2px;">Saved ${formatCents(totalSetupSavings)}</span>
            </div>
            <div style="flex: 1; background: #07070d; border: 1px solid #1e1e2d; border-radius: 6px; padding: 12px; text-align: center;">
              <span style="display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 4px;">Recurring Monthly Care:</span>
              <span style="font-size: 20px; font-weight: 900; color: #38bdf8;">${formatCents(monthlyRecurring)}/mo</span>
              <span style="display: block; font-size: 10px; color: #10b981; margin-top: 2px;">Starts ${firstBillingDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 6: Contract Terms & Compliance -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 13px; font-weight: 900; letter-spacing: 0.15em; color: #94a3b8; text-transform: uppercase; margin: 0 0 12px 0; border-bottom: 1px solid #1e1e2d; padding-bottom: 6px;">
          06 / Contract &amp; Legal Framework
        </h2>
        <div style="background: #10101a; border: 1px solid #1e1e2d; border-radius: 8px; padding: 14px; font-size: 12px; line-height: 1.6; color: #cbd5e1;">
          <div><strong>Base Website Commitment:</strong> 12 consecutive months with 30-day deferred billing trial.</div>
          <div><strong>Optional Support Duration:</strong> ${support && support.id ? `${support.durationMonths} months (ends ${formatDate(support.endDate)})` : 'None (Base tier hosting only)'}</div>
          <div><strong>Terms Version:</strong> <code style="color: #fdba74;">${snapshot.termsVersion || 'v4-wisconsin-hardened'}</code></div>
          <div><strong>Consent Timestamp:</strong> ${formatDate(snapshot.termsAcceptedAt || new Date())}</div>
          <div><strong>Early Termination Liquidated Damages:</strong> 50% of remaining monthly payments under <em>Wassenaar v. Panos</em>, 111 Wis. 2d 518.</div>
          <div><strong>Website Source Code Buyout:</strong> 50% of original setup fee for permanent code transfer &amp; IP release.</div>
        </div>
      </div>

      <!-- Section 7: Technical Implementation Brief -->
      <div>
        <h2 style="font-size: 13px; font-weight: 900; letter-spacing: 0.15em; color: #ea580c; text-transform: uppercase; margin: 0 0 12px 0; border-bottom: 1px solid #1e1e2d; padding-bottom: 6px;">
          07 / Technical Implementation Brief (Build Actions)
        </h2>
        <div style="background: #07070d; border: 1px dashed #ea580c; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 12px; color: #fdba74; white-space: pre-wrap; line-height: 1.5;">${technicalBriefText}</div>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #08080e; border-top: 1px solid #1e1e2d; padding: 16px 30px; text-align: center; font-size: 11px; color: #64748b;">
      Phoenix Websites AI • Internal Automated Order Dispatch System • Proprietary &amp; Confidential
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
================================================================
NEW PHOENIX WEBSITES AI ORDER
================================================================
Order ID: ${orderId}
Date: ${orderDate}

01 / CUSTOMER INFORMATION
----------------------------------------------------------------
Client Name:     ${customerName}
Business Name:   ${businessName}
Email:           ${customerEmail}
Phone:           ${customerPhone}

02 / PROJECT & SCOPE
----------------------------------------------------------------
Tier:            ${tierName} (${snapshot.tierId})
Total Scope:     ${totalPages} Pages (${extraPages} extra pages @ $150 each)

03 / SELECTED ADD-ONS
----------------------------------------------------------------
${addonsTextRows}
04 / OPTIONAL SUPPORT ADD-ON
----------------------------------------------------------------
${supportTextBlock}

05 / PRICING & DISCOUNTS
----------------------------------------------------------------
Standard Setup Subtotal:    ${formatCents(normalSetupSubtotal)}
Standard Monthly Subtotal:  ${formatCents(normalMonthlySubtotal)}/mo

Discounts:
${discountsText}
FINAL DUE TODAY:            ${formatCents(dueToday)} (Paid at checkout)
FINAL MONTHLY CARE:         ${formatCents(monthlyRecurring)}/mo (Starts ${firstBillingDisplay})

06 / CONTRACT & LEGAL
----------------------------------------------------------------
Base Website Term:          12 Consecutive Months
Optional Support Term:      ${support && support.id ? `${support.durationMonths} Months` : 'None'}
Terms Version:              ${snapshot.termsVersion || 'v4-wisconsin-hardened'}
Liquidated Damages:         50% remaining months (Wassenaar v. Panos, 111 Wis. 2d 518)
Buyout Fee:                 50% of setup fee for IP & source code transfer

07 / TECHNICAL IMPLEMENTATION BRIEF
----------------------------------------------------------------
${technicalBriefText}
================================================================
  `.trim();

  return { subject, html, text };
}

/**
 * Generates the transparent, professional customer receipt email
 * 
 * @param {Object} snapshot - Authoritative OrderSnapshot
 * @param {Object} [session] - Stripe Checkout Session
 * @returns {{ subject: string, html: string, text: string }}
 */
function generateCustomerReceiptEmail(snapshot, session = {}) {
  const customerName = snapshot.customerName || (session.metadata && session.metadata.customer_name) || 'Valued Client';
  const customerEmail = snapshot.customerEmail || (session.customer_details && session.customer_details.email) || 'N/A';
  const tierName = snapshot.tierName || 'Custom Platform';
  const totalPages = snapshot.totalPages || 3;
  const dueToday = snapshot.finalSetupCents ?? snapshot.dueTodayCents ?? (session.amount_total || 0);
  const monthlyRecurring = snapshot.finalMonthlyCents ?? 0;
  const firstBillingDisplay = formatDate(snapshot.firstMonthlyBillingDate);

  const support = snapshot.supportAddon;
  const supportSummary = support && support.id 
    ? `${support.name} (${support.durationMonths} Months @ ${formatCents(support.monthlyCents)}/mo)`
    : 'Standard Baseline Included Care';

  const nonSupportAddons = (snapshot.selectedAddons || []).filter(a => a.group !== 'support-duration' && !a.id?.startsWith('support_'));
  const addonsSummary = nonSupportAddons.length > 0 
    ? nonSupportAddons.map(a => a.name).join(', ') 
    : 'None';

  const subject = `Payment Confirmation & Service Agreement — ${tierName} | Phoenix Websites AI`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <div style="background: #0f172a; border-bottom: 3px solid #ea580c; padding: 24px 30px; color: #ffffff;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.2em; color: #ea580c; text-transform: uppercase;">
        Phoenix Websites AI
      </div>
      <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800;">
        Welcome Aboard! Payment Confirmed
      </h1>
    </div>

    <div style="padding: 24px 30px;">
      <p style="margin-top: 0; font-size: 15px; color: #475569;">
        Hi ${customerName},
      </p>
      <p style="font-size: 14px; color: #475569;">
        Thank you for choosing Phoenix Websites AI. Your payment has cleared successfully, and our senior engineering team has initiated the architectural kickoff for your project.
      </p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #0f172a; margin: 0 0 10px 0;">
          Order Summary &amp; Investment Details
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Platform Tier:</td>
            <td style="color: #0f172a; font-weight: bold; text-align: right;">${tierName} (${totalPages} Pages)</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Selected Feature Add-Ons:</td>
            <td style="color: #0f172a; text-align: right;">${addonsSummary}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Support Plan:</td>
            <td style="color: #0f172a; text-align: right;">${supportSummary}</td>
          </tr>
          <tr style="border-top: 1px solid #cbd5e1;">
            <td style="color: #0f172a; font-weight: bold; padding: 8px 0 4px 0;">Amount Paid Today:</td>
            <td style="color: #ea580c; font-weight: 900; font-size: 16px; text-align: right; padding: 8px 0 4px 0;">${formatCents(dueToday)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Monthly Subscription:</td>
            <td style="color: #0f172a; font-weight: bold; text-align: right;">${formatCents(monthlyRecurring)}/mo</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">First Monthly Billing Date:</td>
            <td style="color: #0f172a; text-align: right;">${firstBillingDisplay} (30-day deferred trial)</td>
          </tr>
        </table>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #475569;">
        <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Agreement &amp; Cancellation Notice:</strong>
        Your project entails an initial 12-month base commitment backed by our Lifetime Price Lock Guarantee. In accordance with Wisconsin law (Wis. Stat. § 134.49), non-renewal notice may be submitted via your client portal or email between 60 and 30 days prior to your anniversary date.
      </div>

      <p style="font-size: 13px; color: #475569;">
        A copy of your signed Master Service Agreement is attached to this email. For any technical or billing questions, simply reply directly to this email or contact us at <a href="mailto:hello@phoenixwebsites.ai" style="color: #ea580c; font-weight: bold;">hello@phoenixwebsites.ai</a>.
      </p>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
        Carter Moyer • Founder &amp; Lead Systems Architect<br>
        <strong>Phoenix Websites AI</strong> • <a href="https://phoenixwebsites.ai" style="color: #ea580c; text-decoration: none;">phoenixwebsites.ai</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Welcome to Phoenix Websites AI!
Hi ${customerName},

Your payment of ${formatCents(dueToday)} has been received and confirmed.
Plan: ${tierName} (${totalPages} Pages)
Selected Add-Ons: ${addonsSummary}
Support Plan: ${supportSummary}
Amount Due Today: ${formatCents(dueToday)}
Monthly Recurring: ${formatCents(monthlyRecurring)}/mo (First monthly charge starts ${firstBillingDisplay})

Initial Commitment: 12 Consecutive Months with Lifetime Price Lock.
Cancellations: Written notice between 60 and 30 days prior to annual renewal.
Contact: hello@phoenixwebsites.ai

Thank you for choosing Phoenix Websites AI!
  `.trim();

  return { subject, html, text };
}

module.exports = {
  formatCents,
  formatDate,
  generateOwnerOrderEmail,
  generateCustomerReceiptEmail
};
