import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { ProjectConfiguratorComponent } from '../shared/components/configurator/configurator.component';

@Component({
  selector: 'app-full-stack-development',
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
            <li class="text-orange-500" aria-current="page">Full-Stack Development</li>
          </ol>
        </nav>

        <!-- Hero Header -->
        <header class="mb-20 max-w-4xl">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-[1px] bg-orange-600"></div>
            <span class="text-orange-600 font-black uppercase tracking-[0.4em] text-xs">Full-Stack AI Engineering</span>
          </div>
          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight mb-8">
            Full-Stack AI Development<br>
            <span class="text-white/30">&amp; Custom Web Apps</span>
          </h1>
          <p class="text-lg sm:text-2xl text-white/80 font-normal leading-relaxed mb-6">
            Build custom web applications, SaaS MVPs, customer dashboards, and backend data pipelines. We combine AI-accelerated programming with senior architectural engineering to deliver robust, scalable software.
          </p>
          <div class="flex flex-wrap gap-4 sm:gap-6 pt-4">
            <a href="#configurator" class="px-8 py-5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg shadow-orange-600/20">
              Configure Web App
            </a>
            <a routerLink="/" fragment="audit" class="px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all">
              Request Technical Review
            </a>
          </div>
        </header>

        <!-- What We Build: Full-Stack Capabilities -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Engineered Systems</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">Full-Stack Capabilities</h2>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">01</div>
              <h3 class="text-xl font-bold">Custom Web Applications &amp; MVPs</h3>
              <p class="text-sm text-white/60 leading-relaxed">Turn product concepts into working software. Bespoke frontends paired with robust backend APIs, database models, and secure authentication.</p>
            </div>
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">02</div>
              <h3 class="text-xl font-bold">Customer Portals &amp; Dashboards</h3>
              <p class="text-sm text-white/60 leading-relaxed">Role-based member accounts, subscription management, document uploads, internal admin panels, and real-time project tracking.</p>
            </div>
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">03</div>
              <h3 class="text-xl font-bold">API &amp; Third-Party Integrations</h3>
              <p class="text-sm text-white/60 leading-relaxed">Seamless connectivity with Stripe payments, CRM systems, SMS notifications, external REST APIs, and automated webhook pipelines.</p>
            </div>
          </div>
        </section>

        <!-- Architectural Standards -->
        <section class="mb-24 p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10">
          <div class="max-w-3xl mb-8">
            <span class="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Engineering Principles</span>
            <h2 class="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-4">Zero-Latency Architecture</h2>
            <p class="text-sm text-white/70 leading-relaxed">
              We design software for speed, security, and maintainability. AI accelerates the development cycle, but human rigor guarantees enterprise-grade quality.
            </p>
          </div>
          <div class="grid sm:grid-cols-2 gap-6 text-sm text-white/70">
            <div class="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <h4 class="text-white font-bold text-base flex items-center gap-2">
                <span class="text-orange-500">✓</span> Verified Security &amp; Auth
              </h4>
              <p class="text-xs text-white/50 leading-relaxed">Session protection, bcrypt password hashing, CSRF defenses, input sanitation, and role-based access control.</p>
            </div>
            <div class="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <h4 class="text-white font-bold text-base flex items-center gap-2">
                <span class="text-orange-500">✓</span> Database Architecture
              </h4>
              <p class="text-xs text-white/50 leading-relaxed">Optimized document schemas (MongoDB) and relational models with atomic operations, indexes, and automated daily backups.</p>
            </div>
            <div class="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <h4 class="text-white font-bold text-base flex items-center gap-2">
                <span class="text-orange-500">✓</span> Clean Codebase &amp; Testing
              </h4>
              <p class="text-xs text-white/50 leading-relaxed">Modular component design, strict TypeScript typing, automated unit tests, and production error boundaries.</p>
            </div>
            <div class="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <h4 class="text-white font-bold text-base flex items-center gap-2">
                <span class="text-orange-500">✓</span> Source Code Buyout Available
              </h4>
              <p class="text-xs text-white/50 leading-relaxed">During subscription, you have exclusive commercial license. Full IP transfer via Source Code Buyout—no proprietary agency lock-in.</p>
            </div>
          </div>
        </section>

        <!-- Configurator Section -->
        <section class="mb-24">
          <app-project-configurator></app-project-configurator>
        </section>

        <!-- Full-Stack FAQs -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Common Questions</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">Full-Stack Development FAQs</h2>
          </div>
          <div class="space-y-6">
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <h3 class="text-base font-bold text-white">Can Phoenix Websites AI build complete custom web applications?</h3>
              <p class="text-sm text-white/60 leading-relaxed">Yes. We specialize in custom full-stack web applications, including user dashboards, database CRUD systems, SaaS MVPs, and automated business workflows.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <h3 class="text-base font-bold text-white">What backend and database technologies are used?</h3>
              <p class="text-sm text-white/60 leading-relaxed">We develop with Node.js, Express, MongoDB Atlas, RESTful APIs, and TypeScript, deployed on Vercel or cloud infrastructure with global CDN caching.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <h3 class="text-base font-bold text-white">How is pricing determined for complex applications?</h3>
              <p class="text-sm text-white/60 leading-relaxed">Full-stack web application MVPs start from $4,999. Use our interactive configurator above to select specific features and receive an instant transparent estimate.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  `
})
export class FullStackDevelopmentComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.updateMeta({
      title: 'Full-Stack AI Web Development | Phoenix Websites AI',
      description: 'Custom full-stack web application development and SaaS MVPs by Phoenix Websites AI. AI-accelerated workflows with senior human engineering.',
      canonicalUrl: 'https://phoenixwebsites.ai/services/full-stack-development',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Full-Stack AI Web Development',
        'serviceType': 'Custom Web Application Development',
        'provider': {
          '@type': 'Organization',
          'name': 'Phoenix Websites AI',
          'url': 'https://phoenixwebsites.ai'
        },
        'description': 'Full-stack custom web applications, SaaS MVPs, user portals, databases, and APIs engineered with AI acceleration and human oversight.',
        'areaServed': 'US'
      }
    });
  }
}
