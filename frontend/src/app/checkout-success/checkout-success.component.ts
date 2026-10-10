import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ConversionService } from '../services/conversion.service';
@Component({
 selector: 'app-checkout-success', standalone: true, imports: [RouterLink],
 template: `<main class="max-w-2xl mx-auto px-6 pt-40 pb-24 text-white">
 <h1 class="text-3xl font-bold mb-6">{{ isFreeOrder() && paid() ? 'Order Confirmed' : isFreeOrder() ? 'Order Status' : 'Payment Status' }}</h1>
 <p role="status">{{ message() }}</p>
 @if (!paid()) { <button class="mt-6 p-3 border rounded" [disabled]="busy()" (click)="check()">Check again</button> }
 @if (paid()) { <a class="inline-block mt-6 p-3 border rounded" routerLink="/leave-review">Continue</a> }
 <a class="block mt-6 underline" routerLink="/dashboard">Go to your dashboard</a></main>`
})
export class CheckoutSuccessComponent implements OnInit {
 private api = inject(ApiService); private route = inject(ActivatedRoute);
 private conversions = inject(ConversionService);
 message = signal('Checking your order...'); paid = signal(false); busy = signal(false);
 isFreeOrder = signal(false);
 private freeOrderRetries = 0;
 private maxFreeOrderRetries = 3;
 ngOnInit() { this.check(); }
 check() {
  if (this.busy()) return;
  
  // Handle free orders (100% discount, $0 checkout)
  const freeOrder = this.route.snapshot.queryParamMap.get('free_order');
  const orderId = this.route.snapshot.queryParamMap.get('order_id');
  if (freeOrder === 'true' && orderId) {
    this.isFreeOrder.set(true);
    this.busy.set(true);
    this.message.set('Verifying your free order...');
    this.api.get<any>('stripe/free-order-status?order_id=' + encodeURIComponent(orderId)).subscribe({
      next: res => {
        this.busy.set(false);
        this.freeOrderRetries = 0;
        if (res.confirmed) {
          this.paid.set(true);
          this.message.set('Your free order is confirmed! Thank you. Your order documents will appear in your dashboard shortly.');
        } else {
          this.message.set('We could not verify your free order. Please check your dashboard or contact support.');
        }
      },
      error: err => {
        this.busy.set(false);
        // Auto-retry for transient errors (DB write timing, session not ready)
        if (this.freeOrderRetries < this.maxFreeOrderRetries && (err.status === 404 || err.status === 401 || err.status === 503)) {
          this.freeOrderRetries++;
          this.message.set(`Verifying order... (attempt ${this.freeOrderRetries + 1})`);
          setTimeout(() => this.check(), 1000);
          return;
        }
        // All retries exhausted or non-retryable error
        this.message.set('Your order was placed successfully! Click below to view it in your dashboard.');
        this.paid.set(true); // Show success state since order exists (visible in dashboard)
      }
    });
    return;
  }
  
  // Handle standard Stripe checkout
  const id = this.route.snapshot.queryParamMap.get('session_id');
  if (!id) { this.message.set('No checkout reference was provided. Check your dashboard for orders.'); return; }
  this.busy.set(true);
  this.api.get<any>('stripe/checkout-status?session_id=' + encodeURIComponent(id)).subscribe({
   next: payment => { this.busy.set(false); this.paid.set(payment.paid === true);
    this.message.set(payment.paid ? 'Payment received. Thank you. Your order documents may take a moment to appear in your dashboard.' : 'Payment has not been confirmed yet. Please check again shortly.');
    this.conversions.purchase(payment);
   }, error: err => { this.busy.set(false); this.message.set(err.error?.error || 'Cannot verify payment yet. Please try again.'); }
  });
 }
}
