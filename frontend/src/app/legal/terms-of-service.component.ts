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
            <p>By engaging with Phoenix Websites AI ("we", "us", "our"), you agree to enter into a legally binding service agreement. These terms apply to all clients, visitors, and users of our digital infrastructure and software engineering services.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">2. Contractual Commitment &amp; Two-Component Architecture</h2>
            <p>Unless otherwise agreed in a separate signed master statement of work, all website platform tiers require a mandatory minimum commitment of twelve (12) consecutive months. Every engagement consists of two distinct components:</p>
            <ul class="list-disc ml-6 space-y-2">
              <li><strong>Initial Development &amp; Setup Fee:</strong> A one-time fee due at checkout covering bespoke engineering, architectural scaffolding, UI/UX implementation, third-party API configurations, and deployment.</li>
              <li><strong>Recurring Managed Cloud Care &amp; Maintenance:</strong> Ongoing monthly managed cloud hosting, SSL lifecycle management, daily automated backups, 24/7 uptime monitoring, security patching, and included maintenance hours. First monthly billing begins approximately thirty (30) days post-purchase via Stripe deferred subscription trial.</li>
              <li><strong>Lifetime Price Lock Guarantee:</strong> Your monthly care rate for this specific website is permanently locked in for the duration of continuous subscription and will never increase.</li>
            </ul>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">3. Automatic Renewal &amp; Statutory Notice Window (Wis. Stat. § 134.49 Compliance)</h2>
            <p>To prevent disruption of mission-critical business websites, subscriptions automatically renew for successive twelve (12) month periods upon expiration of the initial term.</p>
            <p><strong>Notice Procedure &amp; Zero-Penalty Non-Renewal:</strong> In compliance with Wisconsin business contract standards (Wis. Stat. § 134.49(3) &amp; (4)), Phoenix Websites AI delivers written statutory reminder notifications via electronic mail to the client's registered email address between fifteen (15) and sixty (60) days prior to the non-renewal notice deadline. To decline renewal, the client must submit notice of non-renewal at least thirty (30) days prior to the annual expiration date via the authenticated client portal or by emailing <a href="mailto:hello@phoenixwebsites.ai" class="text-orange-400 underline font-bold">hello&#64;phoenixwebsites.ai</a>. Upon timely non-renewal, all services remain 100% active through the final day of the current term, terminating automatically with zero ($0) early-termination liquidated damages or cancellation penalties.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">4. Early Termination &amp; Stipulated Liquidated Damages (Wassenaar v. Panos Standard)</h2>
            <p>In the event of an early termination of the 12-month commitment initiated by the client prior to the standard notice window, the client shall be responsible for early-termination liquidated damages equal to <strong>50% of the remaining monthly retainer fees</strong> through the end of the current commitment term.</p>
            <p><strong>Compensatory Justification under Wisconsin Law:</strong> Pursuant to the Wisconsin Supreme Court reasonableness standard in <em>Wassenaar v. Panos</em>, 111 Wis. 2d 518, 331 N.W.2d 326 (1983), the parties expressly acknowledge and agree that:</p>
            <ul class="list-disc ml-6 space-y-1 text-xs">
              <li>Phoenix heavily discounts upfront custom software engineering and setup costs based on the client's reciprocal commitment to a 12-month term;</li>
              <li>Early termination causes immediate compensatory harm through unrecovered upfront engineering labor amortization, reserved edge-infrastructure capacity, and onboarding overhead;</li>
              <li>The 50% formula reasonably forecasts actual compensatory damages by deducting the estimated 50% in variable ongoing fulfillment and server bandwidth costs avoided by Phoenix upon cancellation;</li>
              <li>Actual damages arising from premature contract cancellation are uncertain and difficult to ascertain with mathematical precision. This stipulated sum represents a reasonable forecast of just compensation and not a penalty.</li>
            </ul>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">5. Website Source Code Buyout &amp; IP Transfer</h2>
            <p>During the active subscription term, the client receives an exclusive commercial license to use the deployed website while hosted on Phoenix infrastructure. The client may at any time voluntarily elect a permanent <strong>Website Source Code Buyout</strong>.</p>
            <p><strong>Nature of the Buyout Fee:</strong> The Buyout Fee is exactly <strong>50% of the original one-time setup fee</strong>. The parties agree that this fee is <em>separate and independent consideration</em> for the permanent purchase, copyright assignment, and transfer of the uncompiled source code, database schemas, and bespoke assets, and for the permanent deactivation of automated licensing checks—not liquidated damages or a cancellation penalty. Upon payment, full intellectual property rights and deployment independence are irreversibly transferred to the client.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">6. Payment, Delinquency Charges &amp; Consumer Disclosures</h2>
            <p>All payments are securely tokenized and processed through Stripe. In the event of an overdue balance following a 10-day cure period:</p>
            <ul class="list-disc ml-6 space-y-2">
              <li><strong>Commercial / Business Accounts:</strong> Overdue commercial balances shall accrue a monthly late finance charge of <strong>1.5% per month (18% per annum)</strong> or a $25 administrative delinquency fee, whichever is greater, not to exceed the maximum rate permitted by Wisconsin law (Wis. Stat. § 138.05).</li>
              <li><strong>Consumer Accounts:</strong> For transactions entered into by an individual primarily for personal, family, or household purposes governed by the Wisconsin Consumer Act (Wis. Stat. § 422.203 &amp; DFI guidelines), delinquency charges shall not exceed the statutory maximum of the lesser of <strong>$10.00 or 1% of the unpaid installment</strong> per month (12% per annum).</li>
            </ul>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">7. Payment Disputes &amp; Chargeback Cost Recovery</h2>
            <p>Clients are expected to contact Phoenix in good faith to resolve any billing inquiries prior to initiating third-party payment disputes. In the event of an improper, bad-faith, or fraudulent chargeback filed for services properly performed under this Agreement, the client shall remain fully liable for the outstanding balance plus the actual third-party payment network dispute processing fee assessed by Stripe ($15.00) and substantiated administrative costs incurred in resolving the improper dispute. This provision does not penalize or impair any legitimate statutory or regulatory dispute rights.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">8. Collection Costs &amp; Reasonable Attorney Fees</h2>
            <p>For commercial accounts, in the event of a material payment default requiring referral to third-party collection agencies or legal enforcement in court, the client agrees to pay all reasonable collection agency commissions, court costs, and reasonable attorney fees incurred by Phoenix Websites AI in enforcing this Agreement.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">9. Service Scope, Base Inclusions &amp; Optional Support Add-Ons</h2>
            <p>The base monthly managed cloud care fee includes cloud edge hosting, SSL certificates, automated daily snapshots, uptime monitoring, and base tier maintenance. Optional support duration add-ons (6-Month Extended Support, 12-Month Dedicated Care, or 24-Month Long-Term Architecture Assurance) represent distinct, optional add-on commitments providing priority ticket triage, multi-browser compatibility patching, dependency vulnerability updates, and allocated minor monthly requests (up to 1.5 engineering hours per request; expiring monthly with zero rollover). Optional support add-ons do not automatically renew and conclude strictly at the end of their contracted duration, at which time monthly support billing ceases in Stripe without affecting the underlying base website agreement.</p>
            <p><strong>Deterministic 24-Month Support Rule &amp; Year 2 Transition:</strong> For clients selecting 24-Month Architecture Assurance alongside a 12-month base website agreement, the client receives our lowest monthly support rate in consideration of the 24-month duration commitment. If the base website agreement renews at Month 12, support continues seamlessly in hosted mode through Month 24. If the client submits a timely non-renewal of the base website at Month 12, Phoenix cloud hosting terminates with zero continuing hosting charges, and the remaining 12 months of support automatically transition into <strong>Self-Hosted / Transition Support</strong> for Months 13–24 at the client's contracted locked monthly rate. Self-hosted transition support covers source-code bug fixes, dependency updates, security patches, deployment troubleshooting on client infrastructure, and 6 minor requests per month. Normal contract completion includes delivery of compiled production runtime assets under a non-exclusive deployment license; transfer of the uncompiled source code repository and complete intellectual property assignment remains governed exclusively by the optional 50% setup Buyout Fee under Section 7.</p>
            <p><strong>Support Early Termination:</strong> Early termination of an optional support add-on is subject to liquidated damages of 50% of the remaining monthly support commitment fees pursuant to Wis. Sup. Ct. <em>Wassenaar v. Panos</em>, which is calculated separately from base website liquidated damages and buyout fees.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">10. Limitation of Liability</h2>
            <p><strong>IN NO EVENT SHALL PHOENIX WEBSITES AI BE LIABLE FOR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES</strong> (INCLUDING LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION) ARISING OUT OF OR RELATED TO THIS AGREEMENT. OUR TOTAL AGGREGATE LIABILITY ARISING FROM OR RELATED TO THIS AGREEMENT SHALL BE STRICTLY LIMITED TO THE TOTAL FEES ACTUALLY PAID BY CLIENT TO PHOENIX IN THE THREE (3) MONTHS PRECEDING THE CLAIM.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">11. Governing Law &amp; Venue</h2>
            <p>This Agreement shall be governed by and construed in accordance with the laws of the State of Wisconsin, without regard to conflict of laws principles. The parties submit to the exclusive personal jurisdiction of the state and federal courts located in Wisconsin for any actions arising hereunder.</p>
          </div>

          <div class="space-y-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">12. Disclaimer of Warranties &amp; Legal Status</h2>
            <p><strong>"AS-IS" PROVISION:</strong> Except as expressly provided in a written Service Level Agreement, all services are provided "AS-IS" and "AS-AVAILABLE." Phoenix disclaims all warranties of merchantability and fitness for a particular purpose. While these terms have been crafted under authoritative Wisconsin statutory and judicial standards, they do not constitute formal legal advice to client; clients are encouraged to consult their own counsel.</p>
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
        const formatPrice = (cents: number) => cents ? Math.round(cents * (1 - pct / 100)) / 100 : 0;
        
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
