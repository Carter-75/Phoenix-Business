import { Component, inject, signal, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PricingService, FeatureAddon } from '../../../services/pricing.service';
import { ApiService, PendingIntent } from '../../../services/api.service';

@Component({
  selector: 'app-project-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div id="configurator" class="w-full max-w-[1280px] mx-auto rounded-3xl bg-[#07070d] border border-white/10 p-6 sm:p-10 lg:p-14 shadow-2xl relative overflow-hidden">
      <!-- Ambient Glow Behind Configurator -->
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none -z-10"
           [style.background]="'radial-gradient(circle, var(--theme-primary, #ff4d00) 0%, transparent 70%)'"
           style="opacity: 0.12;"></div>

      <!-- Header -->
      <div class="mb-10 text-center max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest mb-4"
             [style.borderColor]="'var(--theme-border, rgba(255, 77, 0, 0.2))'"
             [style.backgroundColor]="'var(--theme-bg-accent, rgba(255, 77, 0, 0.05))'"
             [style.color]="'var(--theme-primary, #ff4d00)'">
          <span>⚡ Unified Dynamic Pricing &amp; Contract Engine</span>
        </div>
        <h2 class="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mb-4">
          Configure Your System
        </h2>
        <p class="text-white/60 text-sm sm:text-base leading-relaxed">
          Select your base platform, customize page scope, and add modular upgrades. Every tier includes a one-time build fee and managed monthly cloud care with a 30-day deferred billing trial.
        </p>
      </div>

      <!-- Active Promotion Notice Banner -->
      <div class="mb-10 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
           [style.borderColor]="'var(--theme-primary, #ff4d00)'"
           [style.backgroundColor]="'var(--theme-bg-accent, rgba(255, 77, 0, 0.08))'">
        <div class="flex items-center gap-3 text-center sm:text-left">
          <span class="text-2xl">🔥</span>
          <div>
            <div class="text-xs font-black uppercase tracking-widest" [style.color]="'var(--theme-primary, #ff4d00)'">
              {{ pricing.calculation().discounts.promotion.displayName }} Active ({{ pricing.calculation().discounts.promotion.percent }}% Global Savings)
            </div>
            <p class="text-xs text-white/70">{{ pricing.calculation().discounts.promotion.bannerText }}</p>
          </div>
        </div>
        <div class="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white font-bold whitespace-nowrap">
          Applies to Setup &amp; Monthly Fees
        </div>
      </div>

      <!-- Step 1: Base Tier Selection -->
      <div class="mb-12">
        <label class="block text-xs font-black uppercase tracking-widest mb-4" [style.color]="'var(--theme-primary, #ff4d00)'">
          01 / Select Base Platform Tier
        </label>
        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button 
            type="button"
            *ngFor="let project of pricing.baseProjects"
            (click)="pricing.setProjectType(project.id)"
            class="text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between group"
            [ngClass]="pricing.selectedProjectType() === project.id ? '!bg-white/[0.08] ring-1' : 'bg-white/[0.02] border-white/10 hover:border-white/20'"
            [style.borderColor]="pricing.selectedProjectType() === project.id ? 'var(--theme-primary, #ff4d00)' : 'rgba(255,255,255,0.1)'"
            [style.outlineColor]="pricing.selectedProjectType() === project.id ? 'var(--theme-primary, #ff4d00)' : 'transparent'">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[9px] font-black uppercase tracking-widest text-white/50">{{ project.maxTurnaroundWeeks }} Wk Delivery</span>
                <span *ngIf="pricing.selectedProjectType() === project.id" class="w-2.5 h-2.5 rounded-full" [style.backgroundColor]="'var(--theme-primary, #ff4d00)'"></span>
              </div>
              <h4 class="text-base font-bold text-white mb-1.5">{{ project.name }}</h4>
              <p class="text-[11px] text-white/50 leading-relaxed mb-4">{{ project.description }}</p>
            </div>
            
            <!-- Dual Price: Setup + Monthly -->
            <div class="pt-3 border-t border-white/10 flex flex-col gap-1">
              <div class="flex items-baseline justify-between">
                <span class="text-[10px] uppercase font-bold text-white/40">Setup:</span>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-[10px] text-white/30 line-through">\${{ (project.baseSetupPrice / 100).toLocaleString() }}</span>
                  <span class="text-sm font-black text-white" [style.color]="'var(--theme-primary, #ff4d00)'">
                    \${{ (getDiscountedAmount(project.baseSetupPrice) / 100).toLocaleString() }}
                  </span>
                </div>
              </div>
              <div class="flex items-baseline justify-between">
                <span class="text-[10px] uppercase font-bold text-white/40">Care:</span>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-[10px] text-white/30 line-through">\${{ (project.baseMonthlyPrice / 100).toLocaleString() }}/mo</span>
                  <span class="text-xs font-bold text-white/90">
                    \${{ (getDiscountedAmount(project.baseMonthlyPrice) / 100).toLocaleString() }}/mo
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: Page Count -->
      <div class="mb-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <label class="block text-xs font-black uppercase tracking-widest mb-1" [style.color]="'var(--theme-primary, #ff4d00)'">
            02 / Scope: Estimated Page Count
          </label>
          <p class="text-xs text-white/50">Base plan includes {{ pricing.calculation().scope.pagesIncluded }} pages. Additional custom pages are $150 each.</p>
        </div>
        <div class="flex items-center gap-4">
          <button 
            type="button"
            (click)="pricing.setPages(pricing.totalPages() - 1)"
            [disabled]="pricing.totalPages() <= 1"
            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            -
          </button>
          <div class="text-center min-w-[80px]">
            <span class="text-2xl font-black text-white">{{ pricing.totalPages() }}</span>
            <span class="text-[10px] block uppercase tracking-widest text-white/40">Pages</span>
          </div>
          <button 
            type="button"
            (click)="pricing.setPages(pricing.totalPages() + 1)"
            [disabled]="pricing.totalPages() >= 50"
            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            +
          </button>
        </div>
      </div>

      <!-- Step 3: The Big Five Add-On Wheel -->
      <div class="mb-12">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <label class="text-xs font-black uppercase tracking-widest block mb-1" [style.color]="'var(--theme-primary, #ff4d00)'">
              03 / Add-Ons: The Big Five
            </label>
            <p class="text-xs text-white/50">Only the five upgrades that change what your site can do. Spin the wheel, tap a card to add or remove it.</p>
          </div>

          <!-- Wheel Controls -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="scrollWheel(-1)"
              aria-label="Previous add-on"
              class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 transition-all cursor-pointer">
              &lsaquo;
            </button>
            <span class="text-[11px] font-bold text-white/50 min-w-[44px] text-center">{{ wheelIndex() + 1 }} / {{ wheelAddons.length }}</span>
            <button
              type="button"
              (click)="scrollWheel(1)"
              aria-label="Next add-on"
              class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 transition-all cursor-pointer">
              &rsaquo;
            </button>
          </div>
        </div>

        <!-- Bundle Savings Indicator -->
        <div *ngIf="pricing.calculation().eligibleAddonCount > 0" class="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-lg">🎁</span>
            <div>
              <span class="text-xs font-black text-white uppercase tracking-wider">
                Volume Bundle Discount: {{ pricing.calculation().discounts.bundle.percent }}% OFF Add-Ons
              </span>
              <p *ngIf="pricing.calculation().discounts.bundle.nextThreshold" class="text-[11px] text-white/50">
                Add {{ pricing.calculation().discounts.bundle.nextThreshold!.count - pricing.calculation().eligibleAddonCount }} more upgrade to unlock {{ pricing.calculation().discounts.bundle.nextThreshold!.discountPercent }}% bundle savings!
              </p>
            </div>
          </div>
          <span class="text-xs font-bold text-emerald-400">
            -\${{ ((pricing.calculation().discounts.bundle.setupSavings + pricing.calculation().discounts.bundle.monthlySavings) / 100).toFixed(2) }}
          </span>
        </div>

        <!-- Horizontal Rotating Wheel -->
        <div #addonWheel (scroll)="onWheelScroll()" class="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            *ngFor="let item of wheelAddons"
            (click)="!isIncludedInBase(item.feat.id) && pricing.toggleFeature(item.feat.id)"
            [class.cursor-pointer]="!isIncludedInBase(item.feat.id)"
            [class.opacity-60]="isIncludedInBase(item.feat.id)"
            class="snap-center shrink-0 w-[270px] sm:w-[300px] p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between group"
            [ngClass]="(isFeatureSelected(item.feat.id) || isAutoAdded(item.feat.id)) ? '!bg-white/[0.06] border-orange-500/80 ring-1 ring-orange-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/15'">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl">{{ item.icon }}</span>
                <div class="w-4 h-4 rounded border flex items-center justify-center transition-all"
                     [ngClass]="(isFeatureSelected(item.feat.id) || isAutoAdded(item.feat.id) || isIncludedInBase(item.feat.id)) ? 'bg-orange-600 border-orange-600 text-white' : 'border-white/20 bg-white/5'">
                  <span *ngIf="isFeatureSelected(item.feat.id) || isAutoAdded(item.feat.id) || isIncludedInBase(item.feat.id)" class="text-[10px] font-bold">✓</span>
                </div>
              </div>
              <h5 class="text-sm font-bold text-white mb-1.5">{{ item.shortName }}</h5>
              <p class="text-[11px] text-white/50 leading-relaxed mb-3">{{ item.blurb }}</p>
              <p *ngIf="item.autoNote && !isIncludedInBase(item.feat.id)" class="text-[10px] font-bold text-amber-400/90 mb-4">{{ item.autoNote }}</p>
            </div>

            <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span *ngIf="isIncludedInBase(item.feat.id)" class="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Included in Your Tier
              </span>
              <span *ngIf="!isIncludedInBase(item.feat.id) && isAutoAdded(item.feat.id)" class="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Added Automatically
              </span>
              <div *ngIf="!isIncludedInBase(item.feat.id)" class="flex flex-col text-right ml-auto">
                <span *ngIf="item.feat.setupPrice > 0" class="font-bold text-white">+\${{ (item.feat.setupPrice / 100).toLocaleString() }} setup</span>
                <span *ngIf="item.feat.monthlyPrice > 0" class="text-[10px] text-white/60">+\${{ (item.feat.monthlyPrice / 100).toLocaleString() }}/mo</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Wheel Dots -->
        <div class="flex items-center justify-center gap-1.5 mt-3">
          <span *ngFor="let item of wheelAddons; let i = index"
                class="h-1.5 rounded-full transition-all"
                [ngClass]="wheelIndex() === i ? 'w-5 bg-orange-500' : 'w-1.5 bg-white/20'">
          </span>
        </div>

        <p class="text-[11px] text-white/40 mt-4">Need something else, like a migration, multilingual pages, third-party integrations, or a support plan? Mention it in your project brief or on your kickoff call and we will scope it manually.</p>
      </div>

      <!-- Step 4: Transparent Pricing Breakdown & Contract Schedule -->
      <div class="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 mb-10">
        <h3 class="text-xl font-black text-white uppercase tracking-tight mb-6">
          Order Summary &amp; Investment Breakdown
        </h3>

        <!-- Dedicated Support Plan Duration & Inclusions Disclosure (Prompt Req 19 & 20) -->
        <div class="mb-8 p-5 rounded-2xl border transition-all"
             [ngClass]="pricing.calculation().support ? 'bg-orange-500/[0.04] border-orange-500/30' : 'bg-white/[0.02] border-white/5'">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <span class="text-base">{{ pricing.calculation().support ? '🛡️' : 'ℹ️' }}</span>
              <span class="text-xs font-black uppercase tracking-widest text-white">
                {{ pricing.calculation().support ? 'Optional Support Add-On: ' + pricing.calculation().support!.name : 'Baseline Included Support (No Additional Add-On)' }}
              </span>
            </div>
            <span *ngIf="pricing.calculation().support" class="text-[11px] font-mono text-orange-400 font-bold px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
              {{ pricing.calculation().support!.durationMonths }}-Month Commitment • Billed Monthly • Auto-Renew: NO
            </span>
          </div>

          <div *ngIf="pricing.calculation().support" class="grid sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4 p-4 rounded-xl bg-black/40 border border-white/10">
            <div>
              <span class="text-[10px] uppercase font-bold text-white/40 block">Locked Monthly Rate:</span>
              <span class="text-white font-bold text-sm">\${{ (pricing.calculation().support!.discountedMonthlyPrice / 100).toFixed(2) }}/mo</span>
              <span class="text-[10px] text-white/40 block line-through">Std: \${{ (pricing.calculation().support!.standardMonthlyPrice / 100).toFixed(2) }}/mo</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-white/40 block">Commitment Total:</span>
              <span class="text-emerald-400 font-bold text-sm">\${{ (pricing.calculation().support!.totalCommitmentDiscounted / 100).toFixed(2) }}</span>
              <span class="text-[10px] text-white/40 block line-through">Std: \${{ (pricing.calculation().support!.totalCommitmentStandard / 100).toFixed(2) }}</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-white/40 block">Coverage Start / Billing:</span>
              <span class="text-white font-bold block">Production Launch</span>
              <span class="text-[10px] text-white/50 block">Billing: {{ pricing.calculation().support!.startDisplay }}</span>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-white/40 block">Coverage Ends:</span>
              <span class="text-white font-bold block">{{ pricing.calculation().support!.endDisplay }}</span>
              <span class="text-[10px] text-amber-400/90 block">No Auto-Renewal</span>
            </div>
          </div>

          <div *ngIf="pricing.calculation().support" class="text-xs text-white/70 space-y-2">
            <div class="grid sm:grid-cols-2 gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px]">
              <div>
                <span class="text-white/40 block font-bold uppercase text-[9px]">Minor Requests Included:</span>
                <span class="text-white font-bold">{{ pricing.calculation().support!.monthlyRequestsIncluded }} requests / month</span>
                <span class="text-white/40 block text-[10px]">(Up to 1.5 engineering hrs each; expire monthly, no rollover)</span>
              </div>
              <div>
                <span class="text-white/40 block font-bold uppercase text-[9px]">Response SLA:</span>
                <span class="text-white font-bold">{{ pricing.calculation().support!.slaInitialResponse }}</span>
                <span class="text-white/40 block text-[10px]">(Initial response & ticket triage)</span>
              </div>
            </div>

            <div class="text-[10px] uppercase tracking-wider font-bold text-emerald-400 mt-2">Included Support Scope:</div>
            <ul class="list-disc ml-5 space-y-0.5 text-[11px] text-white/60">
              <li *ngFor="let inc of pricing.calculation().support!.inclusions">{{ inc }}</li>
            </ul>

            <div class="text-[10px] uppercase tracking-wider font-bold text-amber-400/80 mt-2">Explicitly Excluded:</div>
            <p class="text-[10px] text-white/40">Completely new features, major layout redesigns, and large architectural builds remain separate paid work.</p>

            <!-- Deterministic 24-Month Rule Disclosure -->
            <div *ngIf="pricing.calculation().support!.durationMonths === 24" class="text-[10px] text-cyan-300 bg-cyan-950/40 p-3 rounded-lg border border-cyan-800/50 mt-3 leading-relaxed">
              <strong class="text-cyan-200 block mb-1">Deterministic 24-Month Rule &amp; Year 2 Transition:</strong>
              The base website agreement is a separate 12-month agreement. If your website renews at Month 12, your 24-month support continues seamlessly in hosted mode through Month 24. If your website does NOT renew at Month 12, Phoenix hosting charges stop ($0 hosting), and your remaining 12 months of support automatically transition into <strong>Self-Hosted / Transition Support</strong> for Months 13–24 at your locked rate of \${{ (pricing.calculation().support!.discountedMonthlyPrice / 100).toFixed(2) }}/mo. Transition support covers source-code maintenance, security updates, cross-browser patches, deployment troubleshooting on your external host, and 6 minor updates/mo on your client infrastructure. Full uncompiled repository IP transfer remains subject to the voluntary 50% setup buyout.
            </div>

            <div class="text-[10px] text-white/40 italic mt-2">
              Why longer support is cheaper: 24-month support receives our lowest rate ($49/mo vs $89/mo standard) in consideration of the longer duration commitment. Early termination of support requires payment of 50% of the remaining monthly support fees as liquidated damages.
            </div>
          </div>

          <div *ngIf="!pricing.calculation().support" class="text-xs text-white/50">
            Includes base tier care: managed edge hosting, SSL lifecycle, daily backups, 99.9% uptime, and standard monitoring. No optional support duration add-on selected.
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-8 mb-8 pb-8 border-b border-white/10">
          <!-- Setup Fee Breakdown -->
          <div>
            <div class="text-xs font-black uppercase tracking-widest text-white/40 mb-3">One-Time Development Fee</div>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between text-white/70">
                <span>Base Platform ({{ pricing.calculation().tier.name }}):</span>
                <span>\${{ (pricing.calculation().normalPrices.baseSetup / 100).toLocaleString() }}</span>
              </div>
              <div *ngIf="pricing.calculation().scope.extraPages > 0" class="flex justify-between text-white/70">
                <span>Extra Pages ({{ pricing.calculation().scope.extraPages }} × $150):</span>
                <span>\${{ (pricing.calculation().scope.extraPagesSetupPrice / 100).toLocaleString() }}</span>
              </div>
              <div *ngIf="pricing.calculation().normalPrices.addonsSetup > 0" class="flex justify-between text-white/70">
                <span>Selected Add-On Setups:</span>
                <span>\${{ (pricing.calculation().normalPrices.addonsSetup / 100).toLocaleString() }}</span>
              </div>
              <div *ngIf="pricing.calculation().discounts.bundle.setupSavings > 0" class="flex justify-between text-emerald-400">
                <span>Bundle Discount ({{ pricing.calculation().discounts.bundle.percent }}% on Add-Ons):</span>
                <span>-\${{ (pricing.calculation().discounts.bundle.setupSavings / 100).toFixed(2) }}</span>
              </div>
              <div *ngIf="pricing.calculation().discounts.promotion.setupSavings > 0" class="flex justify-between text-orange-400 font-bold">
                <span>{{ pricing.calculation().discounts.promotion.displayName }} ({{ pricing.calculation().discounts.promotion.percent }}% Global):</span>
                <span>-\${{ (pricing.calculation().discounts.promotion.setupSavings / 100).toFixed(2) }}</span>
              </div>
              <div *ngIf="pricing.calculation().discounts.coupon.setupSavings > 0" class="flex justify-between text-emerald-400 font-bold">
                <span>Coupon Reduction ({{ pricing.calculation().discounts.coupon.code }}):</span>
                <span>-\${{ (pricing.calculation().discounts.coupon.setupSavings / 100).toFixed(2) }}</span>
              </div>
            </div>
            
            <div class="mt-4 pt-3 border-t border-white/10 flex justify-between items-baseline">
              <span class="text-sm font-black uppercase tracking-wider text-white">Amount Due Today:</span>
              <div class="text-right">
                <span class="text-xs text-white/30 line-through mr-2">\${{ (pricing.calculation().normalPrices.setupSubtotal / 100).toLocaleString() }}</span>
                <span class="text-2xl font-black" [style.color]="'var(--theme-primary, #ff4d00)'">
                  \${{ (pricing.calculation().finalPrices.dueToday / 100).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Monthly Fee Breakdown -->
          <div>
            <div class="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Recurring Managed Cloud Care</div>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between text-white/70">
                <span>Base Platform Monthly Care:</span>
                <span>\${{ (pricing.calculation().normalPrices.baseMonthly / 100).toLocaleString() }}/mo</span>
              </div>
              <div *ngIf="pricing.calculation().normalPrices.addonsMonthly > 0" class="flex justify-between text-white/70">
                <span>Add-On Maintenance:</span>
                <span>\${{ (pricing.calculation().normalPrices.addonsMonthly / 100).toLocaleString() }}/mo</span>
              </div>
              <div *ngIf="pricing.calculation().discounts.bundle.monthlySavings > 0" class="flex justify-between text-emerald-400">
                <span>Bundle Monthly Savings:</span>
                <span>-\${{ (pricing.calculation().discounts.bundle.monthlySavings / 100).toFixed(2) }}/mo</span>
              </div>
              <div *ngIf="pricing.calculation().discounts.promotion.monthlySavings > 0" class="flex justify-between text-orange-400 font-bold">
                <span>Global Promotional Discount ({{ pricing.calculation().discounts.promotion.percent }}%):</span>
                <span>-\${{ (pricing.calculation().discounts.promotion.monthlySavings / 100).toFixed(2) }}/mo</span>
              </div>
              <div *ngIf="pricing.calculation().discounts.coupon.monthlySavings > 0" class="flex justify-between text-emerald-400 font-bold">
                <span>Coupon Monthly Reduction ({{ pricing.calculation().discounts.coupon.code }}):</span>
                <span>-\${{ (pricing.calculation().discounts.coupon.monthlySavings / 100).toFixed(2) }}/mo</span>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-white/10 flex justify-between items-baseline">
              <span class="text-sm font-black uppercase tracking-wider text-white">Monthly Subscription:</span>
              <div class="text-right">
                <span class="text-xs text-white/30 line-through mr-2">\${{ (pricing.calculation().normalPrices.monthlySubtotal / 100).toLocaleString() }}/mo</span>
                <span class="text-2xl font-black text-white">
                  \${{ (pricing.calculation().finalPrices.monthlyRecurring / 100).toLocaleString() }}/mo
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule & Commitment Notice (Requirement 3 & 4) -->
        <div class="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div class="space-y-1">
            <div class="font-bold text-white flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>First Monthly Payment Due: {{ pricing.calculation().schedule.firstMonthlyBillingDisplay }} (30 Days After Purchase)</span>
            </div>
            <p class="text-white/50">
              You are charged ONLY the one-time build fee today. 12-month initial commitment applies. Lifetime price lock guarantee protects your rate against future increases.
            </p>
          </div>
          <div class="px-3 py-1 rounded bg-white/5 border border-white/10 text-white/60 font-mono text-[10px] whitespace-nowrap">
            Initial Term: 12 Mos
          </div>
        </div>

        <!-- Terms of Service & Legal Agreement Review (Mandatory Acceptance) -->
        <div class="mt-6 p-5 rounded-2xl bg-white/[0.02] border transition-all"
             [class.border-red-500]="termsError()"
             [class.border-white/10]="!termsError()">
          <div class="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="configurator-terms-checkbox"
              [checked]="acceptedTerms()"
              (change)="onTermsChange($event)"
              class="mt-1 w-4 h-4 rounded accent-orange-600 cursor-pointer">
            <div class="flex-1">
              <label for="configurator-terms-checkbox" class="text-xs text-white/80 cursor-pointer select-none leading-relaxed block">
                I have reviewed and agree to the 
                <a routerLink="/terms" target="_blank" class="text-orange-400 underline font-bold hover:text-orange-300">Terms of Service</a>, 
                <a routerLink="/privacy" target="_blank" class="text-orange-400 underline font-bold hover:text-orange-300">Privacy Policy</a>, and 
                <a routerLink="/refunds" target="_blank" class="text-orange-400 underline font-bold hover:text-orange-300">Refund Policy</a>. 
                I acknowledge the mandatory 12-month commitment, one-time setup fee, 30-day deferred first monthly billing, and Wisconsin statutory notice terms (Wis. Stat. § 134.49, 30-day non-renewal notice).
              </label>

              <!-- Expandable Terms Disclosure Toggle -->
              <div class="mt-3">
                <button 
                  type="button" 
                  (click)="showTermsDetails.set(!showTermsDetails())" 
                  class="text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <span>{{ showTermsDetails() ? '[-] Hide Agreement Summary' : '[+] Review Key Contract Disclosures' }}</span>
                </button>
              </div>

              <!-- Collapsible Key Terms Details -->
              <div *ngIf="showTermsDetails()" class="mt-4 p-4 rounded-xl bg-black/60 border border-white/5 space-y-2.5 text-[11px] text-white/60 font-mono animate-in fade-in duration-300">
                <div class="flex items-center justify-between pb-2 border-b border-white/5 text-white/80 font-bold">
                  <span>CONTRACT COMMITMENT &amp; DISCLOSURES</span>
                  <span class="text-emerald-400">WISCONSIN LAW GOVERNED</span>
                </div>
                <div class="grid sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span class="text-white/90 block font-bold mb-0.5">&bull; Initial Term:</span>
                    12 months of continuous managed cloud hosting, automated backups, and engineering maintenance.
                  </div>
                  <div>
                    <span class="text-white/90 block font-bold mb-0.5">&bull; Billing Schedule:</span>
                    Only setup fee due today. Recurring monthly payments begin automatically after the 30-day trial period.
                  </div>
                  <div>
                    <span class="text-white/90 block font-bold mb-0.5">&bull; Price Lock Guarantee:</span>
                    Your monthly rate for this specific website is permanently locked for the entire life of the project.
                  </div>
                  <div>
                    <span class="text-white/90 block font-bold mb-0.5">&bull; Wisconsin Renewal Notice:</span>
                    Written notice delivered 60 to 30 days before annual renewal under Wis. Stat. § 134.49.
                  </div>
                  <div>
                    <span class="text-white/90 block font-bold mb-0.5">&bull; Early Termination Fee:</span>
                    50% of the remaining monthly fees for the current 12-month commitment.
                  </div>
                  <div>
                    <span class="text-white/90 block font-bold mb-0.5">&bull; Intellectual Property:</span>
                    Carter Cole / Phoenix Websites AI retains core engineering assets; separate source code IP buyout is available.
                  </div>
                </div>
              </div>

              <!-- Error message if attempted without checking -->
              <p *ngIf="termsError()" class="text-red-400 text-xs font-bold mt-2 animate-bounce flex items-center gap-1.5">
                <span>&bull;</span> Please review and accept the agreement terms before continuing.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Promo / Discount Code Input -->
        <div class="flex flex-col gap-1.5 w-full sm:w-auto">
          <div *ngIf="!pricing.appliedCoupon()" class="flex items-center gap-2">
            <input 
              type="text"
              [(ngModel)]="discountCodeInput"
              (keydown.enter)="applyCoupon()"
              placeholder="Coupon Code"
              [disabled]="couponLoading()"
              class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white uppercase placeholder-white/30 focus:outline-none focus:border-orange-500 w-full sm:w-44">
            <button 
              type="button"
              (click)="applyCoupon()"
              [disabled]="couponLoading()"
              class="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-md">
              <span *ngIf="couponLoading()" class="animate-spin"><i class="fas fa-spinner"></i></span>
              <span>{{ couponLoading() ? 'Verifying...' : 'Apply' }}</span>
            </button>
          </div>

          <!-- Applied Coupon Tag -->
          <div *ngIf="pricing.appliedCoupon() as c" class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">
            <span class="font-mono font-bold">{{ c.code }}</span>
            <span class="text-[10px] text-emerald-300">({{ c.percentage ? c.percentage + '%' : '$' + (c.fixedCents/100) }} off)</span>
            <button type="button" (click)="removeCoupon()" class="text-white/40 hover:text-red-400 ml-1 text-sm font-bold cursor-pointer" title="Remove Coupon">&times;</button>
          </div>

          <!-- Feedback message -->
          <div *ngIf="couponMessage() as msg" 
               [class.text-red-400]="msg.isError" 
               [class.text-emerald-400]="!msg.isError" 
               class="text-[11px] font-bold tracking-wide">
            {{ msg.text }}
          </div>
        </div>

        <!-- Checkout Button -->
        <button 
          type="button"
          (click)="initiateCheckout()"
          [disabled]="loadingCheckout()"
          class="w-full sm:w-auto px-10 py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer shadow-lg"
          [style.backgroundColor]="'var(--theme-primary, #ff4d00)'"
          [style.boxShadow]="'0 0 35px var(--theme-glow, rgba(255, 77, 0, 0.35))'">
          <span *ngIf="!loadingCheckout()">Deploy Project &amp; Lock In Price &rarr;</span>
          <span *ngIf="loadingCheckout()">Initializing Secure Checkout...</span>
        </button>
      </div>
    </div>
  `
})
export class ProjectConfiguratorComponent {
  public pricing = inject(PricingService);
  private api = inject(ApiService);
  private router = inject(Router);

  @Output() requestAuthModal = new EventEmitter<void>();

  public discountCodeInput = '';
  public couponLoading = signal<boolean>(false);
  public couponMessage = signal<{ text: string; isError: boolean } | null>(null);
  public loadingCheckout = signal<boolean>(false);
  public acceptedTerms = signal<boolean>(false);
  public termsError = signal<boolean>(false);
  public showTermsDetails = signal<boolean>(false);

  // The Big Five: the only add-ons offered in the configurator wheel.
  // The full catalog still exists in PricingService for pricing/contracts,
  // but ordering stays simple: database or not, accounts, payments, store, AI.
  public wheelMeta: Record<string, { icon: string; shortName: string; blurb: string; autoNote?: string }> = {
    database: {
      icon: '🗄️',
      shortName: 'Database',
      blurb: 'Your site stores real records: orders, customers, content. Pick this if the site needs to remember anything.',
    },
    auth: {
      icon: '🔐',
      shortName: 'User Accounts & Sign-In',
      blurb: 'Customers register and log in with email or Google, with their own profiles and password reset.',
      autoNote: 'Adds the Database automatically.',
    },
    payments: {
      icon: '💳',
      shortName: 'Online Payments',
      blurb: 'Checkout on the payment service you already use: Stripe, PayPal, Venmo, Square, and more, each connected through its own API. No Stripe account needed.',
    },
    ecommerce: {
      icon: '🛒',
      shortName: 'Online Store',
      blurb: 'Product catalog, cart, inventory tracking, and discount codes so you can sell online.',
      autoNote: 'Adds Online Payments automatically.',
    },
    ai_assistant: {
      icon: '🤖',
      shortName: 'AI Assistant',
      blurb: 'A 24/7 chatbot trained on your business that answers visitors and captures leads while you sleep.',
    },
  };

  public wheelAddons: { feat: FeatureAddon; icon: string; shortName: string; blurb: string; autoNote?: string }[] =
    ['database', 'auth', 'payments', 'ecommerce', 'ai_assistant'].map(id => {
      const feat = this.pricing.featureAddons.find(f => f.id === id)!;
      return { feat, ...this.wheelMeta[id] };
    });

  @ViewChild('addonWheel') addonWheel?: ElementRef<HTMLDivElement>;
  public wheelIndex = signal<number>(0);

  public scrollWheel(dir: number) {
    const el = this.addonWheel?.nativeElement;
    if (!el) return;
    const card = el.querySelector(':scope > div') as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : 316;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  public onWheelScroll() {
    const el = this.addonWheel?.nativeElement;
    if (!el) return;
    const card = el.querySelector(':scope > div') as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : 316;
    const idx = Math.round(el.scrollLeft / step);
    this.wheelIndex.set(Math.max(0, Math.min(this.wheelAddons.length - 1, idx)));
  }

  public isIncludedInBase(id: string): boolean {
    return (this.pricing.calculation().tier.inherentFeatures || []).includes(id);
  }

  public isAutoAdded(id: string): boolean {
    if (this.isFeatureSelected(id) || this.isIncludedInBase(id)) return false;
    return this.pricing.calculation().addons.some(a => a.id === id);
  }

  public onTermsChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.acceptedTerms.set(input.checked);
    if (input.checked) {
      this.termsError.set(false);
    }
  }

  public isFeatureSelected(id: string): boolean {
    return this.pricing.selectedFeatures().includes(id);
  }

  public getDiscountedAmount(cents: number): number {
    const promoPercent = this.pricing.calculation().discounts.promotion.percent || 20;
    return Math.round(cents * (1 - (promoPercent / 100)));
  }

  public applyCoupon() {
    const raw = this.discountCodeInput.trim();
    if (!raw) {
      this.couponMessage.set({ text: 'Please enter a coupon code.', isError: true });
      return;
    }
    const cleanCode = raw.toUpperCase();
    this.couponLoading.set(true);
    this.couponMessage.set(null);

    const email = this.api.currentUser()?.email;
    this.api.post<any>('stripe/validate-discount', { code: cleanCode, email }).subscribe({
      next: (res) => {
        this.couponLoading.set(false);
        if (res.valid) {
          this.pricing.applyValidatedCoupon({
            code: cleanCode,
            type: res.type || 'percentage',
            percentage: res.percentage || 0,
            fixedCents: res.fixedCents || 0,
            appliesTo: res.appliesTo || 'both',
            capSetupCents: res.capSetupCents || 0,
            capMonthlyCents: res.capMonthlyCents || 0,
            bypassFloors: res.bypassFloors === true
          });
          const savingsDesc = res.type === 'percentage_capped'
            ? `${res.percentage}% off up to $${((res.capSetupCents || 0) / 100).toFixed(0)}`
            : res.percentage ? `${res.percentage}% off` : `$${(res.fixedCents / 100).toFixed(0)} off`;
          this.couponMessage.set({ text: `Coupon "${cleanCode}" applied: ${savingsDesc}!`, isError: false });
        } else {
          this.couponMessage.set({ text: res.error || 'This coupon code is not valid.', isError: true });
        }
      },
      error: (err) => {
        this.couponLoading.set(false);
        this.couponMessage.set({ text: err.error?.error || 'Invalid or expired coupon code.', isError: true });
      }
    });
  }

  public removeCoupon() {
    this.pricing.applyValidatedCoupon(null);
    this.discountCodeInput = '';
    this.couponMessage.set(null);
  }

  public initiateCheckout() {
    if (!this.acceptedTerms()) {
      this.termsError.set(true);
      return;
    }
    this.termsError.set(false);

    const calc = this.pricing.calculation();
    const configPayload = {
      tier: calc.tier.id,
      totalPages: calc.scope.totalPages,
      features: calc.addons.map(a => a.id),
      discountCode: this.pricing.discountCode()
    };

    const user = this.api.currentUser();

    // 1. If not authenticated, save pending intent and trigger account creation / login
    if (!user) {
      const intent: PendingIntent = {
        action: 'buy-now',
        type: 'configuration',
        configuration: configPayload,
        acceptedContract: true
      };
      this.api.requestAuth(intent, '/services');
      this.requestAuthModal.emit();
      return;
    }

    // 2. If authenticated but profile not finalized, request onboarding
    if (!user.hasFinalizedProfile) {
      const intent: PendingIntent = {
        action: 'buy-now',
        type: 'configuration',
        configuration: configPayload,
        acceptedContract: true
      };
      this.api.savePendingIntent(intent);
      this.requestAuthModal.emit();
      return;
    }

    // 3. Authenticated and finalized: proceed directly to Stripe
    this.loadingCheckout.set(true);
    this.api.post<any>('stripe/checkout', {
      checkoutMode: 'configuration',
      configuration: configPayload,
      discountCode: configPayload.discountCode,
      acceptedContract: true,
      contractTimestamp: new Date().toISOString()
    }).subscribe({
      next: (res: any) => {
        this.loadingCheckout.set(false);
        if (res && res.url) {
          window.location.href = res.url;
        }
      },
      error: (err: any) => {
        this.loadingCheckout.set(false);
        alert(err?.error?.error || 'Could not initiate checkout session. Please try again.');
      }
    });
  }
}
