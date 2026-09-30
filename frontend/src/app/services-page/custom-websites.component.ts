import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-custom-websites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="min-h-screen bg-[#020205] text-white pt-40 pb-32 px-6 sm:px-12 lg:px-24">
      <div class="max-w-[1200px] mx-auto">
        <!-- Breadcrumb -->
        <nav aria-label="Breadcrumb" class="mb-8 text-xs font-black uppercase tracking-[0.3em] text-white/40">
          <ol class="flex items-center gap-3">
            <li><a routerLink="/" class="hover:text-orange-500 transition-colors">Home</a></li>
            <li>/</li>
            <li><a routerLink="/services" class="hover:text-orange-500 transition-colors">Services</a></li>
            <li>/</li>
            <li class="text-orange-500" aria-current="page">Custom Websites</li>
          </ol>
        </nav>

        <!-- Hero Header -->
        <header class="mb-20 max-w-4xl">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-[1px] bg-orange-600"></div>
            <span class="text-orange-600 font-black uppercase tracking-[0.4em] text-xs">Custom Engineering</span>
          </div>
          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight mb-8">
            AI-Assisted Custom<br>
            <span class="text-white/30">Website Development</span>
          </h1>
          <p class="text-lg sm:text-2xl text-white/80 font-normal leading-relaxed mb-6">
            You hire Phoenix Websites AI to handle your entire web project from architecture to launch. We build bespoke, lightning-fast web applications—not bloated DIY website builder templates.
          </p>
          <div class="flex flex-wrap gap-4 sm:gap-6 pt-4">
            <a routerLink="/" fragment="audit" class="px-8 py-5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg shadow-orange-600/20">
              Request Free Website Audit
            </a>
            <a routerLink="/services" class="px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all">
              View Plans &amp; Pricing
            </a>
          </div>
        </header>

        <!-- Distinct from DIY Builders -->
        <section class="mb-24 p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-orange-500/20 relative overflow-hidden">
          <div class="max-w-3xl">
            <span class="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Engineered For You</span>
            <h2 class="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-6">Why Hire Us Instead of Using a DIY Builder?</h2>
            <div class="grid sm:grid-cols-2 gap-8 text-sm text-white/70 leading-relaxed">
              <div class="space-y-3">
                <h3 class="text-white font-bold text-base flex items-center gap-2">
                  <span class="text-orange-500">✓</span> Full-Service Managed Delivery
                </h3>
                <p>DIY builders require you to spend dozens of hours wrestling with generic templates, fragile plugins, and design tools. With Phoenix Websites AI, you hire Carter to plan, build, test, and maintain the site for you.</p>
              </div>
              <div class="space-y-3">
                <h3 class="text-white font-bold text-base flex items-center gap-2">
                  <span class="text-orange-500">✓</span> AI-Accelerated Engineering
                </h3>
                <p>We leverage modern AI tools to accelerate repetitive code generation and component scaffolding, passing rapid turnaround times to you while human engineering ensures clean architecture, security, and peak Core Web Vitals.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Who It Helps & Capabilities -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Target Fit</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">Who This Service Helps</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">01</div>
              <h3 class="text-xl font-bold">Local &amp; Service Businesses</h3>
              <p class="text-sm text-white/60 leading-relaxed">Contractors, trades, professional consultants, and clinics that need reliable inbound lead generation and a polished, trustworthy digital presence.</p>
            </div>
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">02</div>
              <h3 class="text-xl font-bold">Boutique Brands &amp; E-Commerce</h3>
              <p class="text-sm text-white/60 leading-relaxed">Specialty retail shops and artisan brands looking for smooth shopping experiences, customized checkout flows, and distinct visual identity.</p>
            </div>
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">03</div>
              <h3 class="text-xl font-bold">Growing Companies Needing Portals</h3>
              <p class="text-sm text-white/60 leading-relaxed">Businesses that require customer dashboards, recurring subscription memberships, quote calculators, or automated intake forms.</p>
            </div>
          </div>
        </section>

        <!-- The Project Process -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Step-By-Step</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">Our Development Process</h2>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Phase 1</div>
              <h3 class="text-lg font-bold mb-3">Discovery &amp; Audit</h3>
              <p class="text-xs text-white/60 leading-relaxed">We audit your existing web presence or gather project goals, branding requirements, and essential customer conversion paths.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Phase 2</div>
              <h3 class="text-lg font-bold mb-3">Design &amp; Architecture</h3>
              <p class="text-xs text-white/60 leading-relaxed">We establish the component structure, styling system, accessible color palette, and data schema tailored to your business model.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Phase 3</div>
              <h3 class="text-lg font-bold mb-3">AI-Assisted Build</h3>
              <p class="text-xs text-white/60 leading-relaxed">Clean code is developed with rigorous performance checks, responsive breakpoints, contact forms, and security safeguards.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Phase 4</div>
              <h3 class="text-lg font-bold mb-3">Review, Launch &amp; Care</h3>
              <p class="text-xs text-white/60 leading-relaxed">You review the site, we connect your custom domain and SSL, deploy to global edge CDN, and initiate 24/7 uptime monitoring.</p>
            </div>
          </div>
        </section>

        <!-- Deliverables & Responsibilities -->
        <section class="mb-24 grid md:grid-cols-2 gap-8">
          <div class="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
            <h2 class="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span> Deliverables You Receive
            </h2>
            <ul class="space-y-4 text-sm text-white/70">
              <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Fully custom website engineered with modern frameworks (no DIY builder restrictions).</li>
              <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> High-speed responsive mobile and desktop layouts optimized for Core Web Vitals.</li>
              <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Technical SEO setup: crawlable markup, canonical URLs, XML sitemap, and Open Graph tags.</li>
              <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Integrated lead capture contact forms with spam defense and email/SMS alerts.</li>
              <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Global edge hosting, HTTPS certificate, and continuous security monitoring.</li>
            </ul>
          </div>

          <div class="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
            <h2 class="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <span class="w-3 h-3 rounded-full bg-orange-500"></span> Customer Responsibilities
            </h2>
            <ul class="space-y-4 text-sm text-white/70">
              <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Provide your business name, core service offerings, and target customer description.</li>
              <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Share brand assets such as your logo, brand colors, and high-resolution imagery if available.</li>
              <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Provide domain registrar access or DNS record updates for launch.</li>
              <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Review the staging build and provide consolidated revision notes within project milestones.</li>
            </ul>
          </div>
        </section>

        <!-- Verified Timelines & Pricing Summary -->
        <section class="mb-24 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-orange-600/10 via-transparent to-transparent border border-orange-500/30">
          <div class="max-w-3xl mb-8">
            <span class="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Pricing &amp; Delivery</span>
            <h2 class="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">Verified Timelines &amp; Transparent Plans</h2>
            <p class="text-sm text-white/70 leading-relaxed">
              We offer both structured subscription tiers with lifetime price locks and custom quote projects. Each tier includes a mandatory 12-month commitment, setup fee, and clear maximum delivery windows:
            </p>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm mb-8">
            <div class="p-5 rounded-2xl bg-black/40 border border-white/10">
              <div class="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">Simple Launch</div>
              <div class="font-bold text-white text-base">Max 2-Week Delivery</div>
              <p class="text-xs text-white/60 mt-2">Essential business site, custom design, mobile &amp; SEO setup, basic maintenance.</p>
            </div>
            <div class="p-5 rounded-2xl bg-black/40 border border-white/10">
              <div class="text-xs font-black uppercase tracking-widest text-orange-400 mb-1">Essential Care</div>
              <div class="font-bold text-white text-base">Max 3-Week Delivery</div>
              <p class="text-xs text-white/60 mt-2">Adds 2 hours/mo custom edits, ongoing Google Business management, hosting &amp; monitoring.</p>
            </div>
            <div class="p-5 rounded-2xl bg-black/40 border border-white/10">
              <div class="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Professional Growth</div>
              <div class="font-bold text-white text-base">Max 4-Week Delivery</div>
              <p class="text-xs text-white/60 mt-2">Adds 5 hours/mo custom edits, monthly analytics, and AI chatbot upkeep.</p>
            </div>
            <div class="p-5 rounded-2xl bg-black/40 border border-white/10">
              <div class="text-xs font-black uppercase tracking-widest text-purple-400 mb-1">Enterprise Custom</div>
              <div class="font-bold text-white text-base">Timeline By Scope</div>
              <p class="text-xs text-white/60 mt-2">Advanced architecture, custom database models, 10+ hours/mo edits, dedicated manager.</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <a routerLink="/services" class="text-orange-400 hover:text-orange-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              Explore All Pricing Details &rarr;
            </a>
          </div>
        </section>

        <!-- Call to Action -->
        <section class="text-center py-16 px-8 rounded-3xl bg-white/[0.02] border border-white/5">
          <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-6">Ready to Build Your Website?</h2>
          <p class="text-base text-white/70 max-w-xl mx-auto mb-8">
            Start with a free review of your current site, or discuss your upcoming project goals directly with Carter.
          </p>
          <a routerLink="/" fragment="audit" class="inline-block px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-xl shadow-orange-600/30">
            Request A Free Website Audit
          </a>
        </section>
      </div>
    </main>
  `
})
export class CustomWebsitesComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.updateMeta({
      title: 'Custom Website Development Services | Phoenix Websites AI',
      description: 'Hire Phoenix Websites AI to design, build, and maintain your custom website. AI-assisted custom development, high-speed performance, and managed hosting.',
      canonicalUrl: 'https://phoenixwebsites.ai/services/custom-websites',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Custom Website Development',
        'provider': {
          '@type': 'Organization',
          'name': 'Phoenix Websites AI',
          'url': 'https://phoenixwebsites.ai'
        },
        'description': 'AI-assisted custom website engineering, responsive UI, backend integrations, and managed hosting.',
        'areaServed': 'US',
        'offers': {
          '@type': 'AggregateOffer',
          'priceCurrency': 'USD',
          'price': '89',
          'priceRange': '$89 - $899 / month'
        }
      }
    });
  }
}
