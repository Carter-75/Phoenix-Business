import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-950 text-white/90 pt-32 pb-20 px-8 sm:px-16 overflow-hidden">
      <div class="max-w-[1000px] mx-auto relative">
        <!-- Background Glow -->
        <div class="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#D4AF37]/5 blur-[150px] rounded-full pointer-events-none"></div>
        
        <header class="mb-20" appScrollReveal>
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-[1px] bg-[#D4AF37]"></div>
            <span class="text-[#D4AF37] font-black uppercase tracking-[0.4em] text-xs">Legal Infrastructure</span>
          </div>
          <h1 class="fluid-huge font-black uppercase tracking-tighter leading-[0.9]">
            Privacy<br><span class="text-white/20">Policy</span>
          </h1>
          <p class="mt-8 text-white/50 font-medium tracking-wide">Last Updated: May 1, 2026</p>
        </header>

        <main class="space-y-16 relative z-10" appScrollReveal>
          <section>
            <h2 class="text-2xl font-black uppercase tracking-widest mb-6 text-white">1. Information We Collect</h2>
            <p class="text-white/60 leading-relaxed font-light">
              We collect Name, email, business details, and payment information (processed securely via Stripe).
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-black uppercase tracking-widest mb-6 text-white">2. How We Use Your Data</h2>
            <p class="text-white/60 leading-relaxed font-light">
              Data is used to provide services, send requested resources, and process payments.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-black uppercase tracking-widest mb-6 text-white">3. Data Security</h2>
            <p class="text-white/60 leading-relaxed font-light">
              We utilize encrypted connections (SSL) and secure processors like Stripe and MongoDB Atlas.
            </p>
          </section>

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
        </main>
      </div>
    </div>
  `
})
export class PrivacyPolicyComponent {}
