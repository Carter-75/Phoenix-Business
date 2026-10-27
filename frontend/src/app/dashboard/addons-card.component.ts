import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

/**
 * "Add to your website" card: a signed-in customer with a paid order can
 * buy catalog add-ons after the fact. Prices come from the backend quote
 * endpoint (bundle discount, the site-wide promotion, and coupons all
 * apply the same as at checkout). Nothing due today applies immediately;
 * otherwise the customer is sent to Stripe Checkout for the setup total
 * and lands back here, where the status endpoint confirms application.
 */
@Component({
  selector: 'app-addons-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="returnMessage()" class="bg-white/5 border rounded-2xl p-6 sm:p-8 backdrop-blur-sm mb-12 text-left max-w-lg mx-auto"
         [class.border-emerald-500/30]="returnKind() === 'success'"
         [class.border-white/10]="returnKind() !== 'success'">
      <div class="flex items-center gap-3 mb-2">
        <i class="fa-solid" [class.fa-circle-check]="returnKind() === 'success'" [class.fa-circle-info]="returnKind() !== 'success'" [class.text-emerald-400]="returnKind() === 'success'" [class.text-orange-500]="returnKind() !== 'success'"></i>
        <h3 class="text-lg font-black text-white uppercase tracking-tight">Add-Ons</h3>
      </div>
      <p class="text-slate-400 text-sm">{{ returnMessage() }}</p>
    </div>

    <div *ngFor="let order of orders()" class="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm mb-12 text-left max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-2">
        <i class="fa-solid fa-puzzle-piece text-orange-500"></i>
        <h3 class="text-lg font-black text-white uppercase tracking-tight">Add to Your Website</h3>
      </div>
      <p class="text-slate-400 text-sm mb-5">
        {{ order.tierName }}<span *ngIf="order.businessName"> for {{ order.businessName }}</span>.
        Your current monthly rate is {{ money(order.finalMonthlyCents) }}. Anything you add here starts with your next regular invoice, never a surprise mid-month charge.
      </p>

      <ng-container *ngIf="order.selfServeAvailable; else arrangeByEmail">
        <div class="flex flex-col gap-3 mb-5">
          <label *ngFor="let addon of order.availableAddons" class="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-orange-500/40 transition-colors">
            <input type="checkbox" class="mt-1 accent-orange-600" [checked]="isSelected(order.orderId, addon.id)" (change)="toggle(order, addon.id)">
            <span class="flex-1">
              <span class="block text-sm font-bold text-white">{{ addon.name }}</span>
              <span class="block text-xs text-slate-400 mt-0.5">{{ addon.description }}</span>
              <span class="block text-xs text-orange-300 font-bold mt-1">{{ priceLine(addon) }}</span>
            </span>
          </label>
        </div>

        <label [attr.for]="'addon-coupon-' + order.orderId" class="block text-left text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">Discount code (if you have one)</label>
        <div class="flex gap-2 mb-4">
          <input [id]="'addon-coupon-' + order.orderId" type="text" [ngModel]="couponFor(order.orderId)" (ngModelChange)="setCoupon(order.orderId, $event)" placeholder="Discount code"
                 class="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 uppercase">
          <button type="button" (click)="refreshQuote(order)" class="px-5 py-3 bg-white/10 hover:bg-white/20 text-white transition-all rounded-lg text-xs font-bold uppercase tracking-widest">Apply</button>
        </div>

        <div *ngIf="quoteFor(order.orderId) as q" class="rounded-xl bg-black/30 border border-white/10 p-4 mb-4 text-sm">
          <div *ngFor="let a of q.addons" class="flex justify-between gap-3 text-slate-300">
            <span>{{ a.name }}<span *ngIf="a.autoAdded" class="text-orange-300 text-xs font-bold"> (included, your pick needs it)</span></span>
            <span>{{ money(a.setupCents) }}<span *ngIf="a.monthlyCents"> + {{ money(a.monthlyCents) }}/mo</span></span>
          </div>
          <div *ngIf="q.promotionDiscountPercent" class="flex justify-between gap-3 text-emerald-400 text-xs font-bold mt-2">
            <span>Current promotion ({{ q.promotionDiscountPercent }}% off)</span>
            <span>-{{ money(q.promoDiscountSetupCents + q.promoDiscountMonthlyCents) }}</span>
          </div>
          <div *ngIf="q.bundleDiscountPercent" class="flex justify-between gap-3 text-emerald-400 text-xs font-bold mt-1">
            <span>Bundle savings ({{ q.bundleDiscountPercent }}% off)</span>
            <span>-{{ money(q.bundleDiscountSetupCents + q.bundleDiscountMonthlyCents) }}</span>
          </div>
          <div *ngIf="q.couponCode" class="flex justify-between gap-3 text-emerald-400 text-xs font-bold mt-1">
            <span>Code {{ q.couponCode }}</span>
            <span>-{{ money(q.couponDiscountSetupCents + q.couponDiscountMonthlyCents) }}</span>
          </div>
          <div class="border-t border-white/10 mt-3 pt-3 flex justify-between gap-3 text-white font-bold">
            <span>Due today</span><span>{{ money(q.dueTodayCents) }}</span>
          </div>
          <div class="flex justify-between gap-3 text-slate-300">
            <span>Monthly rate</span>
            <span>{{ money(q.currentMonthlyCents) }} &rarr; {{ money(q.newMonthlyCents) }}</span>
          </div>
        </div>

        <label class="flex items-start gap-3 text-xs text-slate-400 mb-4 cursor-pointer">
          <input type="checkbox" class="mt-0.5 accent-orange-600" [ngModel]="acceptedFor(order.orderId)" (ngModelChange)="setAccepted(order.orderId, $event)">
          <span>I agree to add the selected add-ons to my package under the current Terms of Service. Any monthly change starts with my next regular invoice.</span>
        </label>

        <div *ngIf="errorFor(order.orderId)" class="text-xs text-red-400 font-bold mb-3">{{ errorFor(order.orderId) }}</div>
        <div *ngIf="doneFor(order.orderId)" class="text-xs text-emerald-400 font-bold mb-3">{{ doneFor(order.orderId) }}</div>

        <button type="button" (click)="buy(order)" [disabled]="!quoteFor(order.orderId) || !acceptedFor(order.orderId) || busyFor(order.orderId)"
                class="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white transition-all rounded-full text-xs font-bold uppercase tracking-widest">
          {{ busyFor(order.orderId) ? 'Working...' : 'Add Selected Add-Ons' }}
        </button>
      </ng-container>

      <ng-template #arrangeByEmail>
        <div class="flex flex-col gap-2 mb-5">
          <div *ngFor="let addon of order.availableAddons" class="flex justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <span class="text-sm font-bold text-white">{{ addon.name }}</span>
            <span class="text-xs text-orange-300 font-bold">{{ priceLine(addon) }}</span>
          </div>
        </div>
        <p class="text-slate-400 text-sm mb-4">This package has no card subscription on file, so add-ons are arranged by email instead.</p>
        <a href="mailto:hello@phoenixwebsites.ai?subject=ORDER%20Add-ons%20for%20my%20website"
           class="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white transition-all rounded-full text-xs font-bold uppercase tracking-widest">Email Us to Add</a>
      </ng-template>
    </div>
  `
})
export class AddonsCardComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  orders = signal<any[]>([]);
  returnMessage = signal<string | null>(null);
  returnKind = signal<'success' | 'info'>('info');

  private selectedMap = signal<Record<string, string[]>>({});
  private couponMap = signal<Record<string, string>>({});
  private quoteMap = signal<Record<string, any>>({});
  private acceptedMap = signal<Record<string, boolean>>({});
  private busyMap = signal<Record<string, boolean>>({});
  private errorMap = signal<Record<string, string>>({});
  private doneMap = signal<Record<string, string>>({});

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const flag = params.get('addons');
    const purchaseId = params.get('purchase');
    if (flag === 'success' && purchaseId) {
      this.api.get<any>('addons/status/' + purchaseId).subscribe({
        next: (s) => {
          if (s.status === 'applied') {
            this.returnKind.set('success');
            this.returnMessage.set('Done. ' + (s.addons || []).join(', ') + ' now on your package. A receipt is on its way to your email.');
          } else if (s.status === 'failed') {
            this.returnMessage.set('The payment went through but the add-ons need a hand applying: ' + (s.failureReason || 'please email us') + '. Nothing else is needed from you.');
          } else {
            this.returnMessage.set('Payment received. Your add-ons are being applied and a receipt will follow by email.');
          }
          this.loadMine();
        },
        error: () => this.loadMine()
      });
    } else {
      if (flag === 'cancelled') {
        this.returnMessage.set('No problem, nothing was charged. Your selected add-ons are still here whenever you are ready.');
      }
      this.loadMine();
    }
  }

  private loadMine() {
    this.api.get<any>('addons/mine').subscribe({
      next: (r) => this.orders.set((r.orders || []).filter((o: any) => (o.availableAddons || []).length > 0)),
      error: () => this.orders.set([])
    });
  }

  money(cents: number): string {
    return '$' + (Math.max(0, cents || 0) / 100).toFixed(2);
  }

  priceLine(addon: any): string {
    if (addon.billingType === 'ONE_TIME') return this.money(addon.setupCents) + ' one-time';
    if (addon.billingType === 'MONTHLY') return this.money(addon.monthlyCents) + '/mo';
    return this.money(addon.setupCents) + ' setup + ' + this.money(addon.monthlyCents) + '/mo';
  }

  isSelected(orderId: string, addonId: string): boolean {
    return (this.selectedMap()[orderId] || []).includes(addonId);
  }

  toggle(order: any, addonId: string) {
    const current = this.selectedMap()[order.orderId] || [];
    const next = current.includes(addonId) ? current.filter(id => id !== addonId) : [...current, addonId];
    this.selectedMap.update(m => ({ ...m, [order.orderId]: next }));
    this.doneMap.update(m => ({ ...m, [order.orderId]: '' }));
    this.refreshQuote(order);
  }

  couponFor(orderId: string): string { return this.couponMap()[orderId] || ''; }
  setCoupon(orderId: string, v: string) { this.couponMap.update(m => ({ ...m, [orderId]: v })); }
  acceptedFor(orderId: string): boolean { return !!this.acceptedMap()[orderId]; }
  setAccepted(orderId: string, v: boolean) { this.acceptedMap.update(m => ({ ...m, [orderId]: v })); }
  quoteFor(orderId: string): any { return this.quoteMap()[orderId] || null; }
  busyFor(orderId: string): boolean { return !!this.busyMap()[orderId]; }
  errorFor(orderId: string): string { return this.errorMap()[orderId] || ''; }
  doneFor(orderId: string): string { return this.doneMap()[orderId] || ''; }

  refreshQuote(order: any) {
    const addonIds = this.selectedMap()[order.orderId] || [];
    if (!addonIds.length) {
      this.quoteMap.update(m => ({ ...m, [order.orderId]: null }));
      this.errorMap.update(m => ({ ...m, [order.orderId]: '' }));
      return;
    }
    this.api.post<any>('addons/quote', {
      orderId: order.orderId,
      addonIds,
      couponCode: this.couponFor(order.orderId) || undefined
    }).subscribe({
      next: (r) => {
        this.quoteMap.update(m => ({
          ...m,
          [order.orderId]: { ...r.quote, currentMonthlyCents: r.currentMonthlyCents, newMonthlyCents: r.newMonthlyCents }
        }));
        this.errorMap.update(m => ({ ...m, [order.orderId]: '' }));
      },
      error: (e) => {
        this.quoteMap.update(m => ({ ...m, [order.orderId]: null }));
        this.errorMap.update(m => ({ ...m, [order.orderId]: e?.error?.error || 'Could not price those add-ons.' }));
      }
    });
  }

  buy(order: any) {
    this.busyMap.update(m => ({ ...m, [order.orderId]: true }));
    this.errorMap.update(m => ({ ...m, [order.orderId]: '' }));
    this.api.post<any>('addons/checkout', {
      orderId: order.orderId,
      addonIds: this.selectedMap()[order.orderId] || [],
      couponCode: this.couponFor(order.orderId) || undefined,
      acceptedTerms: true
    }).subscribe({
      next: (r) => {
        if (r.applied) {
          this.doneMap.update(m => ({ ...m, [order.orderId]: 'Done. Those add-ons are on your package now, and a receipt is on its way to your email.' }));
          this.busyMap.update(m => ({ ...m, [order.orderId]: false }));
          this.selectedMap.update(m => ({ ...m, [order.orderId]: [] }));
          this.quoteMap.update(m => ({ ...m, [order.orderId]: null }));
          this.loadMine();
        } else if (r.url) {
          window.location.href = r.url;
        } else {
          this.busyMap.update(m => ({ ...m, [order.orderId]: false }));
          this.errorMap.update(m => ({ ...m, [order.orderId]: 'Something went wrong starting checkout. Nothing was charged.' }));
        }
      },
      error: (e) => {
        this.busyMap.update(m => ({ ...m, [order.orderId]: false }));
        this.errorMap.update(m => ({ ...m, [order.orderId]: e?.error?.error || 'Could not start checkout. Nothing was charged.' }));
      }
    });
  }
}
