// GENERATED FILE. DO NOT EDIT BY HAND.
// Source of truth: backend/services/pricing.service.js
// Regenerate with: node scripts/generate-pricing-catalog.mjs

export const SEED_BASE_PROJECTS = [
  {
    "id": "starter",
    "name": "Starter Launch Website",
    "shortName": "Starter",
    "description": "Custom high-performance 1-3 page website with lead capture, mobile responsiveness, and cloud edge deployment.",
    "baseSetupPrice": 149900,
    "baseMonthlyPrice": 9900,
    "pagesIncluded": 3,
    "maxTurnaroundWeeks": 2,
    "defaultType": "landing",
    "aliases": [
      "simple"
    ]
  },
  {
    "id": "business",
    "name": "Custom Business Website",
    "shortName": "Business",
    "description": "Comprehensive 4-6 page business platform with service pages, team and portfolio pages, and lead automation.",
    "baseSetupPrice": 249900,
    "baseMonthlyPrice": 19900,
    "pagesIncluded": 6,
    "maxTurnaroundWeeks": 3,
    "defaultType": "business",
    "aliases": [
      "essential"
    ]
  },
  {
    "id": "ecommerce",
    "name": "E-Commerce Storefront",
    "shortName": "E-Commerce",
    "description": "Boutique online storefront with product catalog, cart, checkout through your payment provider, and automated customer order emails.",
    "baseSetupPrice": 349900,
    "baseMonthlyPrice": 29900,
    "pagesIncluded": 8,
    "maxTurnaroundWeeks": 4,
    "defaultType": "ecommerce",
    "inherentFeatures": [
      "payments",
      "ecommerce"
    ],
    "aliases": [
      "professional"
    ]
  },
  {
    "id": "webapp",
    "name": "Full-Stack Web App / SaaS MVP",
    "shortName": "Web App / SaaS",
    "description": "Custom web application with authenticated user portal, relational/document database, and API backend.",
    "baseSetupPrice": 499900,
    "baseMonthlyPrice": 39900,
    "pagesIncluded": 10,
    "maxTurnaroundWeeks": 5,
    "defaultType": "webapp",
    "inherentFeatures": [
      "auth",
      "database",
      "dashboard"
    ]
  },
  {
    "id": "enterprise",
    "name": "Enterprise Custom Platform",
    "shortName": "Enterprise",
    "description": "Custom enterprise architecture with multi-role permissions, high-concurrency database, and dedicated account SLAs.",
    "baseSetupPrice": 1499900,
    "baseMonthlyPrice": 99900,
    "pagesIncluded": 15,
    "maxTurnaroundWeeks": 8,
    "defaultType": "enterprise",
    "inherentFeatures": [
      "auth",
      "database",
      "dashboard",
      "roles"
    ]
  }
];

export const SEED_FEATURE_ADDONS = [
  {
    "id": "database",
    "name": "Managed Database & Custom CRUD Logic",
    "description": "Dedicated MongoDB or PostgreSQL schema, data validation, and custom database records management.",
    "billingType": "BOTH",
    "setupPrice": 80000,
    "monthlyPrice": 4000,
    "category": "development"
  },
  {
    "id": "auth",
    "name": "User Authentication & Profiles",
    "description": "Secure registration, email/password and Google OAuth login, user profile storage, and password reset.",
    "billingType": "BOTH",
    "setupPrice": 60000,
    "monthlyPrice": 3000,
    "category": "development",
    "requires": [
      "database"
    ]
  },
  {
    "id": "roles",
    "name": "Multi-Role User Permissions",
    "description": "Granular access control (admin, manager, member, client) with secure role-based guards.",
    "billingType": "ONE_TIME",
    "setupPrice": 45000,
    "monthlyPrice": 0,
    "category": "development",
    "requires": [
      "auth"
    ]
  },
  {
    "id": "dashboard",
    "name": "Custom Admin / Client Portal",
    "description": "Private administrative dashboard with analytics metrics, user/order tables, and operational management.",
    "billingType": "BOTH",
    "setupPrice": 120000,
    "monthlyPrice": 6000,
    "category": "development",
    "requires": [
      "auth",
      "database"
    ]
  },
  {
    "id": "payments",
    "name": "Payments & Checkout Integration (Stripe, PayPal, Venmo, Square & More)",
    "description": "Checkout built on the payment service you already use, connected through its own API: Stripe, PayPal, Venmo, Square, Braintree, Authorize.net, Adyen, and more. No Stripe account required. Includes receipts, refunds, webhook confirmations, and transaction handling.",
    "billingType": "BOTH",
    "setupPrice": 50000,
    "monthlyPrice": 3500,
    "category": "development"
  },
  {
    "id": "ecommerce",
    "name": "E-Commerce Product Catalog & Cart",
    "description": "Dynamic product catalog, inventory tracking, cart state, order notifications, and discount codes.",
    "billingType": "BOTH",
    "setupPrice": 75000,
    "monthlyPrice": 4500,
    "category": "development",
    "requires": [
      "payments"
    ]
  },
  {
    "id": "booking",
    "name": "Booking & Scheduling System",
    "description": "Interactive appointment scheduling, calendar synchronization, automated email/SMS reminders.",
    "billingType": "BOTH",
    "setupPrice": 55000,
    "monthlyPrice": 2500,
    "category": "development"
  },
  {
    "id": "file_storage",
    "name": "Secure Document & File Storage",
    "description": "Encrypted cloud storage uploads (S3/GCS) with virus scanning and secure presigned URLs.",
    "billingType": "BOTH",
    "setupPrice": 40000,
    "monthlyPrice": 2000,
    "category": "development"
  },
  {
    "id": "realtime",
    "name": "Realtime WebSockets / Live Chat",
    "description": "Instant bi-directional messaging, live collaboration, or real-time event streaming.",
    "billingType": "BOTH",
    "setupPrice": 75000,
    "monthlyPrice": 4500,
    "category": "development"
  },
  {
    "id": "api_integrations",
    "name": "Third-Party API & Webhook Integrations",
    "description": "Sync with external CRMs (HubSpot, Salesforce), email platforms, custom webhooks, or ERPs.",
    "billingType": "ONE_TIME",
    "setupPrice": 60000,
    "monthlyPrice": 0,
    "category": "development"
  },
  {
    "id": "sms_notifications",
    "name": "Transactional SMS Alerts Gateway",
    "description": "Instant customer and admin SMS notifications via Twilio or Telnyx.",
    "billingType": "BOTH",
    "setupPrice": 35000,
    "monthlyPrice": 2000,
    "category": "development"
  },
  {
    "id": "cms",
    "name": "Headless CMS Content Management",
    "description": "Visual content editor interface (Sanity, Strapi) allowing non-technical staff to publish blog/copy.",
    "billingType": "BOTH",
    "setupPrice": 70000,
    "monthlyPrice": 3500,
    "category": "development"
  },
  {
    "id": "multilingual",
    "name": "Multilingual Internationalization (i18n)",
    "description": "Multi-language routing, translation state management, and hreflang international SEO tags.",
    "billingType": "ONE_TIME",
    "setupPrice": 50000,
    "monthlyPrice": 0,
    "category": "development"
  },
  {
    "id": "migration",
    "name": "Legacy Website & Data Migration",
    "description": "Full content extraction, 301 redirect map creation, asset transfer, and zero-downtime cutover.",
    "billingType": "ONE_TIME",
    "setupPrice": 65000,
    "monthlyPrice": 0,
    "category": "development"
  },
  {
    "id": "ai_assistant",
    "name": "Grounded Business AI Assistant / Chatbot",
    "description": "24/7 web assistant trained exclusively on your business facts with strict guardrails and lead capture.",
    "billingType": "BOTH",
    "setupPrice": 90000,
    "monthlyPrice": 5000,
    "category": "ai"
  },
  {
    "id": "rag_knowledge",
    "name": "RAG Knowledge-Base Document Assistant",
    "description": "Semantic vector search over PDFs, manuals, and documents with citations and factual retrieval.",
    "billingType": "BOTH",
    "setupPrice": 140000,
    "monthlyPrice": 7500,
    "category": "ai"
  },
  {
    "id": "ai_voice",
    "name": "24/7 Web Voice Assistant (WebRTC)",
    "description": "Ultra-low latency spoken voice interaction directly in the client browser for lead intake.",
    "billingType": "BOTH",
    "setupPrice": 110000,
    "monthlyPrice": 6000,
    "category": "ai"
  },
  {
    "id": "premium_design",
    "name": "Bespoke 3D & GSAP Motion Design",
    "description": "Interactive Three.js particle backgrounds, advanced scroll-triggered animations, and micro-interactions.",
    "billingType": "ONE_TIME",
    "setupPrice": 80000,
    "monthlyPrice": 0,
    "category": "design"
  },
  {
    "id": "branding",
    "name": "Brand Identity & Vector Logo Package",
    "description": "Custom typography hierarchy, brand color palette, vector logo files, and favicon suite.",
    "billingType": "ONE_TIME",
    "setupPrice": 45000,
    "monthlyPrice": 0,
    "category": "design"
  },
  {
    "id": "seo",
    "name": "Advanced Technical SEO & Schema Package",
    "description": "Deep structured data JSON-LD graphs, breadcrumb navigation, sitemap configuration, and GEO/AEO optimization.",
    "billingType": "BOTH",
    "setupPrice": 45000,
    "monthlyPrice": 3000,
    "category": "marketing"
  },
  {
    "id": "geo_aeo",
    "name": "GEO & AI Search Engine Optimization",
    "description": "Optimization for Perplexity, ChatGPT Search, and Google AI Overviews with structured factual citations.",
    "billingType": "ONE_TIME",
    "setupPrice": 50000,
    "monthlyPrice": 0,
    "category": "marketing"
  },
  {
    "id": "copywriting",
    "name": "Professional Copywriting & Messaging",
    "description": "Conversion-oriented value propositions, clear service breakdowns, and customer trust copy.",
    "billingType": "ONE_TIME",
    "setupPrice": 35000,
    "monthlyPrice": 0,
    "category": "marketing"
  },
  {
    "id": "priority_sla",
    "name": "24/7 Priority Emergency Support SLA",
    "description": "Guaranteed under-2-hour emergency response window, direct phone escalation, and weekend engineering coverage.",
    "billingType": "MONTHLY",
    "setupPrice": 0,
    "monthlyPrice": 15000,
    "category": "operations"
  },
  {
    "id": "extra_support_hours",
    "name": "Extended Engineering Retainer (+5 hrs/mo)",
    "description": "Additional 5 dedicated hours per month of custom feature development, design updates, or integrations.",
    "billingType": "MONTHLY",
    "setupPrice": 0,
    "monthlyPrice": 25000,
    "category": "operations"
  },
  {
    "id": "support_6mo",
    "name": "6-Month Extended Support & Defect Warranty",
    "description": "Post-launch defect warranty, priority bug fixes (<24 hr triage), cross-browser compatibility patches, and 2 minor updates/mo.",
    "billingType": "MONTHLY",
    "setupPrice": 0,
    "monthlyPrice": 8900,
    "category": "operations",
    "group": "support-duration",
    "durationMonths": 6,
    "monthlyRequestsIncluded": 2,
    "maxHoursPerRequest": 1.5,
    "requestsRollOver": false,
    "slaInitialResponse": "< 24-hour business day triage",
    "autoRenew": false,
    "inclusions": [
      "Post-launch defect and bug warranty",
      "Priority ticket triage (< 24-hour response window)",
      "Cross-browser and mobile OS compatibility maintenance",
      "Up to 2 minor updates/configuration changes per month (up to 1.5 hrs each; expire monthly, no rollover)",
      "Dependency vulnerability patching"
    ],
    "exclusions": [
      "Major redesigns or layout overhauls",
      "Completely new feature development",
      "Third-party external API subscription costs"
    ]
  },
  {
    "id": "support_12mo",
    "name": "12-Month Dedicated Care & SLA Coverage",
    "description": "Full-year proactive maintenance: bi-monthly dependency upgrades, automated uptime anomaly triage, SEO health checks, up to 4 minor updates/mo, weekend coverage.",
    "billingType": "MONTHLY",
    "setupPrice": 0,
    "monthlyPrice": 6900,
    "category": "operations",
    "group": "support-duration",
    "durationMonths": 12,
    "monthlyRequestsIncluded": 4,
    "maxHoursPerRequest": 1.5,
    "requestsRollOver": false,
    "slaInitialResponse": "< 12-hour response window + weekend emergency on-call",
    "autoRenew": false,
    "inclusions": [
      "All 6-Month Extended Support inclusions",
      "Bi-monthly dependency and framework security upgrades",
      "Automated uptime anomaly investigation",
      "Monthly SEO and Core Web Vitals health check",
      "Up to 4 minor updates per month (up to 1.5 hrs each; expire monthly, no rollover)",
      "Emergency weekend on-call coverage for critical outages"
    ],
    "exclusions": [
      "Major architectural redesigns",
      "New database schemas or large feature builds"
    ]
  },
  {
    "id": "support_24mo",
    "name": "24-Month Long-Term Enterprise Lifecycle Support",
    "description": "Two-year comprehensive lifecycle coverage: major framework version migrations, semi-annual security audits, database tuning, up to 6 updates/mo, priority sprint scheduling.",
    "billingType": "MONTHLY",
    "setupPrice": 0,
    "monthlyPrice": 4900,
    "category": "operations",
    "group": "support-duration",
    "durationMonths": 24,
    "monthlyRequestsIncluded": 6,
    "maxHoursPerRequest": 1.5,
    "requestsRollOver": false,
    "slaInitialResponse": "< 4-hour critical outage triage + < 12-hour standard ticket triage + priority sprint queue",
    "autoRenew": false,
    "transitionSupportRule": "If base website non-renews at Month 12, automatically transitions to Self-Hosted Transition Support for Months 13–24 covering code-level maintenance, compatibility patches, security updates, and bug triage on client infrastructure with zero hosting fees.",
    "inclusions": [
      "All 12-Month Dedicated Care inclusions",
      "Major Angular / Node.js framework version migrations",
      "Semi-annual comprehensive code & security audit",
      "Database query optimization and index tuning",
      "Up to 6 minor updates per month (up to 1.5 hrs each; expire monthly, no rollover)",
      "Dedicated priority sprint queueing",
      "Automatic transition to Self-Hosted Support if base website hosting non-renews after Year 1"
    ],
    "exclusions": [
      "Completely new standalone product builds or uncontracted subdomains"
    ]
  }
];

export const SEED_EXTRA_PAGE_PRICE = 15000;

export const SEED_PRICING_FLOORS = {
  "MIN_SETUP_CENTS": 79900,
  "MIN_MONTHLY_CENTS": 4900,
  "MAX_COMBINED_DISCOUNT_PCT": 100
};
