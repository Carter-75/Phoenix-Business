import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../services/seo.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  template: `
    <section class="min-h-screen pt-40 pb-32 px-8 sm:px-16 overflow-hidden">
      <div class="max-w-[1400px] mx-auto">
        <header class="mb-32 max-w-4xl" appScrollReveal>
          <div class="flex items-center gap-4 mb-8">
            <div class="w-12 h-[1px] bg-[#D4AF37]"></div>
            <span class="text-[#D4AF37] font-black uppercase tracking-[0.4em] text-xs">Our Approach</span>
          </div>
          <h1 class="fluid-h1 font-black mb-12">
            OUR<br>
            <span class="text-white/20">APPROACH</span>
          </h1>
          <p class="fluid-p">
            We started Phoenix because we saw how many websites were breaking or slow. We believe your online home should be as strong and reliable as a real building.
          </p>
        </header>

        <div class="grid lg:grid-cols-2 gap-32 items-start border-t border-white/5 pt-32">
          <div class="space-y-12 fluid-p text-white/60" appScrollReveal>
            <p>
              We focus on **speed** and **ease of use**. We don't just build sites; we create tools that help your business grow automatically.
            </p>
            <p>
              Every bit of work we do is meant to last. From custom-built websites to smart automation, we make sure your tech always works perfectly.
            </p>
            <div class="flex gap-12 mt-20 pt-20 border-t border-white/5">
              <div>
                <div class="text-4xl font-black text-white leading-none mb-2">99.9%</div>
                <div class="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">System Reliability</div>
              </div>
              <div>
                <div class="text-4xl font-black text-white leading-none mb-2">10ms</div>
                <div class="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Edge Response</div>
              </div>
            </div>
          </div>
          
          <div class="space-y-12" appScrollReveal [delay]="0.2">
            <div class="glass-card !p-12 border-white/5">
              <h3 class="fluid-h3 text-white mb-8 uppercase tracking-tighter">Our Promise</h3>
              <ul class="space-y-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                <li class="flex items-center gap-6"><div class="w-8 h-[1px] bg-[#D4AF37]"></div> Fast loading for every visitor</li>
                <li class="flex items-center gap-6"><div class="w-8 h-[1px] bg-[#D4AF37]"></div> Smart tools that save you time</li>
                <li class="flex items-center gap-6"><div class="w-8 h-[1px] bg-[#D4AF37]"></div> 100% reliability you can trust</li>
              </ul>
            </div>
            <div class="aspect-video bg-white/[0.01] border border-white/5 flex items-center justify-center group relative overflow-hidden">
               <div class="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
               <span class="fluid-tiny font-black uppercase tracking-[1em] text-white/10 group-hover:text-[#D4AF37]/20 transition-colors">MMXXIV Protocol</span>
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
      'Philosophy & Foundations — Phoenix',
      'The core architectural philosophy of Phoenix: Zero-Latency Engineering and AI-First infrastructure.'
    );
  }
}

