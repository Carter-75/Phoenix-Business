import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective],
  template: `
    <section class="min-h-screen pt-48 pb-24 px-6 bg-slate-950 relative overflow-hidden">
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/5 top-[-10%] right-[-10%]"></div>
      
      <div class="max-w-4xl mx-auto relative z-10">
        <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-12" appScrollReveal>Terms of <span class="text-orange-500">Service</span></h1>
        
        <div class="space-y-12 text-slate-400 font-medium leading-relaxed" appScrollReveal>
          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">1. The Agreement</h2>
            <p>By engaging with Phoenix ("we", "us", "our"), you agree to enter into a binding service agreement. These terms apply to all clients, visitors, and users of our digital infrastructure services.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">2. Contractual Commitment</h2>
            <p>Unless otherwise specified in a custom engagement agreement, all service tiers require a mandatory minimum commitment of twelve (12) consecutive months. This commitment ensures the stability and resource allocation necessary for elite digital architecture.</p>
            <ul class="list-disc ml-6 space-y-2">
              <li><strong>General Accounts:</strong> Users creating an account without a service selection are bound by general usage and privacy terms.</li>
              <li><strong>Subscription Projects (Tiers 1, 2 & 3):</strong> All tiers require a mandatory 12-month commitment. The engagement includes ongoing services matching your selected tier, subject to auto-renewal unless canceled.</li>
              <li><strong>Subscription Pricing (Tiers 1, 2, 3 & 4):</strong> All tiers require a <strong>mandatory minimum commitment of twelve (12) consecutive months.</strong> Tier 1 requires a $\{{prices().simple_setup}} setup fee and $\{{prices().simple_monthly}} monthly payments. Tier 2 requires a $\{{prices().essential_setup}} setup fee and $\{{prices().essential_monthly}} monthly payments. Tier 3 requires an $\{{prices().professional_setup}} setup fee and $\{{prices().professional_monthly}} monthly payments. Tier 4 requires an $\{{prices().enterprise_setup}} setup fee and $\{{prices().enterprise_monthly}} monthly payments.</li>
            </ul>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">3. Automatic Renewal</h2>
            <p>To prevent service interruption, your contract will automatically renew for subsequent 12-month periods. Notice of non-renewal must be provided via the client portal at least 30 days prior to the current contract's expiration date. Phoenix will provide a courtesy reminder notice via email exactly 30 days before your annual contract is set to renew. Once the automatic renewal occurs, you are bound to a new 12-month service agreement under these same terms. Additionally, you will receive standard automated reminders and receipts prior to each monthly subscription billing cycle.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">4. Early Termination & Liquidated Damages</h2>
            <p>Early termination of the 12-month commitment by the client results in the immediate accrual of "Liquidated Damages." This fee is calculated as 50% of the remaining total contract value. This is not a penalty, but a reasonable pre-estimate of Phoenix's actual losses. This fee covers the costs of custom deployment, dedicated server reservation, and administrative overhead incurred at the project start.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">5. Payment, Non-Refundability & Late Fees</h2>
            <p>Payments are processed via Stripe and are due monthly or yearly as per the selected plan. All payments are strictly non-refundable once the service period has commenced. In the event of a payment failure or unwarranted chargeback, services will be suspended immediately. Any unpaid balances, including debts from fraudulent chargebacks, will accrue a late fee of 5% per month (or the maximum allowed by Wisconsin law). We will pursue debt recovery through third-party collections or legal action (e.g., wage garnishment) if necessary.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">6. Limitation of Liability</h2>
            <p>Phoenix provides high-performance infrastructure but does not guarantee specific business outcomes. <strong>In no event shall Phoenix be liable for any indirect, consequential, incidental, special, or punitive damages</strong> (including, without limitation, lost profits, lost data, or business interruption) arising out of or related to this agreement. This limitation explicitly extends to any delays or failures to deliver projects within estimated timelines. Our total aggregate liability is strictly limited to the total amount paid by the client in the 3 months preceding the event giving rise to the claim.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">7. Service Scope & Fair Use</h2>
            <ul class="list-disc ml-6 space-y-2">
              <li><strong>Tier 1 (Simple Launch):</strong> Includes basic hosting, security, and uptime monitoring. Does not include any free time for ongoing edits or feature updates.</li>
              <li><strong>Tier 2 (Essential Care):</strong> Includes up to 2 hours of "Edits & Updates" per month. Unused hours do not roll over.</li>
              <li><strong>Tier 3 (Professional Growth):</strong> Includes up to 5 hours of specialized updates and AI maintenance.</li>
              <li><strong>Tier 4 (Enterprise Custom):</strong> Includes up to 10 hours of custom development, priority maintenance, and advanced architectural updates.</li>
              <li><strong>Exclusions:</strong> Requests exceeding these limits or requiring new core architecture will be billed at our standard hourly rate of $150/hr.</li>
            </ul>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">8. Domain & Portability / Ownership</h2>
            <p>Upon completion of the initial 12-month term and full payment of all fees, the Client may request a transfer of the domain name for a nominal administrative fee of $50. Website source code and proprietary AI configurations remain the property of Phoenix unless a "Buyout Option" is exercised.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">9. Indemnification</h2>
            <p>The client agrees to indemnify and hold harmless Phoenix from any claims resulting from the client's use of the service, including but not limited to copyright infringement claims arising from content or media provided by the client.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">10. Force Majeure</h2>
            <p>Phoenix is not liable for any failure or delay in performance due to circumstances beyond our reasonable control, including acts of God, natural disasters, or third-party infrastructure failures (e.g., Stripe, MongoDB).</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">11. Communications & Deliverability</h2>
            <p>It is the client's responsibility to maintain a valid, active email address on file and to whitelist communications from our domain. Any legal or administrative notice (including, but not limited to, renewal notices and invoices) that is successfully dispatched from our servers is considered formally and legally delivered, regardless of whether it is filtered into a spam/junk folder or blocked by your email provider. We are not liable for any consequences arising from your failure to receive emails due to your personal inbox settings or third-party email filtering.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">12. Governing Law</h2>
            <p>This agreement is governed by the laws of the State of Wisconsin.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">13. Dispute Resolution & Arbitration</h2>
            <p><strong>Mandatory Binding Arbitration:</strong> Any dispute, claim, or controversy arising out of or relating to these Terms or the breach, termination, enforcement, interpretation, or validity thereof, shall be determined by confidential, binding arbitration in the State of Wisconsin, rather than in public court. This means you waive your right to a trial by jury and to have any dispute heard in a public court.</p>
            <p><strong>Class Action Waiver:</strong> You and Phoenix agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. You waive any right to participate in a class-action lawsuit or class-wide arbitration.</p>
            <p><strong>Confidentiality:</strong> All aspects of the arbitration proceeding, including but not limited to the award of the arbitrator and compliance therewith, shall be strictly confidential. The parties agree to maintain confidentiality unless otherwise required by law.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">14. Disclaimer of Warranties</h2>
            <p><strong>"As-Is" Service:</strong> All services are provided on an "AS-IS" and "AS-AVAILABLE" basis without warranties of any kind. Phoenix expressly disclaims all warranties, whether express, implied, or statutory, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the services will meet your specific business requirements, generate a certain number of leads, or be entirely error-free.</p>
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
            Last Updated: {{currentDate}} • Phoenix Digital Infrastructure
          </div>
        </footer>
      </div>
    </section>
  `
})
export class TermsComponent implements OnInit {
  api = inject(ApiService);
  prices = signal<any>({
    simple_setup: 1499,
    simple_monthly: 99,
    essential_setup: 3499,
    essential_monthly: 299,
    professional_setup: 7999,
    professional_monthly: 599,
    enterprise_setup: 14999,
    enterprise_monthly: 999
  });

  currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  ngOnInit() {
    this.api.get<any>('stripe/pricing').subscribe({
      next: (data) => {
        const pct = data.discountPercentage || 0;
        const formatPrice = (cents: number) => cents ? Math.round((cents / 100) * (1 - pct / 100)) : 0;
        
        this.prices.set({
          simple_setup: formatPrice(data.basePrices.simple_setup),
          simple_monthly: formatPrice(data.basePrices.simple_monthly),
          essential_setup: formatPrice(data.basePrices.essential_setup),
          essential_monthly: formatPrice(data.basePrices.essential_monthly),
          professional_setup: formatPrice(data.basePrices.professional_setup),
          professional_monthly: formatPrice(data.basePrices.professional_monthly),
          enterprise_setup: formatPrice(data.basePrices.enterprise_setup),
          enterprise_monthly: formatPrice(data.basePrices.enterprise_monthly)
        });
      },
      error: () => console.error('Failed to load dynamic pricing for terms')
    });
  }
}
