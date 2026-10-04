# Contract Lifecycle, Wisconsin Statutory Compliance & Automatic Renewal Architecture
**Phoenix Websites AI — Comprehensive Engineering & Legal Audit (Pass 5)**
*Document Version: 2026.5-WI*
*Jurisdiction: State of Wisconsin / Eastern District of Wisconsin*
*Governing Authorities: Wis. Stat. § 134.49, Wassenaar v. Panos (111 Wis. 2d 518), Wis. Stat. § 138.05, Wis. Stat. § 422.203*

---

## 1. Executive Summary & The Problem Solved

Prior to Pass 5, Phoenix Websites AI contracts and marketing stated that a Wisconsin statutory reminder would be provided prior to automatic annual renewal, but **no persistent contract lifecycle state machine or production scheduler existed to track, calculate, or deliver these statutory notices**. 

Under Wisconsin law (**Wis. Stat. § 134.49**), if a seller of business services fails to provide the required advance written notice within the statutory window:
1. **The automatic renewal provision becomes legally void and unenforceable.**
2. **The contract terminates automatically at the end of the initial 12-month term.**
3. If the seller attempts to enforce the renewal or charge unauthorized renewal payments, the customer may recover **twice the amount of damages plus court costs and reasonable attorney fees** under **Wis. Stat. § 134.49(6)**.

Pass 5 implements the complete, production-grade system:
- Centralized persistent `ContractLifecycle` schema with an explicit state machine and immutable audit log.
- Authoritative calendar date mathematics taking into account anniversaries, leap years, month-end clamping, and America/Chicago business time.
- Fully automated, idempotent daily renewal scheduler (`renewal-scheduler.service.js`) with atomic database locking to prevent duplicate notices.
- Automatic retry engine with escalating alerts to `hello@phoenixwebsites.ai` upon persistent failure.
- Clear operational separation between **timely non-renewal** ($0 fee, services run through term end) and **early termination liquidated damages** (50% formula under *Wassenaar v. Panos*).
- Complete operationalization of 6, 12, and 24-month optional support add-ons, including cross-renewal behavior.

---

## 2. Authoritative Wisconsin Legal Requirements (Wis. Stat. § 134.49)

### 2.1 Scope & Covered Contracts
- **Covered Transactions (§ 134.49(1)(a)):** Contracts for the lease of business equipment or the provision of business services entered into or renewed after May 1, 2011.
- **Initial Term & Renewal Duration (§ 134.49(2)(a)):** Applies to contracts with an initial term of one (1) year or more that automatically renew for a period of more than one (1) month.
- **Statutory Exemptions (§ 134.49(1)(b)):** Excludes contracts where the customer can terminate upon notice of 30 days or less without penalty; contracts with federal/state government entities; and contracts for personal, family, or household purposes (governed separately by the Wisconsin Consumer Act).

### 2.2 Point-of-Sale Disclosure Requirements (§ 134.49(2))
At contract execution, the seller must include a conspicuous disclosure explaining that the contract will renew unless declined, and the specific actions required to decline renewal.

### 2.3 Statutory Notice Window (§ 134.49(3)(a))
The seller must provide written notice to the customer:
> **"no more than 60 days and no less than 15 days before the date on which the customer must provide notice to the seller of the customer's intention not to renew."**

#### The Timeline Calculation:
- **Term Expiration Date:** Anniversary date (Day 365 / Month 12).
- **Customer Non-Renewal Deadline:** Thirty (30) days prior to term expiration (Day 335).
- **Statutory Notice Window Opens:** 60 days before deadline = Day 275 (90 days before contract expiration).
- **Statutory Notice Window Closes:** 15 days before deadline = Day 320 (45 days before contract expiration).
- **Phoenix Scheduled Target:** Midpoint at 35 days before deadline (Day 300 / 65 days before expiration). This provides a 20-day buffer before the window closes.

### 2.4 Required Contents of the Notice (§ 134.49(3)(b))
1. A clear statement that the contract will renew unless the customer declines.
2. The specific calendar date deadline by which the customer must decline renewal.
3. Full disclosure of any price changes or rate adjustments (Phoenix guarantees a 0% price increase via its Lifetime Price Lock Guarantee).
4. Concrete, conspicuous instructions describing how the customer can decline renewal.

### 2.5 Permissible Delivery Methods (§ 134.49(4))
- **Electronic Mail (§ 134.49(4)(f)):** Permitted if the contract allows the customer to use electronic mail to decline renewal. Phoenix Websites AI contracts expressly authorize email cancellation to `hello@phoenixwebsites.ai` and authenticated client portal non-renewal, fulfilling this requirement.

---

## 3. Architecture & Data Model

### 3.1 Model: `ContractLifecycle.js`
Located in `backend/models/ContractLifecycle.js`:
```javascript
{
  contractId: "CT-ord_12345",
  orderSnapshotId: "ord_12345",
  userId: ObjectId,
  initialCustomerEmail: "client@business.com",
  currentCustomerEmail: "client@business.com",
  customerName: "Jane Doe",
  businessName: "Acme Corp",
  tierId: "business",
  tierName: "Business Growth Engine",
  setupCents: 349900,
  monthlyCents: 29900,
  contractStatus: "ACTIVE", // State Machine
  currentTermNumber: 1,
  termsHistory: [{
    termNumber: 1,
    startDate: 2026-10-03T00:00:00Z,
    endDate: 2027-10-03T00:00:00Z,
    nonRenewalDeadline: 2027-09-03T00:00:00Z,
    reminderWindowStart: 2027-07-05T00:00:00Z,
    reminderWindowEnd: 2027-08-19T00:00:00Z,
    reminderScheduledDate: 2027-07-30T00:00:00Z,
    reminderStatus: "PENDING", // PENDING -> PROCESSING -> SENT | FAILED
    reminderAttemptCount: 0,
    reminderSentAt: null,
    providerMessageId: null,
    nonRenewalStatus: "NONE" // NONE -> CONFIRMED
  }],
  supportAddon: {
    id: "support_12mo",
    name: "12-Month Proactive Care",
    durationMonths: 12,
    monthlyCents: 6900,
    startDate: 2026-11-02T00:00:00Z,
    endDate: 2027-11-02T00:00:00Z,
    status: "ACTIVE"
  },
  auditLog: [{
    timestamp: 2026-10-03T21:00:00Z,
    eventType: "CONTRACT_CREATED",
    actor: "STRIPE_WEBHOOK",
    details: { ... }
  }]
}
```

### 3.2 State Machine
The contract transitions through explicit states:
- `ACTIVE`: Contract in good standing; awaiting renewal reminder window.
- `RENEWAL_REMINDER_PENDING`: Statutory renewal reminder has been dispatched; awaiting customer action or automatic renewal.
- `NON_RENEWAL_REQUESTED`: Customer submitted timely notice to decline renewal; service continues through current term end date with $0 penalty.
- `RENEWED`: Successfully advanced to next 12-month term (creates Term 2 in `termsHistory`).
- `EARLY_TERMINATION_REQUESTED`: Customer requested early cessation prior to non-renewal deadline; authoritative 50% quote generated.
- `TERMINATED`: Contract completed and ceased.
- `PAYMENT_DELINQUENT`: Overdue payment beyond cure period.
- `CANCELLED`: Mutual cancellation.

---

## 4. Idempotency & Scheduler Design

### 4.1 Daily Scheduler Service (`renewal-scheduler.service.js`)
- Runs daily at 08:00 UTC (03:00 Central).
- Query matches:
  - `contractStatus` in `['ACTIVE', 'RENEWAL_REMINDER_PENDING']`
  - Current term `reminderStatus` in `['PENDING', 'FAILED']`
  - Current date >= `reminderWindowStart` AND <= `reminderWindowEnd`
  - `nonRenewalStatus` == `'NONE'`

### 4.2 Atomic Database Locking
To prevent duplicate emails across multiple workers, retries, or serverless cold starts:
```javascript
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
if (!lockedContract) continue; // Concurrently acquired by another process
```

### 4.3 Retries & Escalation
- If sending succeeds: Status updated to `SENT`, records `providerMessageId` and `reminderSentAt`.
- If sending fails: Status updated to `FAILED`, increments `reminderAttemptCount`.
- **Owner Escalation:** If `reminderAttemptCount >= 3` or if fewer than 3 days remain before `reminderWindowEnd`:
  - Automatically dispatches high-priority email to `hello@phoenixwebsites.ai` with subject:
    `ACTION REQUIRED — RENEWAL NOTICE DELIVERY FAILURE [Contract ID]`
  - Alerts the operator to execute postal or manual delivery before the statutory window closes.

---

## 5. Non-Renewal vs. Early Termination vs. Buyout

| Dimension | Timely Non-Renewal | Early Termination | Website / IP Buyout |
| :--- | :--- | :--- | :--- |
| **Trigger Time** | ≥ 30 days prior to term expiration | Any time before the non-renewal window | Any time during or after contract |
| **Legal Classification** | Contractual expiration per terms | Unilateral breach / early cessation | Independent consideration for IP transfer |
| **Statutory Standard** | Wis. Stat. § 134.49 | *Wassenaar v. Panos* reasonableness | Uniform Commercial Code / Contract Law |
| **Financial Cost** | **$0.00 Penalty** | **50% of remaining monthly fees** | **50% of original setup fee** |
| **Hosting & Service** | Continues active through term end date | Terminated on effective settlement date | Can transition to self-hosting or remain hosted |
| **Source Code Transfer** | Proprietary license ends unless bought out | Proprietary license ends unless bought out | **Full uncompiled code & DB schema transferred** |

---
## 6. Multi-Year Support Across 12-Month Website Renewals (Pass 6 Deterministic Rule)

When a client selects **24-Month Support** alongside a **12-Month Website Agreement**:
1. **If Website Renews at Month 12:** Support continues uninterrupted into Year 2 in `ACTIVE_HOSTED` mode at the guaranteed locked monthly rate ($49/mo standard or locked promotional rate).
2. **If Customer Elects Non-Renewal of Website at Month 12:**
   - Phoenix cloud hosting and platform charges terminate at Month 12 with **$0 continuing hosting fees**.
   - The remaining 12 months of the 24-month support commitment **automatically transition to `ACTIVE_TRANSITION` (Self-Hosted Transition Support)**.
   - Transition Support covers source-code defect remediation, dependency/security updates, deployment troubleshooting on client infrastructure, and up to 6 minor service requests per month (up to 1.5 engineering hours each).
   - Client pays only their locked support fee ($49/mo or promotional equivalent); zero fees are charged for discontinued hosting services.
   - Compiled runtime assets are delivered under a non-exclusive license; full uncompiled Git repository assignment remains governed by the optional 50% IP Buyout Fee.
   - If the client requests early termination of support, early termination damages are 50% of the remaining monthly support fees under *Wassenaar v. Panos*.
   - At Month 24, support status transitions to `EXPIRED`, and the Stripe recurring support charge is automatically deleted.
---

## 7. Production Deployment & Cron Security

1. **Vercel Cron Integration (`vercel.json`):**
   ```json
   {
     "path": "/api/cron/daily-renewals",
     "schedule": "0 8 * * *"
   }
   ```
2. **Authentication Protection:**
   The `/api/cron/daily-renewals` endpoint enforces authorization:
   - Verifies `Authorization: Bearer ${CRON_SECRET}` or query parameter `?key=${CRON_SECRET}`.
   - In production, unauthenticated requests receive `401 Unauthorized`.
3. **CLI Runner:**
   A standalone Node script is available at `backend/scripts/run-daily-renewals.js`:
   ```bash
   node backend/scripts/run-daily-renewals.js [--date=YYYY-MM-DD] [--dry-run]
   ```
