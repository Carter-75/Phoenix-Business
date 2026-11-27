import { Component, inject, OnInit, OnDestroy, signal, effect, computed } from '@angular/core';
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
        <div *ngIf="!loading() && reviewToken() && rawItems().length === 0" class="glass-panel border border-white/10 rounded-2xl p-12 backdrop-blur-sm">
          <div class="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
            <i class="fa-solid fa-xmark text-4xl"></i>
          </div>
          <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-2">Invalid Link</h3>
          <p class="text-slate-400 text-sm mb-8">{{ formError() || 'This review link is invalid or has already been used.' }}</p>
          <a routerLink="/" class="btn-ghost press-spring">
            Return to Home
          </a>
        </div>

        <div *ngIf="!loading() && !reviewToken() && reviewItems().length === 0" class="glass-panel border border-white/10 rounded-2xl p-12 backdrop-blur-sm">
          <div class="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
            <i class="fa-solid fa-check text-4xl"></i>
          </div>
          <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-2">All Caught Up!</h3>
          <p class="text-slate-400 text-sm mb-8">You have no pending reviews at this time. Thank you for your feedback!</p>
          <div *ngIf="googleReviewUrl()" class="mb-8 p-5 bg-white/5 border border-white/10 rounded-xl">
            <p class="text-white font-bold text-sm mb-1">Still want to leave a review?</p>
            <p class="text-slate-400 text-xs leading-relaxed mb-4">You can still review us directly on Google. It takes about 30 seconds, and it shows on our reviews page automatically.</p>
            <a [href]="googleReviewUrl()" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-200 text-slate-900 transition-all rounded-full text-xs font-bold uppercase tracking-widest"><i class="fa-brands fa-google"></i> Review Us on Google</a>
          </div>
          <a routerLink="/dashboard" class="btn-ghost press-spring">
            Return to Dashboard
          </a>
        </div>

        <div *ngIf="!loading() && reviewItems().length > 0 && !handoffActive()" class="relative">
          
          <!-- Carousel Navigation (Top) -->
          <div *ngIf="reviewItems().length > 1" class="flex items-center justify-center gap-4 mb-6">
            <button (click)="prevSlide()" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center disabled:opacity-30" aria-label="Previous project"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Order {{ currentIndex() + 1 }} of {{ reviewItems().length }}
            </div>
            <button (click)="nextSlide()" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center disabled:opacity-30" aria-label="Next project"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </button>
          </div>

          <!-- Direct-to-Google Card (new reviews are written on Google) -->
          <div *ngIf="activeItem() && !activeItem()?.hasReview" class="bg-[#050505] border border-white/10 rounded-2xl w-full z-10 relative overflow-hidden shadow-2xl text-left">
            <div class="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
            <div class="p-6 sm:p-10 text-center">
              <div class="mb-8 p-4 bg-orange-600/5 border border-orange-500/20 rounded-xl flex items-center gap-4 text-left">
                <div class="w-12 h-12 rounded-full bg-orange-600/20 text-orange-500 flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-box-open text-xl"></i>
                </div>
                <div>
                  <div class="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Reviewing Order</div>
                  <h3 class="text-white font-black text-lg leading-tight">{{ activeItem()?.projectName || 'Custom Project' }}</h3>
                </div>
              </div>
              <div class="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                <i class="fa-brands fa-google text-4xl text-white"></i>
              </div>
              <h2 class="text-2xl font-black text-white uppercase tracking-tighter mb-3">Write Your Review on <span class="text-orange-500">Google</span></h2>
              <p class="text-slate-400 text-sm leading-relaxed max-w-md mx-auto mb-8">Our reviews live on Google, where everyone can verify them. Tap the button, write your review there, then come back to this tab: we will confirm it here, and it shows on our reviews page automatically.</p>
              <button type="button" (click)="goToGoogleDirect()" class="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-200 text-slate-900 transition-all rounded-full text-sm font-bold uppercase tracking-widest"><i class="fa-brands fa-google"></i> Write a Review on Google</button>
              <p class="text-slate-600 text-[11px] leading-relaxed mt-6">Already posted it? It appears on our reviews page on its own once Google publishes it.</p>
            </div>
          </div>

          <!-- Carousel Card (legacy website reviews only) -->
          <div *ngIf="activeItem()?.hasReview" class="bg-[#050505] border border-white/10 rounded-2xl w-full z-10 relative overflow-hidden shadow-2xl text-left">
            <div class="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
            
            <form (ngSubmit)="submitReview()" class="p-6 sm:p-10">
              
              <!-- Header Info -->
              <div class="mb-8 p-4 bg-orange-600/5 border border-orange-500/20 rounded-xl flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-orange-600/20 text-orange-500 flex items-center justify-center shrink-0">
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
                <p class="text-sm text-slate-300">You previously left a <strong>{{ activeItem()?.rating }} star</strong> review. You can update your review below if your experience has changed.</p>
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
                    <i class="fa-solid fa-star absolute top-0 left-0 text-orange-500 transition-all duration-75" 
                       [ngStyle]="{'clip-path': getStarClipPath(star)}"></i>
                    
                    <div class="absolute inset-0 flex" role="radiogroup" aria-label="Your rating">
                      <button type="button" class="w-1/2 h-full" role="radio" [attr.aria-checked]="rating() === Math.max(1, star - 0.5)" [attr.aria-label]="'Rate ' + Math.max(1, star - 0.5) + ' stars'" (mouseenter)="hoverRating.set(Math.max(1, star - 0.5))" (click)="$event.stopPropagation(); setRating(Math.max(1, star - 0.5))"></button>
                      <button type="button" class="w-1/2 h-full" role="radio" [attr.aria-checked]="rating() === star" [attr.aria-label]="'Rate ' + star + ' stars'" (mouseenter)="hoverRating.set(star)" (click)="$event.stopPropagation(); setRating(star)"></button>
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
                  <input type="text" [(ngModel)]="businessName" name="businessName" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. Wild Rise Sourdough" required>
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

              <button type="submit" [disabled]="submitting()" class="btn-fire press-spring w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ submitting() ? 'Processing...' : 'Update Review' }}
              </button>
            </form>
          </div>
        </div>

        <!-- Google Handoff Panel -->
        <div *ngIf="!loading() && handoffActive()" class="bg-[#050505] border border-white/10 rounded-2xl w-full z-10 relative overflow-hidden shadow-2xl text-left">
          <div class="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          <div class="p-6 sm:p-10">

            <ng-container *ngIf="handoffStep() === 'waiting'">
              <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-6">
                  <i class="fa-brands fa-google text-4xl"></i>
                </div>
                <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-2">Finish on Google, Then Come Back</h3>
                <p class="text-slate-400 text-sm leading-relaxed max-w-md mx-auto mb-8">Google opened in a new tab. Write your review there and tap Post, then come back to this tab. We check automatically, confirm it here, and it joins our reviews page on its own.</p>
                <p class="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-6"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Watching for your review to appear</p>
                <a *ngIf="googleReviewUrl()" [href]="googleReviewUrl()" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-200 text-slate-900 transition-all rounded-full text-xs font-bold uppercase tracking-widest"><i class="fa-brands fa-google"></i> Open Google Again</a>
              </div>
            </ng-container>

            <ng-container *ngIf="handoffStep() === 'found'">
              <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
                  <i class="fa-solid fa-check text-4xl"></i>
                </div>
                <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-2">Your Review Is Live</h3>
                <p class="text-slate-400 text-sm mb-8">It is posted on Google and now shows on our reviews page too. Thank you!</p>
                <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a routerLink="/reviews" class="btn-fire press-spring">See It on Our Reviews Page</a>
                  <a routerLink="/" class="btn-ghost press-spring">Back to Home</a>
                </div>
              </div>
            </ng-container>

            <ng-container *ngIf="handoffStep() === 'timeout'">
              <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-6">
                  <i class="fa-solid fa-clock text-4xl"></i>
                </div>
                <h3 class="text-2xl font-black text-white uppercase tracking-tight mb-2">Google Is Still Publishing It</h3>
                <p class="text-slate-400 text-sm mb-8">Google sometimes takes a while to show a new review. Nothing more for you to do: it will appear on our reviews page automatically as soon as Google makes it public.</p>
                <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a routerLink="/reviews" class="btn-fire press-spring">Go to Reviews Page</a>
                  <a routerLink="/" class="btn-ghost press-spring">Back to Home</a>
                </div>
              </div>
            </ng-container>

          </div>
        </div>

      </div>
    </section>
  `
})
export class LeaveReviewComponent implements OnInit, OnDestroy {
  api = inject(ApiService);
  route = inject(ActivatedRoute);

  loading = signal(true);
  rawItems = signal<any[]>([]);
  reviewToken = signal<string | null>(null);
  targetContractId = signal<string | null>(null);
  Math = Math;
  
  reviewItems = computed(() => {
    return this.rawItems().filter(item => {
      // Keep if no review exists
      if (!item.hasReview) return true;
      // Contracts already handed off to Google are done, not editable here
      if (item.viaGoogle) return false;
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
  googleReviewUrl = signal('');

  // Google handoff state: the review is written here, posted on Google, and
  // this page then watches for it to appear in the synced Google feed.
  handoffStep = signal<'idle' | 'waiting' | 'found' | 'timeout'>('idle');
  handoffActive = computed(() => this.handoffStep() !== 'idle');
  draftText = signal('');
  draftName = signal('');
  googleStars = computed(() => Math.max(1, Math.round(this.rating())));
  private watchTimer: any = null;
  private watchStartedAt = 0;
  private visibilityHandler = () => {
    if (document.visibilityState === 'visible' && this.handoffStep() === 'waiting') {
      this.checkForMyReview();
    }
  };

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
    // Check for contractId query param (deep-link from ratings page)
    const contractId = this.route.snapshot.queryParamMap.get('contractId');
    if (contractId) {
      this.targetContractId.set(contractId);
    }

    if (token) {
      this.reviewToken.set(token);
      this.fetchTokenStatus(token);
    } else {
      this.fetchStatus();
    }

    this.api.get<{ reviewUrl: string }>('reviews/google').subscribe({
      next: (res) => this.googleReviewUrl.set(res?.reviewUrl || ''),
      error: () => {}
    });
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

        // Auto-select carousel item if contractId query param was provided
        const target = this.targetContractId();
        if (target) {
          const items = this.reviewItems();
          const idx = items.findIndex((item: any) => item.contractId === target);
          if (idx >= 0) {
            this.currentIndex.set(idx);
          }
        }
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  getStarClipPath(starIndex: number) {
    const current = this.hoverRating() > 0 ? this.hoverRating() : this.rating();
    if (current >= starIndex) return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    if (current >= starIndex - 0.5) return 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)';
    return 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
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

    if (active.hasReview) {
      // Legacy website review update. Reviews posted on Google are edited
      // on Google, never here.
      this.submitting.set(true);
      this.api.patch<any>(`reviews/${active.reviewId}`, {
        rating: this.rating(),
        message: this.message()
      }).subscribe({
        next: (res: any) => this.handleSuccess('Review updated successfully!', res),
        error: (err: any) => this.handleError(err)
      });
      return;
    }

    // New reviews are written on Google, not here.
    this.goToGoogleDirect();
  }

  /**
   * The direct flow (industry standard): the button opens Google's own
   * review form, and this page then watches the synced Google feed for the
   * client's review to appear so it can confirm it. Nothing is stored as a
   * website review; the handoff is only logged so the dashboard stops
   * listing the contract as unreviewed.
   */
  goToGoogleDirect() {
    const user = this.api.currentUser();
    const name = `${this.firstName() || user?.firstName || ''} ${this.lastName() || user?.lastName || ''}`.trim();
    this.draftName.set(name);
    this.draftText.set('');
    const url = this.googleReviewUrl();
    if (url) window.open(url, '_blank', 'noopener');
    this.postHandoff();
    this.handoffStep.set('waiting');
    this.startReturnWatch();
  }

  postHandoff() {
    const active = this.activeItem();
    if (!active) return;
    const body: any = {};
    if (this.reviewToken()) body.token = this.reviewToken();
    else body.contractId = active.contractId;
    this.api.post<any>('reviews/handoff', body).subscribe({ next: () => {}, error: () => {} });
  }

  startReturnWatch() {
    this.watchStartedAt = Date.now();
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.watchTimer = setInterval(() => this.checkForMyReview(), 20000);
  }

  stopReturnWatch() {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = null;
    }
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  ngOnDestroy() {
    this.stopReturnWatch();
  }

  checkForMyReview() {
    if (this.handoffStep() !== 'waiting') return;
    if (Date.now() - this.watchStartedAt > 5 * 60 * 1000) {
      this.handoffStep.set('timeout');
      this.stopReturnWatch();
      return;
    }
    this.api.post<any>('reviews/google/refresh', {}).subscribe({
      next: () => this.fetchAndMatch(),
      error: () => this.fetchAndMatch()
    });
  }

  fetchAndMatch() {
    this.api.get<any[]>('reviews/public').subscribe({
      next: (list) => {
        if (this.handoffStep() !== 'waiting') return;
        const mine = (list || []).some(r => r && r.source === 'google' && this.matchesDraft(r));
        if (mine) {
          this.handoffStep.set('found');
          this.stopReturnWatch();
        }
      },
      error: () => {}
    });
  }

  matchesDraft(r: any): boolean {
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    const gName = norm(`${r.firstName || ''} ${r.lastName || ''}`);
    const dName = norm(this.draftName());
    if (!gName || !dName || gName !== dName) return false;
    const dText = norm(this.draftText());
    // Direct-to-Google flow: the review was written entirely on Google, so
    // the author's name is the only identity signal available for the
    // on-page confirmation. Display does not depend on this match.
    if (!dText) return true;
    if (r.rating !== this.googleStars()) return false;
    const gText = norm(r.message);
    if (!gText) return false;
    return gText === dText || gText.startsWith(dText.slice(0, 50)) || dText.startsWith(gText.slice(0, 50));
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
