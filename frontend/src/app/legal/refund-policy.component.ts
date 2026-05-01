import { Component } from '@angular/core';

@Component({
  selector: 'app-refunds',
  standalone: true,
  template: `
    <section class="min-h-screen pt-48 pb-24 px-6 bg-slate-950 relative overflow-hidden">
      <div class="blur-glow w-[500px] h-[500px] bg-red-600/5 bottom-[-10%] left-[-10%]"></div>
      
      <div class="max-w-4xl mx-auto relative z-10">
        <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-12">Refund <span class="text-red-500">Policy</span></h1>
        
        <div class="space-y-12 text-slate-400 font-medium leading-relaxed">
          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">1. General Policy</h2>
            <p>At Phoenix, we provide specialized digital infrastructure and high-performance architectural services. Due to the high-resource intensity of our initial setup and the dedicated reservation of edge-network capacity, **we maintain a strict no-refund policy.**</p>
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
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">3. Trial Periods</h2>
            <p>Certain promotional tiers may offer a 30-day "Limited Trial." During this period, you may cancel your subscription to prevent future charges, but any initial setup fees remain non-refundable.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">4. Cancellation vs. Refund</h2>
            <p>You may cancel your auto-renewal at any time via the client portal. Cancellation stops future charges but does not entitle the client to a refund of past payments or the current billing cycle.</p>
          </div>
        </div>

        <div class="mt-24 pt-12 border-t border-white/5 text-slate-600 text-[10px] font-black uppercase tracking-widest">
          Last Updated: May 1, 2026 • Phoenix Digital Infrastructure
        </div>
      </div>
    </section>
  `
})
export class RefundPolicyComponent {}
