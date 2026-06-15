import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { BackgroundAnimationComponent } from './shared/background-animation/background-animation.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ReviewPopupComponent } from './shared/review-popup/review-popup.component';
import { AiBotComponent } from './shared/ai-bot/ai-bot.component';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, BackgroundAnimationComponent, FooterComponent, ReviewPopupComponent, AiBotComponent],
  template: `
    <div *ngIf="discountPercentage() > 0" class="bg-orange-600 text-white text-center py-2 px-4 text-[10px] sm:text-xs font-black uppercase tracking-widest fixed top-0 w-full z-[100] shadow-xl">
      🚀 Business Opening Deal: {{discountPercentage()}}% Off All Plans & Services!
    </div>
    <app-background-animation></app-background-animation>
    <div class="fire-container">
      <div class="fire-bar" style="left: 10%; animation-delay: 0s;"></div>
      <div class="fire-bar" style="left: 30%; animation-delay: -2s;"></div>
      <div class="fire-bar" style="left: 50%; animation-delay: -5s;"></div>
      <div class="fire-bar" style="left: 70%; animation-delay: -1s;"></div>
      <div class="fire-bar" style="left: 90%; animation-delay: -7s;"></div>
    </div>
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-review-popup></app-review-popup>
    <app-ai-bot></app-ai-bot>
    <app-footer></app-footer>
  `,
})
export class App implements OnInit {
  api = inject(ApiService);
  discountPercentage = signal(0);

  ngOnInit() {
    this.api.get<any>('stripe/pricing').subscribe({
      next: (data) => this.discountPercentage.set(data.discountPercentage || 0),
      error: () => {}
    });
  }
}
