import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingService, FeatureAddon } from '../../../services/pricing.service';
import { ApiService } from '../../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

      <!-- Step 3: Modular Add-On Catalog -->
      <div class="mb-12">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <label class="text-xs font-black uppercase tracking-widest block mb-1" [style.color]="'var(--theme-primary, #ff4d00)'">
              03 / Modular Feature Add-Ons
            </label>
            <p class="text-xs text-white/50">Select optional capabilities. Bundle 2+ upgrades to unlock extra volume savings!</p>
          </div>
          
          <!-- Category Filter Pills -->
          <div class="flex flex-wrap gap-2">
            <button 
              type="button" 
              *ngFor="let cat of categories"
              (click)="selectedCategory.set(cat.id)"
              class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              [class.bg-white]="selectedCategory() === cat.id"
              [class.text-black]="selectedCategory() === cat.id"
              [class.bg-white/5]="selectedCategory() !== cat.id"
              [class.text-white/60]="selectedCategory() !== cat.id">
              {{ cat.label }}
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

        <!-- Add-on Grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            *ngFor="let feat of filteredAddons()"
            (click)="!feat.includedInBase && pricing.toggleFeature(feat.id)"
            [class.border-orange-500]="isFeatureSelected(feat.id)"
            [class.cursor-pointer]="!feat.includedInBase"
            [class.opacity-60]="feat.includedInBase"
            class="p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between group"
            [ngClass]="isFeatureSelected(feat.id) ? '!bg-white/[0.06] border-orange-500/80 ring-1 ring-orange-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/15'">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                      [ngClass]="feat.billingType === 'ONE_TIME' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : feat.billingType === 'MONTHLY' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'">
                  {{ feat.billingType }}
                </span>
                <div class="w-4 h-4 rounded border flex items-center justify-center transition-all"
                     [ngClass]="isFeatureSelected(feat.id) || feat.includedInBase ? 'bg-orange-600 border-orange-600 text-white' : 'border-white/20 bg-white/5'">
                  <span *ngIf="isFeatureSelected(feat.id) || feat.includedInBase" class="text-[10px] font-bold">✓</span>
                </div>
              </div>
              <h5 class="text-sm font-bold text-white mb-1.5">{{ feat.name }}</h5>
              <p class="text-[11px] text-white/50 leading-relaxed mb-4">{{ feat.description }}</p>
            </div>
            
            <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span *ngIf="feat.includedInBase" class="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Included in Base
              </span>
              <div *ngIf="!feat.includedInBase" class="flex flex-col text-right w-full">
                <span *ngIf="feat.setupPrice > 0" class="font-bold text-white">+\${{ (feat.setupPrice / 100).toLocaleString() }} setup</span>
                <span *ngIf="feat.monthlyPrice > 0" class="text-[10px] text-white/60">+\${{ (feat.monthlyPrice / 100).toLocaleString() }}/mo</span>
              </div>
            </div>
          </div>
        </div>
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
      </div>

      <!-- Action Footer -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Promo / Discount Code Input -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="text"
            [(ngModel)]="discountCodeInput"
            placeholder="Coupon Code"
            class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white uppercase placeholder-white/30 focus:outline-none focus:border-orange-500 w-full sm:w-44">
          <button 
            type="button"
            (click)="applyCoupon()"
            class="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap">
            Apply
          </button>
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

  public selectedCategory = signal<string>('all');
  public discountCodeInput = '';
  public loadingCheckout = signal<boolean>(false);

  public categories = [
    { id: 'all', label: 'All Upgrades' },
    { id: 'development', label: 'Development' },
    { id: 'ai', label: 'AI & Bot' },
    { id: 'design', label: 'Design' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'operations', label: 'Support & Ops' }
  ];

  public filteredAddons() {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.pricing.featureAddons;
    return this.pricing.featureAddons.filter(f => f.category === cat);
  }

  public isFeatureSelected(id: string): boolean {
    return this.pricing.selectedFeatures().includes(id);
  }

  public getDiscountedAmount(cents: number): number {
    const promoPercent = this.pricing.calculation().discounts.promotion.percent || 20;
    return Math.round(cents * (1 - (promoPercent / 100)));
  }

  public applyCoupon() {
    if (this.discountCodeInput.trim()) {
      this.pricing.setDiscountCode(this.discountCodeInput);
    }
  }

  public initiateCheckout() {
    this.loadingCheckout.set(true);
    const calc = this.pricing.calculation();

    this.api.post('stripe/checkout', {
      checkoutMode: 'configuration',
      configuration: {
        tier: calc.tier.id,
        totalPages: calc.scope.totalPages,
        features: calc.addons.map(a => a.id),
        discountCode: this.pricing.discountCode()
      }
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
