# Support Lifecycle, Billing Architecture & Multi-Year Add-On Determinism
**Phoenix Websites AI — Comprehensive Engineering & Legal Audit (Pass 6)**
*Document Version: 2026.6-WI*  
*Jurisdiction: State of Wisconsin / Eastern District of Wisconsin*  
*Governing Authorities: Wis. Stat. § 134.49, Wassenaar v. Panos (111 Wis. 2d 518), 17 U.S.C. § 204, Wis. Stat. § 138.05*

---

## 1. Executive Summary: Problem & Sixth Pass Resolution

In earlier passes, the relationship between the **12-month base website agreement** and optional multi-year support add-ons contained an ambiguous operational branch:
> *"Hosting-dependent support ends with zero continuing charges or penalties, OR the client may apply remaining support to code reviews/maintenance for their self-hosted installation."*

This vague "either/or" language failed to define:
- Who chooses between termination and self-hosted support.
- What financial obligations continue if the base website agreement is not renewed at Month 12.
- How Stripe stops recurring support charges without cancelling the base website subscription.
- Exactly what rights and source-code assets are delivered if the client does not execute the separate 50% IP Buyout.
- The precise date distinction between `websiteLaunchedAt`, `coverageStartAt`, `billingStartAt`, and `supportEndAt`.

The **Sixth Pass** establishes **ONE deterministic, server-enforced, and contractually disclosed rule** across every phase of the customer journey: the configurator, OrderSnapshot, ContractLifecycle, Stripe subscriptions, renewal scheduler, owner console, and transactional emails.

---

## 2. Core Architecture: Add-On vs. Base Agreement

### 2.1 Decoupled Agreements
1. **Base Website Agreement:**
   - 12-month initial commitment for website design, build, deployment, cloud infrastructure, DNS, and hosting.
   - Initial term automatically renews annually subject to Wisconsin statutory notice under **Wis. Stat. § 134.49**.
2. **Optional Support Add-On:**
   - Voluntary service add-on chosen at checkout: **None (default)**, **6 months**, **12 months**, or **24 months**.
   - **Never auto-renews.** Terminates automatically upon reaching `supportEndAt`.
   - Mutually exclusive plans with distinct SLAs and monthly request allocations.

### 2.2 Standard vs. Locked Promotional Rates
Longer commitments receive lower standard monthly rates because the client commits to a longer support horizon:
- **6-Month Standard:** $89.00/month (total commitment: $534.00)
- **12-Month Standard:** $69.00/month (total commitment: $828.00)
- **24-Month Standard:** $49.00/month (total commitment: $1,176.00)

**Price & Promotion Lock Guarantee:**
If purchased during an active seasonal campaign (e.g., Halloween 35% off), the discounted monthly rate (e.g., $31.85/month for 24 months) remains **strictly locked** for the entirety of the contracted duration. Subsequent changes to the public pricing calendar or expired promotions never alter an active contract's rate.

---

## 3. Support Dates, Activation & State Machine

### 3.1 Date Distinctions
- `websiteLaunchedAt`: Authoritative timestamp set by owner/admin when the production site goes live. (Before launch, support is `PENDING_ACTIVATION`).
- `coverageStartAt`: Effective date when support triage and maintenance begin (identically matches `websiteLaunchedAt`).
- `billingStartAt`: First recurring support charge date, set to exactly 30 calendar days post-checkout/launch, synchronized with the base monthly billing cycle.
- `supportEndAt`: Authoritative expiration date calculated strictly as `coverageStartAt + durationMonths` (using day-clamped calendar math).

### 3.2 State Machine
A support add-on progresses through explicit, deterministic states:
1. `NONE`: No optional support purchased.
2. `PENDING_ACTIVATION`: Checkout completed; site in active development; support coverage has not started.
3. `ACTIVE_HOSTED`: Website is live on Phoenix hosting; full cloud infrastructure and maintenance active.
4. `ACTIVE_TRANSITION`: Base website agreement was non-renewed or completed at Month 12 while 24-month support remains active. Support transitions automatically to Self-Hosted Transition Support at $0 hosting charges.
5. `EXPIRING`: System has dispatched the 30-day advance expiration courtesy reminder.
6. `EXPIRED`: Support duration completed; Stripe support billing terminated; client returns to base website care.
7. `EARLY_TERMINATION_REQUESTED`: Client requested early termination; authoritative quote generated.
8. `TERMINATED`: Support early termination executed and settled.

---

## 4. The 6-Month & 12-Month Support Lifecycles

### 4.1 6-Month Support Lifecycle
- **Starts:** On `websiteLaunchedAt`.
- **Duration:** Exactly 6 calendar months.
- **Inclusions:** Priority email support (<24h triage window), up to 2 minor requests/month (max 1.5 engineering hours each).
- **At Expiration (Month 6):**
  - Daily scheduler detects `supportEndAt` reached.
  - State advances to `EXPIRED`.
  - Stripe recurring support subscription item is deleted ($0 continuing support charge).
  - Base website agreement ($99–$299/mo) continues uninterrupted.
  - Client receives an expiration confirmation email confirming no auto-renewal and zero future support charges.

### 4.2 12-Month Support Lifecycle
- **Starts:** On `websiteLaunchedAt`.
- **Duration:** Exactly 12 calendar months.
- **Inclusions:** Accelerated triage (<12h window), up to 4 minor requests/month (max 1.5 engineering hours each).
- **Independence from Base Agreement:**
  - Base website renewal occurs under Wis. Stat. § 134.49 (annual renewal).
  - 12-Month Support ends at Month 12 and **does not auto-renew**.
  - If website renews into Year 2, support billing ceases unless client explicitly purchases a new support add-on.

---

## 5. The Deterministic 24-Month Support Rule

When a client purchases 24-Month Support ($49/month or locked promotional equivalent), the commitment is 24 months.

### 5.1 Months 1–12 (Year 1)
- State is `ACTIVE_HOSTED`.
- Inclusions: Highest SLA (<4h critical triage, weekend coverage), up to 6 minor requests/month.
- Client pays base website fee + support fee.

### 5.2 Branch A: Website Renews at Month 12
- Website advances to Term 2 (`RENEWED`).
- Support remains `ACTIVE_HOSTED` for Months 13–24 at the guaranteed locked monthly rate ($49.00/mo or promotional equivalent).
- No price escalation.

### 5.3 Branch B: Website Does NOT Renew at Month 12
- Client submits timely non-renewal for the base website agreement under Wis. Stat. § 134.49.
- At Month 12 expiration, Phoenix cloud hosting, edge CDN, and live server billing **cease entirely ($0 hosting charges)**.
- **Deterministic Transition:** The remaining 12 months of support **automatically transition to `ACTIVE_TRANSITION` (Self-Hosted Transition Support)**.
- **Scope of Transition Support:**
  - Remote source-code maintenance and defect remediation.
  - Dependency, security patch, and compatibility updates.
  - Deployment troubleshooting on client-managed hosting (Vercel, AWS, Cloudflare, etc.).
  - Code-health consultations and architecture triage.
  - Up to 6 minor service requests per month (up to 1.5 hours per request).
- **Exclusions:** Does NOT include Phoenix cloud hosting or net-new feature development.
- **Billing:** Client continues paying only their locked monthly support rate ($49/mo or promotional rate). Zero hosting fees are charged.

---

## 6. Intellectual Property & Source Code Buyout Reconciliation

A critical issue addressed in Pass 6 is reconciling Transition Support with the proprietary codebase without creating an accidental IP giveaway:

1. **Standard Contract Completion / Non-Renewal:**
   - Under Section 5 of the Terms of Service, the client receives a **compiled, deployable runtime asset package** (production JavaScript, static assets, Dockerfile, and environment configurations) under a non-exclusive, perpetual runtime license for self-hosting.
   - Transition Support operates seamlessly on this compiled package, providing build updates and patch deployments.
2. **Voluntary 50% Source Code & IP Buyout:**
   - Under Section 5, transfer of the **complete uncompiled source repository (Git history), Figma design systems, editable vector assets, and full copyright assignment (17 U.S.C. § 204)** requires payment of the voluntary **Buyout Fee (50% of original setup fee)**.
   - Transition Support **does not require** the Buyout Fee. A client who self-hosts compiled code receives full transition support. If the client separately elects the Buyout Fee, transition support applies directly to their raw Git repository.

---

## 7. Service Request Limits & SLA Definitions

### 7.1 Minor Service Request Definition
A "Minor Service Request" is defined as a discrete technical or design task that requires **no more than 1.5 engineering hours** to analyze, execute, test, and deploy:
- *Qualifying Examples:* Copy and typography updates, asset replacements, stylesheet polish, meta tag/SEO adjustments, dependency patch upgrades, and single-component bug remediation.
- *Non-Qualifying Examples:* Net-new payment gateway integrations, complete database schema rewrites, greenfield feature builds, or multi-page structural redesigns.
- *Rollover Policy:* **Zero rollover.** Unused monthly request allowances expire at the end of each billing cycle to preserve predictable engineering capacity.

### 7.2 Service Level Agreement (SLA) Definitions
SLAs specify **Initial Response and Triage Windows**, not complete defect resolution time (which depends on third-party dependencies and issue complexity):
- **6-Month Plan:** Initial triage within **24 business hours** (Monday–Friday, 9:00 AM – 5:00 PM Central).
- **12-Month Plan:** Initial triage within **12 business hours**.
- **24-Month Plan:** Critical triage within **4 hours** (including 24/7 weekend coverage for severity-1 service interruptions; next-business-day response for non-critical requests).
- **Third-Party Exclusions:** Upstream outages (e.g., Stripe, AWS, Cloudflare, DNS registrars) are excluded from SLA response metrics.

---

## 8. Stripe Subscription Architecture & Clean Billing Halt

### 8.1 Multi-Item Subscription Model
In previous iterations, there was risk that terminating support would cancel the entire customer subscription. Pass 6 enforces multi-item subscriptions:
- **Item 1 (Base):** Phoenix Managed Cloud Hosting & Platform Maintenance ($99.00–$299.00/mo).
- **Item 2 (Support):** Optional Support Add-On ($49.00–$89.00/mo or locked promotional rate).
- Both items are tagged with distinct `metadata`:
  - `itemRole: 'base_service'` vs `itemRole: 'support_addon'`
  - `contractId: 'CT-ord_...'`
  - `supportDurationMonths: 6 | 12 | 24`

### 8.2 Safe Termination Mechanism (`expireSupportAndStopStripeBilling`)
When `supportEndAt` is reached:
1. The scheduler calls `expireSupportAndStopStripeBilling(contract, options)`.
2. The service queries Stripe for the customer's subscription.
3. If the subscription contains multiple items, `stripe.subscriptionItems.del(stripeSupportItemId, { proration_behavior: 'none' })` is invoked.
4. If represented as a single combined subscription item, the unit amount is reduced by the support monthly rate.
5. The base hosting line item is **untouched and remains active**.
6. The contract audit log records `SUPPORT_EXPIRED` with the Stripe deletion response.

---

## 9. Support Early Termination & Wisconsin Legal Basis

### 9.1 Legal Analysis under *Wassenaar v. Panos*, 111 Wis. 2d 518 (1983)
Under Wisconsin law, stipulated damages must reflect a reasonable forecast of compensatory harm rather than a punitive penalty. For voluntary early cancellation of a multi-year support add-on:
1. **Compensatory Harm:** Phoenix extends deeply discounted rates ($49/mo vs $89/mo) and reserves senior engineering capacity based on a 24-month commitment.
2. **Avoided Variable Costs:** When support is terminated prematurely, Phoenix avoids future on-demand labor and ticketing triage (~50% of the recurring fee).
3. **The Enforceable Standard:** The customer pays **50% of the remaining monthly support fees**. This compensates Phoenix for reserved capacity and rate differential while crediting the client for avoided labor.

### 9.2 Strict Separation of Obligations
If a customer terminates early, the system generates an itemized quote separating three distinct obligations:
$$\text{Total Settlement} = \text{Base Website Damages} + \text{Support Add-On Damages} + \text{Optional Buyout Fee}$$
- **Base Website Damages:** 50% of remaining base monthly fees through Month 12.
- **Support Add-On Damages:** 50% of remaining support monthly fees through Month 6, 12, or 24.
- **IP Buyout Fee:** 50% of original setup fee (optional, only if customer elects full source code ownership).
- **No Double Counting:** Each line item is tracked and billed independently.

---

## 10. Automated Lifecycle Scheduler & Transactional Emails

### 10.1 Daily Scheduler Additions (`renewal-scheduler.service.js`)
- **Step 6 (Support Expiration Notice):** Evaluates active support contracts where `supportEndAt` is 30 days away. Dispatches a courteous reminder explaining that support will expire on schedule with zero auto-renewal and zero continuing fees.
- **Step 7 (Authoritative Support Expiration):** Evaluates contracts where `supportEndAt <= now`. Transitions status to `EXPIRED`, removes the Stripe support subscription item, and logs an immutable audit event.

### 10.2 Transactional Email Engine (`support-email.service.js`)
- `generateCustomerSupportActivationEmail`: Confirms coverage start, locked monthly rate, SLA, request quota, and no-auto-renew policy.
- `generateCustomerSupportTransitionEmail`: Dispatched when website non-renews; confirms automatic transition to Self-Hosted Support, $0 hosting charges, and ongoing maintenance scope.
- `generateCustomerSupportExpirationEmail`: Confirms support has concluded, Stripe charges have ceased, and base website hosting remains active.
- `generateOwnerSupportAlertEmail`: Alerts management of key milestones (`ACTIVATED`, `TRANSITIONED`, `EXPIRED`, `TERMINATED`).

---

## 11. Security & Server Authoritativeness

To eliminate client-side tampering:
1. **Price & Duration Integrity:** The frontend configurator only submits the plan ID (`support_6mo`, `support_12mo`, `support_24mo`). The backend `pricing.service.js` calculates all fees, discounts, and commitment totals server-side.
2. **Date Authoritativeness:** `coverageStartAt`, `billingStartAt`, and `supportEndAt` are calculated strictly by the server and immutable once stored.
3. **Database Guardrails:** Mongoose schema validators enforce valid status transitions and reject invalid state combinations.

---

## 12. Migration Strategy for Legacy Contracts

For contracts executed prior to Pass 6:
- If `supportAddon` exists without `status`, the contract is flagged as `PENDING_MIGRATION_REVIEW`.
- Existing promotional rates are preserved using their immutable `OrderSnapshot` records.
- Historical launch dates are never fabricated; unlaunched contracts remain `PENDING_ACTIVATION` until verified by owner action.
