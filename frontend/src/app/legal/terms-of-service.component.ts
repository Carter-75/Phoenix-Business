import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  template: `
    <section class="min-h-screen pt-48 pb-24 px-6 bg-slate-950 relative overflow-hidden">
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/5 top-[-10%] right-[-10%]"></div>
      
      <div class="max-w-4xl mx-auto relative z-10">
        <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-12" appScrollReveal>Terms of <span class="text-orange-500">Service</span></h1>
        
        <div class="space-y-12 text-slate-400 font-medium leading-relaxed" appScrollReveal>
          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">1. The Agreement</h2>
            <p>By engaging with Phoenix ("we", "us", "our"), you agree to enter into a binding service agreement.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">2. Contractual Commitment</h2>
            <ul class="list-disc ml-6 space-y-2">
              <li><strong>General Accounts:</strong> Users creating an account without a service selection are bound by general usage and privacy terms.</li>
              <li><strong>One-Time Projects (Tier 1):</strong> Engagement terminates upon delivery of final assets and full payment. No long-term commitment required.</li>
              <li><strong>Subscription Services (Tiers 2 & 3):</strong> All subscription-based tiers require a <strong>mandatory minimum commitment of twelve (12) consecutive months.</strong> This ensures infrastructure stability and dedicated resource allocation.</li>
            </ul>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">3. Automatic Renewal</h2>
            <p>Subscription contracts automatically renew for subsequent 12-month periods. Notice of non-renewal must be provided via the client portal at least 30 days prior to the current contract's expiration date.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">4. Early Termination & Liquidated Damages</h2>
            <p>Early termination of a 12-month commitment results in the immediate accrual of "Liquidated Damages" equal to 50% of the remaining total contract value. This is a pre-estimate of unrecoverable setup costs and lost opportunities.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">5. Governing Law</h2>
            <p>This agreement is governed by the laws of the State of Wisconsin.</p>
          </div>
        </div>

        <footer class="mt-24 pt-12 border-t border-white/5 flex flex-col gap-12">
          <div class="flex flex-col sm:flex-row justify-between gap-8 items-start sm:items-center">
            <div>
              <p class="text-white/30 text-sm font-medium">Questions regarding this policy?</p>
              <p class="text-white font-bold mt-1 tracking-widest uppercase">legal&#64;phoenix.com</p>
            </div>
            <a routerLink="/home" class="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.4em] text-white/50 hover:text-white transition-all">
              Return Home
              <div class="w-8 h-[1px] bg-white/20 group-hover:w-12 group-hover:bg-white transition-all duration-500"></div>
            </a>
          </div>
          <div class="text-white/30 text-[10px] font-black uppercase tracking-widest">
            Last Updated: May 1, 2026 • Phoenix Digital Infrastructure
          </div>
        </footer>
      </div>
    </section>
  `
})
export class TermsComponent {}
