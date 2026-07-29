import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, CartItem } from '../services/api.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen pt-32 pb-20 px-6">
      <div class="max-w-2xl mx-auto">

        <!-- Back Button -->
        <button (click)="goBack()" class="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer py-3 px-4 -ml-4 rounded-lg hover:bg-white/5">
          ← Back
        </button>

        <!-- Header -->
        <h1 class="text-4xl font-black uppercase tracking-tight mb-2">Checkout Review</h1>
        <p class="text-white/40 text-sm mb-10">Review your items before proceeding to payment.</p>

        <!-- Empty Cart -->
        <div *ngIf="cartItems().length === 0" class="text-center py-20">
          <p class="text-5xl mb-4 opacity-30">🛒</p>
          <p class="text-white/40 text-lg mb-4">Your cart is empty</p>
          <button (click)="goBack()" class="text-orange-400 text-sm font-bold uppercase tracking-widest hover:text-orange-300 transition-colors">
            Browse Services & Data
          </button>
        </div>

        <!-- Cart Items -->
        <div *ngIf="cartItems().length > 0" class="space-y-4 mb-8">
          <div *ngFor="let item of cartItems(); let i = index"
               class="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/15 transition-all">
            <div class="flex-1 min-w-0">
              <!-- Data block -->
              <ng-container *ngIf="item.type !== 'service'">
                <p class="font-bold text-white text-sm">{{ item.blockLabel || 'Data Block' }}</p>
                <p class="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1">
                  {{ item.totalRecords || (item.recordIds?.length || 0) }} records
                </p>
              </ng-container>
              <!-- Service tier -->
              <ng-container *ngIf="item.type === 'service'">
                <p class="font-bold text-white text-sm">{{ item.tierName || 'Service Plan' }}</p>
                <p class="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1" *ngIf="item.monthlyPrice">
                  {{ item.monthlyPrice }} · Recurring
                </p>
                <p class="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1" *ngIf="!item.monthlyPrice">
                  Service Plan
                </p>
              </ng-container>
            </div>
            <div class="flex items-center gap-4 ml-4">
              <span class="text-xl font-black text-orange-500" *ngIf="item.price">\${{ item.price }}</span>
              <span class="text-xl font-black text-orange-500" *ngIf="!item.price && item.type !== 'service'">\${{ dataBlockPrice }}</span>
              <button (click)="removeItem(i)" class="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-xs flex items-center justify-center cursor-pointer">
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Discount Code Section -->
        <div *ngIf="cartItems().length > 0" class="rounded-2xl bg-white/[0.03] border border-white/10 p-6 mb-8">
          <p class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Discount / Access Code (Optional)</p>
          
          <!-- Applied discount -->
          <div *ngIf="appliedDiscount()" class="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div class="flex items-center gap-3">
              <span class="text-green-400 text-lg">✓</span>
              <div>
                <p class="text-green-400 font-bold text-xs uppercase tracking-widest">{{ appliedDiscount()!.code }}</p>
                <p class="text-green-400/60 text-[10px]">{{ appliedDiscount()!.percentage }}% off applied</p>
              </div>
            </div>
            <button (click)="removeDiscount()" class="text-green-400/50 hover:text-red-400 text-xs transition-colors cursor-pointer">Remove</button>
          </div>

          <!-- Discount input -->
          <div *ngIf="!appliedDiscount()" class="flex gap-3">
            <input [(ngModel)]="discountInput" 
                   placeholder="Enter code" 
                   class="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-semibold uppercase tracking-widest outline-none focus:border-orange-500/40 transition-colors"
                   [disabled]="discountLoading()" />
            <button (click)="applyDiscount()" 
                    [disabled]="discountLoading() || !discountInput.trim()"
                    class="px-6 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
              {{ discountLoading() ? '...' : 'Apply' }}
            </button>
          </div>
          <p *ngIf="discountError()" class="text-red-400 text-xs mt-2">{{ discountError() }}</p>
        </div>

        <!-- Total + Pay -->
        <div *ngIf="cartItems().length > 0" class="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
          <div class="flex items-center justify-between mb-6">
            <span class="text-white/50 font-bold text-sm uppercase tracking-widest">Total</span>
            <div class="text-right">
              <span *ngIf="appliedDiscount()" class="text-white/30 line-through text-lg mr-3">\${{ subtotal() }}</span>
              <span class="text-3xl font-black text-white">\${{ finalTotal() }}</span>
            </div>
          </div>
          <button (click)="proceedToPayment()" 
                  [disabled]="paymentLoading()"
                  class="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black uppercase tracking-widest text-sm hover:shadow-[0_8px_30px_rgba(234,88,12,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {{ paymentLoading() ? 'Processing...' : 'Pay Now — $' + finalTotal() }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  cartItems = computed(() => this.api.dataCart());
  appliedDiscount = computed(() => this.api.appliedDiscount());

  dataBlockPrice = 137; // Default, can be overridden
  discountInput = '';
  discountLoading = signal(false);
  discountError = signal<string | null>(null);
  paymentLoading = signal(false);

  subtotal = computed(() => {
    let total = 0;
    for (const item of this.cartItems()) {
      if (item.type === 'service') {
        total += item.price || 0;
      } else {
        total += item.price || this.dataBlockPrice;
      }
    }
    return total;
  });

  finalTotal = computed(() => {
    const sub = this.subtotal();
    const discount = this.appliedDiscount();
    if (discount) {
      return Math.round(sub * (1 - discount.percentage / 100));
    }
    return sub;
  });

  ngOnInit() {
    // Fetch dynamic pricing
    this.api.get<any>('stripe/pricing').subscribe({
      next: (data) => {
        if (data.dataBlockPrice) this.dataBlockPrice = data.dataBlockPrice;
      },
      error: () => {}
    });
  }

  removeItem(index: number) {
    this.api.removeCartItem(index);
  }

  applyDiscount() {
    const code = this.discountInput.trim().toUpperCase();
    if (!code) return;
    this.discountLoading.set(true);
    this.discountError.set(null);

    this.api.post<any>('stripe/validate-discount', { code }).subscribe({
      next: (res) => {
        if (res.valid) {
          this.api.appliedDiscount.set({ code, percentage: res.percentage });
          this.discountInput = '';
        }
        this.discountLoading.set(false);
      },
      error: (err) => {
        this.discountError.set(err.error?.error || 'Invalid code');
        this.discountLoading.set(false);
      }
    });
  }

  removeDiscount() {
    this.api.appliedDiscount.set(null);
  }

  proceedToPayment() {
    this.paymentLoading.set(true);
    const user = this.api.currentUser();
    const discount = this.appliedDiscount();

    // Send ALL cart items in one unified request
    this.api.post<{ url: string }>('stripe/unified-checkout', {
      cartItems: this.cartItems(),
      email: user?.email,
      name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      businessName: user?.businessName || '',
      acceptedContract: true,
      contractTimestamp: new Date().toISOString(),
      discountCode: discount?.code || undefined
    }).subscribe({
      next: (res) => {
        window.location.href = res.url;
        this.paymentLoading.set(false);
      },
      error: (err) => {
        this.paymentLoading.set(false);
        alert(err.error?.error || 'Failed to initialize checkout. Please try again.');
      }
    });
  }
  goBack() {
    window.history.back();
  }
}
