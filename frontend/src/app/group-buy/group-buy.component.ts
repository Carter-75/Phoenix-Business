import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { environment } from '../../environments/environment';

declare global {
  interface Window { Stripe?: any; }
}

/**
 * Public group buy page. What is sold here is a discount (a high
 * percent off with a dollar cap), never a website. Joining saves a
 * card with Stripe; the join price is charged only if the group fills
 * by the deadline stated on this page. Copy rules: no countdown
 * theatrics, no fake scarcity, every material term in the terms box
 * above the join button.
 */
@Component({
  selector: 'app-group-buy',
  standalone: true,
  imports: [RouterLink, SkeletonComponent],
  template: `
  <main class="max-w-3xl mx-auto px-6 pt-40 pb-24 text-white">
    @if (loading()) {
      <app-skeleton variant="page" [count]="2"></app-skeleton>
    } @else if (!event()) {
      <h1 class="text-3xl font-bold mb-4">Group Buy</h1>
      <p class="text-white/80 leading-relaxed">
        No group buy is running right now. When one opens, a small group of
        businesses joins together, and if the group fills, everyone gets the
        group discount. Regular website pricing is always available on the
        <a routerLink="/services" class="underline">services page</a>.
      </p>
    } @else {
      <h1 class="text-3xl font-bold mb-3">{{ event().name }}</h1>
      <p class="text-white/80 leading-relaxed mb-8">
        A few businesses band together for a better price. Joining buys you a
        personal discount code: <strong class="text-white">{{ event().percentOff }}% off</strong>,
        applied to up to {{ money(event().capSetupCents) }} of a website setup price and up to
        {{ money(event().capMonthlyCents) }} of the monthly price, on any package.
        The discount is the product here; the website itself is bought separately, later,
        at the normal checkout with your code.
      </p>

      <div class="border border-white/15 rounded-xl p-6 mb-8 bg-white/5">
        <p class="text-lg">
          <strong>{{ event().joinedCount }} of {{ event().slotsNeeded }}</strong> joined
        </p>
        <p class="text-white/70 mt-1 text-sm">{{ event().capacityReason }}</p>
        <p class="text-white/70 mt-3 text-sm">
          Group closes: <span class="text-white">{{ deadlineText() }}</span>
        </p>
        <p class="text-white/70 text-sm">
          Join price: <span class="text-white">{{ money(event().joinPriceCents) }}</span>,
          charged only if the group fills.
        </p>
      </div>

      @if (event().status === 'missed') {
        <div class="border border-white/15 rounded-xl p-6 mb-8">
          <p class="font-semibold mb-1">This group did not fill.</p>
          <p class="text-white/70 text-sm">Nobody was charged. If you joined, you already got an email confirming that.</p>
        </div>
      } @else if (event().status === 'completed' || event().status === 'filling') {
        <div class="border border-white/15 rounded-xl p-6 mb-8">
          <p class="font-semibold mb-1">This group filled.</p>
          <p class="text-white/70 text-sm">Joiners were charged the join price and emailed their personal discount codes.</p>
        </div>
      }

      @if (myEntry(); as entry) {
        <div class="border border-orange-400/40 rounded-xl p-6 mb-8 bg-orange-400/10">
          @if (entry.status === 'joined') {
            <p class="font-semibold">You are in this group.</p>
            <p class="text-white/75 text-sm mt-1">
              Your card is saved and will be charged {{ money(entry.joinPriceCents) }} only if the
              group reaches {{ event().slotsNeeded }} by {{ deadlineText() }}. If it does not fill,
              your card is never charged.
            </p>
            <button (click)="cancelEntry()" [disabled]="busy()" class="mt-4 px-4 py-2 rounded-lg border border-white/30 hover:bg-white/10 disabled:opacity-50 cursor-pointer">
              Leave the group (free)
            </button>
          } @else if (entry.status === 'charged') {
            <p class="font-semibold">The group filled. Your discount code:</p>
            <p class="text-2xl font-mono tracking-widest mt-2">{{ entry.couponCode }}</p>
            <p class="text-white/75 text-sm mt-2">
              Enter it at checkout when you build your site at
              <a routerLink="/services" class="underline">Services</a>. It is tied to your account and works once.
            </p>
          } @else if (entry.status === 'charge_failed') {
            <p class="font-semibold">Your spot is held, but your saved card could not be charged.</p>
            <p class="text-white/75 text-sm mt-1">
              Pay the {{ money(entry.joinPriceCents) }} join price with a working card by
              {{ fixDeadlineText() }} to keep your {{ event().percentOff }}% discount.
            </p>
            <button (click)="fixPayment()" [disabled]="busy()" class="mt-4 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 font-semibold disabled:opacity-50 cursor-pointer">
              Pay now and keep my discount
            </button>
          } @else if (entry.status === 'not_charged') {
            <p class="font-semibold">This group did not fill, and your card was never charged.</p>
          } @else if (entry.status === 'dropped') {
            <p class="font-semibold">Your payment window closed, so this spot was released.</p>
          }
          @if (message()) { <p class="mt-3 text-sm text-white/80">{{ message() }}</p> }
        </div>
      } @else if (event().status === 'open') {
        <div class="border border-white/15 rounded-xl p-6 mb-8 text-sm leading-relaxed text-white/85">
          <p class="font-semibold text-white text-base mb-3">The full terms, before you join</p>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>Regular prices are the live prices on the services page. This group price is {{ event().percentOff }}% off up to {{ money(event().capSetupCents) }} of the setup price and up to {{ money(event().capMonthlyCents) }} of the monthly price. The most the code can ever take off is {{ money(maxSetupSaving()) }} on setup and {{ money(maxMonthlySaving()) }} a month.</li>
            <li>The group runs if {{ event().slotsNeeded }} people join by {{ deadlineText() }}. The count on this page is the real join list.</li>
            <li>Joining saves your card with Stripe. You are charged {{ money(event().joinPriceCents) }} once, only if the group fills, at the moment it fills. If it does not fill, your card is never charged and there is nothing to refund.</li>
            <li>The {{ money(event().joinPriceCents) }} buys the discount itself. It is not a deposit and does not come off your project price later.</li>
            <li>You can leave free any time before the group fills, from this page or your dashboard. No call, no pitch.</li>
            <li>If the group fills but your card cannot be charged, you get 7 days to pay with a working card before the spot is released. The group still runs for everyone else.</li>
            <li>After a fill, your personal code arrives by email. It is tied to your account, works once, and must be used within {{ event().redeemWindowDays }} days. Projects are scheduled in the order codes are redeemed.</li>
            <li>Organizer: Phoenix Websites AI (Carter), La Crosse, Wisconsin. Contact: hello&#64;phoenixwebsites.ai.</li>
          </ul>
        </div>

        @if (!user()) {
          <button (click)="signIn()" class="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-400 font-semibold cursor-pointer">
            Sign in to join
          </button>
          <p class="text-white/60 text-sm mt-3">An account is needed so your discount code can be tied to you.</p>
        } @else if (!showCardForm()) {
          <button (click)="startJoin()" [disabled]="busy()" class="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-400 font-semibold disabled:opacity-50 cursor-pointer">
            Join for {{ money(event().joinPriceCents) }} if the group fills
          </button>
        } @else {
          <div class="border border-white/15 rounded-xl p-6">
            <p class="text-sm text-white/85 leading-relaxed mb-4">
              By saving your card you agree: Phoenix Websites AI may charge this card
              {{ money(event().joinPriceCents) }} once, only if this group reaches
              {{ event().slotsNeeded }} people by {{ deadlineText() }}. If it does not,
              the card is never charged.
            </p>
            <label class="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Card details</label>
      <div id="gb-card-element" role="group" aria-label="Card details" class="p-3 rounded-lg bg-white text-black"></div>
            <button (click)="confirmJoin()" [disabled]="busy()" class="mt-4 px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-400 font-semibold disabled:opacity-50 cursor-pointer">
              {{ busy() ? 'Saving your card...' : 'Save card and join' }}
            </button>
          </div>
        }
        @if (message()) { <p class="mt-4 text-sm" [class.text-red-300]="isError()" [class.text-white/80]="!isError()">{{ message() }}</p> }
      }
    }
  </main>`,
  styles: [`:host { display: block; }`]
})
export class GroupBuyComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly event = signal<any>(null);
  protected readonly myEntry = signal<any>(null);
  protected readonly user = signal<any>(null);
  protected readonly showCardForm = signal(false);
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly isError = signal(false);

  private stripe: any = null;
  private cardElement: any = null;
  private clientSecret = '';

  ngOnInit() {
    this.user.set(this.api.currentUser());
    this.api.get<any>('group-buy/current').subscribe({
      next: (res) => {
        this.event.set(res.event);
        this.loading.set(false);
        this.loadMine();
        this.maybeConfirmFix();
      },
      error: () => { this.loading.set(false); }
    });
  }

  private loadMine() {
    if (!this.api.currentUser()) return;
    this.api.get<any>('group-buy/mine').subscribe({
      next: (res) => {
        const ev = this.event();
        const mine = (res.entries || []).find((e: any) => ev && e.event && e.event.id === ev.id && e.status !== 'cancelled_by_buyer');
        this.myEntry.set(mine || null);
      },
      error: () => {}
    });
  }

  private maybeConfirmFix() {
    const params = this.route.snapshot.queryParams;
    const sessionId = params['fix_session'];
    const entryId = params['entry'];
    if (!sessionId || !entryId || !this.api.currentUser()) return;
    this.api.post<any>(`group-buy/entries/${entryId}/fix-confirm`, { sessionId }).subscribe({
      next: () => { this.say('Payment confirmed. Your discount code is below and was emailed to you.', false); this.loadMine(); },
      error: (err) => this.say(err.error?.error || 'That payment could not be confirmed yet.', true)
    });
  }

  protected money(cents: number): string {
    return `$${((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  protected maxSetupSaving(): number {
    const e = this.event(); return e ? Math.round(e.capSetupCents * (e.percentOff / 100)) : 0;
  }
  protected maxMonthlySaving(): number {
    const e = this.event(); return e ? Math.round(e.capMonthlyCents * (e.percentOff / 100)) : 0;
  }
  protected deadlineText(): string {
    const e = this.event();
    if (!e?.deadline) return '';
    return new Date(e.deadline).toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  }
  protected fixDeadlineText(): string {
    const entry = this.myEntry();
    if (!entry?.fixDeadline) return '';
    return new Date(entry.fixDeadline).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  }

  protected say(text: string, isErr: boolean) {
    this.message.set(text);
    this.isError.set(isErr);
  }

  protected signIn() {
    this.api.loginWithGoogle('/group-buy');
  }

  protected startJoin() {
    this.busy.set(true);
    this.api.post<any>('group-buy/join/setup-intent', {}).subscribe({
      next: async (res) => {
        this.clientSecret = res.clientSecret;
        this.showCardForm.set(true);
        this.busy.set(false);
        await this.mountCard();
      },
      error: (err) => { this.busy.set(false); this.say(err.error?.error || 'Could not start joining.', true); }
    });
  }

  private async loadStripe(): Promise<any> {
    if (window.Stripe) return window.Stripe(environment.stripePublishableKey);
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Stripe failed to load'));
      document.head.appendChild(s);
    });
    return window.Stripe(environment.stripePublishableKey);
  }

  private async mountCard() {
    try {
      this.stripe = await this.loadStripe();
      const elements = this.stripe.elements();
      this.cardElement = elements.create('card', { hidePostalCode: false });
      // The container renders with the form; wait one tick for it.
      setTimeout(() => this.cardElement.mount('#gb-card-element'), 0);
    } catch {
      this.say('The secure card form could not load. Please refresh and try again.', true);
    }
  }

  protected async confirmJoin() {
    if (!this.stripe || !this.cardElement || !this.clientSecret) return;
    this.busy.set(true);
    const user = this.api.currentUser();
    const result = await this.stripe.confirmCardSetup(this.clientSecret, {
      payment_method: {
        card: this.cardElement,
        billing_details: { email: user?.email, name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() }
      }
    });
    if (result.error) {
      this.busy.set(false);
      this.say(result.error.message || 'That card could not be saved.', true);
      return;
    }
    this.api.post<any>('group-buy/join/complete', { setupIntentId: result.setupIntent.id }).subscribe({
      next: () => {
        this.busy.set(false);
        this.showCardForm.set(false);
        this.say('You are in. Watch your email for updates, and for your code if the group fills.', false);
        this.api.get<any>('group-buy/current').subscribe({ next: (res) => this.event.set(res.event) });
        this.loadMine();
      },
      error: (err) => { this.busy.set(false); this.say(err.error?.error || 'Could not finish joining.', true); }
    });
  }

  protected cancelEntry() {
    const entry = this.myEntry();
    if (!entry) return;
    this.busy.set(true);
    this.api.post<any>(`group-buy/entries/${entry.id}/cancel`, {}).subscribe({
      next: () => { this.busy.set(false); this.myEntry.set(null); this.say('You left the group. Your card will not be charged.', false); },
      error: (err) => { this.busy.set(false); this.say(err.error?.error || 'Could not cancel.', true); }
    });
  }

  protected fixPayment() {
    const entry = this.myEntry();
    if (!entry) return;
    this.busy.set(true);
    this.api.post<any>(`group-buy/entries/${entry.id}/fix-checkout`, {}).subscribe({
      next: (res) => { window.location.href = res.url; },
      error: (err) => { this.busy.set(false); this.say(err.error?.error || 'Could not open the payment page.', true); }
    });
  }
}
