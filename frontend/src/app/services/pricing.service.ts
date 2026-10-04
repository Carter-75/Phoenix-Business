import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { ThemePromotionService } from './theme-promotion.service';
import { Observable } from 'rxjs';

export interface BaseProject {
  id: string;
  name: string;
  shortName: string;
  description: string;
  baseSetupPrice: number; // in cents
  baseMonthlyPrice: number; // in cents
  pagesIncluded: number;
  maxTurnaroundWeeks: number;
  defaultType: string;
  inherentFeatures?: string[];
}

export interface FeatureAddon {
  id: string;
  name: string;
  description: string;
  billingType: 'ONE_TIME' | 'MONTHLY' | 'BOTH';
  setupPrice: number; // in cents
  monthlyPrice: number; // in cents
  category: 'development' | 'ai' | 'design' | 'marketing' | 'operations';
  group?: string; // e.g. 'support-duration'
  durationMonths?: number; // e.g. 6, 12, 24
  monthlyRequestsIncluded?: number;
  maxHoursPerRequest?: number;
  slaInitialResponse?: string;
  requestsRollOver?: boolean;
  transitionSupportRule?: string;
  autoRenew?: boolean;
  inclusions?: string[];
  exclusions?: string[];
  requires?: string[];
  includedInBase?: boolean;
}

export interface SupportAddonDetails {
  id: string;
  name: string;
  durationMonths: number;
  monthlyPrice: number;
  standardMonthlyPrice: number;
  discountedMonthlyPrice: number;
  discountPercent: number;
  totalCommitmentStandard: number;
  totalCommitmentDiscounted: number;
  setupPrice: number;
  billingType: string;
  coverageStartRule: string;
  billingStartRule: string;
  startDate: string;
  startDisplay: string;
  endDate: string;
  endDisplay: string;
  autoRenew: boolean;
  monthlyRequestsIncluded?: number;
  maxHoursPerRequest?: number;
  slaInitialResponse?: string;
  requestsRollOver?: boolean;
  transitionSupportRule?: string;
  inclusions: string[];
  exclusions: string[];
}

export interface UnifiedPricingCalculation {
  tier: BaseProject;
  scope: {
    totalPages: number;
    pagesIncluded: number;
    extraPages: number;
    extraPagesSetupPrice: number;
  };
  addons: FeatureAddon[];
  eligibleAddonCount: number;
  support: SupportAddonDetails | null;

  normalPrices: {
    setupSubtotal: number;
    monthlySubtotal: number;
    baseSetup: number;
    baseMonthly: number;
    addonsSetup: number;
    addonsMonthly: number;
  };

  discounts: {
    bundle: {
      percent: number;
      setupSavings: number;
      monthlySavings: number;
      nextThreshold: { count: number; discountPercent: number } | null;
    };
    promotion: {
      id: string;
      name: string;
      displayName: string;
      percent: number;
      setupSavings: number;
      monthlySavings: number;
      bannerText: string;
    };
    coupon: {
      code: string | null;
      setupSavings: number;
      monthlySavings: number;
    };
    effectiveSetupPercent: number;
    effectiveMonthlyPercent: number;
  };

  finalPrices: {
    dueToday: number;
    monthlyRecurring: number;
    baseMonthlyRecurring?: number;
    supportMonthlyRecurring?: number;
  };

  schedule: {
    dueTodayCents: number;
    monthlyRecurringCents: number;
    trialDays: number;
    firstMonthlyBillingDate: string;
    firstMonthlyBillingDisplay: string;
    websiteCommitmentMonths: number;
    commitmentMonths: number;
    supportDurationMonths: number;
    priceLockGuaranteed: boolean;
  };

  projectBrief: string;
}

export const BASE_PROJECTS: BaseProject[] = [
  {
    id: 'starter',
    name: 'Starter Launch Website',
    shortName: 'Starter',
    description: 'Custom high-performance 1-3 page website with lead capture, mobile responsiveness, and cloud edge deployment.',
    baseSetupPrice: 149900,
    baseMonthlyPrice: 9900,
    pagesIncluded: 3,
    maxTurnaroundWeeks: 2,
    defaultType: 'landing'
  },
  {
    id: 'business',
    name: 'Custom Business Website',
    shortName: 'Business',
    description: 'Comprehensive 4-6 page business platform with service showcases, team/portfolio, and lead automation.',
    baseSetupPrice: 249900,
    baseMonthlyPrice: 19900,
    pagesIncluded: 6,
    maxTurnaroundWeeks: 3,
    defaultType: 'business'
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Storefront',
    shortName: 'E-Commerce',
    description: 'Boutique online storefront with product catalog, cart, Stripe checkout, and automated customer order emails.',
    baseSetupPrice: 349900,
    baseMonthlyPrice: 29900,
    pagesIncluded: 8,
    maxTurnaroundWeeks: 4,
    defaultType: 'ecommerce',
    inherentFeatures: ['payments', 'ecommerce']
  },
  {
    id: 'webapp',
    name: 'Full-Stack Web App / SaaS MVP',
    shortName: 'Web App / SaaS',
    description: 'Custom web application with authenticated user portal, relational/document database, and API backend.',
    baseSetupPrice: 499900,
    baseMonthlyPrice: 39900,
    pagesIncluded: 10,
    maxTurnaroundWeeks: 5,
    defaultType: 'webapp',
    inherentFeatures: ['auth', 'database', 'dashboard']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Custom Platform',
    shortName: 'Enterprise',
    description: 'Bespoke enterprise architecture with multi-role permissions, high-concurrency database, and dedicated account SLAs.',
    baseSetupPrice: 1499900,
    baseMonthlyPrice: 99900,
    pagesIncluded: 15,
    maxTurnaroundWeeks: 8,
    defaultType: 'enterprise',
    inherentFeatures: ['auth', 'database', 'dashboard', 'roles']
  }
];

export const FEATURE_ADDONS: FeatureAddon[] = [
  // Development
  {
    id: 'database',
    name: 'Managed Database & Custom CRUD Logic',
    description: 'Dedicated MongoDB or PostgreSQL schema, data validation, and custom database records management.',
    billingType: 'BOTH',
    setupPrice: 80000,
    monthlyPrice: 4000,
    category: 'development'
  },
  {
    id: 'auth',
    name: 'User Authentication & Profiles',
    description: 'Secure registration, email/password and Google OAuth login, user profile storage, and password reset.',
    billingType: 'BOTH',
    setupPrice: 60000,
    monthlyPrice: 3000,
    category: 'development',
    requires: ['database']
  },
  {
    id: 'roles',
    name: 'Multi-Role User Permissions',
    description: 'Granular access control (admin, manager, member, client) with secure role-based guards.',
    billingType: 'ONE_TIME',
    setupPrice: 45000,
    monthlyPrice: 0,
    category: 'development',
    requires: ['auth']
  },
  {
    id: 'dashboard',
    name: 'Custom Admin / Client Portal',
    description: 'Private administrative dashboard with analytics metrics, user/order tables, and operational management.',
    billingType: 'BOTH',
    setupPrice: 120000,
    monthlyPrice: 6000,
    category: 'development',
    requires: ['auth', 'database']
  },
  {
    id: 'payments',
    name: 'Stripe Payments & Checkout Integration',
    description: 'Integrated Stripe checkout, customer billing portal, webhook receipts, and transaction handling.',
    billingType: 'BOTH',
    setupPrice: 50000,
    monthlyPrice: 3500,
    category: 'development'
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Product Catalog & Cart',
    description: 'Dynamic product catalog, inventory tracking, cart state, order notifications, and discount codes.',
    billingType: 'BOTH',
    setupPrice: 75000,
    monthlyPrice: 4500,
    category: 'development',
    requires: ['payments']
  },
  {
    id: 'booking',
    name: 'Booking & Scheduling System',
    description: 'Interactive appointment scheduling, calendar synchronization, automated email/SMS reminders.',
    billingType: 'BOTH',
    setupPrice: 55000,
    monthlyPrice: 2500,
    category: 'development'
  },
  {
    id: 'file_storage',
    name: 'Secure Document & File Storage',
    description: 'Encrypted cloud storage uploads (S3/GCS) with virus scanning and secure presigned URLs.',
    billingType: 'BOTH',
    setupPrice: 40000,
    monthlyPrice: 2000,
    category: 'development'
  },
  {
    id: 'realtime',
    name: 'Realtime WebSockets / Live Chat',
    description: 'Instant bi-directional messaging, live collaboration, or real-time event streaming.',
    billingType: 'BOTH',
    setupPrice: 75000,
    monthlyPrice: 4500,
    category: 'development'
  },
  {
    id: 'api_integrations',
    name: 'Third-Party API & Webhook Integrations',
    description: 'Sync with external CRMs (HubSpot, Salesforce), email platforms, custom webhooks, or ERPs.',
    billingType: 'ONE_TIME',
    setupPrice: 60000,
    monthlyPrice: 0,
    category: 'development'
  },
  {
    id: 'sms_notifications',
    name: 'Transactional SMS Alerts Gateway',
    description: 'Instant customer and admin SMS notifications via Twilio or Telnyx.',
    billingType: 'BOTH',
    setupPrice: 35000,
    monthlyPrice: 2000,
    category: 'development'
  },
  {
    id: 'cms',
    name: 'Headless CMS Content Management',
    description: 'Visual content editor interface (Sanity, Strapi) allowing non-technical staff to publish blog/copy.',
    billingType: 'BOTH',
    setupPrice: 70000,
    monthlyPrice: 3500,
    category: 'development'
  },
  {
    id: 'multilingual',
    name: 'Multilingual Internationalization (i18n)',
    description: 'Multi-language routing, translation state management, and hreflang international SEO tags.',
    billingType: 'ONE_TIME',
    setupPrice: 50000,
    monthlyPrice: 0,
    category: 'development'
  },
  {
    id: 'migration',
    name: 'Legacy Website & Data Migration',
    description: 'Full content extraction, 301 redirect map creation, asset transfer, and zero-downtime cutover.',
    billingType: 'ONE_TIME',
    setupPrice: 65000,
    monthlyPrice: 0,
    category: 'development'
  },

  // AI & Automation
  {
    id: 'ai_assistant',
    name: 'Grounded Business AI Assistant / Chatbot',
    description: '24/7 web assistant trained exclusively on your business facts with strict guardrails and lead capture.',
    billingType: 'BOTH',
    setupPrice: 90000,
    monthlyPrice: 5000,
    category: 'ai'
  },
  {
    id: 'rag_knowledge',
    name: 'RAG Knowledge-Base Document Assistant',
    description: 'Semantic vector search over PDFs, manuals, and documents with citations and factual retrieval.',
    billingType: 'BOTH',
    setupPrice: 140000,
    monthlyPrice: 7500,
    category: 'ai'
  },
  {
    id: 'ai_voice',
    name: '24/7 Web Voice Assistant (WebRTC)',
    description: 'Ultra-low latency spoken voice interaction directly in the client browser for lead intake.',
    billingType: 'BOTH',
    setupPrice: 110000,
    monthlyPrice: 6000,
    category: 'ai'
  },

  // Design
  {
    id: 'premium_design',
    name: 'Bespoke 3D & GSAP Motion Design',
    description: 'Interactive Three.js particle backgrounds, advanced scroll-triggered animations, and micro-interactions.',
    billingType: 'ONE_TIME',
    setupPrice: 80000,
    monthlyPrice: 0,
    category: 'design'
  },
  {
    id: 'branding',
    name: 'Brand Identity & Vector Logo Package',
    description: 'Custom typography hierarchy, brand color palette, vector logo files, and favicon suite.',
    billingType: 'ONE_TIME',
    setupPrice: 45000,
    monthlyPrice: 0,
    category: 'design'
  },

  // Marketing & Discovery
  {
    id: 'seo',
    name: 'Advanced Technical SEO & Schema Package',
    description: 'Deep structured data JSON-LD graphs, breadcrumb navigation, sitemap configuration, and GEO/AEO optimization.',
    billingType: 'BOTH',
    setupPrice: 45000,
    monthlyPrice: 3000,
    category: 'marketing'
  },
  {
    id: 'geo_aeo',
    name: 'GEO & AI Search Engine Optimization',
    description: 'Optimization for Perplexity, ChatGPT Search, and Google AI Overviews with structured factual citations.',
    billingType: 'ONE_TIME',
    setupPrice: 50000,
    monthlyPrice: 0,
    category: 'marketing'
  },
  {
    id: 'copywriting',
    name: 'Professional Copywriting & Messaging',
    description: 'Conversion-oriented value propositions, clear service breakdowns, and customer trust copy.',
    billingType: 'ONE_TIME',
    setupPrice: 35000,
    monthlyPrice: 0,
    category: 'marketing'
  },

  // Operations & Support
  {
    id: 'priority_sla',
    name: '24/7 Priority Emergency Support SLA',
    description: 'Guaranteed under-2-hour emergency response window, direct phone escalation, and weekend engineering coverage.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 15000,
    category: 'operations'
  },
  {
    id: 'extra_support_hours',
    name: 'Extended Engineering Retainer (+5 hrs/mo)',
    description: 'Additional 5 dedicated hours per month of custom feature development, design updates, or integrations.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 25000,
    category: 'operations'
  },
  {
    id: 'support_6mo',
    name: '6-Month Extended Support & Defect Warranty',
    description: 'Post-launch defect warranty, priority bug fixes (<24 hr triage), cross-browser compatibility patches, and 2 minor updates/mo.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 8900,
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
  {
    id: 'support_12mo',
    name: '12-Month Dedicated Care & SLA Coverage',
    description: 'Full-year proactive maintenance: bi-monthly dependency upgrades, automated uptime anomaly triage, SEO health checks, up to 4 minor updates/mo, weekend coverage.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 6900,
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
  {
    id: 'support_24mo',
    name: '24-Month Long-Term Enterprise Lifecycle Support',
    description: 'Two-year comprehensive lifecycle coverage: major framework version migrations, semi-annual security audits, database tuning, up to 6 updates/mo, priority sprint scheduling.',
    billingType: 'MONTHLY',
    setupPrice: 0,
    monthlyPrice: 4900,
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
];

export const EXTRA_PAGE_PRICE = 15000; // in cents ($150.00)

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private api = inject(ApiService);
  private themePromo = inject(ThemePromotionService);

  // Available catalogs
  public readonly baseProjects = BASE_PROJECTS;
  public readonly featureAddons = FEATURE_ADDONS;
  public readonly extraPagePrice = EXTRA_PAGE_PRICE;

  public selectedProjectType = signal<string>('business');
  public totalPages = signal<number>(6);
  public selectedFeatures = signal<string[]>([]);
  public discountCode = signal<string>('');
  public appliedCoupon = signal<{ code: string; type: 'percentage' | 'fixed'; percentage: number; fixedCents: number; appliesTo: string } | null>(null);

  // Comprehensive reactive calculation computed from user state & active promotion
  public calculation = computed<UnifiedPricingCalculation>(() => {
    const tierId = this.selectedProjectType();
    const baseProject = BASE_PROJECTS.find(p => p.id === tierId) || BASE_PROJECTS[1];
    const inherentFeatures = baseProject.inherentFeatures || [];

    // Pages
    const pages = Math.max(1, this.totalPages());
    const extraPages = Math.max(0, pages - baseProject.pagesIncluded);
    const extraPagesPrice = extraPages * EXTRA_PAGE_PRICE;

    // Addons with auto-dependencies and group deduplication
    const rawSelectedList = this.selectedFeatures();
    const groupedSelections: Record<string, string> = {};
    const ungroupedList: string[] = [];

    for (const fId of rawSelectedList) {
      const feat = FEATURE_ADDONS.find(f => f.id === fId);
      if (!feat) continue;
      if (feat.group) {
        groupedSelections[feat.group] = feat.id;
      } else {
        ungroupedList.push(feat.id);
      }
    }

    const rawSelected = new Set([...ungroupedList, ...Object.values(groupedSelections)]);
    if (rawSelected.has('dashboard')) {
      rawSelected.add('auth');
      rawSelected.add('database');
    }
    if (rawSelected.has('auth')) {
      rawSelected.add('database');
    }
    if (rawSelected.has('roles')) {
      rawSelected.add('auth');
      rawSelected.add('database');
    }
    if (rawSelected.has('ecommerce')) {
      rawSelected.add('payments');
    }

    let addonsSetupSubtotal = 0;
    let addonsMonthlySubtotal = 0;
    let eligibleCount = 0;
    const detailedAddons: FeatureAddon[] = [];
    let selectedSupportAddon: FeatureAddon | null = null;

    for (const featId of rawSelected) {
      const feat = FEATURE_ADDONS.find(f => f.id === featId);
      if (!feat) continue;

      if (feat.group === 'support-duration') {
        selectedSupportAddon = feat;
      }

      const isInherent = inherentFeatures.includes(featId);
      const itemSetup = isInherent ? 0 : feat.setupPrice;
      const itemMonthly = isInherent ? 0 : feat.monthlyPrice;

      if (!isInherent) {
        addonsSetupSubtotal += itemSetup;
        addonsMonthlySubtotal += itemMonthly;
        eligibleCount++;
      }

      detailedAddons.push({
        ...feat,
        setupPrice: itemSetup,
        monthlyPrice: itemMonthly,
        includedInBase: isInherent
      });
    }

    // Bundle discount
    let bundleDiscountPercent = 0;
    let nextThreshold: { count: number; discountPercent: number } | null = { count: 2, discountPercent: 5 };
    if (eligibleCount >= 6) {
      bundleDiscountPercent = 15;
      nextThreshold = null;
    } else if (eligibleCount >= 4) {
      bundleDiscountPercent = 10;
      nextThreshold = { count: 6, discountPercent: 15 };
    } else if (eligibleCount >= 2) {
      bundleDiscountPercent = 5;
      nextThreshold = { count: 4, discountPercent: 10 };
    }

    const bundleSavingsSetup = Math.round(addonsSetupSubtotal * (bundleDiscountPercent / 100));
    const bundleSavingsMonthly = Math.round(addonsMonthlySubtotal * (bundleDiscountPercent / 100));

    const postBundleAddonsSetup = addonsSetupSubtotal - bundleSavingsSetup;
    const postBundleAddonsMonthly = addonsMonthlySubtotal - bundleSavingsMonthly;

    // Normal genuine reference prices
    const normalSetupSubtotal = baseProject.baseSetupPrice + extraPagesPrice + addonsSetupSubtotal;
    const normalMonthlySubtotal = baseProject.baseMonthlyPrice + addonsMonthlySubtotal;

    const subtotalAfterBundleSetup = baseProject.baseSetupPrice + extraPagesPrice + postBundleAddonsSetup;
    const subtotalAfterBundleMonthly = baseProject.baseMonthlyPrice + postBundleAddonsMonthly;

    // Active Global Promotion
    const promoInfo = this.themePromo.bannerContent();
    const globalPromoPercent = promoInfo.discountPercent || 20;

    const promoSavingsSetup = Math.round(subtotalAfterBundleSetup * (globalPromoPercent / 100));
    const promoSavingsMonthly = Math.round(subtotalAfterBundleMonthly * (globalPromoPercent / 100));

    const postPromoSetup = Math.max(0, subtotalAfterBundleSetup - promoSavingsSetup);
    const postPromoMonthly = Math.max(0, subtotalAfterBundleMonthly - promoSavingsMonthly);

    // Coupon discount calculation
    const applied = this.appliedCoupon();
    let couponSetupSavings = 0;
    let couponMonthlySavings = 0;
    if (applied) {
      if (applied.appliesTo === 'setup' || applied.appliesTo === 'both') {
        couponSetupSavings = applied.type === 'percentage'
          ? Math.round(postPromoSetup * (applied.percentage / 100))
          : Math.min(postPromoSetup, applied.fixedCents);
      }
      if (applied.appliesTo === 'monthly' || applied.appliesTo === 'both') {
        couponMonthlySavings = applied.type === 'percentage'
          ? Math.round(postPromoMonthly * (applied.percentage / 100))
          : Math.min(postPromoMonthly, applied.fixedCents);
      }
    }

    const postCouponSetup = Math.max(0, postPromoSetup - couponSetupSavings);
    const postCouponMonthly = Math.max(0, postPromoMonthly - couponMonthlySavings);

    // Final prices clamped to minimum floors ($799 setup / $49 monthly)
    const finalSetupCents = Math.max(79900, postCouponSetup);
    const finalMonthlyCents = Math.max(4900, postCouponMonthly);

    // 30-day deferred billing schedule
    const firstBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const firstBillingDisplay = firstBillingDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    let supportDetails: SupportAddonDetails | null = null;
    if (selectedSupportAddon) {
      const stdMonthly = selectedSupportAddon.monthlyPrice;
      const supportAfterBundle = Math.round(stdMonthly * (1 - bundleDiscountPercent / 100));
      const supportAfterPromo = Math.round(supportAfterBundle * (1 - globalPromoPercent / 100));
      const discMonthly = Math.max(100, supportAfterPromo);

      const dur = selectedSupportAddon.durationMonths!;
      const totalStd = stdMonthly * dur;
      const totalDisc = discMonthly * dur;
      const effectiveDiscountPct = Math.round(((totalStd - totalDisc) / totalStd) * 100);

      const supportEndDate = new Date(firstBillingDate.getTime() + (dur * 30.44 * 24 * 60 * 60 * 1000));
      supportDetails = {
        id: selectedSupportAddon.id,
        name: selectedSupportAddon.name,
        durationMonths: dur,
        monthlyPrice: discMonthly,
        standardMonthlyPrice: stdMonthly,
        discountedMonthlyPrice: discMonthly,
        discountPercent: effectiveDiscountPct,
        totalCommitmentStandard: totalStd,
        totalCommitmentDiscounted: totalDisc,
        setupPrice: selectedSupportAddon.setupPrice,
        billingType: selectedSupportAddon.billingType,
        coverageStartRule: 'Website Production Launch Date (Immediate Coverage)',
        billingStartRule: 'First Monthly Care Cycle (+30 Days from Kickoff)',
        startDate: firstBillingDate.toISOString(),
        startDisplay: firstBillingDisplay,
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
        transitionSupportRule: selectedSupportAddon.transitionSupportRule || undefined,
        inclusions: selectedSupportAddon.inclusions || [],
        exclusions: selectedSupportAddon.exclusions || []
      };
    }

    const effectiveSetupPct = Math.round(((normalSetupSubtotal - finalSetupCents) / normalSetupSubtotal) * 100);
    const effectiveMonthlyPct = Math.round(((normalMonthlySubtotal - finalMonthlyCents) / normalMonthlySubtotal) * 100);

    const supportMonthlyPortion = supportDetails ? supportDetails.discountedMonthlyPrice : 0;
    const baseWebsiteMonthlyPortion = Math.max(0, finalMonthlyCents - supportMonthlyPortion);

    const featureNames = detailedAddons.map(a => a.name).join(', ') || 'Standard Included Scope';
    const supportBriefLine = supportDetails 
      ? `Support: ${supportDetails.name} (${supportDetails.durationMonths} Mos @ $${(supportDetails.discountedMonthlyPrice / 100).toFixed(2)}/mo locked [Std: $${(supportDetails.standardMonthlyPrice / 100).toFixed(2)}/mo])`
      : `Support: Standard Baseline Included Care (No optional support add-on selected)`;

    const projectBrief = [
      `Plan: ${baseProject.name}`,
      `Scope: ${pages} Pages (${extraPages} Extra Pages)`,
      `Add-Ons: ${featureNames}`,
      supportBriefLine,
      `Due Today: $${(finalSetupCents / 100).toFixed(2)} (Standard: $${(normalSetupSubtotal / 100).toFixed(2)})`,
      `First Monthly Care: $${(finalMonthlyCents / 100).toFixed(2)} on ${firstBillingDisplay}`,
      `Subsequent Care: $${(finalMonthlyCents / 100).toFixed(2)}/mo (Standard: $${(normalMonthlySubtotal / 100).toFixed(2)}/mo)`,
      `12-Month Initial Commitment with 30-Day Subscription Trial`,
      `Promotion: ${promoInfo.name} (${globalPromoPercent}% Global Discount Applied)`
    ].join('\n');

    return {
      tier: baseProject,
      scope: {
        totalPages: pages,
        pagesIncluded: baseProject.pagesIncluded,
        extraPages,
        extraPagesSetupPrice: extraPagesPrice
      },
      addons: detailedAddons,
      eligibleAddonCount: eligibleCount,
      support: supportDetails,
      normalPrices: {
        setupSubtotal: normalSetupSubtotal,
        monthlySubtotal: normalMonthlySubtotal,
        baseSetup: baseProject.baseSetupPrice,
        baseMonthly: baseProject.baseMonthlyPrice,
        addonsSetup: addonsSetupSubtotal,
        addonsMonthly: addonsMonthlySubtotal
      },
      discounts: {
        bundle: {
          percent: bundleDiscountPercent,
          setupSavings: bundleSavingsSetup,
          monthlySavings: bundleSavingsMonthly,
          nextThreshold
        },
        promotion: {
          id: this.themePromo.autoThemeId(),
          name: promoInfo.name,
          displayName: promoInfo.name,
          percent: globalPromoPercent,
          setupSavings: promoSavingsSetup,
          monthlySavings: promoSavingsMonthly,
          bannerText: promoInfo.bannerText
        },
        coupon: {
          code: applied ? applied.code : (this.discountCode() || null),
          setupSavings: couponSetupSavings,
          monthlySavings: couponMonthlySavings
        },
        effectiveSetupPercent: effectiveSetupPct,
        effectiveMonthlyPercent: effectiveMonthlyPct
      },
      finalPrices: {
        dueToday: finalSetupCents,
        monthlyRecurring: finalMonthlyCents,
        baseMonthlyRecurring: baseWebsiteMonthlyPortion,
        supportMonthlyRecurring: supportMonthlyPortion
      },
      schedule: {
        dueTodayCents: finalSetupCents,
        monthlyRecurringCents: finalMonthlyCents,
        trialDays: 30,
        firstMonthlyBillingDate: firstBillingDate.toISOString(),
        firstMonthlyBillingDisplay: firstBillingDisplay,
        websiteCommitmentMonths: 12,
        commitmentMonths: 12,
        supportDurationMonths: supportDetails ? supportDetails.durationMonths : 0,
        priceLockGuaranteed: true
      },
      projectBrief
    };
  });

  // State mutations
  public setProjectType(id: string) {
    this.selectedProjectType.set(id);
    const p = BASE_PROJECTS.find(x => x.id === id);
    if (p && this.totalPages() < p.pagesIncluded) {
      this.totalPages.set(p.pagesIncluded);
    }
  }

  public setPages(count: number) {
    this.totalPages.set(Math.max(1, Math.min(100, count)));
  }

  public toggleFeature(id: string) {
    const targetFeat = FEATURE_ADDONS.find(f => f.id === id);
    const current = this.selectedFeatures();
    
    if (current.includes(id)) {
      // Deselect
      this.selectedFeatures.set(current.filter(x => x !== id));
      return;
    }

    // If it belongs to a group (e.g. 'support-duration'), deselect any other member of that group first
    let next = [...current];
    if (targetFeat && targetFeat.group) {
      const sameGroupIds = FEATURE_ADDONS.filter(f => f.group === targetFeat.group).map(f => f.id);
      next = next.filter(x => !sameGroupIds.includes(x));
    }
    next.push(id);
    this.selectedFeatures.set(next);
  }

  public setDiscountCode(code: string) {
    this.discountCode.set(code.trim().toUpperCase());
  }

  public applyValidatedCoupon(coupon: { code: string; type: 'percentage' | 'fixed'; percentage: number; fixedCents: number; appliesTo: string } | null) {
    this.appliedCoupon.set(coupon);
    if (coupon) {
      this.discountCode.set(coupon.code);
    } else {
      this.discountCode.set('');
    }
  }

  public saveEstimate(data: { name: string; email: string; businessName?: string; phone?: string; notes?: string }): Observable<any> {
    const calc = this.calculation();
    return this.api.post('pricing/save-estimate', {
      ...data,
      configuration: {
        tier: calc.tier.id,
        totalPages: calc.scope.totalPages,
        features: calc.addons.map(a => a.id),
        discountCode: this.discountCode()
      }
    });
  }
}
