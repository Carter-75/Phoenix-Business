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

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">8. Client Communication Policy</h2>
            <p><strong>Subject-Line Words:</strong> To make sure your messages reach the right workflow and are read, every email you send to Phoenix Websites AI must include one of the following words as a standalone word anywhere in the subject line: <strong>NEW</strong> (a new inquiry), <strong>OUTREACH</strong> (a reply to our outreach), or <strong>ORDER</strong> (a message about your order or project). All other subject text is welcome; the word simply has to be present. Email that does not include one of these subject words may not be routed to our team and may not be read.</p>
            <p><strong>Warning and 5-Day Response Window:</strong> If communication about your project breaks down under this policy, we will send a warning email to your registered email address explaining what happened. You will have five (5) days from that warning to reply with ORDER in the subject line to keep or restart your project.</p>
            <p><strong>Archiving, Cancellation, and Refund:</strong> If we do not receive a reply with ORDER in the subject line within the 5-day window, your project will be archived (your project data is retained and is not permanently deleted), your subscription will be cancelled, and a refund will be issued automatically for the amounts you have paid, minus a startup fee equal to the lesser of $100.00 or 50% of the total amount you have actually paid. The startup fee covers setup and administrative costs already incurred on your project, including account provisioning, project scaffolding, and onboarding work performed before the cancellation. If you have paid nothing, no startup fee applies and no refund is due.</p>
            <p><strong>Reviews:</strong> Nothing in this policy prohibits, restricts, or penalizes honest reviews. If you leave a review on phoenixwebsites.ai, it will remain public and searchable even if your project is archived under this policy. If your project is archived, a short factual note will be added to your review stating that the project was archived under this communication policy after a 5-day notice went unanswered, and the review will no longer be counted in our displayed rating totals and averages.</p>
            <p><strong>Scope:</strong> This communication policy applies to paid engagements; free or promotional orders are exempt.</p>
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
