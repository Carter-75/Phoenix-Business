import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemePromotionService } from '../../../services/theme-promotion.service';

@Component({
  selector: 'app-promo-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside *ngIf="visible() && banner().bannerText" 
           aria-label="Seasonal announcement"
           class="relative z-[120] w-full bg-gradient-to-r from-[#020205] via-[var(--theme-primary)]/15 to-[#020205] border-b border-[var(--theme-primary)]/25 py-2.5 px-4 text-center transition-all duration-500">
      <div class="max-w-[1400px] mx-auto flex items-center justify-between gap-4 text-xs">
        
        <!-- Left Spacer for balancing close button -->
        <div class="hidden sm:block w-8"></div>

        <!-- Center Message -->
        <div class="flex-1 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
          <!-- Holiday / Theme Badge -->
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/40 text-[var(--theme-primary)] shadow-[0_0_15px_var(--theme-glow)]">
            <span class="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] animate-pulse"></span>
            {{ banner().name }}
          </span>

          <!-- Promotional Headline -->
          <span class="font-medium text-white/90 tracking-wide text-[11px] sm:text-xs">
            {{ banner().bannerText }}
          </span>

          <!-- Discount Pill if active and not already mentioned in headline -->
          <span *ngIf="banner().discountPercent > 0 && !banner().bannerText.includes(banner().discountPercent + '%')" class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
            Save {{ banner().discountPercent }}%
          </span>

          <!-- CTA Link -->
          <a *ngIf="banner().ctaLink" 
             [routerLink]="banner().ctaLink" 
             class="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] hover:text-white transition-colors underline underline-offset-4">
            {{ banner().ctaText || 'Learn More' }}
            <i class="fas fa-arrow-right text-[8px]"></i>
          </a>
        </div>

        <!-- Dismiss Button -->
        <button (click)="dismiss()" 
                aria-label="Dismiss promotional banner"
                class="text-white/40 hover:text-white transition-colors p-1">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class PromoBannerComponent {
  private themePromo = inject(ThemePromotionService);
  private readonly DISMISS_KEY = 'phoenix_banner_dismissed_v1';

  public banner = this.themePromo.bannerContent;
  public visible = signal(true);

  constructor() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const isDismissed = sessionStorage.getItem(this.DISMISS_KEY);
        if (isDismissed === 'true') {
          this.visible.set(false);
        }
      }
    } catch (e) {}
  }

  dismiss() {
    this.visible.set(false);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.DISMISS_KEY, 'true');
      }
    } catch (e) {}
  }
}
