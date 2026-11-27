import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { BackgroundAnimationComponent } from './shared/background-animation/background-animation.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ReviewPopupComponent } from './shared/review-popup/review-popup.component';
import { AiBotComponent } from './shared/ai-bot/ai-bot.component';
import { CartFabComponent } from './shared/cart-fab/cart-fab.component';
import { CartDrawerComponent } from './shared/cart-drawer/cart-drawer.component';
import { ApiService } from './services/api.service';
import { VoiceCallModalComponent } from './shared/voice-call-modal/voice-call-modal.component';

import { PromoBannerComponent } from './shared/components/promo-banner/promo-banner.component';
import { TermsGateComponent } from './shared/components/terms-gate/terms-gate.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    BackgroundAnimationComponent,
    FooterComponent,
    ReviewPopupComponent,
    AiBotComponent,
    CartFabComponent,
    CartDrawerComponent,
    VoiceCallModalComponent,
    PromoBannerComponent,
    TermsGateComponent
  ],
  template: `
    <app-promo-banner></app-promo-banner>
    <app-terms-gate></app-terms-gate>
    @defer (on idle) {
      <app-background-animation></app-background-animation>
    }
    <div class="fire-container">
      <div class="fire-bar" style="left: 10%; animation-delay: 0s;"></div>
      <div class="fire-bar" style="left: 30%; animation-delay: -2s;"></div>
      <div class="fire-bar" style="left: 50%; animation-delay: -5s;"></div>
      <div class="fire-bar" style="left: 70%; animation-delay: -1s;"></div>
      <div class="fire-bar" style="left: 90%; animation-delay: -7s;"></div>
    </div>
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[400] focus:bg-orange-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg text-xs font-bold">Skip to main content</a>
    <app-navbar></app-navbar>
    <main id="main-content" [class.page-enter]="pageEntering()">
      <router-outlet></router-outlet>
    </main>
    @defer (on idle) {
      <app-review-popup></app-review-popup>
      <app-cart-fab></app-cart-fab>
      <app-cart-drawer></app-cart-drawer>
      <app-ai-bot></app-ai-bot>
      <app-voice-call-modal></app-voice-call-modal>
    }
    <app-footer></app-footer>
  `,
})
export class App implements OnInit {
  api = inject(ApiService);
  router = inject(Router);
  discountPercentage = signal(0);
  pageEntering = signal(false);
  private leaving = false;

  ngOnInit() {
    this.api.checkStatus().subscribe();
    this.api.get<any>('stripe/pricing').subscribe({
      next: (data) => this.discountPercentage.set(data.discountPercentage || 0),
      error: () => {}
    });
    this.setupPageTransitions();
  }

  // Page transitions (Carter, Nov 26, 2026): the exit animation finishes
  // BEFORE the router moves, then the new page springs in. Internal anchor
  // clicks are held for the 240ms exit, then navigation runs. Reduced
  // motion and modified clicks (new tab etc.) pass straight through.
  private setupPageTransitions() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.addEventListener('click', (event: MouseEvent) => {
      if (reduced || this.leaving) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement).closest?.('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/') || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(href, window.location.origin);
      if (url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      this.leaving = true;
      document.body.classList.add('page-exit');
      window.setTimeout(() => {
        this.router.navigateByUrl(url.pathname + url.search + url.hash).finally(() => {
          document.body.classList.remove('page-exit');
          this.leaving = false;
        });
      }, 240);
    }, true);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.pageEntering.set(false);
        requestAnimationFrame(() => {
          this.pageEntering.set(true);
          window.setTimeout(() => this.pageEntering.set(false), 360);
        });
      }
    });
  }
}
