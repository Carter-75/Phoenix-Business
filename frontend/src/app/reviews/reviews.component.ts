import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="min-h-screen pt-32 pb-24 px-4 sm:px-6 bg-slate-950 relative flex flex-col items-center justify-start">
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/5 top-[-10%] right-[-10%] absolute pointer-events-none"></div>
      
      <div class="max-w-[1400px] w-full relative z-10">
        
        <header class="text-center mb-16 max-w-3xl mx-auto">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-600/10 border border-orange-500/20 text-orange-500 mb-6">
            <i class="fa-solid fa-star text-3xl"></i>
          </div>
          <h1 class="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase mb-6">Client <span class="text-orange-500">Ratings</span></h1>
          <p class="text-lg sm:text-xl text-slate-400 font-medium leading-relaxed mb-6">Real feedback from verified businesses scaling their revenue with Phoenix Studio infrastructure.</p>
          <div *ngIf="api.currentUser()" class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <i class="fa-solid fa-user-circle text-orange-500"></i> Logged in as: {{ api.currentUser()?.firstName }} {{ api.currentUser()?.lastName }} <span *ngIf="api.currentUser()?.businessName">({{ api.currentUser()?.businessName }})</span>
          </div>
        </header>

        <!-- Filters -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 pb-8 border-b border-white/10">
          <div class="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
            <i class="fa-solid fa-chart-line text-orange-500"></i> {{ filteredOtherReviews().length + myReviews().length }} Ratings
          </div>
          <div class="flex items-center gap-4 w-full sm:w-auto">
            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hidden sm:block whitespace-nowrap">Filter By Rating</label>
            <select [ngModel]="selectedFilter()" (ngModelChange)="selectedFilter.set($event)" class="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:border-orange-500 transition-colors w-full sm:w-auto cursor-pointer">
              <option [ngValue]="0">All Ratings</option>
              <option [ngValue]="5">5.0 Stars</option>
              <option [ngValue]="4.5">4.5+ Stars</option>
              <option [ngValue]="4">4.0+ Stars</option>
              <option [ngValue]="3">3.0+ Stars</option>
            </select>
          </div>
        </div>

        <div *ngIf="loading()" class="py-24 flex justify-center">
          <i class="fa-solid fa-circle-notch fa-spin text-5xl text-orange-600"></i>
        </div>

        <!-- MY REVIEWS (ALWAYS TOP) -->
        <ng-container *ngIf="!loading() && myReviews().length > 0">
          <div class="mb-16">
            <div class="flex items-center gap-4 mb-8">
              <div class="w-8 h-[1px] bg-green-500"></div>
              <span class="text-green-500 font-black uppercase tracking-[0.3em] text-xs">Your Feedback</span>
              <div class="w-full h-[1px] bg-white/5 flex-grow"></div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div *ngFor="let review of myReviews()" class="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 sm:p-8 relative group hover:border-green-500/40 transition-colors">
                
                <div class="absolute top-4 right-4 flex gap-2">
                  <button *ngIf="editingReviewId() !== review._id" (click)="startEdit(review)" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center">
                    <i class="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button *ngIf="editingReviewId() !== review._id" (click)="deleteReview(review._id)" [disabled]="saving()" class="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors flex items-center justify-center disabled:opacity-50">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                  <button *ngIf="editingReviewId() === review._id" (click)="cancelEdit()" class="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors flex items-center justify-center">
                    <i class="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>

                <div class="flex gap-1 mb-6">
                   <ng-container *ngIf="editingReviewId() !== review._id">
                     <ng-container *ngFor="let star of [1,2,3,4,5]">
                       <i *ngIf="review.rating >= star" class="fa-solid fa-star text-sm text-orange-500"></i>
                       <i *ngIf="review.rating < star && review.rating > star - 1" class="fa-solid fa-star-half-stroke text-sm text-orange-500"></i>
                       <i *ngIf="review.rating <= star - 1" class="fa-solid fa-star text-sm text-white/10"></i>
                     </ng-container>
                   </ng-container>
                   
                   <ng-container *ngIf="editingReviewId() === review._id">
                     <div class="flex items-center gap-1" (mouseleave)="hoverEditRating.set(0)">
                       <ng-container *ngFor="let star of [1,2,3,4,5]">
                         <div class="relative cursor-pointer text-xl">
                           <i class="fa-regular fa-star text-white/10"></i>
                           <i class="fa-solid fa-star absolute top-0 left-0 text-orange-500 transition-all duration-75" 
                              [ngStyle]="{'clip-path': getEditStarClipPath(star)}"></i>
                           
                           <div class="absolute inset-0 flex z-10">
                             <div class="w-1/2 h-full" (mouseenter)="hoverEditRating.set(Math.max(1, star - 0.5))" (click)="$event.stopPropagation(); editRating.set(Math.max(1, star - 0.5))"></div>
                             <div class="w-1/2 h-full" (mouseenter)="hoverEditRating.set(star)" (click)="$event.stopPropagation(); editRating.set(star)"></div>
                           </div>
                         </div>
                       </ng-container>
                     </div>
                   </ng-container>
                </div>

                <ng-container *ngIf="editingReviewId() !== review._id">
                  <p *ngIf="review.message?.trim()" class="text-lg text-white mb-8 leading-relaxed font-medium">"{{ review.message }}"</p>
                </ng-container>

                <ng-container *ngIf="editingReviewId() === review._id">
                  <textarea [ngModel]="editMessage()" (ngModelChange)="editMessage.set($event)" rows="3" class="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm mb-6 outline-none focus:border-orange-500 resize-none"></textarea>
                  <button (click)="saveEdit(review._id)" [disabled]="saving()" class="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-colors mb-8 disabled:opacity-50">
                    {{ saving() ? 'Saving...' : 'Update Review' }}
                  </button>
                </ng-container>

                <div class="flex items-center gap-4 mt-auto">
                  <div class="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-black uppercase">
                    {{ review.firstName.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-white font-bold text-sm">{{ review.firstName }} {{ review.lastName }} <span *ngIf="review.businessName" class="text-slate-500 font-normal">({{ review.businessName }})</span></p>
                    <p class="text-slate-400 text-xs">{{ review.projectName }} &bull; {{ review.createdAt | date:'MMM yyyy' }}</p>
                  </div>
                </div>

                <!-- Admin Comment -->
                <div *ngIf="review.adminComment && editingReviewId() !== review._id" class="mt-6 bg-orange-500/10 border-l-2 border-orange-500 p-4 rounded-r-xl">
                  <p class="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Phoenix Response</p>
                  <p class="text-sm text-slate-300 italic">"{{ review.adminComment }}"</p>
                </div>

              </div>
            </div>
          </div>
        </ng-container>

        <!-- OTHER REVIEWS -->
        <ng-container *ngIf="!loading()">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-8 h-[1px] bg-slate-700"></div>
            <span class="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Community Reviews</span>
            <div class="w-full h-[1px] bg-white/5 flex-grow"></div>
          </div>

          <div *ngIf="filteredOtherReviews().length === 0" class="text-center py-24 bg-white/5 rounded-2xl border border-white/10">
            <i class="fa-solid fa-comment-slash text-4xl text-slate-600 mb-4"></i>
            <h3 class="text-xl font-bold text-white mb-2">No Ratings Found</h3>
            <p class="text-slate-400 text-sm">No reviews match your current filter.</p>
          </div>

          <div class="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            <div *ngFor="let review of filteredOtherReviews()" class="bg-white/5 border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-6 sm:p-8 break-inside-avoid">
              
              <div class="flex gap-1 mb-6">
                 <ng-container *ngFor="let star of [1,2,3,4,5]">
                   <i *ngIf="review.rating >= star" class="fa-solid fa-star text-sm text-orange-500"></i>
                   <i *ngIf="review.rating < star && review.rating > star - 1" class="fa-solid fa-star-half-stroke text-sm text-orange-500"></i>
                   <i *ngIf="review.rating <= star - 1" class="fa-solid fa-star text-sm text-white/10"></i>
                 </ng-container>
              </div>

              <p *ngIf="review.message?.trim()" class="text-base text-white mb-8 leading-relaxed font-medium">"{{ review.message }}"</p>

              <div class="flex items-center gap-4 mt-auto">
                <div class="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-black uppercase">
                  {{ review.firstName.charAt(0) }}
                </div>
                <div>
                  <p class="text-white font-bold text-sm">{{ review.firstName }} {{ review.lastName }} <span *ngIf="review.businessName" class="text-slate-500 font-normal">({{ review.businessName }})</span></p>
                  <p class="text-slate-400 text-xs">{{ review.projectName }} &bull; {{ review.createdAt | date:'MMM yyyy' }}</p>
                </div>
              </div>

              <div *ngIf="review.adminComment" class="mt-6 bg-orange-500/5 border-l-2 border-orange-500 p-4 rounded-r-xl">
                <p class="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Phoenix Response</p>
                <p class="text-xs text-slate-300 italic">"{{ review.adminComment }}"</p>
              </div>

            </div>
          </div>
        </ng-container>

      </div>
    </section>
  `
})
export class ReviewsComponent implements OnInit {
  api = inject(ApiService);
  Math = Math; // for template usage

  allReviews = signal<any[]>([]);
  loading = signal(true);
  selectedFilter = signal<number>(0);

  editingReviewId = signal<string | null>(null);
  editRating = signal<number>(5);
  hoverEditRating = signal<number>(0);
  editMessage = signal<string>('');
  saving = signal(false);

  myReviews = computed(() => {
    const user = this.api.currentUser();
    if (!user) return [];
    return this.allReviews().filter(r => r.userId === user._id);
  });

  otherReviews = computed(() => {
    const user = this.api.currentUser();
    let allOthers = this.allReviews();
    if (user) {
      allOthers = allOthers.filter(r => r.userId !== user._id);
    }
    
    const byBusiness = new Map<string, any[]>();
    for (const r of allOthers) {
      const key = r.businessName || r.userId || r._id;
      if (!byBusiness.has(key)) byBusiness.set(key, []);
      byBusiness.get(key)!.push(r);
    }
    
    let result: any[] = [];
    
    for (const reviews of byBusiness.values()) {
      const highQualityReviews = reviews.filter(r => r.rating >= 4 && r.message && r.message.trim().length > 0);
      
      let bestReview = reviews[0];
      let bestScore = -1;
      
      for (const r of reviews) {
        const hasText = r.message && r.message.trim().length > 0;
        let score = r.rating;
        // +0.6 means a 4 with text (4.6) beats a 4.5 no-text (4.5), 
        // but a 4 with text (4.6) loses to a 5 no-text (5.0).
        if (r.rating >= 4 && hasText) {
          score += 0.6;
        } else {
          score += (hasText ? 0.1 : 0);
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestReview = r;
        }
      }
      
      const bestIsHighQuality = bestReview.rating >= 4 && bestReview.message && bestReview.message.trim().length > 0;
      
      if (highQualityReviews.length >= 2 && bestIsHighQuality) {
        // User rule: if >=2 high quality reviews AND they aren't outpaced by a better rating (like a 5 no-text), show ALL reviews for this business
        result.push(...reviews);
      } else {
        // Pick the single best one
        if (bestReview) {
          result.push(bestReview);
        }
      }
    }
    
    return result;
  });

  filteredOtherReviews = computed(() => {
    const filter = this.selectedFilter();
    let reviews = this.otherReviews();
    
    if (filter > 0) {
      reviews = reviews.filter(r => r.rating >= filter);
    }
    
    return reviews;
  });

  ngOnInit() {
    this.api.get<any[]>('reviews/public').subscribe({
      next: (data) => {
        // filter out any empty messages if needed, but we require rating and message.
        this.allReviews.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load public reviews', err);
        this.loading.set(false);
      }
    });
  }

  getEditStarClipPath(starIndex: number) {
    const current = this.hoverEditRating() > 0 ? this.hoverEditRating() : this.editRating();
    if (current >= starIndex) return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    if (current >= starIndex - 0.5) return 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)';
    return 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
  }

  startEdit(review: any) {
    this.editingReviewId.set(review._id);
    this.editRating.set(review.rating); // Keep exact float instead of Math.floor!
    this.editMessage.set(review.message || '');
  }

  cancelEdit() {
    this.editingReviewId.set(null);
  }

  saveEdit(reviewId: string) {
    if (!this.editRating()) return;
    
    this.saving.set(true);
    this.api.patch<any>(`reviews/${reviewId}`, {
      rating: this.editRating(),
      message: this.editMessage()
    }).subscribe({
      next: (updatedReview) => {
        this.allReviews.update(reviews => 
          reviews.map(r => r._id === reviewId ? { ...r, rating: updatedReview.rating, message: updatedReview.message } : r)
        );
        this.editingReviewId.set(null);
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Failed to update review', err);
        alert('Failed to update review.');
        this.saving.set(false);
      }
    });
  }

  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    this.saving.set(true);
    this.api.delete<any>(`reviews/${reviewId}`).subscribe({
      next: () => {
        this.allReviews.update(reviews => reviews.filter(r => r._id !== reviewId));
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Failed to delete review', err);
        alert('Failed to delete review.');
        this.saving.set(false);
      }
    });
  }
}
