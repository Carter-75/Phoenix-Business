import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';
import { SEED_BASE_PROJECTS, SEED_FEATURE_ADDONS, SEED_EXTRA_PAGE_PRICE, SEED_PRICING_FLOORS } from './pricing-catalog.generated';
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
      introApplied?: boolean;
      introFirstMonthCents?: number | null;
      introOngoingMonthlyCents?: number | null;
      introOngoingPercentOff?: number;
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
    firstMonthCents?: number;
    ongoingMonthlyCents?: number;
    firstMonthlyBillingDate: string;
    firstMonthlyBillingDisplay: string;
    websiteCommitmentMonths: number;
    commitmentMonths: number;
    supportDurationMonths: number;
    priceLockGuaranteed: boolean;
  };

  projectBrief: string;
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private api = inject(ApiService);
  private themePromo = inject(ThemePromotionService);
  private platformId = inject(PLATFORM_ID);

  // Catalog state. Seeded at build time from the backend pricing engine
  // (pricing-catalog.generated.ts) and refreshed in the browser from the
  // live /api/pricing/catalog endpoint, so this file carries no second
  // hand-written copy of the catalog.
  private projectsSignal = signal<BaseProject[]>(SEED_BASE_PROJECTS as unknown as BaseProject[]);
  private addonsSignal = signal<FeatureAddon[]>(SEED_FEATURE_ADDONS as unknown as FeatureAddon[]);
  private extraPagePriceSignal = signal<number>(SEED_EXTRA_PAGE_PRICE);
  private floorsSignal = signal<{ minSetupCents: number; minMonthlyCents: number }>({
    minSetupCents: SEED_PRICING_FLOORS.MIN_SETUP_CENTS,
    minMonthlyCents: SEED_PRICING_FLOORS.MIN_MONTHLY_CENTS
  });

  // Available catalogs
  public get baseProjects(): BaseProject[] {
    return this.projectsSignal();
  }

  public get featureAddons(): FeatureAddon[] {
    return this.addonsSignal();
  }

  public get extraPagePrice(): number {
    return this.extraPagePriceSignal();
  }

  constructor() {
    // Browser only: swap the build-time seed for the live backend catalog.
    // On any failure the seed stays in place and pricing keeps working.
    if (isPlatformBrowser(this.platformId)) {
      this.api.get<any>('pricing/catalog').subscribe({
        next: (data) => {
          if (!data) return;
          if (Array.isArray(data.baseProjects) && data.baseProjects.length > 0) {
            this.projectsSignal.set(data.baseProjects as BaseProject[]);
          }
          if (Array.isArray(data.featureAddons) && data.featureAddons.length > 0) {
            this.addonsSignal.set(data.featureAddons as FeatureAddon[]);
          }
          if (data.extraPagePrice) {
            this.extraPagePriceSignal.set(data.extraPagePrice);
          }
          if (data.pricingFloors) {
            const floors = { ...this.floorsSignal() };
            if (data.pricingFloors.MIN_SETUP_CENTS) {
              floors.minSetupCents = data.pricingFloors.MIN_SETUP_CENTS;
            }
            if (data.pricingFloors.MIN_MONTHLY_CENTS) {
              floors.minMonthlyCents = data.pricingFloors.MIN_MONTHLY_CENTS;
            }
            this.floorsSignal.set(floors);
          }
        },
        error: () => {
          // Silent: the build-time seed catalog remains active.
        }
      });
    }
  }

  public selectedProjectType = signal<string>('business');
  public totalPages = signal<number>(6);
  public selectedFeatures = signal<string[]>([]);
  public discountCode = signal<string>('');
  public appliedCoupon = signal<{ code: string; type: 'percentage' | 'fixed' | 'percentage_capped' | 'intro'; percentage: number; fixedCents: number; appliesTo: string; capSetupCents?: number; capMonthlyCents?: number; bypassFloors?: boolean; ongoingMonthlyPercentOff?: number; restrictToPackage?: string } | null>(null);

  // Comprehensive reactive calculation computed from user state & active promotion
  public calculation = computed<UnifiedPricingCalculation>(() => {
    const tierId = this.selectedProjectType();
    const baseProject = this.baseProjects.find(p => p.id === tierId) || this.baseProjects[1];
    const inherentFeatures = baseProject.inherentFeatures || [];

    // Pages
    const pages = Math.max(1, this.totalPages());
    const extraPages = Math.max(0, pages - baseProject.pagesIncluded);
    const extraPagesPrice = extraPages * this.extraPagePrice;

    // Addons with auto-dependencies and group deduplication
    const rawSelectedList = this.selectedFeatures();
    const groupedSelections: Record<string, string> = {};
    const ungroupedList: string[] = [];

    for (const fId of rawSelectedList) {
      const feat = this.featureAddons.find(f => f.id === fId);
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
      const feat = this.featureAddons.find(f => f.id === featId);
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
    // Intro offers are tier locked: on any other package the code
    // simply does not apply here (checkout refuses it with a reason).
    const introApplied = Boolean(applied && applied.type === 'intro' && (!applied.restrictToPackage || applied.restrictToPackage === baseProject.id));
    let couponSetupSavings = 0;
    let couponMonthlySavings = 0;
    if (applied && (applied.type !== 'intro' || introApplied)) {
      if (applied.appliesTo === 'setup' || applied.appliesTo === 'both') {
        couponSetupSavings = applied.type === 'percentage'
          ? Math.round(postPromoSetup * (applied.percentage / 100))
          : applied.type === 'percentage_capped'
            ? Math.round(Math.min(postPromoSetup, applied.capSetupCents || 0) * (applied.percentage / 100))
            : applied.type === 'intro'
              ? Math.min(postPromoSetup, applied.capSetupCents || 0)
              : Math.min(postPromoSetup, applied.fixedCents);
      }
      if (applied.appliesTo === 'monthly' || applied.appliesTo === 'both') {
        couponMonthlySavings = applied.type === 'percentage'
          ? Math.round(postPromoMonthly * (applied.percentage / 100))
          : applied.type === 'percentage_capped'
            ? Math.round(Math.min(postPromoMonthly, applied.capMonthlyCents || 0) * (applied.percentage / 100))
            : applied.type === 'intro'
              ? Math.min(postPromoMonthly, applied.capMonthlyCents || 0)
              : Math.min(postPromoMonthly, applied.fixedCents);
      }
    }

    const postCouponSetup = Math.max(0, postPromoSetup - couponSetupSavings);
    const postCouponMonthly = Math.max(0, postPromoMonthly - couponMonthlySavings);

    // Check if this is a 100% discount (free order)
    const effectiveSetupDiscountRatio = normalSetupSubtotal > 0 
      ? (normalSetupSubtotal - postCouponSetup) / normalSetupSubtotal 
      : 0;
    const effectiveMonthlyDiscountRatio = normalMonthlySubtotal > 0 
      ? (normalMonthlySubtotal - postCouponMonthly) / normalMonthlySubtotal 
      : 0;
    const is100PercentDiscount = effectiveSetupDiscountRatio >= 0.9999 && effectiveMonthlyDiscountRatio >= 0.9999;

    // Final prices: bypass floors for 100% discount and for coupons
    // flagged bypassFloors (group buy discounts have no minimum),
    // otherwise apply minimum floors
    const bypassFloors = Boolean(applied && applied.bypassFloors);
    const finalSetupCents = is100PercentDiscount ? 0 : bypassFloors ? postCouponSetup : Math.max(this.floorsSignal().minSetupCents, postCouponSetup);
    let finalMonthlyCents = is100PercentDiscount ? 0 : bypassFloors ? postCouponMonthly : Math.max(this.floorsSignal().minMonthlyCents, postCouponMonthly);
    // Intro offer: the recurring rate shown and charged is the
    // ongoing rate (percent off, ongoing). The first month is free
    // and handled by the longer trial at checkout.
    const introFirstMonthCents = introApplied ? postCouponMonthly : null;
    const introOngoingMonthlyCents = introApplied ? Math.round(postPromoMonthly * (1 - ((applied as any).ongoingMonthlyPercentOff || 0) / 100)) : null;
    if (introApplied) finalMonthlyCents = introOngoingMonthlyCents as number;

    // 30-day deferred billing schedule
    const firstBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const firstPaidBillingDate = introApplied ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : firstBillingDate;
    const firstPaidBillingDisplay = firstPaidBillingDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
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
      introApplied
        ? `First Monthly Care: $${((introFirstMonthCents || 0) / 100).toFixed(2)} (free first month with your outreach code)`
        : `First Monthly Care: $${(finalMonthlyCents / 100).toFixed(2)} on ${firstBillingDisplay}`,
      introApplied
        ? `Subsequent Care: $${((introOngoingMonthlyCents || 0) / 100).toFixed(2)}/mo starting ${firstPaidBillingDisplay} (Standard: $${(normalMonthlySubtotal / 100).toFixed(2)}/mo)`
        : `Subsequent Care: $${(finalMonthlyCents / 100).toFixed(2)}/mo (Standard: $${(normalMonthlySubtotal / 100).toFixed(2)}/mo)`,
      introApplied ? `12-Month Initial Commitment with 60-Day Subscription Trial` : `12-Month Initial Commitment with 30-Day Subscription Trial`,
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
          monthlySavings: couponMonthlySavings,
          introApplied,
          introFirstMonthCents,
          introOngoingMonthlyCents,
          introOngoingPercentOff: introApplied ? ((applied as any).ongoingMonthlyPercentOff || 0) : 0
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
        trialDays: introApplied ? 60 : 30,
        firstMonthCents: introApplied ? (introFirstMonthCents || 0) : finalMonthlyCents,
        ongoingMonthlyCents: introApplied ? (introOngoingMonthlyCents || 0) : finalMonthlyCents,
        firstMonthlyBillingDate: firstPaidBillingDate.toISOString(),
        firstMonthlyBillingDisplay: firstPaidBillingDisplay,
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
    const p = this.baseProjects.find(x => x.id === id);
    if (p && this.totalPages() < p.pagesIncluded) {
      this.totalPages.set(p.pagesIncluded);
    }
  }

  public setPages(count: number) {
    this.totalPages.set(Math.max(1, Math.min(100, count)));
  }

  public toggleFeature(id: string) {
    const targetFeat = this.featureAddons.find(f => f.id === id);
    const current = this.selectedFeatures();
    
    if (current.includes(id)) {
      // Deselect
      this.selectedFeatures.set(current.filter(x => x !== id));
      return;
    }

    // If it belongs to a group (e.g. 'support-duration'), deselect any other member of that group first
    let next = [...current];
    if (targetFeat && targetFeat.group) {
      const sameGroupIds = this.featureAddons.filter(f => f.group === targetFeat.group).map(f => f.id);
      next = next.filter(x => !sameGroupIds.includes(x));
    }
    next.push(id);
    this.selectedFeatures.set(next);
  }

  public setDiscountCode(code: string) {
    this.discountCode.set(code.trim().toUpperCase());
  }

  public applyValidatedCoupon(coupon: { code: string; type: 'percentage' | 'fixed' | 'percentage_capped' | 'intro'; percentage: number; fixedCents: number; appliesTo: string; capSetupCents?: number; capMonthlyCents?: number; bypassFloors?: boolean; ongoingMonthlyPercentOff?: number; restrictToPackage?: string } | null) {
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
