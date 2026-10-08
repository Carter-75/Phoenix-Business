import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { ProjectConfiguratorComponent } from '../shared/components/configurator/configurator.component';

@Component({
  selector: 'app-ai-web-development',
  standalone: true,
  imports: [CommonModule, RouterLink, ProjectConfiguratorComponent],
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
            <li class="text-orange-500" aria-current="page">AI Web Development</li>
          </ol>
        </nav>

        <!-- Hero Header -->
        <header class="mb-20 max-w-4xl">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-[1px] bg-orange-600"></div>
            <span class="text-orange-600 font-black uppercase tracking-[0.4em] text-xs">AI-Native Web Development Agency</span>
          </div>
          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight mb-8">
            AI-Powered Web Development<br>
            <span class="text-white/30">With Human Oversight</span>
          </h1>
          <p class="text-lg sm:text-2xl text-white/80 font-normal leading-relaxed mb-6">
            Phoenix Websites AI builds complete custom websites and digital platforms for clients. We use AI to accelerate the coding process while our senior engineers oversee every line of architecture, security, and quality assurance.
          </p>
          <div class="flex flex-wrap gap-4 sm:gap-6 pt-4">
            <a href="#configurator" class="px-8 py-5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg shadow-orange-600/20">
              Configure Your Website
            </a>
            <a routerLink="/" fragment="audit" class="px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all">
              Request Free Audit
            </a>
          </div>
        </header>

        <!-- Key Distinction: Agency vs DIY Builder -->
        <section class="mb-24 p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-orange-500/20 relative overflow-hidden">
          <div class="max-w-3xl">
            <span class="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">The AI-Native Model</span>
            <h2 class="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-6">We Build It For You — Not A DIY Tool</h2>
            <div class="grid sm:grid-cols-2 gap-8 text-sm text-white/70 leading-relaxed">
              <div class="space-y-3">
                <h3 class="text-white font-bold text-base flex items-center gap-2">
                  <span class="text-orange-500">✓</span> No DIY Drag-and-Drop
                </h3>
                <p>You do not have to write prompts, fight with template editors, or configure web servers. You give us your requirements and brand goals; we architect, code, test, and launch the site for you.</p>
              </div>
              <div class="space-y-3">
                <h3 class="text-white font-bold text-base flex items-center gap-2">
                  <span class="text-orange-500">✓</span> Senior Human Engineering
                </h3>
                <p>AI writes raw scaffolding rapidly, but human judgment ensures security, accessibility, Core Web Vitals, clean architecture, and authentic brand voice.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Division of Labor: What AI Does vs What Humans Oversee -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Process Transparency</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">How AI &amp; Humans Work Together</h2>
          </div>
          <div class="grid md:grid-cols-2 gap-8">
            <div class="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-orange-500"></span>
                <h3 class="text-xl font-bold uppercase tracking-tight text-white">What AI Accelerates</h3>
              </div>
              <ul class="space-y-4 text-sm text-white/70">
                <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Rapid boilerplate and component scaffolding in modern frameworks.</li>
                <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Automated unit test suite generation and edge-case syntax verification.</li>
                <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Responsive CSS layout drafting across mobile, tablet, and ultra-wide screens.</li>
                <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Initial schema markup generation and SEO tag structuring.</li>
              </ul>
            </div>

            <div class="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 class="text-xl font-bold uppercase tracking-tight text-white">What Human Engineers Oversee</h3>
              </div>
              <ul class="space-y-4 text-sm text-white/70">
                <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> System architecture, database modeling, and API security boundaries.</li>
                <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Direct client communication, requirement scoping, and business alignment.</li>
                <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Rigorous code review, vulnerability prevention, and dependency auditing.</li>
                <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Final deployment to global edge CDN and 24/7 uptime monitoring.</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Interactive Configurator Anchor -->
        <section class="mb-24">
          <app-project-configurator></app-project-configurator>
        </section>

        <!-- FAQ Section -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Common Questions</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">AI Web Development FAQs</h2>
          </div>
          <div class="space-y-6">
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <h3 class="text-base font-bold text-white">Is Phoenix Websites AI an AI website builder?</h3>
              <p class="text-sm text-white/60 leading-relaxed">No. We are an engineering agency. You do not build the site yourself or manage AI tools. You hire us to handle the entire project from concept to launch.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <h3 class="text-base font-bold text-white">Who owns the code and finished website?</h3>
              <p class="text-sm text-white/60 leading-relaxed">During your subscription, you receive an exclusive commercial license. Full IP ownership is available via the Source Code Buyout (50% of original setup fee), transferring complete rights with no ongoing obligations or lock-in.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <h3 class="text-base font-bold text-white">What technologies do you use?</h3>
              <p class="text-sm text-white/60 leading-relaxed">We develop with modern full-stack web technologies including Angular, TypeScript, Node.js, Express, MongoDB, Tailwind CSS, and Stripe, hosted on high-speed global edge networks.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <h3 class="text-base font-bold text-white">How fast is delivery?</h3>
              <p class="text-sm text-white/60 leading-relaxed">Because AI eliminates repetitive boilerplate coding, starter sites are delivered within 2 weeks and comprehensive business sites within 3 to 4 weeks.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  `
})
export class AiWebDevelopmentComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.updateMeta({
      title: 'AI Web Development Company | Phoenix Websites AI',
      description: 'Hire Phoenix Websites AI for custom AI-assisted web development with human oversight. Fast, bespoke, high-performance websites engineered for your business.',
      canonicalUrl: 'https://phoenixwebsites.ai/services/ai-web-development',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'AI-Assisted Custom Web Development',
        'serviceType': 'AI Web Development',
        'provider': {
          '@type': 'Organization',
          'name': 'Phoenix Websites AI',
          'url': 'https://phoenixwebsites.ai'
        },
        'description': 'Custom website and web application development using AI acceleration with senior human engineering oversight.',
        'areaServed': 'US'
      }
    });
  }
}
