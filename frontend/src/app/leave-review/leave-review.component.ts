import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-leave-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="min-h-screen pt-32 sm:pt-48 pb-24 px-4 sm:px-6 bg-[#020205] relative flex flex-col items-center justify-start">
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/5 top-[-10%] right-[-10%] absolute pointer-events-none"></div>

      <div class="max-w-2xl w-full relative z-10 text-center">
        
        <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-2">Leave a <span class="text-orange-500">Review</span></h1>
        <p class="text-xl text-slate-400 mb-12 font-medium">Your feedback shapes our future.</p>

        <div *ngIf="loading()" class="py-12">
           <i class="fa-solid fa-circle-notch fa-spin text-4xl text-orange-600"></i>
        </div>

        <!-- Token Invalid State -->
        <div *ngIf="!loading() && reviewToken() && rawItems().length === 0" class="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-sm">
          <div class="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
            <i class="fa-solid fa-xmark text-4xl"></i>
          </div>
          <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-2">Invalid Link</h3>
          <p class="text-slate-400 text-sm mb-8">{{ formError() || 'This review link is invalid or has already been used.' }}</p>
          <a routerLink="/home" class="inline-block px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-all rounded-full text-white font-bold uppercase tracking-widest text-sm">
            Return to Home
          </a>
        </div>

        <div *ngIf="!loading() && !reviewToken() && reviewItems().length === 0" class="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-sm">
          <div class="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
            <i class="fa-solid fa-check text-4xl"></i>
          </div>
          <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-2">All Caught Up!</h3>
          <p class="text-slate-400 text-sm mb-8">You have no pending reviews at this time. Thank you for your feedback!</p>
          <a routerLink="/dashboard" class="inline-block px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-all rounded-full text-white font-bold uppercase tracking-widest text-sm">
            Return to Dashboard
          </a>
        </div>

        <div *ngIf="!loading() && reviewItems().length > 0" class="relative">
          
          <!-- Carousel Navigation (Top) -->
          <div *ngIf="reviewItems().length > 1" class="flex items-center justify-center gap-4 mb-6">
            <button (click)="prevSlide()" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center disabled:opacity-30">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Order {{ currentIndex() + 1 }} of {{ reviewItems().length }}
            </div>
            <button (click)="nextSlide()" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center disabled:opacity-30">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <!-- Carousel Card -->
          <div class="bg-[#050505] border border-white/10 rounded-2xl w-full z-10 relative overflow-hidden shadow-2xl text-left">
            <div class="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-600 to-yellow-500"></div>
            
            <form (ngSubmit)="submitReview()" class="p-6 sm:p-10">
              
              <!-- Header Info -->
              <div class="mb-8 p-4 bg-orange-600/5 border border-orange-500/20 rounded-xl flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-orange-600/20 text-orange-500 flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-box-open text-xl"></i>
                </div>
                <div>
                  <div class="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Reviewing Order</div>
                  <h3 class="text-white font-black text-lg leading-tight">{{ activeItem()?.projectName || 'Custom Project' }}</h3>
                  <div class="text-xs text-slate-400 mt-1" *ngIf="api.currentUser()">
                    <i class="fa-solid fa-user-circle mr-1"></i> Posting as <strong>{{ api.currentUser()?.firstName }} {{ api.currentUser()?.lastName }}</strong> <span *ngIf="api.currentUser()?.businessName">({{ api.currentUser()?.businessName }})</span>
                  </div>
                </div>
              </div>
              
              <!-- Admin Comment Display -->
              <div *ngIf="activeItem()?.adminComment" class="mb-8 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-xl">
                <div class="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2"><i class="fa-solid fa-reply mr-1"></i> Message from Phoenix</div>
                <p class="text-sm text-slate-300 italic">"{{ activeItem()?.adminComment }}"</p>
              </div>

              <!-- Update Prompt -->
              <div *ngIf="activeItem()?.hasReview && activeItem()?.rating <= 3.5" class="mb-8 p-4 bg-white/5 border border-white/10 rounded-xl">
                <p class="text-sm text-slate-300">You previously left a <strong>{{ activeItem()?.rating }} star</strong> review. We noticed it was a bit low—if we've resolved your issues, we'd love it if you updated your rating!</p>
              </div>

              <div class="text-center mb-8">
                 <h2 class="text-2xl font-black text-white uppercase tracking-tighter">Rate Your <span class="text-orange-500">Experience</span></h2>
                 <p class="text-slate-400 text-xs mt-2 font-medium">Click to select your rating</p>
              </div>

              <!-- Star Rating -->
              <div class="flex items-center justify-center gap-3 mb-8" (mouseleave)="hoverRating.set(0)">
                <ng-container *ngFor="let star of [1,2,3,4,5]">
                  <div class="relative cursor-pointer text-5xl">
                    <i class="fa-regular fa-star text-slate-800"></i>
                    <i class="fa-solid fa-star absolute top-0 left-0 text-yellow-500 transition-all duration-75" 
                       [ngStyle]="{'clip-path': getStarClipPath(star)}"></i>
                    
                    <div class="absolute inset-0 flex">
                      <div class="w-1/2 h-full" (mouseenter)="hoverRating.set(Math.max(1, star - 0.5))" (click)="$event.stopPropagation(); setRating(Math.max(1, star - 0.5))"></div>
                      <div class="w-1/2 h-full" (mouseenter)="hoverRating.set(star)" (click)="$event.stopPropagation(); setRating(star)"></div>
                    </div>
                  </div>
                </ng-container>
              </div>
              
              <div *ngIf="formError()" class="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-bold text-center">
                {{ formError() }}
              </div>
              
              <div *ngIf="formSuccess()" class="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-xs font-bold text-center">
                {{ formSuccess() }}
              </div>

              <!-- Form Fields -->
              <div class="space-y-4">
                <div *ngIf="!activeItem()?.hasReview">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Business Name *</label>
                  <input type="text" [(ngModel)]="businessName" name="businessName" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. Phoenix Digital" required>
                </div>
                
                <div *ngIf="!activeItem()?.hasReview" class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">First Name *</label>
                    <input type="text" [(ngModel)]="firstName" name="firstName" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors" placeholder="Jane" required>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Name</label>
                    <input type="text" [(ngModel)]="lastName" name="lastName" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors" placeholder="Doe">
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Message (Optional)</label>
                  <textarea [(ngModel)]="message" name="message" rows="4" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors resize-none" placeholder="Tell us what you liked or how we can improve..."></textarea>
                </div>
              </div>

              <button type="submit" [disabled]="submitting()" class="w-full mt-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20">
                {{ submitting() ? 'Processing...' : (activeItem()?.hasReview ? 'Update Review' : 'Submit Review') }}
              </button>
            </form>
          </div>
        </div>

      </div>
    </section>
  `
})
export class LeaveReviewComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);

  loading = signal(true);
  rawItems = signal<any[]>([]);
  reviewToken = signal<string | null>(null);
  Math = Math;
  
  reviewItems = computed(() => {
    return this.rawItems().filter(item => {
      // Keep if no review exists
      if (!item.hasReview) return true;
      // Keep if review exists, is <= 3.5, and has NOT been dismissed
      if (item.hasReview && item.rating <= 3.5 && !item.dismissedLowRating) return true;
      return false;
    });
  });

  currentIndex = signal(0);
  activeItem = computed(() => {
    const items = this.reviewItems();
    if (items.length === 0) return null;
    return items[this.currentIndex()];
  });

  rating = signal(0);
  hoverRating = signal(0);
  businessName = signal('');
  firstName = signal('');
  lastName = signal('');
  message = signal('');

  formError = signal('');
  formSuccess = signal('');
  submitting = signal(false);

  constructor() {
    effect(() => {
      const active = this.activeItem();
      if (active) {
        this.formError.set('');
        this.formSuccess.set('');
        
        if (active.hasReview) {
          // It's an update scenario
          this.rating.set(active.rating || 0);
          this.message.set(active.message || '');
        } else {
          // New review, prefill from user profile or token response
          const user = this.api.currentUser();
          this.rating.set(0);
          this.message.set('');
          
          if (!this.businessName() && user) this.businessName.set(user.businessName || '');
          if (!this.firstName() && user) this.firstName.set(user.firstName || '');
          if (!this.lastName() && user) this.lastName.set(user.lastName || '');
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.reviewToken.set(token);
      this.fetchTokenStatus(token);
    } else {
      this.fetchStatus();
    }
  }

  fetchTokenStatus(token: string) {
    this.loading.set(true);
    this.api.get<any>(`reviews/token/${token}`).subscribe({
      next: (res) => {
        this.rawItems.set([{
          ...res,
          hasReview: false
        }]);
        this.businessName.set(res.businessName);
        this.firstName.set(res.firstName);
        this.lastName.set(res.lastName);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.formError.set(err.error?.message || 'Invalid review link.');
        this.rawItems.set([]);
        this.loading.set(false);
      }
    });
  }

  fetchStatus() {
    this.loading.set(true);
    this.api.get<any[]>('reviews/status').subscribe({
      next: (res) => {
        this.rawItems.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  getStarClipPath(starIndex: number) {
    const current = this.hoverRating() > 0 ? this.hoverRating() : this.rating();
    if (current >= starIndex) return 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
    if (current >= starIndex - 0.5) return 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
    return 'polygon(0 0, 0 0, 0 100%, 0 100%)';
  }

  setRating(val: number) {
    this.rating.set(val);
  }

  prevSlide() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(v => v - 1);
    } else {
      this.currentIndex.set(this.reviewItems().length - 1); // Wrap around
    }
  }

  nextSlide() {
    if (this.currentIndex() < this.reviewItems().length - 1) {
      this.currentIndex.update(v => v + 1);
    } else {
      this.currentIndex.set(0); // Wrap around
    }
  }

  submitReview() {
    this.formError.set('');
    this.formSuccess.set('');
    const active = this.activeItem();
    if (!active) return;

    if (this.rating() === 0) {
      this.formError.set('Please select a star rating.');
      return;
    }

    this.submitting.set(true);

    if (this.reviewToken()) {
      // Unauthenticated submission using token
      if (!this.businessName() || !this.firstName()) {
        this.formError.set('Business Name and First Name are required.');
        this.submitting.set(false);
        return;
      }

      this.api.post<any>(`reviews/token/${this.reviewToken()}`, {
        businessName: this.businessName(),
        firstName: this.firstName(),
        lastName: this.lastName(),
        rating: this.rating(),
        message: this.message()
      }).subscribe({
        next: (res: any) => this.handleSuccess('Review submitted successfully!', res),
        error: (err: any) => this.handleError(err)
      });
      return;
    }

    if (active.hasReview) {
      // UPDATE existing review
      this.api.patch<any>(`reviews/${active.reviewId}`, {
        rating: this.rating(),
        message: this.message()
      }).subscribe({
        next: (res: any) => this.handleSuccess('Review updated successfully!', res),
        error: (err: any) => this.handleError(err)
      });
    } else {
      // CREATE new review
      if (!this.businessName() || !this.firstName()) {
        this.formError.set('Business Name and First Name are required.');
        this.submitting.set(false);
        return;
      }

      this.api.post<any>('reviews', {
        contractId: active.contractId,
        projectName: active.projectName,
        businessName: this.businessName(),
        firstName: this.firstName(),
        lastName: this.lastName(),
        rating: this.rating(),
        message: this.message()
      }).subscribe({
        next: (res: any) => this.handleSuccess('Review submitted successfully!', res),
        error: (err: any) => this.handleError(err)
      });
    }
  }

  handleSuccess(msg: string, updatedReview: any) {
    this.submitting.set(false);
    this.formSuccess.set(msg);
    
    setTimeout(() => {
      if (this.reviewToken()) {
        this.reviewToken.set(null); // Force it to show success message and no longer try to use token
        this.rawItems.set([]); // Show all caught up
      } else {
        this.fetchStatus();
      }
      this.currentIndex.set(0); // Reset to first item
    }, 1500);
  }

  handleError(err: any) {
    this.submitting.set(false);
    this.formError.set(err.error?.message || 'Something went wrong.');
  }
}
