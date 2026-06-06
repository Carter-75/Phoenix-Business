import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="min-h-screen pt-48 pb-24 px-6 bg-slate-950 relative flex items-center justify-center">
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/5 top-[-10%] right-[-10%] absolute pointer-events-none"></div>
      
      <div class="max-w-2xl w-full relative z-10 text-center">
        <!-- SUCCESS STATE -->
        <ng-container *ngIf="isSuccess()">
          <div class="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
            <i class="fa-solid fa-check text-4xl"></i>
          </div>
          <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-6">Payment <span class="text-green-500">Successful</span></h1>
          <p class="text-xl text-slate-400 mb-12 font-medium">Your onboarding is complete. Please check your email for the next steps.</p>
          
          <div class="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm mb-12">
            <div class="flex items-start gap-4 text-left">
              <i class="fa-solid fa-circle-exclamation text-orange-500 mt-1"></i>
              <div>
                <h3 class="text-white font-bold mb-2">Check Your Spam Folder</h3>
                <p class="text-slate-400 text-sm">We've just sent your welcome packet and a digital copy of your service agreement. If you don't see it in your inbox within 5 minutes, please check your spam or junk folder.</p>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="#" (click)="downloadPDF($event)" class="group relative px-8 py-4 bg-orange-600 hover:bg-orange-500 transition-all rounded-full overflow-hidden flex items-center justify-center gap-3">
              <span class="relative z-10 text-white font-bold uppercase tracking-widest text-sm">{{ downloadingPdf() ? 'Downloading...' : 'Download Receipt (PDF)' }}</span>
              <i class="fa-solid" [class.fa-download]="!downloadingPdf()" [class.fa-circle-notch]="downloadingPdf()" [class.fa-spin]="downloadingPdf()" class="relative z-10 text-white group-hover:-translate-y-1 transition-transform"></i>
            </a>
            <a routerLink="/home" class="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-all rounded-full flex items-center justify-center gap-3 text-white font-bold uppercase tracking-widest text-sm">
              Return Home
            </a>
          </div>
        </ng-container>

        <!-- CANCELLATION SUCCESS STATE -->
        <ng-container *ngIf="isCancellationSuccess()">
          <div class="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
            <i class="fa-solid fa-check text-4xl"></i>
          </div>
          <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-6">Service <span class="text-red-500">Terminated</span></h1>
          <p class="text-xl text-slate-400 mb-12 font-medium">Your cancellation has been processed successfully.</p>
          
          <div class="flex justify-center">
            <a routerLink="/home" class="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-all rounded-full flex items-center justify-center gap-3 text-white font-bold uppercase tracking-widest text-sm">
              Return Home
            </a>
          </div>
        </ng-container>

        <!-- STANDARD PORTAL STATE -->
        <ng-container *ngIf="!isSuccess() && !isCancellationSuccess()">
          <div class="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-600/10 border border-orange-500/20 text-orange-500">
            <i class="fa-solid fa-user-astronaut text-4xl"></i>
          </div>
          <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-6">Client <span class="text-orange-500">Portal</span></h1>
          <p class="text-xl text-slate-400 mb-12 font-medium">Manage your contract, view termination options, and download invoices.</p>
          
          <div class="flex flex-col items-center gap-6 max-w-sm mx-auto">
            <button (click)="openCancelModal()" class="w-full group relative px-8 py-5 bg-white text-black hover:bg-red-50 transition-all rounded-full overflow-hidden flex items-center justify-center gap-3">
              <span class="relative z-10 font-black uppercase tracking-widest text-sm text-red-600">
                Manage Contract / Cancellation
              </span>
              <i class="fa-solid fa-arrow-right relative z-10 text-red-600 group-hover:translate-x-1 transition-transform"></i>
            </button>

            <a href="#" *ngIf="api.currentUser()" (click)="downloadPDF($event)" class="text-slate-400 hover:text-white transition-colors text-sm font-medium underline underline-offset-4 mt-4 inline-block">
              {{ downloadingPdf() ? 'Downloading...' : 'Download Latest Contract/Receipt' }}
            </a>
            
            <button *ngIf="api.currentUser()" (click)="logout()" class="text-slate-500 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest mt-8">
              Sign Out
            </button>
          </div>
        </ng-container>

      </div>
    </section>

    <!-- Cancellation & Ownership Modal -->
    <div *ngIf="showCancelModal()" class="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div class="absolute inset-0 bg-[#020205]/95 backdrop-blur-3xl" (click)="closeCancelModal()"></div>
      <div class="glass-card !bg-[#050505] max-w-[600px] w-full z-10 p-8 sm:p-12 border-red-500/20 relative">
        
        <button (click)="closeCancelModal()" class="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/20 hover:text-white transition-all">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>

        <header class="mb-10">
          <h2 class="text-3xl font-black uppercase tracking-tighter mb-4 text-white">Manage <span class="text-red-500">Service</span></h2>
          <div class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 space-y-2">
            <p *ngIf="cancelQuote()?.windowStatus === 'in-window'" class="text-green-500 bg-green-500/10 inline-block px-4 py-2 rounded-lg border border-green-500/20"><i class="fa-solid fa-check-circle mr-1"></i> Eligible for 60-30 Day Notice Window (No Penalty)</p>
            
            <p *ngIf="cancelQuote()?.windowStatus === 'too-early'" class="text-orange-500 bg-orange-500/10 inline-block px-4 py-2 rounded-lg border border-orange-500/20"><i class="fa-solid fa-clock mr-1"></i> {{ cancelQuote()?.monthsLeft }} Months Remaining in Contract</p>
            
            <div *ngIf="cancelQuote()?.windowStatus === 'too-late'" class="text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20 text-left">
              <p><i class="fa-solid fa-triangle-exclamation mr-1"></i> Notice Window Missed</p>
              <p class="text-[9px] mt-2 text-red-400/80 normal-case tracking-normal">You are within 30 days of auto-renewal. Cancellations require 30-60 days notice. An automatic 6-month penalty applies.</p>
            </div>
          </div>
        </header>

        <div *ngIf="loadingQuote()" class="py-12 flex justify-center">
          <i class="fa-solid fa-circle-notch fa-spin text-4xl text-orange-600"></i>
        </div>

        <div *ngIf="!loadingQuote() && cancelQuote()" class="space-y-6">
          
          <!-- OPTION A: BUYOUT -->
          <div class="border border-orange-500/30 bg-orange-500/5 rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute top-0 right-0 bg-orange-600 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-bl-lg">Recommended</div>
            <h3 class="text-xl font-black text-white mb-2">Option A: Buyout & Keep Website</h3>
            <p class="text-sm text-slate-400 mb-6 leading-relaxed">Pay the 50% website buyout fee to retain full ownership and hosting rights of your custom infrastructure. <span *ngIf="cancelQuote()!.earlyTerminationFee > 0">Includes early termination fee.</span></p>
            
            <div class="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
              <span class="text-xs font-bold uppercase tracking-widest text-slate-500">Total Due</span>
              <span class="text-2xl font-black text-white">{{ cancelQuote()!.totalBuyoutCost | currency }}</span>
            </div>

            <button (click)="processCancellation('buyout')" [disabled]="checkoutLoading()" class="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-colors disabled:opacity-50">
              {{ checkoutLoading() ? 'Processing...' : 'Pay & Retain Ownership' }}
            </button>
          </div>

          <!-- OPTION B: SURRENDER -->
          <div class="border border-white/10 bg-white/5 rounded-2xl p-6">
            <h3 class="text-xl font-black text-white mb-2">Option B: Terminate & Surrender</h3>
            <p class="text-sm text-slate-400 mb-6 leading-relaxed">Cancel your service agreement completely. You will instantly lose all access to and ownership of your website and its data.</p>
            
            <div class="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
              <span class="text-xs font-bold uppercase tracking-widest text-slate-500">Early Termination Fee</span>
              <span class="text-2xl font-black text-white">{{ cancelQuote()!.earlyTerminationFee | currency }}</span>
            </div>

            <button (click)="processCancellation('cancel')" [disabled]="checkoutLoading()" class="w-full py-4 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-black uppercase tracking-widest text-xs rounded-xl transition-all disabled:opacity-50">
              {{ checkoutLoading() ? 'Processing...' : (cancelQuote()!.windowStatus === 'in-window' ? 'Confirm Free Cancellation' : 'Pay & Surrender Assets') }}
            </button>
          </div>

        </div>

      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  
  isSuccess = signal(false);
  isCancellationSuccess = signal(false);
  apiUrl = environment.apiUrl;

  showCancelModal = signal(false);
  loadingQuote = signal(false);
  checkoutLoading = signal(false);
  cancelQuote = signal<any>(null);
  downloadingPdf = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['success'] === 'true') {
        this.isSuccess.set(true);
      }
      if (params['cancellation_success'] === 'true') {
        this.isCancellationSuccess.set(true);
      }
    });
  }

  downloadPDF(event: Event) {
    event.preventDefault();
    if (this.downloadingPdf()) return;
    this.downloadingPdf.set(true);

    this.api.download('auth/contract/pdf').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Phoenix_Contract_Receipt.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingPdf.set(false);
      },
      error: (err) => {
        console.error('Download failed', err);
        alert('Failed to download PDF. Please try again from a desktop computer, or check your email for the attached copy.');
        this.downloadingPdf.set(false);
      }
    });
  }

  openCancelModal() {
    const user = this.api.currentUser();
    if (!user) return;
    
    this.showCancelModal.set(true);
    this.loadingQuote.set(true);
    
    this.api.get<any>(`stripe/cancellation-quote/${user.email}`).subscribe({
      next: (res) => {
        this.cancelQuote.set(res);
        this.loadingQuote.set(false);
      },
      error: (err) => {
        this.loadingQuote.set(false);
        console.error(err);
        alert('Could not fetch cancellation details. Do you have an active subscription?');
        this.closeCancelModal();
      }
    });
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
    this.cancelQuote.set(null);
  }

  processCancellation(type: 'buyout' | 'cancel') {
    this.checkoutLoading.set(true);
    const quote = this.cancelQuote();
    const amount = type === 'buyout' ? quote.totalBuyoutCost : quote.earlyTerminationFee;
    
    this.api.post<any>('stripe/checkout-cancellation', {
      email: this.api.currentUser()?.email,
      type,
      amount,
      subscriptionId: quote.subscriptionId
    }).subscribe({
      next: (res) => {
        if (res.zeroDollar) {
          window.location.reload();
        } else if (res.url) {
          window.location.href = res.url;
        }
      },
      error: (err) => {
        this.checkoutLoading.set(false);
        console.error(err);
        alert('Failed to initialize secure checkout.');
      }
    });
  }

  logout() {
    this.api.logout();
    window.location.href = '/home';
  }
}
