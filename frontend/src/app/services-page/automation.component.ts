import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-automation',
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
            <li class="text-orange-500" aria-current="page">Automation</li>
          </ol>
        </nav>

        <!-- Hero Header -->
        <header class="mb-20 max-w-4xl">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-[1px] bg-orange-600"></div>
            <span class="text-orange-600 font-black uppercase tracking-[0.4em] text-xs">Workflow Engineering</span>
          </div>
          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight mb-8">
            Business Process<br>
            <span class="text-white/30">Automation</span>
          </h1>
          <p class="text-lg sm:text-2xl text-white/80 font-normal leading-relaxed mb-6">
            Stop losing leads and wasting hours on repetitive manual tasks. We engineer robust, automated pipelines connecting your website, email, SMS alerts, and internal systems.
          </p>
          <div class="flex flex-wrap gap-4 sm:gap-6 pt-4">
            <a routerLink="/" fragment="audit" class="px-8 py-5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg shadow-orange-600/20">
              Request Automation Review
            </a>
            <a routerLink="/services" class="px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all">
              View Website Plans
            </a>
          </div>
        </header>

        <!-- What We Automate -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Supported Capabilities</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">Core Automation Solutions</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">01</div>
              <h3 class="text-xl font-bold">Instant Lead Routing &amp; Alerts</h3>
              <p class="text-sm text-white/60 leading-relaxed">
                When a customer submits an inquiry, our system automatically validates the submission, stores it durably, sends instant SMS notifications to your team, and triggers personalized confirmation receipts.
              </p>
            </div>
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">02</div>
              <h3 class="text-xl font-bold">CRM &amp; Database Sync</h3>
              <p class="text-sm text-white/60 leading-relaxed">
                Seamlessly pipe inbound inquiries and customer activity into your database, CRM, or spreadsheets with zero manual data entry or copy-pasting errors.
              </p>
            </div>
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">03</div>
              <h3 class="text-xl font-bold">Webhook &amp; API Pipelines</h3>
              <p class="text-sm text-white/60 leading-relaxed">
                Connect disparate services—Stripe payments, billing systems, communication providers, and operational dashboards—with resilient webhooks and error logging.
              </p>
            </div>
          </div>
        </section>

        <!-- Who It Helps -->
        <section class="mb-24 p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10">
          <div class="max-w-3xl mb-8">
            <span class="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Who We Help</span>
            <h2 class="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-4">Eliminate Manual Bottlenecks</h2>
            <p class="text-sm text-white/70 leading-relaxed">
              Automation is ideal for busy business owners, contractors, and agencies where missed inquiries directly equal lost revenue:
            </p>
          </div>
          <div class="grid sm:grid-cols-2 gap-6 text-sm text-white/70">
            <div class="space-y-2 border-l border-orange-500/40 pl-4">
              <h3 class="text-white font-bold">Contractors &amp; Field Teams</h3>
              <p>Get SMS notifications immediately while on the job site so you can call high-intent leads back within minutes instead of hours.</p>
            </div>
            <div class="space-y-2 border-l border-orange-500/40 pl-4">
              <h3 class="text-white font-bold">Professional Firms &amp; Clinics</h3>
              <p>Standardize customer intake, intake form parsing, and appointment confirmation workflows without hiring extra administrative staff.</p>
            </div>
          </div>
        </section>

        <!-- Process -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Engineering Methodology</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">How We Build Your Automations</h2>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Step 1</div>
              <h3 class="text-lg font-bold mb-3">Workflow Audit</h3>
              <p class="text-xs text-white/60 leading-relaxed">We map your current manual process, identify where time is wasted, and specify the exact trigger and action rules.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Step 2</div>
              <h3 class="text-lg font-bold mb-3">Pipeline Architecture</h3>
              <p class="text-xs text-white/60 leading-relaxed">We design error handling, retry mechanisms, and data schemas so transactions never fail silently.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Step 3</div>
              <h3 class="text-lg font-bold mb-3">Integration &amp; Testing</h3>
              <p class="text-xs text-white/60 leading-relaxed">We develop the integration using secure serverless endpoints and verify all edge cases with real payload simulation.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Step 4</div>
              <h3 class="text-lg font-bold mb-3">Deployment &amp; Alerts</h3>
              <p class="text-xs text-white/60 leading-relaxed">The pipeline is deployed to production with automated health checks and log monitoring.</p>
            </div>
          </div>
        </section>

        <!-- Deliverables & Responsibilities -->
        <section class="mb-24 grid md:grid-cols-2 gap-8">
          <div class="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
            <h2 class="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span> Deliverables
            </h2>
            <ul class="space-y-4 text-sm text-white/70">
              <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Fully automated, server-backed workflow pipelines.</li>
              <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Direct SMS/email instant notification gateways.</li>
              <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Secure API key management and endpoint encryption.</li>
              <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span> Fail-safe logging and delivery confirmation records.</li>
            </ul>
          </div>

          <div class="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
            <h2 class="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <span class="w-3 h-3 rounded-full bg-orange-500"></span> Customer Responsibilities
            </h2>
            <ul class="space-y-4 text-sm text-white/70">
              <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Provide necessary credentials or invite access to relevant third-party services.</li>
              <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Specify exact notification recipient phone numbers and email addresses.</li>
              <li class="flex items-start gap-3"><span class="text-orange-400 font-bold">•</span> Validate sample test alerts during the staging verification review.</li>
            </ul>
          </div>
        </section>

        <!-- Pricing & Quote Information -->
        <section class="mb-24 p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-orange-500/30">
          <div class="max-w-3xl">
            <span class="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Pricing Model</span>
            <h2 class="text-3xl font-black uppercase tracking-tight mb-4">Quote-Based &amp; Plan Inclusion</h2>
            <p class="text-sm text-white/70 leading-relaxed mb-6">
              Standard lead capture and routing automations are included in our managed website plans. Standalone automation projects and custom API integrations are quoted transparently based on the specific services being connected and data complexity.
            </p>
            <a routerLink="/" fragment="audit" class="inline-block px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all">
              Request An Automation Quote
            </a>
          </div>
        </section>
      </div>
    </main>
  `
})
export class AutomationComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.updateMeta({
      title: 'Business Process Automation Services | Phoenix Websites AI',
      description: 'Streamline customer intake, lead notifications, SMS alerts, and CRM integrations with custom workflow automation from Phoenix Websites AI.',
      canonicalUrl: 'https://phoenixwebsites.ai/services/automation',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Business Process Automation',
        'provider': {
          '@type': 'Organization',
          'name': 'Phoenix Websites AI',
          'url': 'https://phoenixwebsites.ai'
        },
        'description': 'Custom workflow automations, lead routing, SMS/email alerts, and CRM integrations.',
        'areaServed': 'US'
      }
    });
  }
}
