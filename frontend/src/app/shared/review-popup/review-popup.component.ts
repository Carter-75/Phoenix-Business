import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-review-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Corner Sliding Popup -->
    <div *ngIf="showCornerPopup()" (click)="goToReviews()" class="fixed bottom-6 right-6 z-[150] bg-[#0a0a0f] border border-orange-500/30 rounded-xl p-4 shadow-2xl transition-all hover:-translate-y-1 hover:border-orange-500/60 group cursor-pointer" style="animation: slide-up 0.5s ease-out forwards;">
      <div class="flex items-center gap-4">
        
        <div class="w-12 h-12 rounded-full bg-orange-600/20 text-orange-500 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-star text-xl"></i>
        </div>
        
        <div class="pr-6">
          <h4 class="text-white font-black uppercase tracking-widest text-xs group-hover:text-orange-400 transition-colors">
            {{ isUpdateMode() ? 'Update Your Review' : 'How did we do?' }}
          </h4>
          <p class="text-slate-400 text-[10px] uppercase tracking-widest mt-1">
            {{ isUpdateMode() ? 'We noticed a low rating.' : 'Tap to review your order' }}
          </p>
        </div>
        
        <button class="absolute top-2 right-2 text-slate-500 hover:text-white p-1" (click)="dismissCorner($event)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ReviewPopupComponent implements OnInit {
  api = inject(ApiService);
  router = inject(Router);

  showCornerPopup = signal(false);
  cornerDismissed = signal(false);
  
  rawItems = signal<any[]>([]);

  reviewItems = computed(() => {
    return this.rawItems().filter(item => {
      // Keep if no review exists
      if (!item.hasReview) return true;
      // Keep if review exists, is <= 3.5, and has NOT been dismissed
      if (item.hasReview && item.rating <= 3.5 && !item.dismissedLowRating) return true;
      return false;
    });
  });

  isUpdateMode = computed(() => {
    // If the active item in the carousel would be an update
    const items = this.reviewItems();
    if (items.length === 0) return false;
    return items[0].hasReview && items[0].rating <= 3.5;
  });

  constructor() {
    effect(() => {
      const user = this.api.currentUser();
      if (user) {
        this.checkEligibility();
      }
    });
  }

  ngOnInit() {
    if (this.api.currentUser()) {
      this.checkEligibility();
    }
  }

  checkEligibility() {
    this.api.get<any[]>('reviews/status').subscribe({
      next: (res: any) => {
        this.rawItems.set(res);
        if (this.reviewItems().length > 0 && !this.cornerDismissed()) {
          // Check if we should auto-route to /leave-review (if coming from checkout)
          const params = new URLSearchParams(window.location.search);
          if (params.get('success') === 'true') {
            this.goToReviews();
          } else {
            this.showCornerPopup.set(true);
          }
        } else {
          this.showCornerPopup.set(false);
        }
      },
      error: (err: any) => console.error('Error checking review eligibility:', err)
    });
  }

  goToReviews() {
    this.showCornerPopup.set(false);
    this.router.navigate(['/leave-review']);
  }

  dismissCorner(event: Event) {
    event.stopPropagation();
    this.showCornerPopup.set(false);
    this.cornerDismissed.set(true);
  }
}
