const mongoose = require('mongoose');

/**
 * Contract Term History Entry Schema
 * Tracks each 12-month contractual term independently to ensure full legal auditability
 */
const termHistorySchema = new mongoose.Schema({
  termNumber: { type: Number, required: true, default: 1 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  // Non-Renewal Deadline (30 days prior to term expiration)
  nonRenewalDeadline: { type: Date, required: true },
  
  // Statutory Notice Window under Wis. Stat. § 134.49 (15 to 60 days before nonRenewalDeadline)
  reminderWindowStart: { type: Date, required: true },
  reminderWindowEnd: { type: Date, required: true },
  reminderScheduledDate: { type: Date, required: true },
  
  // Reminder Execution & Idempotency
  reminderStatus: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'EXEMPT', 'SKIPPED'], 
    default: 'PENDING',
    index: true
  },
  reminderAttemptCount: { type: Number, default: 0 },
  reminderLastAttemptAt: { type: Date },
  reminderSentAt: { type: Date },
  reminderFailureReason: { type: String },
  providerMessageId: { type: String },
  
  // Non-Renewal Execution
  nonRenewalStatus: { 
    type: String, 
    enum: ['NONE', 'REQUESTED', 'CONFIRMED', 'REJECTED'], 
    default: 'NONE' 
  },
  nonRenewalRequestedAt: { type: Date },
  nonRenewalEffectiveDate: { type: Date },
  nonRenewalSource: { 
    type: String, 
    enum: ['CUSTOMER_PORTAL', 'EMAIL_MANUAL', 'ADMIN_OVERRIDE', 'NONE'],
    default: 'NONE'
  },
  nonRenewalNotes: { type: String },

  // Terms version governing this term
  termsVersion: { type: String, default: '2026.5-WI' }
}, { _id: false });

/**
 * Immutable Audit Log Entry Schema
 */
const auditLogEntrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  eventType: { 
    type: String, 
    required: true,
    enum: [
      'CONTRACT_CREATED',
      'RENEWAL_REMINDER_SCHEDULED',
      'RENEWAL_REMINDER_PROCESSING',
      'RENEWAL_REMINDER_SENT',
      'RENEWAL_REMINDER_FAILED',
      'RENEWAL_REMINDER_ESCALATED',
      'NON_RENEWAL_REQUESTED',
      'NON_RENEWAL_CONFIRMED',
      'CONTRACT_RENEWED',
      'EARLY_TERMINATION_REQUESTED',
      'EARLY_TERMINATION_COMPLETED',
      'BUYOUT_REQUESTED',
      'BUYOUT_COMPLETED',
      'SUPPORT_PURCHASED',
      'SUPPORT_ACTIVATED',
      'SUPPORT_EXPIRATION_NOTICE_SENT',
      'SUPPORT_TRANSITIONED_TO_SELF_HOSTED',
      'SUPPORT_EXPIRED',
      'SUPPORT_TERMINATION_REQUESTED',
      'SUPPORT_TERMINATED',
      'SUPPORT_REQUEST_LOGGED',
      'SUPPORT_STARTED',
      'SUPPORT_REMINDER_SENT',
      'PAYMENT_DELINQUENT_FLAGGED',
      'CUSTOMER_EMAIL_UPDATED',
      'ADMIN_MANUAL_OVERRIDE'
    ]
  },
  actor: { type: String, required: true, default: 'SYSTEM' }, // 'SYSTEM', 'CUSTOMER', 'OWNER_ADMIN', 'STRIPE_WEBHOOK'
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String }
}, { _id: false });

/**
 * Master Contract Lifecycle Schema
 */
const contractLifecycleSchema = new mongoose.Schema({
  contractId: { type: String, required: true, unique: true, index: true },
  orderSnapshotId: { type: String, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Customer Contact Info (Preserves historic execution email while tracking current)
  initialCustomerEmail: { type: String, required: true, lowercase: true },
  currentCustomerEmail: { type: String, required: true, lowercase: true, index: true },
  customerName: { type: String },
  customerPhone: { type: String },
  businessName: { type: String },
  
  // Stripe Identifiers
  stripeCustomerId: { type: String, index: true },
  stripeSubscriptionId: { type: String, index: true },
  stripeScheduleId: { type: String },
  
  // Product / Scope Details
  tierId: { type: String, required: true },
  tierName: { type: String, required: true },
  setupCents: { type: Number, required: true },
  monthlyCents: { type: Number, required: true },
  priceLocked: { type: Boolean, default: true },
  
  // Master Contract Status State Machine
  contractStatus: {
    type: String,
    enum: [
      'ACTIVE',
      'RENEWAL_REMINDER_PENDING',
      'NON_RENEWAL_REQUESTED',
      'RENEWAL_PENDING',
      'RENEWED',
      'EARLY_TERMINATION_REQUESTED',
      'TERMINATING',
      'TERMINATED',
      'PAYMENT_DELINQUENT',
      'CANCELLED'
    ],
    default: 'ACTIVE',
    index: true
  },
  
  // Current Term Pointer & Chronological Term History
  currentTermNumber: { type: Number, default: 1 },
  termsHistory: [termHistorySchema],

  // Authoritative Production Launch Date
  websiteLaunchedAt: { type: Date },
  
  // Support Add-on Tracking (Independent lifecycle from base contract)
  supportAddon: {
    id: { type: String },
    name: { type: String },
    durationMonths: { type: Number, default: 0 },
    standardMonthlyCents: { type: Number, default: 0 },
    discountedMonthlyCents: { type: Number, default: 0 },
    monthlyCents: { type: Number, default: 0 }, // legacy alias
    promotionPercentage: { type: Number, default: 0 },
    totalCommitmentStandardCents: { type: Number, default: 0 },
    totalCommitmentDiscountedCents: { type: Number, default: 0 },
    coverageStartAt: { type: Date },
    billingStartAt: { type: Date },
    startDate: { type: Date }, // backwards-compat alias
    supportEndAt: { type: Date },
    endDate: { type: Date }, // backwards-compat alias
    status: { 
      type: String, 
      enum: [
        'NONE',
        'PENDING_ACTIVATION',
        'ACTIVE_HOSTED',
        'ACTIVE_TRANSITION',
        'EXPIRING',
        'EXPIRED',
        'EARLY_TERMINATION_REQUESTED',
        'TERMINATED',
        'ACTIVE',     // backwards compatibility
        'CANCELLED'   // backwards compatibility
      ], 
      default: 'NONE',
      index: true
    },
    stripeSubscriptionItemId: { type: String },
    monthlyRequestsIncluded: { type: Number, default: 0 },
    maxHoursPerRequest: { type: Number, default: 1.5 },
    requestsUsedThisCycle: { type: Number, default: 0 },
    cycleResetAt: { type: Date },
    requestsRollOver: { type: Boolean, default: false },
    slaInitialResponse: { type: String },
    transitionSupportRule: { type: String },
    reminderSentAt: { type: Date },
    expirationEmailSentAt: { type: Date },
    inclusions: [{ type: String }],
    exclusions: [{ type: String }]
  },
  
  // Legal Agreement Metadata
  termsVersion: { type: String, default: '2026.5-WI' },
  termsAcceptedAt: { type: Date, default: Date.now },
  acceptanceIpAddress: { type: String },
  
  // Early Termination / Buyout Records
  terminationQuote: {
    calculatedAt: { type: Date },
    monthsRemaining: { type: Number },
    websiteDamagesCents: { type: Number },
    liquidatedDamagesCents: { type: Number }, // backwards compatibility alias for websiteDamagesCents
    supportDamagesCents: { type: Number, default: 0 },
    supportMonthsRemaining: { type: Number, default: 0 },
    buyoutFeeCents: { type: Number, default: 0 },
    totalSettlementCents: { type: Number },
    effectiveTerminationDate: { type: Date },
    quoteAcceptedAt: { type: Date }
  },
  
  // Comprehensive Immutable Audit Trail
  auditLog: [auditLogEntrySchema],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
contractLifecycleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ContractLifecycle', contractLifecycleSchema);
