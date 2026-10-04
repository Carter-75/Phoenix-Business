import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-refunds',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  template: `
    <section class="min-h-screen pt-48 pb-24 px-6 bg-slate-950 relative overflow-hidden">
      <div class="blur-glow w-[500px] h-[500px] bg-red-600/5 bottom-[-10%] left-[-10%]"></div>
      
      <div class="max-w-4xl mx-auto relative z-10">
        <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-12" appScrollReveal>Refund <span class="text-red-500">Policy</span></h1>
        
        <div class="space-y-12 text-slate-400 font-medium leading-relaxed" appScrollReveal>
          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">1. General Policy</h2>
            <p>At Phoenix, we provide specialized digital infrastructure and high-performance architectural services. Due to the high-resource intensity of our initial setup and the dedicated reservation of edge-network capacity, <strong>we maintain a strict no-refund policy for all payments made for Subscription Tiers 1, 2, and 3.</strong> However, this does not apply in the rare event that Phoenix completely fails to deliver the core services agreed upon.</p>
            <p><strong>Tier 4 (Enterprise Custom) Exception:</strong> For Tier 4 custom projects, you may request a full refund via our official Refund Request email procedure <em>only if</em> the request is made <strong>before</strong> the final custom specifications, extra fees, and scope of work have been formally agreed upon. Once the final agreement is made for a Tier 4 project, the strict no-refund policy applies.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">2. Why we don't refund</h2>
            <p>When you subscribe to a Phoenix tier, our engineering team immediately begins the following non-recoverable operations:</p>
            <ul class="list-disc ml-6 space-y-2">
              <li>Allocation of high-priority edge-network slots.</li>
              <li>Provisioning of isolated LLM data pipelines.</li>
              <li>Bespoke architectural configuration and deployment scripts.</li>
              <li>Strategic reservation of development time for your account.</li>
            </ul>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">3. Setup Fees</h2>
            <p>All initial setup and startup fees are non-refundable, subject to the exceptions described in this policy.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">4. Trial Periods</h2>
            <p>The 30-day subscription trial delays the first monthly payment. It does not waive the 12-month commitment, setup fee, or cancellation fees. The strict notice window and early-termination terms in the service agreement still apply.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">5. Cancellation vs. Refund</h2>
            <p>Cancellation and non-renewal follow the 60-to-30-day notice window and fees in the service agreement. A cancellation request does not automatically remove unpaid fees or entitle you to a refund of past payments.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">6. Chargebacks &amp; Payment Disputes</h2>
            <p>Clients agree to contact Phoenix in good faith to resolve any service or billing issues before initiating third-party payment disputes.</p>
            <p>If a dispute or chargeback is determined to be unwarranted, fraudulent, or in bad faith for services properly rendered under contract, the client remains responsible for the full balance plus the <strong>actual third-party payment network dispute processing fee assessed by Stripe ($15.00)</strong> and substantiated administrative recovery costs. Overdue commercial balances accrue a finance charge of 1.5% per month (18% APR) under Wis. Stat. § 138.05; qualifying consumer balances are governed by the Wisconsin Consumer Act (Wis. Stat. § 422.203) and capped at the lesser of $10 or 1% per month. This provision does not restrict or penalize legitimate statutory dispute rights.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">7. Delivery Timelines &amp; Late Projects</h2>
            <p>While we strive to meet estimated delivery timelines (e.g., 2 weeks for Starter), these represent standard engineering targets and not absolute guarantees.</p>
            <p>If your project substantially exceeds the agreed timeline and you wish to request a project audit or refund, you must submit a written request to <strong>hello&#64;phoenixwebsites.ai</strong> with the subject line <code>Refund Request</code> detailing the circumstances. Phoenix evaluates all requests in good faith in accordance with Wisconsin commercial standards.</p>
          </div>
        </div>

        <footer class="mt-24 pt-12 border-t border-white/5 flex flex-col gap-12">
          <div class="flex flex-col sm:flex-row justify-between gap-8 items-start sm:items-center">
            <div>
              <p class="text-white/30 text-sm font-medium">Questions regarding this policy?</p>
              <p class="text-white font-bold mt-1 tracking-widest uppercase">hello&#64;phoenixwebsites.ai</p>
            </div>
            <a routerLink="/" class="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.4em] text-white/50 hover:text-white transition-all">
              Return Home
              <div class="w-8 h-[1px] bg-white/20 group-hover:w-12 group-hover:bg-white transition-all duration-500"></div>
            </a>
          </div>
          <div class="text-white/30 text-[10px] font-black uppercase tracking-widest">
            Last Updated: October 3, 2026 • Phoenix Websites AI
          </div>
        </footer>
      </div>
    </section>
  `
})
export class RefundPolicyComponent {}
