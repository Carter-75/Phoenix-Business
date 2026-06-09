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
            <p>All initial setup and startup fees are non-refundable.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">4. Trial Periods</h2>
            <p>Certain promotional tiers may offer a 30-day "Limited Trial." During this period, you may cancel your subscription to prevent future charges, but any initial setup fees remain non-refundable.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">5. Cancellation vs. Refund</h2>
            <p>You may cancel your auto-renewal at any time via the client portal. Cancellation stops future charges but does not entitle the client to a refund of past payments or the current billing cycle.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">6. Chargebacks & Payment Disputes</h2>
            <p>If you initiate a chargeback or payment dispute with your credit card company or bank, your service will be suspended immediately. <strong>The burden of proof rests entirely on you, the client, to legally prove the chargeback is legitimate.</strong></p>
            <p>If the chargeback is found to be unwarranted or fraudulent, you remain fully legally responsible for the outstanding balance, plus a <strong>$150 administrative dispute fee</strong>. We reserve the right to recover owed debts through any and all legal means necessary, including turning the debt over to a third-party collections agency, reporting to credit bureaus, and pursuing legal action that could result in court-ordered asset seizure or wage garnishment. Any unpaid balances accrue a <strong>late fee of 5% per month</strong> (or the maximum amount permitted by Wisconsin law) until paid in full.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">7. Delivery Timelines & Late Projects</h2>
            <p>While we strive to meet the estimated delivery timelines provided for each tier (e.g., 2 weeks for Tier 1), these are strictly estimates and not guarantees. <strong>Phoenix is not legally or financially responsible for any damages or losses incurred due to late project delivery.</strong></p>
            <p>If your project exceeds the estimated timeline and you wish to cancel, your sole and exclusive remedy is to request a refund. To do so, you must send an email to <strong>partnership&#64;carter-portfolio.fyi</strong> with the subject line <strong>exactly</strong> as: <code>Refund Request</code>. If the subject line contains any other words, the request may not be processed. This is the only valid method for requesting a late-delivery refund.</p>
          </div>
        </div>

        <footer class="mt-24 pt-12 border-t border-white/5 flex flex-col gap-12">
          <div class="flex flex-col sm:flex-row justify-between gap-8 items-start sm:items-center">
            <div>
              <p class="text-white/30 text-sm font-medium">Questions regarding this policy?</p>
              <p class="text-white font-bold mt-1 tracking-widest uppercase">legal&#64;phoenix.com</p>
            </div>
            <a routerLink="/home" class="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.4em] text-white/50 hover:text-white transition-all">
              Return Home
              <div class="w-8 h-[1px] bg-white/20 group-hover:w-12 group-hover:bg-white transition-all duration-500"></div>
            </a>
          </div>
          <div class="text-white/30 text-[10px] font-black uppercase tracking-widest">
            Last Updated: May 7, 2026 • Phoenix Digital Infrastructure
          </div>
        </footer>
      </div>
    </section>
  `
})
export class RefundPolicyComponent {}
