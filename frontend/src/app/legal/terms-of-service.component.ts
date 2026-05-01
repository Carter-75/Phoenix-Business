import { Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  template: `
    <section class="min-h-screen pt-48 pb-24 px-6 bg-slate-950 relative overflow-hidden">
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/5 top-[-10%] right-[-10%]"></div>
      
      <div class="max-w-4xl mx-auto relative z-10">
        <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-12">Terms of <span class="text-orange-500">Service</span></h1>
        
        <div class="space-y-12 text-slate-400 font-medium leading-relaxed">
          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">1. The Agreement</h2>
            <p>By engaging with Phoenix ("we", "us", "our"), you agree to enter into a binding service agreement. These terms apply to all clients, visitors, and users of our digital infrastructure services.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">2. Contractual Commitment</h2>
            <div class="p-8 bg-orange-500/5 border border-orange-500/20 rounded-3xl text-orange-200">
              <p class="font-bold mb-4 uppercase tracking-widest text-xs">Standard 12-Month Term</p>
              <p>Unless otherwise specified in a custom engagement agreement, all service tiers require a mandatory minimum commitment of twelve (12) consecutive months. This commitment ensures the stability and resource allocation necessary for elite digital architecture.</p>
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">3. Automatic Renewal</h2>
            <p>To prevent service interruption, your contract will automatically renew for subsequent 12-month periods. Notice of non-renewal must be provided via the client portal at least 30 days prior to the current contract's expiration date.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">4. Early Termination & Liquidated Damages</h2>
            <p>Early termination of the 12-month commitment by the client results in the immediate accrual of "Liquidated Damages." This fee is calculated as 50% of the remaining total contract value. This is not a penalty, but a reasonable pre-estimate of Phoenix's actual losses, including unrecoverable setup costs, infrastructure reservation, and lost opportunities.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">5. Payment & Non-Refundability</h2>
            <p>Payments are processed via Stripe and are due monthly or yearly as per the selected plan. All payments are strictly non-refundable once the service period has commenced. In the event of a payment failure, services may be suspended immediately until the account is brought current.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">6. Limitation of Liability</h2>
            <p>Phoenix provides high-performance infrastructure but does not guarantee specific business outcomes. Our liability is limited to the total amount paid by the client in the 3 months preceding any claim.</p>
          </div>
        </div>

        <div class="mt-24 pt-12 border-t border-white/5 text-slate-600 text-[10px] font-black uppercase tracking-widest">
          Last Updated: May 1, 2026 • Phoenix Digital Infrastructure
        </div>
      </div>
    </section>
  `
})
export class TermsComponent {}
