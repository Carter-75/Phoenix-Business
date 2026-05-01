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
    <div class="min-h-screen bg-[#050505] text-white/90 pt-32 pb-20 px-8 sm:px-16 overflow-hidden">
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
            <div class="space-y-4 text-white/60 leading-relaxed font-light">
              <p>We collect information that you provide directly to us, such as when you request a free guide, inquire about services, or create an account. This may include:</p>
              <ul class="list-none space-y-2 pl-4 border-l border-white/10">
                <li>• Name and contact information (email address)</li>
                <li>• Business details (business name, project requirements)</li>
                <li>• Payment information (processed securely via Stripe)</li>
                <li>• Communications you send to us</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-black uppercase tracking-widest mb-6 text-white">2. How We Use Your Data</h2>
            <div class="space-y-4 text-white/60 leading-relaxed font-light">
              <p>Phoenix uses the collected data for various purposes:</p>
              <ul class="list-none space-y-2 pl-4 border-l border-white/10">
                <li>• To provide and maintain our services</li>
                <li>• To send requested resources (e.g., AI Implementation Guides)</li>
                <li>• To process payments and subscriptions</li>
                <li>• To communicate about project updates or technical roadmaps</li>
                <li>• To monitor service usage and performance</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-black uppercase tracking-widest mb-6 text-white">3. Data Security</h2>
            <p class="text-white/60 leading-relaxed font-light">
              We implement industry-standard security measures to protect your personal data. However, no method of transmission over the Internet or electronic storage is 100% secure. We utilize encrypted connections (SSL) and secure third-party processors like Stripe and MongoDB Atlas to ensure maximum protection.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-black uppercase tracking-widest mb-6 text-white">4. Your Rights</h2>
            <p class="text-white/60 leading-relaxed font-light">
              You have the right to access, correct, or delete your personal information at any time. You can unsubscribe from our automated outreach via the link in our emails or by contacting us directly.
            </p>
          </section>

          <footer class="pt-20 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-8 items-start sm:items-center">
            <div>
              <p class="text-white/30 text-sm font-medium">Questions regarding this policy?</p>
              <p class="text-white font-bold mt-1 tracking-widest uppercase">legal&#64;phoenix.com</p>
            </div>
            <a routerLink="/home" class="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.4em] text-white/50 hover:text-white transition-all">
              Return Home
              <div class="w-8 h-[1px] bg-white/20 group-hover:w-12 group-hover:bg-[#D4AF37] transition-all duration-500"></div>
            </a>
          </footer>
        </main>
      </div>
    </div>
  `
})
export class PrivacyPolicyComponent {}
