import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ConversionService } from '../services/conversion.service';
@Component({
 selector: 'app-checkout-success', standalone: true, imports: [RouterLink],
 template: `<main class="max-w-2xl mx-auto px-6 pt-40 pb-24 text-white">
 <h1 class="text-3xl font-bold mb-6">Payment status</h1><p role="status">{{ message() }}</p>
 @if (!paid()) { <button class="mt-6 p-3 border rounded" [disabled]="busy()" (click)="check()">Check again</button> }
 @if (paid()) { <a class="inline-block mt-6 p-3 border rounded" routerLink="/leave-review">Continue</a> }
 <a class="block mt-6 underline" routerLink="/dashboard">Go to your dashboard</a></main>`
})
export class CheckoutSuccessComponent implements OnInit {
 private api = inject(ApiService); private route = inject(ActivatedRoute);
 private conversions = inject(ConversionService);
 message = signal('Checking your payment.'); paid = signal(false); busy = signal(false);
 ngOnInit() { this.check(); }
 check() {
  if (this.busy()) return;
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
