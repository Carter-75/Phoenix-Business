import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../services/seo.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  template: `
    <section class="min-h-screen bg-[#050505] selection:bg-gold-500/30">
      <div class="section-spacing">
        <div class="max-w-[1400px] mx-auto">
          <div class="mb-32">
            <span class="fluid-tiny font-black uppercase tracking-[0.8em] text-[#D4AF37]">Foundations</span>
            <h1 class="fluid-h1 font-black text-white mt-8 uppercase tracking-[-0.05em]">Our <span class="gold-text">Philosophy</span></h1>
          </div>

          <div class="grid lg:grid-cols-2 gap-32 items-start border-t border-white/[0.05] pt-32">
            <div class="space-y-12 fluid-p text-white/60">
              <p>
                Phoenix Business was established as a direct response to the fragility of modern web infrastructure. We believe that digital platforms should be as structural and resilient as physical architecture.
              </p>
              <p>
                Our approach is rooted in **Zero-Latency Engineering** and **AI-First Integration**. We don't just build websites; we engineer autonomous digital ecosystems that scale with the speed of your business.
              </p>
              <p>
                Every line of code we deploy is a commitment to stability. From high-performance boutique builds to enterprise-scale automation suites, we ensure your infrastructure never burns out.
              </p>
            </div>
            
            <div class="grid grid-cols-1 gap-12">
              <div class="premium-card !p-12 border-white/[0.05]">
                <h3 class="fluid-h3 text-white mb-6 uppercase">The Phoenix Standard</h3>
                <ul class="space-y-6 text-sm font-black uppercase tracking-widest text-white/40">
                  <li class="flex items-center gap-4"><div class="w-2 h-[1px] bg-[#D4AF37]"></div> Sub-Second Edge Delivery</li>
                  <li class="flex items-center gap-4"><div class="w-2 h-[1px] bg-[#D4AF37]"></div> Autonomous LLM Pipelines</li>
                  <li class="flex items-center gap-4"><div class="w-2 h-[1px] bg-[#D4AF37]"></div> 100% Uptime Architecture</li>
                </ul>
              </div>
              <div class="aspect-video bg-white/[0.01] border border-white/[0.03] flex items-center justify-center">
                 <span class="fluid-tiny font-black uppercase tracking-[1em] text-white/10">MMXXIV Protocol</span>
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
      'Philosophy & Foundations — Phoenix Business',
      'The core architectural philosophy of Phoenix Business: Zero-Latency Engineering and AI-First infrastructure.'
    );
  }
}
