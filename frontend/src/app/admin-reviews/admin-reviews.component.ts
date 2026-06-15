import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <section class="min-h-screen pt-32 sm:pt-48 pb-24 px-4 sm:px-6 bg-[#020205] relative flex flex-col items-center justify-start">
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/5 top-[-10%] right-[-10%] absolute pointer-events-none"></div>

      <div class="max-w-6xl w-full relative z-10">
        
        <div class="text-center mb-12">
          <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-2">Review <span class="text-orange-500">Dashboard</span></h1>
          <p class="text-xl text-slate-400 font-medium">Manage and view all client feedback.</p>
        </div>

        <div *ngIf="loading()" class="flex justify-center py-12">
           <i class="fa-solid fa-circle-notch fa-spin text-4xl text-orange-600"></i>
        </div>

        <div *ngIf="!loading() && reviews().length === 0" class="text-center py-12 bg-white/5 rounded-2xl border border-white/10 max-w-lg mx-auto">
           <i class="fa-solid fa-inbox text-4xl text-slate-600 mb-4"></i>
           <h3 class="text-xl font-bold text-white mb-2">No Reviews Yet</h3>
           <p class="text-slate-400 text-sm">Clients haven't left any reviews.</p>
        </div>

        <div *ngIf="!loading() && reviews().length > 0" class="bg-[#050505] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-400">
              <thead class="text-xs uppercase bg-white/5 text-slate-500 tracking-widest border-b border-white/10">
                <tr>
                  <th scope="col" class="px-6 py-4">Client</th>
                  <th scope="col" class="px-6 py-4">Project / Business</th>
                  <th scope="col" class="px-6 py-4">Rating</th>
                  <th scope="col" class="px-6 py-4">Message</th>
                  <th scope="col" class="px-6 py-4">Date</th>
                  <th scope="col" class="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of reviews()" class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td class="px-6 py-4 font-bold text-white">
                    {{ r.firstName }} {{ r.lastName || '' }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-white font-medium">{{ r.projectName }}</div>
                    <div class="text-[10px] uppercase tracking-widest text-orange-500 mt-1">{{ r.businessName }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center text-yellow-500 font-bold text-base gap-1">
                      <span>{{ r.rating }}</span> <i class="fa-solid fa-star text-xs relative top-[1px]"></i>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="max-w-xs truncate" [title]="r.message">
                      <span *ngIf="r.message">{{ r.message }}</span>
                      <span *ngIf="!r.message" class="text-slate-600 italic">No message</span>
                    </div>
                    
                    <div class="mt-3 pl-3 border-l-2 border-orange-500/30">
                      <div class="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Your Reply (Internal & Visible to Client)</div>
                      
                      <div *ngIf="!r.isEditingReply">
                        <div *ngIf="r.adminComment" class="text-xs text-orange-400 mb-2">{{ r.adminComment }}</div>
                        <button (click)="r.isEditingReply = true; r.draftReply = r.adminComment || ''" class="text-[10px] text-slate-500 hover:text-orange-500 transition-colors uppercase font-bold tracking-widest">
                          <i class="fa-solid fa-reply mr-1"></i> {{ r.adminComment ? 'Edit Reply' : 'Add Reply' }}
                        </button>
                      </div>
                      
                      <div *ngIf="r.isEditingReply" class="flex flex-col gap-2 mt-1">
                        <textarea [(ngModel)]="r.draftReply" rows="2" class="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white w-full focus:border-orange-500 outline-none resize-none" placeholder="Type your reply..."></textarea>
                        <div class="flex gap-2">
                          <button (click)="saveReply(r)" [disabled]="r.saving" class="text-[10px] bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded font-bold transition-colors uppercase tracking-widest disabled:opacity-50">
                            {{ r.saving ? 'Saving...' : 'Save' }}
                          </button>
                          <button (click)="r.isEditingReply = false" [disabled]="r.saving" class="text-[10px] text-slate-500 hover:text-white px-2 font-bold uppercase tracking-widest">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-xs">
                    {{ r.createdAt | date:'mediumDate' }}
                  </td>
                  <td class="px-6 py-4">
                    <span *ngIf="r.rating > 3.5" class="px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[10px] font-bold uppercase tracking-widest">Positive</span>
                    <span *ngIf="r.rating <= 3.5 && !r.dismissedLowRating" class="px-2 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded text-[10px] font-bold uppercase tracking-widest">Needs Attn</span>
                    <span *ngIf="r.rating <= 3.5 && r.dismissedLowRating" class="px-2 py-1 bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded text-[10px] font-bold uppercase tracking-widest">Dismissed</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  `
})
export class AdminReviewsComponent implements OnInit {
  api = inject(ApiService);
  reviews = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.get<any[]>('reviews/all').subscribe({
      next: (res) => {
        // Initialize editing state
        const withState = res.map(r => ({ ...r, isEditingReply: false, draftReply: '', saving: false }));
        this.reviews.set(withState);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load admin reviews', err);
        this.loading.set(false);
      }
    });
  }

  saveReply(review: any) {
    review.saving = true;
    this.api.patch(\`reviews/\${review._id}/admin-comment\`, { adminComment: review.draftReply }).subscribe({
      next: (res) => {
        review.adminComment = res.adminComment;
        review.isEditingReply = false;
        review.saving = false;
      },
      error: (err) => {
        console.error('Failed to save reply', err);
        review.saving = false;
        alert('Failed to save reply');
      }
    });
  }
}
