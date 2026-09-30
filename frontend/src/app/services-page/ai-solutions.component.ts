import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { VoiceCallService } from '../services/voice-call.service';

@Component({
  selector: 'app-ai-solutions',
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
            <li class="text-orange-500" aria-current="page">AI Solutions</li>
          </ol>
        </nav>

        <!-- Hero Header -->
        <header class="mb-20 max-w-4xl">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-[1px] bg-orange-600"></div>
            <span class="text-orange-600 font-black uppercase tracking-[0.4em] text-xs">Intelligent Systems</span>
          </div>
          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight mb-8">
            AI Solutions &amp;<br>
            <span class="text-white/30">Conversational Tools</span>
          </h1>
          <p class="text-lg sm:text-2xl text-white/80 font-normal leading-relaxed mb-6">
            Equip your business with 24/7 client response. We build purpose-driven AI web voice assistants, grounded inquiry chatbots, and intelligent workflow tools with strict factual guardrails.
          </p>
          <div class="flex flex-wrap items-center gap-4 sm:gap-6 pt-4">
            <button (click)="voiceCall.startCall()" class="px-8 py-5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              Test Live Web Call Demo
            </button>
            <a routerLink="/" fragment="audit" class="px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all">
              Request AI Solution Quote
            </a>
          </div>
        </header>

        <!-- Live Demo Callout -->
        <section class="mb-24 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-orange-600/10 to-transparent border border-orange-500/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="space-y-3 max-w-2xl">
            <span class="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] block">Working Demonstration</span>
            <h2 class="text-2xl sm:text-3xl font-black uppercase tracking-tight">Experience Our Web Voice Assistant</h2>
            <p class="text-sm text-white/70 leading-relaxed">
              Our site features a live conversational voice assistant running directly in your browser. It answers client questions about Phoenix Websites AI, explains service tiers, and handles inquiries in natural spoken dialogue.
            </p>
          </div>
          <button (click)="voiceCall.startCall()" class="shrink-0 px-8 py-5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all">
            Launch Voice Call Now
          </button>
        </section>

        <!-- Capabilities -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Supported Offerings</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">What We Build</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">01</div>
              <h3 class="text-xl font-bold">Browser &amp; Phone Voice Assistants</h3>
              <p class="text-sm text-white/60 leading-relaxed">
                Allow visitors to speak with your business directly through your website or telephone line, providing immediate answers to frequently asked questions and scheduling inquiries.
              </p>
            </div>
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">02</div>
              <h3 class="text-xl font-bold">Grounded Customer Chatbots</h3>
              <p class="text-sm text-white/60 leading-relaxed">
                Trained exclusively on your business policies, pricing parameters, and service catalog with strict negative constraints against hallucinations or off-topic responses.
              </p>
            </div>
            <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div class="text-orange-500 font-black text-xl">03</div>
              <h3 class="text-xl font-bold">Intelligent Lead Triage</h3>
              <p class="text-sm text-white/60 leading-relaxed">
                Automatically categorize incoming client messages, extract key requirements, score intent, and flag high-priority deals for immediate human follow-up.
              </p>
            </div>
          </div>
        </section>

        <!-- Safety & Guardrails -->
        <section class="mb-24 p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10">
          <div class="max-w-3xl mb-8">
            <span class="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Engineering Standards</span>
            <h2 class="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-4">Grounded In Verified Business Facts</h2>
            <p class="text-sm text-white/70 leading-relaxed">
              We do not deploy unconstrained, generic chatbot scripts. Every conversational tool is engineered with strict system guidelines:
            </p>
          </div>
          <div class="grid sm:grid-cols-3 gap-6 text-sm text-white/70">
            <div class="space-y-2 border-l border-orange-500/40 pl-4">
              <h3 class="text-white font-bold">Zero Hallucinations</h3>
              <p>The model is instructed to explicitly state when information is unavailable and offer human follow-up rather than guessing.</p>
            </div>
            <div class="space-y-2 border-l border-orange-500/40 pl-4">
              <h3 class="text-white font-bold">Rate Limiting &amp; Security</h3>
              <p>Backend API proxies protect your API quotas, enforce session caps, and block prompt injection attempts.</p>
            </div>
            <div class="space-y-2 border-l border-orange-500/40 pl-4">
              <h3 class="text-white font-bold">Human Escalation</h3>
              <p>Customers can always transition to direct email, phone call, or audit submission when they prefer human support.</p>
            </div>
          </div>
        </section>

        <!-- Process -->
        <section class="mb-24">
          <div class="mb-12">
            <span class="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Deployment Workflow</span>
            <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight">How We Implement AI Tools</h2>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Stage 1</div>
              <h3 class="text-lg font-bold mb-3">Knowledge Base</h3>
              <p class="text-xs text-white/60 leading-relaxed">Compile verified FAQs, services, pricing limits, and company facts into structured prompts.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Stage 2</div>
              <h3 class="text-lg font-bold mb-3">Guardrail Setup</h3>
              <p class="text-xs text-white/60 leading-relaxed">Define bounds, fallback behaviors, response tone, and prohibited responses.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Stage 3</div>
              <h3 class="text-lg font-bold mb-3">UI &amp; API Integration</h3>
              <p class="text-xs text-white/60 leading-relaxed">Connect custom audio streaming or chat widgets with authenticated backend proxies.</p>
            </div>
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div class="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Stage 4</div>
              <h3 class="text-lg font-bold mb-3">Live Tuning</h3>
              <p class="text-xs text-white/60 leading-relaxed">Review initial real customer interactions and adjust prompt weighting for accuracy.</p>
            </div>
          </div>
        </section>

        <!-- Pricing & Inclusion -->
        <section class="mb-24 p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-orange-500/30">
          <div class="max-w-3xl">
            <span class="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Pricing &amp; Plans</span>
            <h2 class="text-3xl font-black uppercase tracking-tight mb-4">Included In Growth Plans Or Custom Quote</h2>
            <p class="text-sm text-white/70 leading-relaxed mb-6">
              AI Chatbot upkeep is included in our Professional Growth plan ($539/month) and Enterprise Custom plans. Standalone AI voice assistants and custom enterprise integrations are quoted based on expected conversation volume and custom system integration requirements.
            </p>
            <div class="flex flex-wrap gap-4">
              <a routerLink="/services" class="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all">
                See Professional Growth Plan
              </a>
              <a routerLink="/" fragment="audit" class="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all">
                Request Custom AI Scope
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  `
})
export class AiSolutionsComponent implements OnInit {
  private seo = inject(SeoService);
  public voiceCall = inject(VoiceCallService);

  ngOnInit() {
    this.seo.updateMeta({
      title: 'AI Solutions & Conversational Assistants | Phoenix Websites AI',
      description: 'Integrate 24/7 web voice assistants, grounded inquiry chatbots, and intelligent lead triage into your business with Phoenix Websites AI.',
      canonicalUrl: 'https://phoenixwebsites.ai/services/ai-solutions',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'AI Solutions & Conversational Assistants',
        'provider': {
          '@type': 'Organization',
          'name': 'Phoenix Websites AI',
          'url': 'https://phoenixwebsites.ai'
        },
        'description': '24/7 web voice assistants, grounded inquiry chatbots, and intelligent lead triage.',
        'areaServed': 'US'
      }
    });
  }
}
