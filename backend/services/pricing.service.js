/**
 * Phoenix Websites AI — Unified Authoritative Server-Side Pricing Engine
 * 
 * Centralized, secure calculation of:
 * - Base tier setup fees and monthly fees
 * - Extra page rates
 * - Modular add-on catalog with billing classifications (ONE_TIME, MONTHLY, BOTH)
 * - Inherent feature dependency resolution
 * - Progressive add-on volume/bundle discounts
 * - Global seasonal promotions applied to BOTH setup and monthly fees
 * - Database-backed and environment-backed coupons
 * - Profit protection floors and maximum discount caps
 * - Deferred first monthly payment calculation (30 days post-purchase)
 * 
 * NEVER TRUST CLIENT-SIDE PRICING AMOUNTS.
 */

const { getActivePromotion } = require('./promotion.service');

// Database-Backed Coupons In-Memory Cache (synchronized with MongoDB)
const dbCouponsCache = new Map();

function syncDatabaseCoupons(coupons = []) {
  dbCouponsCache.clear();
  for (const c of coupons) {
    if (c && c.code && c.enabled !== false) {
      dbCouponsCache.set(String(c.code).trim().toUpperCase(), c);
    }
  }
}

function setDatabaseCoupon(coupon) {
  if (coupon && coupon.code) {
    const code = String(coupon.code).trim().toUpperCase();
    if (coupon.enabled === false) {
      dbCouponsCache.delete(code);
    } else {
      dbCouponsCache.set(code, coupon);
    }
  }
}

function removeDatabaseCoupon(code) {
  if (code) {
    dbCouponsCache.delete(String(code).trim().toUpperCase());
  }
}

function getDatabaseCouponsCache() {
  return Array.from(dbCouponsCache.values());
}

// Base Project Tiers: Every tier has BOTH a one-time setup/build fee AND a recurring monthly fee.
const BASE_PROJECTS = {
  starter: {
    id: 'starter',
    name: 'Starter Launch Website',
    shortName: 'Starter',
    description: 'Custom high-performance 1-3 page website with lead capture, mobile responsiveness, and cloud edge deployment.',
    baseSetupPrice: 149900, // $1,499.00
    baseMonthlyPrice: 9900, // $99.00/mo (Managed edge hosting, SSL, daily backups, 99.9% uptime, 0 hrs monthly edits)
    pagesIncluded: 3,
    maxTurnaroundWeeks: 2,
    defaultType: 'landing',
    aliases: ['simple']
  },
  business: {
    id: 'business',
    name: 'Custom Business Website',
    shortName: 'Business',
    description: 'Comprehensive 4-6 page business platform with service showcases, team/portfolio, and lead automation.',
    baseSetupPrice: 249900, // $2,499.00
    baseMonthlyPrice: 19900, // $199.00/mo (Managed hosting, 24/7 monitoring, security updates, 2 hrs/mo custom edits)
    pagesIncluded: 6,
    maxTurnaroundWeeks: 3,
    defaultType: 'business',
    aliases: ['essential']
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce Storefront',
    shortName: 'E-Commerce',
    description: 'Boutique online storefront with product catalog, cart, Stripe checkout, and automated customer order emails.',
    baseSetupPrice: 349900, // $3,499.00
    baseMonthlyPrice: 29900, // $299.00/mo (Hosting, cart/checkout maintenance, catalog support, 3 hrs/mo custom edits)
    pagesIncluded: 8,
    maxTurnaroundWeeks: 4,
    defaultType: 'ecommerce',
    inherentFeatures: ['payments', 'ecommerce'],
    aliases: ['professional']
  },
  webapp: {
    id: 'webapp',
    name: 'Full-Stack Web App / SaaS MVP',
    shortName: 'Web App / SaaS',
    description: 'Custom web application with authenticated user portal, relational/document database, and API backend.',
    baseSetupPrice: 499900, // $4,999.00
    baseMonthlyPrice: 39900, // $399.00/mo (Database/auth infrastructure, API monitoring, security patching, 5 hrs/mo engineering)
    pagesIncluded: 10,
    maxTurnaroundWeeks: 5,
    defaultType: 'webapp',
    inherentFeatures: ['auth', 'database', 'dashboard']
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Custom Platform',
    shortName: 'Enterprise',
    description: 'Bespoke enterprise architecture with multi-role permissions, high-concurrency database, and dedicated account SLAs.',
    baseSetupPrice: 1499900, // $14,999.00
    baseMonthlyPrice: 99900, // $999.00/mo (Dedicated account manager, enterprise SLAs, 10+ hrs/mo dedicated engineering)
    pagesIncluded: 15,
    maxTurnaroundWeeks: 8,
    defaultType: 'enterprise',
    inherentFeatures: ['auth', 'database', 'dashboard', 'roles']
  }
};

// Aliases lookup for backwards compatibility with legacy tier IDs
const TIER_ALIASES = {
  simple: 'starter',
  essential: 'business',
  professional: 'ecommerce',
  enterprise: 'enterprise'
};

const EXTRA_PAGE_PRICE = 15000; // $150.00 setup per extra page beyond tier quota

/**
 * Comprehensive Add-On Catalog with Billing Classification:
 * - ONE_TIME: One-time setup fee only (monthlyPrice: 0)
 * - MONTHLY: Ongoing monthly service only (setupPrice: 0)
 * - BOTH: Initial setup/configuration fee AND ongoing monthly maintenance
 */
const FEATURE_ADDONS = {
  // Development Add-Ons
  database: {
    id: 'database',
    name: 'Managed Database & Custom CRUD Logic',
    description: 'Dedicated MongoDB or PostgreSQL schema, data validation, and custom database records management.',
    billingType: 'BOTH',
    setupPrice: 80000,   // $800.00
    monthlyPrice: 4000,  // $40.00/mo
    category: 'development'
  },
  auth: {
    id: 'auth',
    name: 'User Authentication & Profiles',
    description: 'Secure registration, email/password and Google OAuth login, user profile storage, and password reset.',
    billingType: 'BOTH',
    setupPrice: 60000,   // $600.00
    monthlyPrice: 3000,  // $30.00/mo
    category: 'development',
    requires: ['database']
  },
  roles: {
    id: 'roles',
    name: 'Multi-Role User Permissions',
    description: 'Granular access control (admin, manager, member, client) with secure role-based guards.',
    billingType: 'ONE_TIME',
    setupPrice: 45000,   // $450.00
    monthlyPrice: 0,
    category: 'development',
    requires: ['auth']
  },
  dashboard: {
    id: 'dashboard',
    name: 'Custom Admin / Client Portal',
    description: 'Private administrative dashboard with analytics metrics, user/order tables, and operational management.',
    billingType: 'BOTH',
    setupPrice: 120000,  // $1,200.00
    monthlyPrice: 6000,  // $60.00/mo
    category: 'development',
    requires: ['auth', 'database']
  },
  payments: {
    id: 'payments',
    name: 'Stripe Payments & Checkout Integration',
    description: 'Integrated Stripe checkout, customer billing portal, webhook receipts, and transaction handling.',
    billingType: 'BOTH',
    setupPrice: 50000,   // $500.00
    monthlyPrice: 3500,  // $35.00/mo
    category: 'development'
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce Product Catalog & Cart',
    description: 'Dynamic product catalog, inventory tracking, cart state, order notifications, and discount codes.',
    billingType: 'BOTH',
    setupPrice: 75000,   // $750.00
    monthlyPrice: 4500,  // $45.00/mo
    category: 'development',
    requires: ['payments']
  },
  booking: {
    id: 'booking',
    name: 'Booking & Scheduling System',
    description: 'Interactive appointment scheduling, calendar synchronization, automated email/SMS reminders.',
    billingType: 'BOTH',
    setupPrice: 55000,   // $550.00
    monthlyPrice: 2500,  // $25.00/mo
    category: 'development'
  },
  file_storage: {
    id: 'file_storage',
    name: 'Secure Document & File Storage',
    description: 'Encrypted cloud storage uploads (S3/GCS) with virus scanning and secure presigned URLs.',
    billingType: 'BOTH',
    setupPrice: 40000,   // $400.00
    monthlyPrice: 2000,  // $20.00/mo
    category: 'development'
  },
  realtime: {
    id: 'realtime',
    name: 'Realtime WebSockets / Live Chat',
    description: 'Instant bi-directional messaging, live collaboration, or real-time event streaming.',
    billingType: 'BOTH',
    setupPrice: 75000,   // $750.00
    monthlyPrice: 4500,  // $45.00/mo
    category: 'development'
  },
  api_integrations: {
    id: 'api_integrations',
    name: 'Third-Party API & Webhook Integrations',
    description: 'Sync with external CRMs (HubSpot, Salesforce), email platforms, custom webhooks, or ERPs.',
    billingType: 'ONE_TIME',
    setupPrice: 60000,   // $600.00
    monthlyPrice: 0,
    category: 'development'
  },
  sms_notifications: {
    id: 'sms_notifications',
    name: 'Transactional SMS Alerts Gateway',
    description: 'Instant customer and admin SMS notifications via Twilio or Telnyx.',
    billingType: 'BOTH',
    setupPrice: 35000,   // $350.00
    monthlyPrice: 2000,  // $20.00/mo
    category: 'development'
  },
  cms: {
    id: 'cms',
    name: 'Headless CMS Content Management',
    description: 'Visual content editor interface (Sanity, Strapi) allowing non-technical staff to publish blog/copy.',
    billingType: 'BOTH',
    setupPrice: 70000,   // $700.00
    monthlyPrice: 3500,  // $35.00/mo
    category: 'development'
  },
  multilingual: {
    id: 'multilingual',
    name: 'Multilingual Internationalization (i18n)',
    description: 'Multi-language routing, translation state management, and hreflang international SEO tags.',
    billingType: 'ONE_TIME',
    setupPrice: 50000,   // $500.00
    monthlyPrice: 0,
    category: 'development'
  },
  migration: {
    id: 'migration',
    name: 'Legacy Website & Data Migration',
    description: 'Full content extraction, 301 redirect map creation, asset transfer, and zero-downtime cutover.',
    billingType: 'ONE_TIME',
    setupPrice: 65000,   // $650.00
    monthlyPrice: 0,
    category: 'development'
  },

  // AI & Automation Add-Ons
  ai_assistant: {
    id: 'ai_assistant',
    name: 'Grounded Business AI Assistant / Chatbot',
    description: '24/7 web assistant trained exclusively on your business facts with strict guardrails and lead capture.',
    billingType: 'BOTH',
    setupPrice: 90000,   // $900.00
    monthlyPrice: 5000,  // $50.00/mo
    category: 'ai'
  },
  rag_knowledge: {
    id: 'rag_knowledge',
    name: 'RAG Knowledge-Base Document Assistant',
    description: 'Semantic vector search over PDFs, manuals, and documents with citations and factual retrieval.',
    billingType: 'BOTH',
    setupPrice: 140000,  // $1,400.00
    monthlyPrice: 7500,  // $75.00/mo
    category: 'ai'
  },
  ai_voice: {
    id: 'ai_voice',
    name: '24/7 Web Voice Assistant (WebRTC)',
    description: 'Ultra-low latency spoken voice interaction directly in the client browser for lead intake.',
    billingType: 'BOTH',
    setupPrice: 110000,  // $1,100.00
    monthlyPrice: 6000,  // $60.00/mo
    category: 'ai'
  },

  // Design Add-Ons
  premium_design: {
    id: 'premium_design',
    name: 'Bespoke 3D & GSAP Motion Design',
    description: 'Interactive Three.js particle backgrounds, advanced scroll-triggered animations, and micro-interactions.',
    billingType: 'ONE_TIME',
    setupPrice: 80000,   // $800.00
    monthlyPrice: 0,
    category: 'design'
  },
  branding: {
    id: 'branding',
    name: 'Brand Identity & Vector Logo Package',
    description: 'Custom typography hierarchy, brand color palette, vector logo files, and favicon suite.',
    billingType: 'ONE_TIME',
    setupPrice: 45000,   // $450.00
    monthlyPrice: 0,
    category: 'design'
  },

  // Marketing & Discovery Add-Ons
  seo: {
    id: 'seo',
    name: 'Advanced Technical SEO & Schema Package',
    description: 'Deep structured data JSON-LD graphs, breadcrumb navigation, sitemap configuration, and GEO/AEO optimization.',
    billingType: 'BOTH',
    setupPrice: 45000,   // $450.00
    monthlyPrice: 3000,  // $30.00/mo
    category: 'marketing'
  },
  geo_aeo: {
    id: 'geo_aeo',
    name: 'GEO & AI Search Engine Optimization',
    description: 'Optimization for Perplexity, ChatGPT Search, and Google AI Overviews with structured factual citations.',
    billingType: 'ONE_TIME',
    setupPrice: 50000,   // $500.00
    monthlyPrice: 0,
    category: 'marketing'
  },
  copywriting: {
    id: 'copywriting',
    name: 'Professional Copywriting & Messaging',
    description: 'Conversion-oriented value propositions, clear service breakdowns, and customer trust copy.',
    billingType: 'ONE_TIME',
    setupPrice: 35000,   // $350.00
    monthlyPrice: 0,
    category: 'marketing'
  },

  // Operations & Support Add-Ons
  priority_sla: {
    id: 'priority_sla',
    name: '24/7 Priority Emergency Support SLA',
    description: 'Guaranteed under-2-hour emergency response window, direct phone escalation, and weekend engineering coverage.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 15000, // $150.00/mo
    category: 'operations'
  },
  extra_support_hours: {
    id: 'extra_support_hours',
    name: 'Extended Engineering Retainer (+5 hrs/mo)',
    description: 'Additional 5 dedicated hours per month of custom feature development, design updates, or integrations.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 25000, // $250.00/mo
    category: 'operations'
  },

  // Modular Support-Duration Add-Ons (Mutually Exclusive group: 'support-duration')
  support_6mo: {
    id: 'support_6mo',
    name: '6-Month Extended Support & Defect Warranty',
    description: 'Post-launch defect warranty, priority bug fixes (<24 hr triage), cross-browser compatibility patches, and 2 minor updates/mo.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 8900, // $89.00/mo for 6 months
    category: 'operations',
    group: 'support-duration',
    durationMonths: 6,
    monthlyRequestsIncluded: 2,
    maxHoursPerRequest: 1.5,
    requestsRollOver: false,
    slaInitialResponse: '< 24-hour business day triage',
    autoRenew: false,
    inclusions: [
      'Post-launch defect and bug warranty',
      'Priority ticket triage (< 24-hour response window)',
      'Cross-browser and mobile OS compatibility maintenance',
      'Up to 2 minor updates/configuration changes per month (up to 1.5 hrs each; expire monthly, no rollover)',
      'Dependency vulnerability patching'
    ],
    exclusions: [
      'Major redesigns or layout overhauls',
      'Completely new feature development',
      'Third-party external API subscription costs'
    ]
  },
  support_12mo: {
    id: 'support_12mo',
    name: '12-Month Dedicated Care & SLA Coverage',
    description: 'Full-year proactive maintenance: bi-monthly dependency upgrades, automated uptime anomaly triage, SEO health checks, up to 4 minor updates/mo, weekend coverage.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 6900, // $69.00/mo for 12 months (save $20/mo vs 6-mo)
    category: 'operations',
    group: 'support-duration',
    durationMonths: 12,
    monthlyRequestsIncluded: 4,
    maxHoursPerRequest: 1.5,
    requestsRollOver: false,
    slaInitialResponse: '< 12-hour response window + weekend emergency on-call',
    autoRenew: false,
    inclusions: [
      'All 6-Month Extended Support inclusions',
      'Bi-monthly dependency and framework security upgrades',
      'Automated uptime anomaly investigation',
      'Monthly SEO and Core Web Vitals health check',
      'Up to 4 minor updates per month (up to 1.5 hrs each; expire monthly, no rollover)',
      'Emergency weekend on-call coverage for critical outages'
    ],
    exclusions: [
      'Major architectural redesigns',
      'New database schemas or large feature builds'
    ]
  },
  support_24mo: {
    id: 'support_24mo',
    name: '24-Month Long-Term Enterprise Lifecycle Support',
    description: 'Two-year comprehensive lifecycle coverage: major framework version migrations, semi-annual security audits, database tuning, up to 6 updates/mo, priority sprint scheduling.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 4900, // $49.00/mo for 24 months (best rate: save $40/mo vs 6-mo)
    category: 'operations',
    group: 'support-duration',
    durationMonths: 24,
    monthlyRequestsIncluded: 6,
    maxHoursPerRequest: 1.5,
    requestsRollOver: false,
    slaInitialResponse: '< 4-hour critical outage triage + < 12-hour standard ticket triage + priority sprint queue',
    autoRenew: false,
    transitionSupportRule: 'If base website non-renews at Month 12, automatically transitions to Self-Hosted Transition Support for Months 13–24 covering code-level maintenance, compatibility patches, security updates, and bug triage on client infrastructure with zero hosting fees.',
    inclusions: [
      'All 12-Month Dedicated Care inclusions',
      'Major Angular / Node.js framework version migrations',
      'Semi-annual comprehensive code & security audit',
      'Database query optimization and index tuning',
      'Up to 6 minor updates per month (up to 1.5 hrs each; expire monthly, no rollover)',
      'Dedicated priority sprint queueing',
      'Automatic transition to Self-Hosted Support if base website hosting non-renews after Year 1'
    ],
    exclusions: [
      'Completely new standalone product builds or uncontracted subdomains'
    ]
  }
};

// Profit Protection & Floors (in cents)
const PRICING_FLOORS = {
  MIN_SETUP_CENTS: 79900,      // Absolute floor: $799.00 setup
  MIN_MONTHLY_CENTS: 4900,     // Absolute floor: $49.00/mo
  MAX_COMBINED_DISCOUNT_PCT: 100 // Allow up to 100% discount after global promo; floor prices still apply
};

/**
 * Calculates progressive bundle/volume discount percentage on add-ons
 * @param {number} addonCount 
 * @returns {{ discountPercent: number, nextThreshold: { count: number, discountPercent: number } | null }}
 */
function calculateBundleDiscount(addonCount) {
  if (addonCount >= 6) {
    return { discountPercent: 15, nextThreshold: null };
  } else if (addonCount >= 4) {
    return { discountPercent: 10, nextThreshold: { count: 6, discountPercent: 15 } };
  } else if (addonCount >= 2) {
    return { discountPercent: 5, nextThreshold: { count: 4, discountPercent: 10 } };
  }
  return { discountPercent: 0, nextThreshold: { count: 2, discountPercent: 5 } };
}

/**
 * Evaluates dynamic pricing adjustments based on legitimate project factors:
 * - Turnaround urgency (rush delivery)
 * - High-concurrency scalability requirements
 * (Never uses protected personal attributes)
 */
function evaluateDynamicFactors(input = {}) {
  let setupAdjustment = 0;
  let monthlyAdjustment = 0;
  const factorsApplied = [];

  // Urgency / Expedited Delivery: +20% setup if turnaround is cut in half
  if (input.urgency === 'rush') {
    setupAdjustment += 50000; // $500 rush fee
    factorsApplied.push({
      id: 'rush_delivery',
      name: 'Expedited Priority Sprint Delivery',
      setupAmount: 50000,
      monthlyAmount: 0,
      reason: 'Guaranteed 50% accelerated timeline with dedicated sprint allocation.'
    });
  }

  return { setupAdjustment, monthlyAdjustment, factorsApplied };
}

/**
 * Authoritative Unified Pricing Calculation
 * 
 * @param {Object} input
 * @param {string} [input.tier] - starter | business | ecommerce | webapp | enterprise
 * @param {string} [input.projectType] - alias for tier
 * @param {number} [input.totalPages] - Total number of pages requested
 * @param {string[]} [input.features] - Array of feature add-on IDs
 * @param {string[]} [input.addons] - Alias for features
 * @param {string} [input.urgency] - normal | rush
 * @param {string} [input.discountCode] - Optional coupon code
 * @param {boolean} [input.isTestMode] - Test mode override ($1.00 testing)
 * @param {Date} [input.date] - Optional date override for testing
 * @returns {Object} Full breakdown of one-time, monthly, and contractual details
 */
function calculateProjectPrice(input = {}, options = {}) {
  const isTestMode = input.isTestMode ?? (process.env.TEST_MODE === 'true');
  const calcDate = (input.date instanceof Date) 
    ? input.date 
    : ((input.calculationDate instanceof Date) ? input.calculationDate : new Date());

  // 1. Resolve Base Tier
  const rawTierKey = String(input.tier || input.projectType || 'business').toLowerCase().trim();
  const normalizedTierKey = TIER_ALIASES[rawTierKey] || rawTierKey;
  const baseProject = BASE_PROJECTS[normalizedTierKey] || BASE_PROJECTS.business;

  let baseSetupPrice = isTestMode ? 100 : baseProject.baseSetupPrice;
  let baseMonthlyPrice = isTestMode ? 100 : baseProject.baseMonthlyPrice;
  const inherentFeatures = baseProject.inherentFeatures || [];

  // 2. Extra Pages Calculation
  const parsedPages = parseInt(input.totalPages, 10);
  const totalPages = (isNaN(parsedPages) || parsedPages < 1)
    ? baseProject.pagesIncluded
    : Math.min(100, parsedPages);
  const extraPages = Math.max(0, totalPages - baseProject.pagesIncluded);
  const extraPagesSetupPrice = isTestMode ? 0 : (extraPages * EXTRA_PAGE_PRICE);

  // 3. Process Add-Ons & Dependencies
  const rawFeatureList = Array.isArray(input.features) 
    ? input.features 
    : (Array.isArray(input.addons) 
        ? input.addons 
        : (Array.isArray(input.selectedFeatures) ? input.selectedFeatures : []));

  // Enforce single-selection for grouped add-ons (e.g. group: 'support-duration')
  // We keep the LAST selected item in any single-select group
  const groupedSelections = {};
  const ungroupedFeatures = [];

  for (const fId of rawFeatureList) {
    const feat = FEATURE_ADDONS[fId];
    if (!feat) continue;
    if (feat.group) {
      groupedSelections[feat.group] = feat.id; // single-select deduplication
    } else {
      ungroupedFeatures.push(feat.id);
    }
  }

  const sanitizedFeatureList = [
    ...ungroupedFeatures,
    ...Object.values(groupedSelections)
  ];
  const selectedFeatureSet = new Set(sanitizedFeatureList);

  // Auto-satisfy dependencies
  if (selectedFeatureSet.has('dashboard')) {
    selectedFeatureSet.add('auth');
    selectedFeatureSet.add('database');
  }
  if (selectedFeatureSet.has('auth')) {
    selectedFeatureSet.add('database');
  }
  if (selectedFeatureSet.has('roles')) {
    selectedFeatureSet.add('auth');
    selectedFeatureSet.add('database');
  }
  if (selectedFeatureSet.has('ecommerce')) {
    selectedFeatureSet.add('payments');
  }

  let addonsSetupSubtotal = 0;
  let addonsMonthlySubtotal = 0;
  let eligibleAddonCount = 0;
  const detailedAddons = [];
  let selectedSupportAddon = null;

  for (const featId of selectedFeatureSet) {
    const feat = FEATURE_ADDONS[featId];
    const isInherent = inherentFeatures.includes(featId);
    
    if (feat.group === 'support-duration') {
      selectedSupportAddon = feat;
    }

    const itemSetup = isInherent ? 0 : (isTestMode ? 50 : feat.setupPrice);
    const itemMonthly = isInherent ? 0 : (isTestMode ? 50 : feat.monthlyPrice);

    if (!isInherent) {
      addonsSetupSubtotal += itemSetup;
      addonsMonthlySubtotal += itemMonthly;
      eligibleAddonCount++;
    }

    detailedAddons.push({
      id: feat.id,
      name: feat.name,
      description: feat.description,
      category: feat.category,
      group: feat.group || null,
      durationMonths: feat.durationMonths || null,
      billingType: feat.billingType,
      setupPrice: itemSetup,
      monthlyPrice: itemMonthly,
      inclusions: feat.inclusions || [],
      exclusions: feat.exclusions || [],
      includedInBase: isInherent
    });
  }

  // 4. Dynamic Legitimate Adjustments
  const { setupAdjustment, monthlyAdjustment, factorsApplied } = evaluateDynamicFactors(input);

  // 5. Volume / Bundle Discount Calculation
  const bundle = calculateBundleDiscount(eligibleAddonCount);
  const bundleDiscountPercent = isTestMode ? 0 : bundle.discountPercent;
  const bundleSavingsSetup = Math.round(addonsSetupSubtotal * (bundleDiscountPercent / 100));
  const bundleSavingsMonthly = Math.round(addonsMonthlySubtotal * (bundleDiscountPercent / 100));

  const postBundleAddonsSetup = addonsSetupSubtotal - bundleSavingsSetup;
  const postBundleAddonsMonthly = addonsMonthlySubtotal - bundleSavingsMonthly;

  // Undiscounted Standard Subtotals (Genuine Reference Prices)
  const normalSetupSubtotal = baseSetupPrice + extraPagesSetupPrice + addonsSetupSubtotal + setupAdjustment;
  const normalMonthlySubtotal = baseMonthlyPrice + addonsMonthlySubtotal + monthlyAdjustment;

  // Subtotals after bundle savings (before global promo)
  const subtotalAfterBundleSetup = baseSetupPrice + extraPagesSetupPrice + postBundleAddonsSetup + setupAdjustment;
  const subtotalAfterBundleMonthly = baseMonthlyPrice + postBundleAddonsMonthly + monthlyAdjustment;

  // 6. Global Seasonal Promotion (Applies to EVERYTHING: Setup + Monthly)
  const activePromo = getActivePromotion(calcDate);
  const globalPromoDiscountPercent = isTestMode ? 0 : (activePromo.discountPercent || 20); // Baseline 20% evergreen

  const promoSavingsSetup = Math.round(subtotalAfterBundleSetup * (globalPromoDiscountPercent / 100));
  const promoSavingsMonthly = Math.round(subtotalAfterBundleMonthly * (globalPromoDiscountPercent / 100));

  const postPromoSetup = Math.max(0, subtotalAfterBundleSetup - promoSavingsSetup);
  const postPromoMonthly = Math.max(0, subtotalAfterBundleMonthly - promoSavingsMonthly);

  // 7. Coupon Discount (Database-backed coupons first, legacy env as fallback)
  let couponDiscountSetup = 0;
  let couponDiscountMonthly = 0;
  let appliedCouponCode = null;
  let couponSource = null;

  if (input.discountCode || (options && options.coupon)) {
    const rawCode = String(input.discountCode || (options.coupon && options.coupon.code)).trim().toUpperCase();
    
    // 1. Check database coupon (explicitly passed or from cache)
    const dbCoupon = (options && options.coupon) || dbCouponsCache.get(rawCode);
    if (dbCoupon && dbCoupon.enabled !== false) {
      const now = calcDate || new Date();
      const isExpired = dbCoupon.expiresAt && new Date(dbCoupon.expiresAt) < now;
      const isLimitReached = dbCoupon.usageLimit > 0 && dbCoupon.usageCount >= dbCoupon.usageLimit;

      if (!isExpired && !isLimitReached) {
        appliedCouponCode = dbCoupon.code;
        const appliesTo = dbCoupon.appliesTo || 'both';

        if (dbCoupon.type === 'fixed') {
          const fixedCents = parseInt(dbCoupon.amount, 10) || 0;
          if (appliesTo === 'setup' || appliesTo === 'both') {
            couponDiscountSetup = Math.min(postPromoSetup, fixedCents);
          }
          if (appliesTo === 'monthly') {
            couponDiscountMonthly = Math.min(postPromoMonthly, fixedCents);
          }
          couponSource = `DATABASE ($${(fixedCents / 100).toFixed(2)})`;
        } else {
          const pct = Math.min(100, Math.max(0, parseInt(dbCoupon.amount, 10) || 0));
          if (appliesTo === 'setup' || appliesTo === 'both') {
            couponDiscountSetup = Math.round(postPromoSetup * (pct / 100));
          }
          if (appliesTo === 'monthly' || appliesTo === 'both') {
            couponDiscountMonthly = Math.round(postPromoMonthly * (pct / 100));
          }
          couponSource = `DATABASE (${pct}%)`;
        }
      }
    }

    // 2. Fallback to legacy environment codes DC_* (general) and DCL_* (limited)
    if (!appliedCouponCode) {
      const dcVal = process.env[`DC_${rawCode}`];
      const dclVal = process.env[`DCL_${rawCode}`];

      if (dcVal || dclVal) {
        const pct = parseInt(dcVal || dclVal, 10);
        if (!isNaN(pct) && pct > 0) {
          couponDiscountSetup = Math.round(postPromoSetup * (pct / 100));
          couponDiscountMonthly = Math.round(postPromoMonthly * (pct / 100));
          appliedCouponCode = rawCode;
          couponSource = `ENV (${pct}%)`;
        }
      }
    }
  }

  let finalSetupBeforeFloor = Math.max(0, postPromoSetup - couponDiscountSetup);
  let finalMonthlyBeforeFloor = Math.max(0, postPromoMonthly - couponDiscountMonthly);

  // 8. Profit Protection Floors & Max Discount Cap
  // Total discount from normal subtotal:
  const totalSetupDiscount = normalSetupSubtotal - finalSetupBeforeFloor;
  const maxAllowedSetupDiscount = Math.round(normalSetupSubtotal * (PRICING_FLOORS.MAX_COMBINED_DISCOUNT_PCT / 100));

  let finalSetupCents = finalSetupBeforeFloor;
  if (!isTestMode) {
    if (totalSetupDiscount > maxAllowedSetupDiscount) {
      finalSetupCents = normalSetupSubtotal - maxAllowedSetupDiscount;
    }
    finalSetupCents = Math.max(PRICING_FLOORS.MIN_SETUP_CENTS, finalSetupCents);
  }

  let finalMonthlyCents = finalMonthlyBeforeFloor;
  if (!isTestMode) {
    finalMonthlyCents = Math.max(PRICING_FLOORS.MIN_MONTHLY_CENTS, finalMonthlyCents);
  }

  // 9. First Monthly Billing Schedule (Starts ~30 days post-purchase)
  const firstMonthlyDate = new Date(calcDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const firstMonthlyDisplay = firstMonthlyDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  let supportDetails = null;
  if (selectedSupportAddon) {
    const stdMonthly = selectedSupportAddon.monthlyPrice;
    // Calculate discounted monthly support rate considering bundle and global seasonal promotion
    const supportAfterBundle = Math.round(stdMonthly * (1 - bundleDiscountPercent / 100));
    const supportAfterPromo = Math.round(supportAfterBundle * (1 - globalPromoDiscountPercent / 100));
    const discMonthly = isTestMode ? stdMonthly : Math.max(100, supportAfterPromo);

    const dur = selectedSupportAddon.durationMonths;
    const totalStd = stdMonthly * dur;
    const totalDisc = discMonthly * dur;
    const effectiveDiscountPct = Math.round(((totalStd - totalDisc) / totalStd) * 100);

    const supportEndDate = new Date(firstMonthlyDate.getTime() + (dur * 30.44 * 24 * 60 * 60 * 1000));
    supportDetails = {
      id: selectedSupportAddon.id,
      name: selectedSupportAddon.name,
      durationMonths: dur,
      monthlyPrice: discMonthly, // Final active discounted monthly rate
      standardMonthlyPrice: stdMonthly,
      discountedMonthlyPrice: discMonthly,
      discountPercent: effectiveDiscountPct,
      totalCommitmentStandard: totalStd,
      totalCommitmentDiscounted: totalDisc,
      setupPrice: selectedSupportAddon.setupPrice,
      billingType: selectedSupportAddon.billingType,
      coverageStartRule: 'Website Production Launch Date (Immediate Coverage)',
      billingStartRule: 'First Monthly Care Cycle (+30 Days from Kickoff)',
      startDate: firstMonthlyDate.toISOString(),
      startDisplay: firstMonthlyDisplay,
      endDate: supportEndDate.toISOString(),
      endDisplay: supportEndDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      autoRenew: false,
      monthlyRequestsIncluded: selectedSupportAddon.monthlyRequestsIncluded,
      maxHoursPerRequest: selectedSupportAddon.maxHoursPerRequest,
      slaInitialResponse: selectedSupportAddon.slaInitialResponse,
      requestsRollOver: false,
      transitionSupportRule: selectedSupportAddon.transitionSupportRule || null,
      inclusions: selectedSupportAddon.inclusions || [],
      exclusions: selectedSupportAddon.exclusions || []
    };
  }

  // Effective Total Discount Percentages
  const effectiveSetupDiscountPct = Math.round(((normalSetupSubtotal - finalSetupCents) / normalSetupSubtotal) * 100);
  const effectiveMonthlyDiscountPct = Math.round(((normalMonthlySubtotal - finalMonthlyCents) / normalMonthlySubtotal) * 100);

  // Distinct Base Website Monthly vs Support Monthly Breakdown
  const supportMonthlyPortion = supportDetails ? supportDetails.discountedMonthlyPrice : 0;
  const baseWebsiteMonthlyPortion = Math.max(0, finalMonthlyCents - supportMonthlyPortion);

  // Structured summary brief
  const featureNames = detailedAddons.map(a => a.name).join(', ') || 'Standard Included Scope';
  const supportBriefLine = supportDetails 
    ? `Support: ${supportDetails.name} (${supportDetails.durationMonths} Mos @ $${(supportDetails.discountedMonthlyPrice / 100).toFixed(2)}/mo locked [Std: $${(supportDetails.standardMonthlyPrice / 100).toFixed(2)}/mo])`
    : `Support: Standard Baseline Included Care (No optional support add-on selected)`;

  const projectBrief = [
    `Plan: ${baseProject.name}`,
    `Target Scope: ${totalPages} Pages (Includes ${baseProject.pagesIncluded}, ${extraPages} Extra)`,
    `Add-Ons: ${featureNames}`,
    supportBriefLine,
    `Due Today: $${(finalSetupCents / 100).toFixed(2)} (Standard: $${(normalSetupSubtotal / 100).toFixed(2)})`,
    `First Monthly Care: $${(finalMonthlyCents / 100).toFixed(2)} on ${firstMonthlyDisplay}`,
    `Subsequent Care: $${(finalMonthlyCents / 100).toFixed(2)}/mo (Standard: $${(normalMonthlySubtotal / 100).toFixed(2)}/mo)`,
    `Initial Commitment: 12 Consecutive Months with 30-Day Subscription Trial`,
    `Promotion: ${activePromo.name} (${globalPromoDiscountPercent}% Global Savings Applied)`
  ].join('\n');

  return {
    success: true,
    tier: {
      id: baseProject.id,
      name: baseProject.name,
      shortName: baseProject.shortName,
      description: baseProject.description,
      pagesIncluded: baseProject.pagesIncluded,
      maxTurnaroundWeeks: baseProject.maxTurnaroundWeeks
    },
    scope: {
      totalPages,
      pagesIncluded: baseProject.pagesIncluded,
      extraPages,
      extraPagesSetupPrice
    },
    addons: detailedAddons,
    eligibleAddonCount,
    support: supportDetails,
    dynamicFactors: factorsApplied,

    // Normal genuine prices (before discounts)
    normalPrices: {
      setupSubtotal: normalSetupSubtotal,
      monthlySubtotal: normalMonthlySubtotal,
      baseSetup: baseSetupPrice,
      baseMonthly: baseMonthlyPrice,
      addonsSetup: addonsSetupSubtotal,
      addonsMonthly: addonsMonthlySubtotal
    },

    // Savings breakdown
    discounts: {
      bundle: {
        percent: bundleDiscountPercent,
        setupSavings: bundleSavingsSetup,
        monthlySavings: bundleSavingsMonthly,
        nextThreshold: bundle.nextThreshold
      },
      promotion: {
        id: activePromo.id,
        name: activePromo.name,
        displayName: activePromo.displayName,
        percent: globalPromoDiscountPercent,
        setupSavings: promoSavingsSetup,
        monthlySavings: promoSavingsMonthly,
        bannerText: activePromo.bannerText,
        theme: activePromo.theme
      },
      coupon: {
        code: appliedCouponCode,
        source: couponSource,
        setupSavings: couponDiscountSetup,
        monthlySavings: couponDiscountMonthly,
        savingsSetup: couponDiscountSetup,
        savingsMonthly: couponDiscountMonthly
      },
      effectiveSetupPercent: effectiveSetupDiscountPct,
      effectiveMonthlyPercent: effectiveMonthlyDiscountPct
    },

    // Authoritative Final Amounts (in cents)
    finalPrices: {
      dueToday: finalSetupCents,       // Paid today at Stripe checkout
      monthlyRecurring: finalMonthlyCents, // Billed monthly starting after 30 days
      baseMonthlyRecurring: baseWebsiteMonthlyPortion, // Base website monthly without support
      supportMonthlyRecurring: supportMonthlyPortion   // Support monthly portion
    },
    // Top-level aliases for backwards compatibility
    oneTimeTotal: finalSetupCents,
    recurringMonthly: finalMonthlyCents,
    oneTimeSubtotal: normalSetupSubtotal,
    discountPercentage: effectiveSetupDiscountPct,

    // Billing & Commitment Schedule
    schedule: {
      dueTodayCents: finalSetupCents,
      monthlyRecurringCents: finalMonthlyCents,
      trialDays: 30,
      firstMonthlyBillingDate: firstMonthlyDate.toISOString(),
      firstMonthlyBillingDisplay: firstMonthlyDisplay,
      websiteCommitmentMonths: 12,
      commitmentMonths: 12, // alias
      supportDurationMonths: supportDetails ? supportDetails.durationMonths : 0,
      priceLockGuaranteed: true
    },

    projectBrief
  };
}

module.exports = {
  BASE_PROJECTS,
  TIER_ALIASES,
  FEATURE_ADDONS,
  PRICING_FLOORS,
  EXTRA_PAGE_PRICE,
  calculateBundleDiscount,
  evaluateDynamicFactors,
  calculateProjectPrice,
  syncDatabaseCoupons,
  setDatabaseCoupon,
  removeDatabaseCoupon,
  getDatabaseCouponsCache
};
