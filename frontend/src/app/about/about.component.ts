import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective, RouterLink],
  template: `
    <section class="min-h-screen pt-24 sm:pt-40 pb-16 sm:pb-32 px-4 sm:px-16 overflow-hidden">
      <div class="max-w-[1400px] mx-auto">
        <header class="mb-16 sm:mb-32 max-w-4xl">
          <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div class="w-8 sm:w-12 h-[1px] bg-[#FF4D00] flex-shrink-0"></div>
            <span class="text-[#FF4D00] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[10px] sm:text-xs">Our Approach</span>
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
                <div class="text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-[#FF4D00]">Typical Delivery</div>
              </div>
              <div>
                <div class="text-3xl sm:text-4xl font-black text-white leading-none mb-2">1</div>
                <div class="text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-[#FF4D00]">Engineer On Your Project</div>
              </div>
            </div>
          </div>
          
          <div class="space-y-8 sm:space-y-12">
            <div class="glass-card !p-5 sm:!p-12 border-white/5">
              <h3 class="fluid-h3 text-white mb-6 sm:mb-8 uppercase tracking-tighter">Our Promise</h3>
              <ul class="space-y-5 sm:space-y-8 text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-white/40">
                <li class="flex items-center gap-4 sm:gap-6"><div class="w-6 sm:w-8 h-[1px] bg-[#FF4D00] flex-shrink-0"></div> Fast loading for every visitor</li>
                <li class="flex items-center gap-4 sm:gap-6"><div class="w-6 sm:w-8 h-[1px] bg-[#FF4D00] flex-shrink-0"></div> Smart tools that save you time</li>
                <li class="flex items-center gap-4 sm:gap-6"><div class="w-6 sm:w-8 h-[1px] bg-[#FF4D00] flex-shrink-0"></div> Code you can own outright</li>
              </ul>
            </div>
            <div class="aspect-video bg-white/[0.02] border border-white/5 flex items-center justify-center group relative overflow-hidden">
               <div class="absolute inset-0 bg-gradient-to-br from-[#FF4D00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
               <div class="text-center space-y-3 px-6">
                 <p class="text-sm font-bold text-white/70">Custom code. No templates.</p>
                 <p class="text-sm font-bold text-white/70">Checked by a human before it ships.</p>
                 <p class="text-sm font-bold text-white/70">Yours to own.</p>
               </div>
            </div>
          </div>
        </div>

        <div class="border-t border-white/5 mt-16 sm:mt-32 pt-12 sm:pt-24">
          <span class="text-[#FF4D00] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[10px] block mb-4">How a Project Runs</span>
          <h2 class="fluid-h2 mb-10 sm:mb-14">WHAT WORKING<br><span class="text-white/20">WITH ME LOOKS LIKE</span></h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="glass-card !bg-transparent">
              <span class="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4D00] block mb-3">Step 1</span>
              <h3 class="text-lg font-bold text-white mb-2">The Free Audit</h3>
              <p class="text-white/40 text-sm leading-relaxed">We start with your current site, or your plans if you do not have one. You get three specific fixes and a straight recommendation on scope.</p>
            </div>
            <div class="glass-card !bg-transparent">
              <span class="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4D00] block mb-3">Step 2</span>
              <h3 class="text-lg font-bold text-white mb-2">The Build</h3>
              <p class="text-white/40 text-sm leading-relaxed">I design and build your site, asking for what I need from you about a day at a time, never in a last-minute pile. Most packages are built in 2 to 5 weeks.</p>
            </div>
            <div class="glass-card !bg-transparent">
              <span class="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4D00] block mb-3">Step 3</span>
              <h3 class="text-lg font-bold text-white mb-2">Your Review</h3>
              <p class="text-white/40 text-sm leading-relaxed">You see the site before it launches and send one consolidated round of notes. I would rather take the extra days and hand you something finished than rush a reveal.</p>
            </div>
            <div class="glass-card !bg-transparent">
              <span class="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4D00] block mb-3">Step 4</span>
              <h3 class="text-lg font-bold text-white mb-2">Launch and Care</h3>
              <p class="text-white/40 text-sm leading-relaxed">The site goes live on managed hosting. Your monthly plan covers hosting, backups, monitoring, and your edit hours, and you can add features later from your dashboard.</p>
            </div>
          </div>
        </div>

        <div class="border-t border-white/5 mt-16 sm:mt-24 pt-12 sm:pt-24 grid md:grid-cols-2 gap-4">
          <div class="glass-card !bg-transparent">
            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4D00] block mb-4">What AI Does Here</span>
            <ul class="space-y-2.5 text-sm text-white/50">
              <li>Scaffolding, boilerplate, and repetitive code</li>
              <li>First-pass layout and styling variations</li>
              <li>Automated testing passes and consistency checks</li>
            </ul>
          </div>
          <div class="glass-card !bg-transparent">
            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4D00] block mb-4">What I Do Myself</span>
            <ul class="space-y-2.5 text-sm text-white/50">
              <li>The design, and whether it sounds like your business</li>
              <li>Architecture, security, and code review</li>
              <li>Final testing of every page, form, and checkout</li>
              <li>Answering your emails. You are talking to the builder.</li>
            </ul>
          </div>
        </div>

        <div class="border-t border-white/5 mt-16 sm:mt-24 pt-12 sm:pt-24 flex flex-col lg:flex-row lg:items-center gap-8 justify-between">
          <div>
            <h2 class="fluid-h3 text-white uppercase tracking-tighter mb-3">Talk to the Person Who Builds It</h2>
            <p class="text-white/50 text-sm leading-relaxed max-w-xl">Phoenix Websites AI is based in La Crosse, Wisconsin and works with businesses anywhere. Email <a href="mailto:hello@phoenixwebsites.ai" class="text-orange-400 underline">hello@phoenixwebsites.ai</a> or call <a href="tel:+17603347874" class="text-orange-400 underline">+1 (760) 334-7874</a>.</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 shrink-0">
            <a routerLink="/" fragment="audit" class="premium-btn text-center">Get a Free Website Audit</a>
            <a routerLink="/services" class="text-xs font-black uppercase tracking-[0.3em] py-6 px-6 hover:text-orange-600 transition-all border-b border-white/10 text-center">See Packages and Prices</a>
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

