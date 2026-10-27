import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../services/seo.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  template: `
    <section class="min-h-screen pt-24 sm:pt-40 pb-16 sm:pb-32 px-4 sm:px-16 overflow-hidden">
      <div class="max-w-[1400px] mx-auto">
        <header class="mb-16 sm:mb-32 max-w-4xl">
          <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div class="w-8 sm:w-12 h-[1px] bg-[#D4AF37] flex-shrink-0"></div>
            <span class="text-[#D4AF37] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[10px] sm:text-xs">Our Approach</span>
          </div>
          <h1 class="fluid-h1 font-black mb-8 sm:mb-12">
            OUR<br>
            <span class="text-white/20">APPROACH</span>
          </h1>
          <p class="fluid-p">
            I am Carter Moyer, the founder of Phoenix Websites AI, and the engineer who builds every project. I started Phoenix after watching small businesses pay agency prices for slow websites built on templates their owners could not control.
          </p>
        </header>

        <div class="grid lg:grid-cols-2 gap-12 sm:gap-24 lg:gap-32 items-start border-t border-white/5 pt-12 sm:pt-32">
          <div class="space-y-8 sm:space-y-12 fluid-p text-white/60">
            <p>
              The work is <strong>custom websites and web applications</strong>. AI tools handle the repetitive parts of building them, which keeps delivery at 2 to 5 weeks. I review the code, the security, and the finished site myself before anything launches.
            </p>
            <p>
              You deal with me directly. No account managers, no handoffs, no ticket queue. If something breaks, you email the person who built it.
            </p>
            <div class="flex flex-col sm:flex-row gap-6 sm:gap-12 mt-8 sm:mt-20 pt-8 sm:pt-20 border-t border-white/5">
              <div>
                <div class="text-3xl sm:text-4xl font-black text-white leading-none mb-2">2-5 wks</div>
                <div class="text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-[#D4AF37]">Typical Delivery</div>
              </div>
              <div>
                <div class="text-3xl sm:text-4xl font-black text-white leading-none mb-2">1</div>
                <div class="text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-[#D4AF37]">Engineer On Your Project</div>
              </div>
            </div>
          </div>
          
          <div class="space-y-8 sm:space-y-12">
            <div class="glass-card !p-5 sm:!p-12 border-white/5">
              <h3 class="fluid-h3 text-white mb-6 sm:mb-8 uppercase tracking-tighter">Our Promise</h3>
              <ul class="space-y-5 sm:space-y-8 text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-white/40">
                <li class="flex items-center gap-4 sm:gap-6"><div class="w-6 sm:w-8 h-[1px] bg-[#D4AF37] flex-shrink-0"></div> Fast loading for every visitor</li>
                <li class="flex items-center gap-4 sm:gap-6"><div class="w-6 sm:w-8 h-[1px] bg-[#D4AF37] flex-shrink-0"></div> Smart tools that save you time</li>
                <li class="flex items-center gap-4 sm:gap-6"><div class="w-6 sm:w-8 h-[1px] bg-[#D4AF37] flex-shrink-0"></div> Code you can own outright</li>
              </ul>
            </div>
            <div class="aspect-video bg-white/[0.02] border border-white/5 flex items-center justify-center group relative overflow-hidden">
               <div class="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
               <div class="text-center space-y-3 px-6">
                 <p class="text-sm font-bold text-white/70">Custom code. No templates.</p>
                 <p class="text-sm font-bold text-white/70">Checked by a human before it ships.</p>
                 <p class="text-sm font-bold text-white/70">Yours to own.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class AboutComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.updateMeta(
      'Philosophy & Foundations | Phoenix',
      'How Phoenix Websites AI works: custom websites and web apps built by Carter Moyer, with AI assistance and human review, delivered in 2 to 5 weeks.'
    );
  }
}

