import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
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
    PromoBannerComponent
  ],
  template: `
    <app-promo-banner></app-promo-banner>
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
    <app-navbar></app-navbar>
    <main id="main-content">
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
  discountPercentage = signal(0);

  ngOnInit() {
    this.api.checkStatus().subscribe();
    this.api.get<any>('stripe/pricing').subscribe({
      next: (data) => this.discountPercentage.set(data.discountPercentage || 0),
      error: () => {}
    });
  }
}
