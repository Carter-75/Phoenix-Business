import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="min-h-screen pt-32 sm:pt-48 pb-24 px-4 sm:px-6 bg-slate-950 relative flex flex-col items-center justify-start">
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
          <p class="text-xl text-slate-400 mb-12 font-medium">Manage your active projects, view termination options, and download invoices.</p>
          
          <div *ngIf="loadingContracts()" class="flex justify-center py-12">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl text-orange-600"></i>
          </div>

          <div *ngIf="!loadingContracts() && contracts().length === 0" class="text-center py-12 bg-white/5 rounded-2xl border border-white/10 max-w-lg mx-auto">
             <i class="fa-solid fa-folder-open text-4xl text-slate-600 mb-4"></i>
             <h3 class="text-xl font-bold text-white mb-2">No Active Projects</h3>
             <p class="text-slate-400 text-sm">You do not have any active websites or contracts right now.</p>
          </div>

          <div *ngIf="!loadingContracts() && contracts().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            
            <div *ngFor="let contract of contracts()" class="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <!-- Status Badge -->
              <div class="absolute top-0 right-0 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-bl-lg"
                   [ngClass]="{
                     'bg-green-500 text-white': contract.status === 'active',
                     'bg-blue-500 text-white': contract.status === 'bought-out',
                     'bg-red-500 text-white': contract.status === 'cancelled' || contract.status === 'breached'
                   }">
                {{ contract.status }}
              </div>

              <h3 class="text-xl font-black text-white mb-1 pr-16">{{ contract.projectName || 'Phoenix Digital Services' }}</h3>
              <p class="text-xs text-orange-500 font-bold uppercase tracking-widest mb-6">{{ contract.contractType }}</p>

              <div class="flex flex-col gap-3 mt-auto">
                <button (click)="openCancelModal(contract._id)" class="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white transition-all rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <i class="fa-solid fa-gear"></i> Manage Contract
                </button>
                
                <button (click)="downloadPDF($event, contract._id)" class="w-full px-4 py-3 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-colors rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <i class="fa-solid fa-download"></i> {{ downloadingPdfId() === contract._id ? 'Downloading...' : 'Download PDF' }}
                </button>
              </div>
            </div>

          </div>

          <button *ngIf="api.currentUser()" (click)="logout()" class="text-slate-500 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest mt-12 block mx-auto">
            Sign Out
          </button>
        </ng-container>

      </div>
    </section>

    <!-- Cancellation & Ownership Modal -->
    <div *ngIf="showCancelModal()" class="fixed inset-0 z-[200] overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4 sm:p-6 relative">
        <div class="fixed inset-0 bg-[#020205]/95 backdrop-blur-3xl" (click)="closeCancelModal()"></div>
        <div class="glass-card !bg-[#050505] max-w-[600px] w-full z-10 p-6 sm:p-12 border-red-500/20 relative">
        
        <button (click)="closeCancelModal()" class="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/20 hover:text-white transition-all">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>

        <header class="mb-10">
          <h2 class="text-3xl font-black uppercase tracking-tighter mb-4 text-white">Manage <span class="text-red-500">Service</span></h2>
          <div class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 space-y-2">
            
            <p *ngIf="cancelQuote()?.isOneTimePurchase" class="text-blue-400 bg-blue-500/10 inline-block px-4 py-2 rounded-lg border border-blue-500/20"><i class="fa-solid fa-crown mr-1"></i> Ownership Unlocked</p>

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

        <!-- TIER 1 OUTRIGHT OWNERSHIP STATE -->
        <div *ngIf="!loadingQuote() && cancelQuote()?.isOneTimePurchase" class="space-y-6">
          <div class="border border-blue-500/30 bg-blue-500/5 rounded-2xl p-6 relative overflow-hidden">
            <h3 class="text-xl font-black text-white mb-2">Simple Launch Plan</h3>
            <p class="text-sm text-slate-400 mb-6 leading-relaxed">You have fully purchased and own the rights to your custom website infrastructure. There are no monthly subscriptions, buyout fees, or early termination penalties to worry about.</p>
            
            <button (click)="closeCancelModal()" class="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-colors">
              Return to Dashboard
            </button>
          </div>
        </div>

        <div *ngIf="!loadingQuote() && cancelQuote() && !cancelQuote()?.isOneTimePurchase" class="space-y-6">
          
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
  downloadingPdfId = signal<string | null>(null);

  contracts = signal<any[]>([]);
  loadingContracts = signal(true);

  constructor() {
    effect(() => {
      if (this.api.currentUser()) {
        this.fetchContracts();
      }
    });
  }

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

  fetchContracts() {
    this.api.get<any[]>('auth/contracts').subscribe({
      next: (res) => {
        this.contracts.set(res);
        this.loadingContracts.set(false);
      },
      error: (err) => {
        console.error('Failed to load contracts', err);
        this.loadingContracts.set(false);
      }
    });
  }

  downloadPDF(event: Event, contractId: string) {
    event.preventDefault();
    if (this.downloadingPdfId()) return;
    this.downloadingPdfId.set(contractId);

    this.api.download(`auth/contract/pdf/${contractId}`).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Phoenix_Contract_${contractId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingPdfId.set(null);
      },
      error: (err) => {
        console.error('Download failed', err);
        alert('Failed to download PDF. Please try again from a desktop computer, or check your email for the attached copy.');
        this.downloadingPdfId.set(null);
      }
    });
  }

  openCancelModal(contractId: string) {
    const user = this.api.currentUser();
    if (!user) return;

    this.showCancelModal.set(true);
    this.loadingQuote.set(true);

    this.api.get<any>(`stripe/cancellation-quote/${contractId}`).subscribe({
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
